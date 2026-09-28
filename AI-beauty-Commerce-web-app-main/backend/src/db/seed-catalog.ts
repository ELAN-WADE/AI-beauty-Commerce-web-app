import 'dotenv/config';
import { getDb } from './client';
import { brands, categories, ingredients, attributes, products, productVariants, productImages, productAttributes, productIngredients } from '../modules/catalog/schema';
import { stockLevels, inventoryMovements } from '../modules/inventory/schema';
import { eq } from 'drizzle-orm';
// Source of truth for the port: the live Vite storefront mocks (read-only import).
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - frontend mock module (relative to backend/src/db/)
import { products as mockProducts } from '../../../src/data/products';
// @ts-ignore
import { categories as mockCategories } from '../../../src/data/categories';

interface MockProduct {
  id: string;
  sku?: string;
  name: string;
  brand: string;
  tagline?: string;
  rating: number;
  reviewsCount: number;
  price: number;
  originalPrice?: number;
  image: string;
  galleryImages: string[];
  category: string;
  subCategory: string;
  sizes: string[];
  stockCount: number;
  isBestseller?: boolean;
  isNew?: boolean;
  isFlashSale?: boolean;
  hashtag?: string;
  description: string;
  whatItDoes: string[];
  keyIngredients: { name: string; percentage?: string; description: string }[];
  whoItsFor: { skinTypes: string[]; concerns: string[] };
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120) || 'item';
}

/** 'DES-BO-01-100ML' + '200ml' → 'DES-BO-01-200ML' (first size keeps original SKU). */
function variantSku(productSku: string | undefined, productId: string, size: string, first: boolean): string {
  if (first && productSku) return productSku.toUpperCase();
  const base = (productSku ?? productId).toUpperCase().replace(/-\d+(ML|G|KG|L|PCS)$/, '');
  return `${base}-${size.replace(/\s+/g, '').toUpperCase()}`.slice(0, 60);
}

async function main() {
  const db = getDb();
  const brandIdByName = new Map<string, string>();
  const categoryIdBySlug = new Map<string, string>();

  for (const p of mockProducts as MockProduct[]) {
    if (!brandIdByName.has(p.brand)) {
      const [row] = await db.insert(brands).values({ name: p.brand, slug: slugify(p.brand) }).onConflictDoNothing().returning({ id: brands.id });
      const id = row?.id ?? (await db.select({ id: brands.id }).from(brands).where(eq(brands.name, p.brand)).limit(1))[0].id;
      brandIdByName.set(p.brand, id);
    }
  }
  for (const c of mockCategories as { slug: string; name: string; description?: string; image?: string }[]) {
    const [row] = await db
      .insert(categories)
      .values({ slug: c.slug, name: c.name, description: c.description ?? '', imageUrl: c.image })
      .onConflictDoNothing()
      .returning({ id: categories.id });
    const id = row?.id ?? (await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, c.slug)).limit(1))[0].id;
    categoryIdBySlug.set(c.slug, id);
  }

  let created = 0;
  for (const p of mockProducts as MockProduct[]) {
    const categoryId = categoryIdBySlug.get(p.category) ?? [...categoryIdBySlug.values()][0];
    const [prod] = await db
      .insert(products)
      .values({
        brandId: brandIdByName.get(p.brand)!,
        categoryId,
        name: p.name,
        slug: p.id.toLowerCase(),
        tagline: p.tagline ?? '',
        description: p.description,
        subCategory: p.subCategory,
        hashtag: p.hashtag,
        rating: String(Math.min(5, Math.max(0, p.rating))),
        reviewsCount: p.reviewsCount,
        isBestseller: p.isBestseller ?? false,
        isNew: p.isNew ?? false,
        isFlashSale: p.isFlashSale ?? false,
      })
      .onConflictDoNothing()
      .returning({ id: products.id });
    const productId = prod?.id ?? (await db.select({ id: products.id }).from(products).where(eq(products.slug, p.id.toLowerCase())).limit(1))[0].id;
    if (prod) created += 1;

    // Variants: sizes share the product price (admin reprices per size later); stock split evenly.
    const sizes = p.sizes.length > 0 ? p.sizes : ['Standard'];
    const perVariant = Math.floor(p.stockCount / sizes.length);
    let remainder = p.stockCount - perVariant * sizes.length;
    for (const [i, size] of sizes.entries()) {
      const qty = perVariant + (remainder-- > 0 ? 1 : 0);
      const [v] = await db
        .insert(productVariants)
        .values({
          productId,
          sku: variantSku(p.sku, p.id, size, i === 0),
          sizeLabel: size,
          priceKobo: Math.round(p.price * 100),
          compareAtKobo: p.originalPrice ? Math.round(p.originalPrice * 100) : null,
          position: i,
        })
        .onConflictDoNothing()
        .returning({ id: productVariants.id });
      const variantId = v?.id;
      // Stock seeded once per new variant only (re-runs never double-count).
      if (variantId && qty > 0) {
        await db.insert(stockLevels).values({ variantId, onHand: qty }).onConflictDoNothing();
        await db.insert(inventoryMovements).values({ variantId, delta: qty, reason: 'seed', refType: 'seed', refId: 'catalog-seed' });
      }
    }

    const imgs = [p.image, ...p.galleryImages].filter((u, idx, arr) => u && arr.indexOf(u) === idx);
    for (const [i, url] of imgs.entries()) {
      await db.insert(productImages).values({ productId, url, alt: p.name, position: i }).onConflictDoNothing();
    }
    for (const b of p.whatItDoes ?? []) {
      const [a] = await db.insert(attributes).values({ name: 'benefit' }).onConflictDoNothing().returning({ id: attributes.id });
      const attributeId = a?.id ?? (await db.select({ id: attributes.id }).from(attributes).where(eq(attributes.name, 'benefit')).limit(1))[0].id;
      await db.insert(productAttributes).values({ productId, attributeId, value: b.slice(0, 300) }).onConflictDoNothing();
    }
    for (const s of [...(p.whoItsFor?.skinTypes ?? []), ...(p.whoItsFor?.concerns ?? [])]) {
      const [a] = await db.insert(attributes).values({ name: 'skin-profile' }).onConflictDoNothing().returning({ id: attributes.id });
      const attributeId = a?.id ?? (await db.select({ id: attributes.id }).from(attributes).where(eq(attributes.name, 'skin-profile')).limit(1))[0].id;
      await db.insert(productAttributes).values({ productId, attributeId, value: s.slice(0, 300) }).onConflictDoNothing();
    }
    for (const g of p.keyIngredients ?? []) {
      const [ing] = await db.insert(ingredients).values({ name: g.name, description: g.description ?? '' }).onConflictDoNothing().returning({ id: ingredients.id });
      const ingredientId = ing?.id ?? (await db.select({ id: ingredients.id }).from(ingredients).where(eq(ingredients.name, g.name)).limit(1))[0].id;
      await db.insert(productIngredients).values({ productId, ingredientId, detail: (g.percentage ?? '').slice(0, 80) }).onConflictDoNothing();
    }
  }

  console.log(`catalog seed complete: ${created} new products (idempotent re-runs safe)`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
