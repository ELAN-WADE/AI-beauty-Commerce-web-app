/**
 * Batch-2 (Part III): computed sorts (price-asc/desc, rating) order and
 * paginate in Postgres — same cursor protocol, tiebreaks and filters as the
 * old in-memory implementation, but only the page is hydrated.
 * Runs on PGlite — no Postgres needed.
 */
import { describe, expect, it, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '@/db/schema';
import { brands, categories, products, productVariants } from '@/modules/catalog/schema';
import { HQ_LOCATION_ID, inventoryLocations, stockLevels } from '@/modules/inventory/schema';
import { listProducts } from '@/modules/catalog/service';

let db: PgliteDatabase<typeof schema>;

// price / rating / stock per product.
const FIXTURES = [
  { slug: 'p-a', price: 300, rating: '4.00', stock: 5 },
  { slug: 'p-b', price: 100, rating: '5.00', stock: 0 },
  { slug: 'p-c', price: 200, rating: '3.00', stock: 2 },
  { slug: 'p-d', price: 200, rating: '4.50', stock: 7 }, // price tie with p-c
  { slug: 'p-e', price: 500, rating: '2.00', stock: 0 },
  { slug: 'p-f', price: 400, rating: '4.50', stock: 1 },
] as const;

beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  const client = new PGlite({ extensions: { pgcrypto, uuid_ossp } });
  db = drizzle(client, { schema });
  await migrate(db as never, { migrationsFolder: './drizzle' });
  await db
    .insert(inventoryLocations)
    .values({ id: HQ_LOCATION_ID, code: 'HQ', name: 'Lagos HQ', type: 'WAREHOUSE', city: 'Lagos', state: 'Lagos' })
    .onConflictDoNothing();
  const [brand] = await db.insert(brands).values({ name: 'B', slug: 'b' }).returning({ id: brands.id });
  const [category] = await db.insert(categories).values({ name: 'C', slug: 'c' }).returning({ id: categories.id });
  for (const f of FIXTURES) {
    const [product] = await db
      .insert(products)
      .values({ brandId: brand.id, categoryId: category.id, name: f.slug, slug: f.slug, rating: f.rating })
      .returning({ id: products.id });
    const [variant] = await db
      .insert(productVariants)
      .values({ productId: product.id, sku: `SKU-${f.slug}`, priceKobo: f.price * 100 })
      .returning({ id: productVariants.id });
    await db.insert(stockLevels).values({ locationId: HQ_LOCATION_ID, pool: 'PLATFORM', variantId: variant.id, onHand: f.stock, reserved: 0 });
  }
}, 120000);

const pg = () => db as never;

async function walk(sort: 'price-asc' | 'price-desc' | 'rating', limit = 2): Promise<string[]> {
  const slugs: string[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 10; i++) {
    const res = await listProducts(pg(), { sort, limit, ...(cursor ? { cursor } : {}) });
    slugs.push(...res.items.map((p) => p.slug));
    if (!res.nextCursor) break;
    cursor = res.nextCursor;
  }
  return slugs;
}

describe('computed catalog sorts (SQL keyset)', () => {
  it('orders price ascending with slug tiebreak', async () => {
    expect(await walk('price-asc', 10)).toEqual(['p-b', 'p-c', 'p-d', 'p-a', 'p-f', 'p-e']);
  });

  it('orders price descending with slug tiebreak', async () => {
    expect(await walk('price-desc', 10)).toEqual(['p-e', 'p-f', 'p-a', 'p-c', 'p-d', 'p-b']);
  });

  it('orders rating ascending with slug tiebreak', async () => {
    expect(await walk('rating', 10)).toEqual(['p-e', 'p-c', 'p-a', 'p-d', 'p-f', 'p-b']);
  });

  it('paginates without gaps or duplicates', async () => {
    expect(await walk('price-asc', 2)).toEqual(['p-b', 'p-c', 'p-d', 'p-a', 'p-f', 'p-e']);
    expect(await walk('price-desc', 4)).toEqual(['p-e', 'p-f', 'p-a', 'p-c', 'p-d', 'p-b']);
    expect(await walk('rating', 3)).toEqual(['p-e', 'p-c', 'p-a', 'p-d', 'p-f', 'p-b']);
  });

  it('filters in-stock both ways', async () => {
    const inStock = await listProducts(pg(), { sort: 'price-asc', limit: 10, inStock: 'true' });
    expect(inStock.items.map((p) => p.slug).sort()).toEqual(['p-a', 'p-c', 'p-d', 'p-f']);
    const out = await listProducts(pg(), { sort: 'price-asc', limit: 10, inStock: 'false' });
    expect(out.items.map((p) => p.slug).sort()).toEqual(['p-b', 'p-e']);
  });

  it('restarts from head on garbage cursors', async () => {
    const res = await listProducts(pg(), { sort: 'price-desc', limit: 2, cursor: 'garbage!!' });
    expect(res.items.map((p) => p.slug)).toEqual(['p-e', 'p-f']);
  });
});
