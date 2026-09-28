import { and, asc, desc, eq, ilike, inArray, or, lt, type SQL } from 'drizzle-orm';
import type { AppDb, Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { decodeCursor, encodeCursor, type Cursor } from '../../lib/cursor';
import {
  attributes,
  brands,
  categories,
  ingredients,
  productAttributes,
  productImages,
  productIngredients,
  productVariants,
  products,
} from './schema';
import { stockLevels } from '../inventory/schema';
import { computeAvailable } from '../inventory/service';
import type { ProductCreateInput, ProductQuery, ProductUpdateInput } from './validation';

// ---------- Cursor helpers live in lib/cursor.ts (shared with orders) ----------
export { decodeCursor, encodeCursor } from '../../lib/cursor';

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120) || 'item';
}

// ---------- Public reads ----------

export interface PublicVariant {
  id: string;
  sku: string;
  sizeLabel: string;
  priceKobo: number;
  priceNgn: number;
  compareAtKobo: number | null;
  available: number;
}

export interface PublicProduct {
  slug: string;
  name: string;
  brand: { name: string; slug: string };
  category: { name: string; slug: string };
  tagline: string;
  description: string;
  subCategory: string;
  hashtag: string | null;
  rating: number;
  reviewsCount: number;
  isBestseller: boolean;
  isNew: boolean;
  isFlashSale: boolean;
  minPriceKobo: number;
  minPriceNgn: number;
  totalAvailable: number;
  images: { url: string; alt: string }[];
  variants: PublicVariant[];
}

function toPublicProduct(
  p: typeof products.$inferSelect,
  brand: { name: string; slug: string },
  category: { name: string; slug: string },
  variants: (typeof productVariants.$inferSelect)[],
  images: { url: string; alt: string }[],
  availability: Map<string, number>,
): PublicProduct {
  const pubVars: PublicVariant[] = variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    sizeLabel: v.sizeLabel,
    priceKobo: v.priceKobo,
    priceNgn: v.priceKobo / 100,
    compareAtKobo: v.compareAtKobo,
    available: availability.get(v.id) ?? 0,
  }));
  const prices = pubVars.map((v) => v.priceKobo);
  return {
    slug: p.slug,
    name: p.name,
    brand,
    category,
    tagline: p.tagline,
    description: p.description,
    subCategory: p.subCategory,
    hashtag: p.hashtag,
    rating: Number(p.rating),
    reviewsCount: p.reviewsCount,
    isBestseller: p.isBestseller,
    isNew: p.isNew,
    isFlashSale: p.isFlashSale,
    minPriceKobo: prices.length ? Math.min(...prices) : 0,
    minPriceNgn: prices.length ? Math.min(...prices) / 100 : 0,
    totalAvailable: pubVars.reduce((s, v) => s + v.available, 0),
    images,
    variants: pubVars,
  };
}

export async function listProducts(db: AppDb, q: ProductQuery) {
  const conds: SQL[] = [eq(products.isActive, true)];

  if (q.category) {
    const cat = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, q.category)).limit(1);
    if (cat.length === 0) return { items: [], nextCursor: null as string | null };
    conds.push(eq(products.categoryId, cat[0].id));
  }
  if (q.brand) {
    const br = await db.select({ id: brands.id }).from(brands).where(eq(brands.slug, q.brand)).limit(1);
    if (br.length === 0) return { items: [], nextCursor: null as string | null };
    conds.push(eq(products.brandId, br[0].id));
  }
  if (q.q) {
    const like = `%${q.q.replace(/[%_]/g, '')}%`; // wildcards stripped (LIKE-injection closed)
    conds.push(or(ilike(products.name, like), ilike(products.subCategory, like)) as SQL);
  }

  // Sort keysets: newest → createdAt; price-* → min variant price; rating → rating.
  // Price/rating sorts join an aggregate subquery; newest stays a pure index scan.
  const cursor = decodeCursor(q.cursor);
  const limit = q.limit;

  if (q.sort === 'newest') {
    const rows = await db
      .select({ p: products, brandName: brands.name, brandSlug: brands.slug, catName: categories.name, catSlug: categories.slug })
      .from(products)
      .innerJoin(brands, eq(products.brandId, brands.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(
        cursor
          ? and(...conds, or(lt(products.createdAt, new Date(cursor.k)), and(eq(products.createdAt, new Date(cursor.k)), lt(products.id, cursor.id))) as SQL)
          : and(...conds),
      )
      .orderBy(desc(products.createdAt), desc(products.id))
      .limit(limit + 1);
    return pageFromRows(db, rows, limit, q.inStock, (r) => ({ k: (r.p.createdAt as Date).toISOString(), id: r.p.id }));
  }

  // price-asc / price-desc / rating: computed sort (catalogue scale: fine; revisit with
  // materialized min_price column when measured slow — the cursor stays opaque).
  const all = await db
    .select({ p: products, brandName: brands.name, brandSlug: brands.slug, catName: categories.name, catSlug: categories.slug })
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conds));
  const withVariants = await hydrate(db, all.map((r) => r.p), all.map((r) => ({ brandName: r.brandName, brandSlug: r.brandSlug, catName: r.catName, catSlug: r.catSlug })));
  let items = withVariants;
  if (q.inStock === 'true') items = items.filter((i) => i.totalAvailable > 0);
  if (q.inStock === 'false') items = items.filter((i) => i.totalAvailable === 0);
  const key = (i: PublicProduct) => (q.sort === 'rating' ? i.rating : i.minPriceKobo);
  items.sort((a, b) => {
    const d = q.sort === 'price-desc' ? key(b) - key(a) : key(a) - key(b);
    return d !== 0 ? d : a.slug.localeCompare(b.slug);
  });
  let start = 0;
  if (cursor) {
    const idx = items.findIndex((i) =>
      q.sort === 'rating' ? String(i.rating) === cursor.k && i.slug > cursor.id : String(i.minPriceKobo) === cursor.k && i.slug > cursor.id,
    );
    // Simpler robust rule: drop everything up to and including the cursor item.
    const exact = items.findIndex((i) => (q.sort === 'rating' ? String(i.rating) : String(i.minPriceKobo)) === cursor.k && i.slug === cursor.id);
    start = exact >= 0 ? exact + 1 : (idx >= 0 ? idx : 0);
  }
  const slice = items.slice(start, start + limit);
  const last = slice[slice.length - 1];
  const hasMore = start + limit < items.length;
  return {
    items: slice,
    nextCursor: hasMore && last ? encodeCursor({ k: q.sort === 'rating' ? String(last.rating) : String(last.minPriceKobo), id: last.slug }) : null,
  };
}

