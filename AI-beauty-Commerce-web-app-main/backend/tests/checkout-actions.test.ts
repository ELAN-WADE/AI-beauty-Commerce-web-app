/**
 * Phase 4 proof: Server Action cores run the IDENTICAL services as the REST
 * routes (same validation, same idempotency, same atomicity) with zero HTTP.
 * Runs on in-memory PGlite — no Postgres needed.
 */
import { describe, expect, it, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { ZodError } from 'zod';
import * as schema from '@/db/schema';
import { ApiError } from '@/lib/errors';
import { brands, categories, products, productVariants, productImages } from '@/modules/catalog/schema';
import { HQ_LOCATION_ID, inventoryLocations, stockLevels } from '@/modules/inventory/schema';
import {
  runCheckout,
  runInitPayment,
  runSyncCart,
  toActionFailure,
} from '@/app/actions/_shared';

let db: PgliteDatabase<typeof schema>;
const SESSION = '11111111-2222-4333-8555-666666666666';
const GUEST_TOKEN = 'a'.repeat(64);

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
  const [brand] = await db.insert(brands).values({ name: 'Desla', slug: 'desla' }).returning({ id: brands.id });
  const [category] = await db.insert(categories).values({ name: 'Skincare', slug: 'skincare' }).returning({ id: categories.id });
  const [product] = await db
    .insert(products)
    .values({ brandId: brand.id, categoryId: category.id, name: 'Action Body Oil', slug: 'action-body-oil', tagline: 't', description: 'd', subCategory: 'Body' })
    .returning({ id: products.id });
  const variants = await db
    .insert(productVariants)
    .values([
      { productId: product.id, sku: 'ABO-50', sizeLabel: '50ml', priceKobo: 15000, position: 0 },
      { productId: product.id, sku: 'ABO-100', sizeLabel: '100ml', priceKobo: 25000, position: 1 },
    ])
    .returning({ id: productVariants.id });
  await db.insert(productImages).values({ productId: product.id, url: '/action_oil.jpg', alt: 'Action', position: 0 });
  await db.insert(stockLevels).values([
    { locationId: HQ_LOCATION_ID, pool: 'PLATFORM', variantId: variants[0].id, onHand: 10, reserved: 0 },
    { locationId: HQ_LOCATION_ID, pool: 'PLATFORM', variantId: variants[1].id, onHand: 10, reserved: 0 },
  ]);
}, 120000);

const pg = () => db as never;
const guest = { sessionId: SESSION };
const address = {
  fullName: 'Test Shopper',
  email: 'shopper@example.com',
  phone: '+2348012345678',
  street: '12 Adeola Odeku',
  city: 'Lagos',
  state: 'Lagos',
};

describe('cart sync core (runSyncCart)', () => {
  it('replaces the server cart with exactly the given lines (slug→variant, verified)', async () => {
    const cart = await runSyncCart(pg(), guest, [
      { productId: 'action-body-oil', size: '50ml', quantity: 2 },
      { productId: 'ACTION-BODY-OIL', size: 'unknown-size', quantity: 1 }, // falls back to first variant… but dupes!
    ]).catch((e) => e as Error);
    // Both lines resolve to the 50ml variant → duplicate guard fires (same as REST).
    expect(cart).toBeInstanceOf(Error);
    expect((cart as Error).message).toMatch(/cannot be checked out/);

    const ok = await runSyncCart(pg(), guest, [
      { productId: 'action-body-oil', size: '50ml', quantity: 2 },
      { productId: 'action-body-oil', size: '100ml', quantity: 1 },
    ]);
    expect(ok.lines).toHaveLength(2);
    expect(ok.lines.find((l) => l.sizeLabel === '50ml')?.qty).toBe(2);
    expect(ok.subtotalKobo).toBe(2 * 15000 + 25000);
  });

  it('rejects bad quantities and unknown slugs like the REST path', async () => {
    await expect(runSyncCart(pg(), guest, [{ productId: 'action-body-oil', size: '50ml', quantity: 0 }])).rejects.toThrow(
      /cannot be checked out/,
    );
    await expect(runSyncCart(pg(), guest, [{ productId: 'no-such-slug', size: '50ml', quantity: 1 }])).rejects.toThrow(
      /cannot be checked out/,
    );
    await expect(runSyncCart(pg(), { sessionId: 'not-a-uuid' }, [])).rejects.toThrow();
  });
});

describe('checkout core (runCheckout)', () => {
  it('creates an atomic priced order and replays on the same idempotency key', async () => {
    await runSyncCart(pg(), guest, [{ productId: 'action-body-oil', size: '50ml', quantity: 1 }]);
    const key = `test-checkout-${Date.now()}`;
    const first = await runCheckout(pg(), guest, { ...address, guestAccessToken: GUEST_TOKEN }, key, '127.0.0.1');
    expect(first.replay).toBe(false);
    expect(first.order.status).toBe('PENDING');
    expect(first.order.items).toHaveLength(1);
    expect(first.order.items[0].unitPriceKobo).toBe(15000);

    const replay = await runCheckout(pg(), guest, { ...address, guestAccessToken: GUEST_TOKEN }, key, '127.0.0.1');
    expect(replay.replay).toBe(true);
    expect(replay.order.id).toBe(first.order.id);
  });

  it('enforces guest token + idempotency rules identically to the route', async () => {
    await expect(runCheckout(pg(), guest, { ...address }, 'short', '127.0.0.1')).rejects.toThrow(/Idempotency-Key/);
    await expect(
      runCheckout(pg(), guest, { ...address, guestAccessToken: undefined }, `k-${Date.now()}`, '127.0.0.1'),
    ).rejects.toThrow(/Guest access token is required/);
  });
});

describe('payment-init core (runInitPayment)', () => {
  it('rejects missing guest capability and bad keys before touching providers', async () => {
    await expect(
      runInitPayment(pg(), guest, { orderId: '00000000-0000-4000-8000-000000000099', provider: 'stripe', appUrl: '' }, 'short'),
    ).rejects.toThrow(/Idempotency-Key/);
    await expect(
      runInitPayment(
        pg(),
        guest,
        { orderId: '00000000-0000-4000-8000-000000000099', provider: 'stripe', appUrl: '' },
        `pay-key-${Date.now()}`,
      ),
    ).rejects.toThrow(/Guest order token required/);
  });
});

describe('action error envelope (toActionFailure)', () => {
  it('mirrors the REST envelope codes', () => {
    expect(toActionFailure(new ApiError(404, 'not_found', 'Gone.'))).toEqual({
      status: 404,
      code: 'not_found',
      message: 'Gone.',
    });
    const zod = new ZodError([]);
    expect(toActionFailure(zod)).toEqual({ status: 422, code: 'invalid_input', message: 'Validation failed.' });
    expect(toActionFailure(new Error('boom'))).toEqual({
      status: 500,
      code: 'internal_error',
      message: 'Unable to complete the request.',
    });
  });
});
