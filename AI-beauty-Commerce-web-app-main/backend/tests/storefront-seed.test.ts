/**
 * Phase 2 proof: the ISR server seed reads live catalogue data through the
 * SAME Drizzle services as `/api/products` and maps it onto the EXACT
 * storefront `Product` shape the client renders (no mock flash, no UI drift).
 * Runs on in-memory PGlite — no Postgres needed.
 */
import { describe, expect, it, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '@/db/schema';
import { brands, categories, products, productVariants, productImages } from '@/modules/catalog/schema';
import { HQ_LOCATION_ID, inventoryLocations, stockLevels } from '@/modules/inventory/schema';
import { getCatalogSeed, getProductSeed, listProductSlugs } from '@/lib/server-catalog';

let db: PgliteDatabase<typeof schema>;

beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  const client = new PGlite({ extensions: { pgcrypto, uuid_ossp } });
  db = drizzle(client, { schema });
  await migrate(db as never, { migrationsFolder: './drizzle' });

  // Migrations already seed the HQ location — keep idempotent.
  await db
    .insert(inventoryLocations)
    .values({
      id: HQ_LOCATION_ID,
      code: 'HQ',
      name: 'Lagos HQ',
      type: 'WAREHOUSE',
      city: 'Lagos',
      state: 'Lagos',
    })
    .onConflictDoNothing();
  const [brand] = await db
    .insert(brands)
    .values({ name: 'Desla', slug: 'desla' })
    .returning({ id: brands.id });
  const [category] = await db
    .insert(categories)
    .values({ name: 'Skincare', slug: 'skincare' })
    .returning({ id: categories.id });
  const [product] = await db
    .insert(products)
    .values({
      brandId: brand.id,
      categoryId: category.id,
      name: 'Golden Body Oil',
      slug: 'golden-body-oil',
      tagline: 'Liquid gold glow',
      description: 'Luxury body oil',
      subCategory: 'Body',
      rating: '4.50',
      reviewsCount: 12,
      isBestseller: true,
    })
    .returning({ id: products.id });
  const variants = await db
    .insert(productVariants)
    .values([
      { productId: product.id, sku: 'GBO-50', sizeLabel: '50ml', priceKobo: 15000, position: 0 },
      { productId: product.id, sku: 'GBO-100', sizeLabel: '100ml', priceKobo: 25000, position: 1 },
    ])
    .returning({ id: productVariants.id });
  await db.insert(productImages).values({ productId: product.id, url: '/product_oil.jpg', alt: 'Golden Body Oil', position: 0 });
  // 10 + 5 on hand → stockCount 15, min price ₦150.
  await db.insert(stockLevels).values([
    { locationId: HQ_LOCATION_ID, pool: 'PLATFORM', variantId: variants[0].id, onHand: 10, reserved: 0 },
    { locationId: HQ_LOCATION_ID, pool: 'PLATFORM', variantId: variants[1].id, onHand: 5, reserved: 0 },
  ]);
}, 120000);

const pg = () => db as never;

describe('ISR catalogue seed (server-catalog)', () => {
  it('lists slugs for generateStaticParams', async () => {
    await expect(listProductSlugs(1000, pg())).resolves.toEqual(['golden-body-oil']);
  });

  it('seeds the storefront Product shape with live kobo pricing + stock', async () => {
    const seed = await getCatalogSeed(100, pg());
    expect(seed).toHaveLength(1);
    const [p] = seed;
    expect(p.id).toBe('golden-body-oil');
    expect(p.name).toBe('Golden Body Oil');
    expect(p.brand).toBe('Desla');
    expect(p.price).toBe(150); // min variant, kobo→naira (storefront prices are ₦)
    expect(p.sizes).toEqual(['50ml', '100ml']);
    expect(p.inStock).toBe(true);
    expect(p.stockCount).toBe(15);
    expect(p.image).toBe('/product_oil.jpg');
    expect(p.galleryImages).toEqual(['/product_oil.jpg']);
    expect(p.isBestseller).toBe(true);
    // RSC-safe: plain JSON only (no Date/BigInt/undefined-functions).
    expect(JSON.parse(JSON.stringify(seed))).toEqual(JSON.parse(JSON.stringify([p])));
  });

  it('resolves a single product case-insensitively, misses cleanly', async () => {
    const hit = await getProductSeed('GOLDEN-BODY-OIL', pg());
    expect(hit?.id).toBe('golden-body-oil');
    await expect(getProductSeed('no-such-product', pg())).resolves.toBeNull();
  });

  it('degrades to empty (mock fallback) without a database', async () => {
    // No db arg + no reachable DATABASE_URL here → never throws.
    await expect(getCatalogSeed(5)).resolves.toEqual([]);
    await expect(listProductSlugs(5)).resolves.toEqual([]);
  });
});