type ListRow = {
  p: typeof products.$inferSelect;
  brandName: string;
  brandSlug: string;
  catName: string;
  catSlug: string;
};

async function pageFromRows(
  db: AppDb,
  rows: ListRow[],
  limit: number,
  inStock: 'true' | 'false' | undefined,
  cursorOf: (r: ListRow) => Cursor,
) {
  const hasMore = rows.length > limit;
  const trimmed = hasMore ? rows.slice(0, limit) : rows;
  let items = await hydrate(
    db,
    trimmed.map((r) => r.p),
    trimmed.map((r) => ({ brandName: r.brandName, brandSlug: r.brandSlug, catName: r.catName, catSlug: r.catSlug })),
  );
  if (inStock === 'true') items = items.filter((i) => i.totalAvailable > 0);
  if (inStock === 'false') items = items.filter((i) => i.totalAvailable === 0);
  const lastRow = trimmed[trimmed.length - 1];
  return { items, nextCursor: hasMore && lastRow ? encodeCursor(cursorOf(lastRow)) : null };
}

async function hydrate(
  db: AppDb,
  prods: (typeof products.$inferSelect)[],
  meta: { brandName: string; brandSlug: string; catName: string; catSlug: string }[],
): Promise<PublicProduct[]> {
  if (prods.length === 0) return [];
  const ids = prods.map((p) => p.id);
  const variantIds = (await db.select({ id: productVariants.id }).from(productVariants).where(inArray(productVariants.productId, ids))).map((r) => r.id);
  const [vars, imgs, stock] = await Promise.all([
    variantIds.length > 0
      ? db.select().from(productVariants).where(and(inArray(productVariants.productId, ids), eq(productVariants.isActive, true))).orderBy(asc(productVariants.position))
      : Promise.resolve([] as (typeof productVariants.$inferSelect)[]),
    db.select().from(productImages).where(inArray(productImages.productId, ids)).orderBy(asc(productImages.position)),
    variantIds.length > 0 ? db.select().from(stockLevels).where(inArray(stockLevels.variantId, variantIds)) : Promise.resolve([] as (typeof stockLevels.$inferSelect)[]),
  ]);
  const avail = new Map(stock.map((s) => [s.variantId, computeAvailable(s.onHand, s.reserved)]));
  return prods.map((p, i) =>
    toPublicProduct(
      p,
      { name: meta[i].brandName, slug: meta[i].brandSlug },
      { name: meta[i].catName, slug: meta[i].catSlug },
      vars.filter((v) => v.productId === p.id),
      imgs.filter((im) => im.productId === p.id).map((im) => ({ url: im.url, alt: im.alt })),
      avail,
    ),
  );
}

export async function getProduct(db: AppDb, slugOrId: string): Promise<ProductDetail> {
  const rows = await db
    .select({ p: products, brandName: brands.name, brandSlug: brands.slug, catName: categories.name, catSlug: categories.slug })
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(or(eq(products.slug, slugOrId.toLowerCase()), eq(products.id, slugOrId)))
    .limit(1);
  const row = rows[0];
  if (!row || !row.p.isActive) throw Errors.notFound('Product not found.');
  const [item] = await hydrate(db, [row.p], [{ brandName: row.brandName, brandSlug: row.brandSlug, catName: row.catName, catSlug: row.catSlug }]);
  // Full detail: attributes + ingredients (public, non-sensitive).
  const [attrs, ings] = await Promise.all([
    db.select({ name: attributes.name, value: productAttributes.value }).from(productAttributes).innerJoin(attributes, eq(productAttributes.attributeId, attributes.id)).where(eq(productAttributes.productId, row.p.id)),
    db.select({ name: ingredients.name, description: ingredients.description, detail: productIngredients.detail }).from(productIngredients).innerJoin(ingredients, eq(productIngredients.ingredientId, ingredients.id)).where(eq(productIngredients.productId, row.p.id)),
  ]);
  return { ...item, attributes: attrs, ingredients: ings };
}

