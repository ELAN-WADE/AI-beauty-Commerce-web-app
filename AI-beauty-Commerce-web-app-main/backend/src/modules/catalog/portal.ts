import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { audit } from '../audit/service';
import { adjustStock } from '../inventory/service';
import { HQ_LOCATION_ID, stockLevels } from '../inventory/schema';
import { brands, categories, products, productVariants, productImages } from './schema';
import { createProduct, updateProduct } from './service';
import { productCreateSchema } from './validation';

const asset = z.string().max(2000).refine(v => /^\/(?!\/)/.test(v) || /^https?:\/\//.test(v), 'Use a site image path or HTTP/HTTPS URL.');
const text = z.string().trim();
const isUuid = (v?: string) => Boolean(v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v));
export const portalProductSchema = z.object({
  serverId: z.string().uuid().optional(), version: z.number().int().positive().optional(),
  slug: text.min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: text.min(1).max(200), brand: text.min(1).max(120), category: text.min(1).max(120),
  tagline: text.max(300).default(''), description: text.max(8000).default(''), subCategory: text.max(120).default(''), hashtag: text.max(60).optional(),
  isActive: z.boolean(), isNew: z.boolean().default(false), isBestseller: z.boolean().default(false), isFlashSale: z.boolean().default(false),
  image: asset, galleryImages: z.array(asset).max(10).default([]),
  variants: z.array(z.object({ id: z.string().optional(), sku: text.min(1).max(60), sizeLabel: text.min(1).max(40), priceNgn: z.number().positive().max(20000000), compareAtNgn: z.number().positive().max(20000000).nullable(), stock: z.number().int().min(0).max(1000000), isActive: z.boolean() }).strict()).min(1).max(20),
  whatItDoes: z.array(text.max(1000)).max(40).default([]),
  whoItsFor: z.object({ skinTypes: z.array(text.max(100)).max(30), concerns: z.array(text.max(100)).max(30) }),
  keyIngredients: z.array(z.object({ name: text.max(160), percentage: text.max(80).optional(), description: text.max(1000) })).max(40),
  howToUse: z.object({ routine: text.max(50), step: text.max(120), instructions: text.max(5000), precautions: text.max(5000) }),
  brandInfo: z.object({ origin: text.max(300), crueltyFree: z.boolean(), guarantee: text.max(1000) }),
  customBadge: text.max(120).refine(value => !/clinical/i.test(value), 'Clinical labels are not supported.').optional(),
});
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120);

export async function portalCatalogue(db: Db) {
  const rows = await db.select({ product: products, brand: brands.name, category: categories.slug }).from(products).innerJoin(brands, eq(brands.id, products.brandId)).innerJoin(categories, eq(categories.id, products.categoryId)).orderBy(desc(products.updatedAt)).limit(300);
  const ids = rows.map(r => r.product.id);
  const [variants, images, taxonomy] = await Promise.all([
    ids.length ? db.select({ variant: productVariants, stock: stockLevels.onHand }).from(productVariants).leftJoin(stockLevels, and(eq(stockLevels.variantId, productVariants.id), eq(stockLevels.locationId, HQ_LOCATION_ID), eq(stockLevels.pool, 'PLATFORM'))).where(inArray(productVariants.productId, ids)).orderBy(asc(productVariants.position)) : [],
    ids.length ? db.select().from(productImages).where(inArray(productImages.productId, ids)).orderBy(asc(productImages.position)) : [],
    db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder)),
  ]);
  return { products: rows.map(({ product: p, brand, category }) => {
    const vars = variants.filter(v => v.variant.productId === p.id).map(({ variant: v, stock }) => ({ id: v.id, sku: v.sku, sizeLabel: v.sizeLabel, priceNgn: v.priceKobo / 100, compareAtNgn: v.compareAtKobo === null ? null : v.compareAtKobo / 100, stock: stock ?? 0, isActive: v.isActive }));
    const gallery = images.filter(i => i.productId === p.id).map(i => i.url);
    const pres = (p.presentation ?? {}) as Record<string, any>;
    const defaultImage = gallery[0] || pres.image || '/product_barrier_cream.jpg';
    return {
      ...pres,
      id: p.slug,
      serverId: p.id,
      version: p.version,
      slug: p.slug,
      name: p.name,
      brand,
      category,
      tagline: p.tagline,
      description: p.description,
      subCategory: p.subCategory,
      hashtag: p.hashtag,
      isActive: p.isActive,
      isBestseller: p.isBestseller,
      isNew: p.isNew,
      isFlashSale: p.isFlashSale,
      rating: Number(p.rating),
      reviewsCount: p.reviewsCount,
      variants: vars,
      sku: vars[0]?.sku,
      price: vars[0]?.priceNgn ?? 0,
      originalPrice: vars[0]?.compareAtNgn ?? undefined,
      image: defaultImage,
      galleryImages: gallery.length > 0 ? gallery : (pres.galleryImages || [defaultImage]),
      sizes: vars.map(v => v.sizeLabel),
      stockCount: vars.reduce((sum, v) => sum + v.stock, 0),
      inStock: p.isActive && vars.some(v => v.isActive && v.stock > 0),
      whatItDoes: pres.whatItDoes ?? [],
      keyIngredients: pres.keyIngredients ?? [],
      whoItsFor: pres.whoItsFor ?? { skinTypes: [], concerns: [] },
      howToUse: pres.howToUse ?? { routine: '', step: '', instructions: '', precautions: '' },
      brandInfo: pres.brandInfo ?? { origin: '', crueltyFree: false, guarantee: '' },
      customBadge: pres.customBadge,
    };
  }), categories: taxonomy.map(c => ({ id: c.id, name: c.name, slug: c.slug, image: c.imageUrl, description: c.description, itemCount: rows.filter(r => r.product.categoryId === c.id).length })) };
}

