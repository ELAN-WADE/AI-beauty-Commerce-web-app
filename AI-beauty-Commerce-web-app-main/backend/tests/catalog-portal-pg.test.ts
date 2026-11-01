import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { portalProductSchema, savePortalProduct } from '@/modules/catalog/portal';
import { products, productVariants } from '@/modules/catalog/schema';
import { getProduct, listProducts } from '@/modules/catalog/service';
import { productQuerySchema } from '@/modules/catalog/validation';
import { mapOwned } from '@/storefront/lib/owned-api';

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;
let actorId: string;
const pg = () => db as never;
const payload = (overrides: Record<string, unknown> = {}) => portalProductSchema.parse({
  slug: 'live-barrier-serum', name: 'Live Barrier Serum', brand: 'Live Test Brand', category: 'facial-care',
  tagline: 'Barrier support', description: 'Live catalogue product', subCategory: 'Serum', isActive: true,
  isNew: true, isBestseller: false, isFlashSale: false, image: '/product_barrier_cream.jpg', galleryImages: [],
  variants: [{ sku: 'LIVE-BARRIER-50', sizeLabel: '50ml', priceNgn: 12500, compareAtNgn: null, stock: 7, isActive: true }],
  whatItDoes: ['Supports the skin barrier'], whoItsFor: { skinTypes: ['All Skin Types'], concerns: ['Dryness'] },
  keyIngredients: [{ name: 'Ceramide', percentage: '3%', description: 'Barrier support' }],
  howToUse: { routine: 'PM', step: '2', instructions: 'Apply nightly', precautions: 'Patch test' },
  brandInfo: { origin: 'Lagos', crueltyFree: true, guarantee: 'Authenticity guaranteed' }, customBadge: 'Cold pressed',
  ...overrides,
});

beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } });
  db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: './drizzle' });
  const [actor] = await db.insert(schema.users).values({ email: 'catalogue-admin@example.test', passwordHash: 'test' }).returning();
  actorId = actor.id;
  await db.insert(schema.categories).values({ name: 'Facial Care', slug: 'facial-care' }).onConflictDoNothing();
}, 120000);
afterAll(async () => { await client?.close(); });

describe('admin live catalogue publication', () => {
  it('keeps drafts private, publishes real fields to the storefront model, reflects edits, and removes withdrawn products', async () => {
    const draft = payload({ slug: 'test-publication-journey', name: 'TEST Formulation Preview', isActive: false, variants: [{ sku: 'TEST-PREVIEW-50', sizeLabel: '50ml', priceNgn: 15000, compareAtNgn: null, stock: 0, isActive: true }] });
    const saved = await savePortalProduct(pg(), actorId, draft, 'publication-journey-draft');
    const query = productQuerySchema.parse({ q: 'TEST Formulation Preview' });
    expect((await listProducts(pg(), query)).items).toHaveLength(0);
    await expect(getProduct(pg(), saved.slug)).rejects.toMatchObject({ status: 404 });
    const [variant] = await db.select().from(productVariants).where(eq(productVariants.productId, saved.id));
    const published = { ...draft, serverId: saved.id, version: 1, isActive: true, variants: draft.variants.map(v => ({ ...v, id: variant.id })) };
    await savePortalProduct(pg(), actorId, published, 'publication-journey-publish');
    const listing = await listProducts(pg(), query);
    expect(listing.items).toHaveLength(1);
    expect(mapOwned(listing.items[0])).toMatchObject({ id: draft.slug, name: draft.name, price: 15000, image: '/product_barrier_cream.jpg', inStock: false, stockCount: 0, whatItDoes: draft.whatItDoes });
    expect(mapOwned(await getProduct(pg(), saved.slug))).toMatchObject({ description: draft.description, keyIngredients: draft.keyIngredients });
    const edited = { ...published, version: 2, tagline: 'Updated from administrator', variants: published.variants.map(v => ({ ...v, priceNgn: 16000 })) };
    await savePortalProduct(pg(), actorId, edited, 'publication-journey-edit');
    expect(mapOwned(await getProduct(pg(), saved.slug))).toMatchObject({ price: 16000, tagline: edited.tagline });
    await savePortalProduct(pg(), actorId, { ...edited, version: 3, isActive: false }, 'publication-journey-withdraw');
    expect((await listProducts(pg(), query)).items).toHaveLength(0);
    await expect(getProduct(pg(), saved.slug)).rejects.toMatchObject({ status: 404 });
  });
  it('rejects clinical merchandising labels at the server boundary', () => {
    expect(() => payload({ customBadge: 'Clinical Strength' })).toThrow();
  });
  it('creates products, prices, stock, and presentation fields in the database and safely replays', async () => {
    const product = payload();
    const first = await savePortalProduct(pg(), actorId, product, 'publish-product-key-1');
    const replay = await savePortalProduct(pg(), actorId, product, 'publish-product-key-1');
    expect(replay.id).toBe(first.id);
    const [row] = await db.select().from(products).where(eq(products.id, first.id));
    const variants = await db.select().from(productVariants).where(eq(productVariants.productId, first.id));
    expect(row.presentation).toMatchObject({ customBadge: 'Cold pressed', brandInfo: { origin: 'Lagos' } });
    expect(row.version).toBe(1);
    expect(variants).toHaveLength(1);
    expect(variants[0].priceKobo).toBe(1_250_000);
  });

  it('rejects stale edits and does not overwrite another publication key', async () => {
    const first = await savePortalProduct(pg(), actorId, payload({ slug: 'stale-serum', name: 'Stale Serum', variants: [{ sku: 'STALE-50', sizeLabel: '50ml', priceNgn: 10000, compareAtNgn: null, stock: 1, isActive: true }] }), 'publish-product-key-2');
    const [variant] = await db.select().from(productVariants).where(eq(productVariants.productId, first.id));
    await savePortalProduct(pg(), actorId, payload({ serverId: first.id, version: 1, slug: 'stale-serum', name: 'Stale Serum', variants: [{ id: variant.id, sku: 'STALE-50', sizeLabel: '50ml', priceNgn: 11000, compareAtNgn: null, stock: 2, isActive: true }] }), 'publish-product-key-3');
    await expect(savePortalProduct(pg(), actorId, payload({ serverId: first.id, version: 1, slug: 'stale-serum', name: 'Stale Serum', variants: [{ id: variant.id, sku: 'STALE-50', sizeLabel: '50ml', priceNgn: 12000, compareAtNgn: null, stock: 3, isActive: true }] }), 'publish-product-key-4')).rejects.toMatchObject({ status: 409 });
  });
});