export interface ProductDetail extends PublicProduct {
  attributes: { name: string; value: string }[];
  ingredients: { name: string; description: string; detail: string }[];
}

export async function listCategories(db: AppDb) {
  return db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function listBrands(db: AppDb) {
  return db.select().from(brands).where(eq(brands.isActive, true)).orderBy(asc(brands.name));
}

// ---------- Admin writes (price-change audit rows arrive with S7 audit_logs) ----------

export async function createBrand(db: AppDb, input: { name: string; slug?: string; description: string; logoUrl?: string; isActive: boolean }) {
  const [row] = await db.insert(brands).values({ ...input, slug: input.slug ?? slugify(input.name) }).returning();
  return row;
}

export async function createCategory(db: AppDb, input: { name: string; slug?: string; parentId: string | null; description: string; imageUrl?: string; sortOrder: number; isActive: boolean }) {
  const [row] = await db.insert(categories).values({ ...input, slug: input.slug ?? slugify(input.name) }).returning();
  return row;
}

async function upsertAttribute(db: Db, name: string) {
  const [row] = await db.insert(attributes).values({ name }).onConflictDoNothing().returning({ id: attributes.id });
  if (row) return row.id;
  const found = await db.select({ id: attributes.id }).from(attributes).where(eq(attributes.name, name)).limit(1);
  return found[0].id;
}

async function upsertIngredient(db: Db, name: string, description: string) {
  const [row] = await db.insert(ingredients).values({ name, description }).onConflictDoNothing().returning({ id: ingredients.id });
  if (row) return row.id;
  const found = await db.select({ id: ingredients.id }).from(ingredients).where(eq(ingredients.name, name)).limit(1);
  return found[0].id;
}

export async function createProduct(db: AppDb, input: import('./validation').ProductCreateInput) {
  return db.transaction(async (tx) => {
    const [p] = await tx
      .insert(products)
      .values({
        brandId: input.brandId,
        categoryId: input.categoryId,
        name: input.name,
        slug: input.slug ?? slugify(input.name),
        tagline: input.tagline,
        description: input.description,
        subCategory: input.subCategory,
        hashtag: input.hashtag,
        isBestseller: input.isBestseller,
        isNew: input.isNew,
        isFlashSale: input.isFlashSale,
        isActive: input.isActive,
      })
      .returning();
    const variantRows = await tx
      .insert(productVariants)
      .values(input.variants.map((v) => ({ ...v, productId: p.id })))
      .returning({ id: productVariants.id });
    // Zeroed ledger rows so availability reads never miss (no null handling downstream).
    for (const v of variantRows) {
      await tx.insert(stockLevels).values({ variantId: v.id }).onConflictDoNothing();
    }
    if (input.images.length > 0) {
      await tx.insert(productImages).values(input.images.map((im, i) => ({ productId: p.id, url: im.url, alt: im.alt, position: i })));
    }
    for (const a of input.attributes) {
      const attributeId = await upsertAttribute(tx, a.name);
      await tx.insert(productAttributes).values({ productId: p.id, attributeId, value: a.value }).onConflictDoNothing();
    }
    for (const g of input.ingredients) {
      const ingredientId = await upsertIngredient(tx, g.name, g.description);
      await tx.insert(productIngredients).values({ productId: p.id, ingredientId, detail: g.detail }).onConflictDoNothing();
    }
    return { id: p.id, slug: p.slug, variantIds: variantRows.map((v) => v.id) };
  });
}

export async function updateProduct(db: AppDb, id: string, input: ProductUpdateInput) {
  return db.transaction(async (tx) => {
    const { variants, ...fields } = input;
    let slug = fields.slug;
    if (fields.name && !slug) slug = undefined; // never auto-rename slugs (URLs are contracts)
    const [p] = await tx
      .update(products)
      .set({ ...fields, ...(slug ? { slug } : {}), updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning({ id: products.id, slug: products.slug });
    if (!p) throw Errors.notFound('Product not found.');
    if (variants) {
      for (const v of variants) {
        if (v.id) {
          await tx.update(productVariants).set({ ...v, updatedAt: new Date() }).where(and(eq(productVariants.id, v.id), eq(productVariants.productId, id)));
        } else {
          const [nv] = await tx.insert(productVariants).values({ ...v, productId: id }).returning({ id: productVariants.id });
          await tx.insert(stockLevels).values({ variantId: nv.id }).onConflictDoNothing();
        }
      }
    }
    return p;
  });
}