export async function savePortalProduct(db: Db, actorId: string, input: z.infer<typeof portalProductSchema>, key: string) {
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`catalogue:${key}`}, 0))`);
    const [replay] = await tx.select().from(products).where(eq(products.publicationKey, key));
    if (replay) {
      if (replay.slug !== input.slug || replay.name !== input.name) throw Errors.conflict('Publication key reused.');
      return { id: replay.id, slug: replay.slug };
    }
    const [existing] = input.serverId ? await tx.select().from(products).where(eq(products.id, input.serverId)).for('update') : [];
    if (input.serverId && !existing) throw Errors.notFound();
    if (existing && existing.version !== input.version) throw Errors.conflict('This product changed. Refresh before editing.');
    const catSlug = slugify(input.category);
    let [category] = await tx.select().from(categories).where(or(eq(categories.slug, input.category), eq(categories.slug, catSlug)));
    if (!category) {
      const catName = input.category.replace(/[-_]+/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      await tx.insert(categories).values({ name: catName, slug: catSlug, description: `${catName} collection` }).onConflictDoNothing();
      [category] = await tx.select().from(categories).where(eq(categories.slug, catSlug));
    }
    if (!category) throw Errors.badRequest('Could not resolve or create catalogue category.');
    const brandSlug = slugify(input.brand);
    await tx.insert(brands).values({ name: input.brand, slug: brandSlug }).onConflictDoNothing();
    let [brand] = await tx.select().from(brands).where(eq(brands.name, input.brand));
    if (!brand) {
      [brand] = await tx.select().from(brands).where(eq(brands.slug, brandSlug));
    }
    if (!brand) throw Errors.conflict('Brand name conflicts with an existing brand slug.');
    const imageUrls = [...new Set([input.image, ...input.galleryImages])];
    const validated = productCreateSchema.parse({
      name: input.name,
      slug: input.slug,
      tagline: input.tagline,
      description: input.description,
      subCategory: input.subCategory,
      hashtag: input.hashtag,
      isActive: input.isActive,
      isNew: input.isNew,
      isBestseller: input.isBestseller,
      isFlashSale: input.isFlashSale,
      brandId: brand.id,
      categoryId: category.id,
      variants: input.variants.map(({ id, priceNgn, compareAtNgn, stock, ...v }, position) => ({
        ...v,
        position,
        priceKobo: Math.round(priceNgn * 100),
        compareAtKobo: compareAtNgn === null ? null : Math.round(compareAtNgn * 100),
      })),
      images: imageUrls.map((url) => ({
        url,
        alt: input.name,
      })),
      attributes: [],
      ingredients: input.keyIngredients.map((i) => ({ name: i.name, description: i.description, detail: i.percentage ?? '' })),
    });
    // Pass only catalogue contract fields (UI identity/natural fields are stored below).
    const saved = existing
      ? await updateProduct(tx as never, existing.id, {
          ...validated,
          variants: validated.variants.map((v, i) => ({
            ...v,
            ...(isUuid(input.variants[i]?.id) ? { id: input.variants[i].id } : {}),
          })),
        })
      : await createProduct(tx as never, validated);
    const presentation = {
      whatItDoes: input.whatItDoes,
      whoItsFor: input.whoItsFor,
      keyIngredients: input.keyIngredients,
      howToUse: input.howToUse,
      brandInfo: input.brandInfo,
      customBadge: input.customBadge,
      image: input.image,
      galleryImages: input.galleryImages,
    };
    await tx.update(products).set({ presentation, version: (existing?.version ?? 0) + 1, publicationKey: key }).where(eq(products.id, saved.id));
    const savedVariants = await tx.select().from(productVariants).where(eq(productVariants.productId, saved.id));
    for (const variant of savedVariants) {
      const requested = input.variants.find(v => v.sku === variant.sku);
      if (!requested) { await tx.update(productVariants).set({ isActive: false }).where(eq(productVariants.id, variant.id)); continue; }
      const [level] = await tx.select().from(stockLevels).where(and(eq(stockLevels.variantId, variant.id), eq(stockLevels.locationId, HQ_LOCATION_ID), eq(stockLevels.pool, 'PLATFORM'))).for('update');
      const delta = requested.stock - (level?.onHand ?? 0);
      if (delta) await adjustStock(tx, { variantId: variant.id, delta, reason: 'Admin catalogue stock update', refType: 'product', refId: saved.id });
    }
    await audit(tx, { actorId, action: existing ? 'product.update' : 'product.create', entityType: 'product', entityId: saved.id, after: { slug: saved.slug } });
    return saved;
  });
}
