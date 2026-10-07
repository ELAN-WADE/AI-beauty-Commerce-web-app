import { describe, expect, it, beforeAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { HQ_LOCATION_ID, inventoryLocations, stockLevels } from '@/modules/inventory/schema';
import { adjustStock, reserveStock, getLevels } from '@/modules/inventory/service';
import { postJournal } from '@/modules/ledger/service';
import { locateStock } from '@/modules/routing/service';
import { getGuestOrder, requireGuestOrder } from '@/modules/orders/service';
import { createHash, randomBytes } from 'node:crypto';
import { checkSharedRateLimit } from '@/lib/rate-limit';

let db: PgliteDatabase<typeof schema>;

beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  const client = new PGlite({ extensions: { pgcrypto, uuid_ossp } });
  db = drizzle(client, { schema });
  await migrate(db as never, { migrationsFolder: './drizzle' });
}, 120000);

describe('partner network migration', () => {
  it('enforces a shared atomic quota from the database', async () => {
    const key = `test:${crypto.randomUUID()}`;
    const first = await checkSharedRateLimit(db as never, key, { limit: 2, windowMs: 60_000 });
    const second = await checkSharedRateLimit(db as never, key, { limit: 2, windowMs: 60_000 });
    const third = await checkSharedRateLimit(db as never, key, { limit: 2, windowMs: 60_000 });
    expect([first.allowed, second.allowed, third.allowed]).toEqual([true, true, false]);
    expect(third.retryAfterMs).toBeGreaterThan(0);
  });
  it('rejects guest email as an order credential and accepts only its private capability', async () => {
    const token = randomBytes(32).toString('hex');
    const [order] = await db.insert(schema.orders).values({
      orderNumber: 'DES-TOK123', idempotencyKey: 'guest-token-boundary', guestEmail: 'guest@example.com',
      guestAccessTokenHash: createHash('sha256').update(token).digest('hex'),
      shippingAddress: { fullName: 'Guest', city: 'Lagos' },
    }).returning({ id: schema.orders.id });
    await expect(getGuestOrder(db as never, order.id, 'guest@example.com')).rejects.toThrow();
    await expect(requireGuestOrder(db as never, order.id, randomBytes(32).toString('hex'))).rejects.toThrow();
    expect((await getGuestOrder(db as never, 'DES-TOK123', token)).id).toBe(order.id);
  });
  it('seeds the HQ warehouse location with the fixed id', async () => {
    const rows = await db.select().from(inventoryLocations).where(eq(inventoryLocations.id, HQ_LOCATION_ID));
    expect(rows[0]?.code).toBe('HQ-LAGOS');
    expect(rows[0]?.isActive).toBe(true);
  });

  it('keys stock by location, isolating partner balances', async () => {
    const [brand] = await db.insert(schema.brands).values({ name: 'Test Brand', slug: 'test-brand' }).returning({ id: schema.brands.id });
    const [category] = await db.insert(schema.categories).values({ name: 'Test', slug: 'test-cat' }).returning({ id: schema.categories.id });
    const [product] = await db.insert(schema.products).values({ brandId: brand.id, categoryId: category.id, name: 'Oil', slug: 'test-oil' }).returning({ id: schema.products.id });
    const [variant] = await db.insert(schema.productVariants).values({ productId: product.id, sku: 'TEST-1', priceKobo: 2400000 }).returning({ id: schema.productVariants.id });
    const [partner] = await db.insert(schema.distributors).values({ name: 'Ota Hub', city: 'Ota', state: 'Ogun', verified: true }).returning({ id: schema.distributors.id });
    const [location] = await db.insert(inventoryLocations).values({ code: 'TEST-OTA', name: 'Ota Hub', type: 'DISTRIBUTOR', distributorId: partner.id, city: 'Ota', state: 'Ogun', isActive: true }).returning({ id: inventoryLocations.id });

    await adjustStock(db as never, { locationId: HQ_LOCATION_ID, variantId: variant.id, delta: 10, reason: 'seed hq' });
    await adjustStock(db as never, { locationId: location.id, variantId: variant.id, delta: 4, reason: 'seed hub' });

    const before = await getLevels(db as never, [variant.id]);
    expect(before.get(variant.id)?.onHand).toBe(14);

    const hold = await reserveStock(db as never, { locationId: location.id, variantId: variant.id, qty: 3, refType: 'order', refId: 'order-1', ttlMinutes: 30 });
    expect(hold.id).toBeDefined();

    const hubLevels = await db.select().from(stockLevels).where(eq(stockLevels.locationId, location.id));
    const hqLevels = await db.select().from(stockLevels).where(eq(stockLevels.locationId, HQ_LOCATION_ID));
    expect(hqLevels[0]?.reserved).toBe(0);
    expect(hubLevels[0]?.reserved).toBe(3);

    // Reserving more than the hub holds fails even though HQ has stock.
    await expect(reserveStock(db as never, { locationId: location.id, variantId: variant.id, qty: 5, refType: 'order', refId: 'order-2', ttlMinutes: 30 })).rejects.toThrow();
  });

  it('routes only when every line is available at one location', async () => {
    const variantRows = await db.select({ id: schema.productVariants.id }).from(schema.productVariants).limit(1);
    const result = await locateStock(db as never, { city: 'Ota', state: 'Ogun', method: 'DELIVERY', items: [{ variantId: variantRows[0].id, qty: 1 }] });
    expect(result.hasFullCart).toBe(true);
    expect(result.options[0]?.locationId).toBeDefined();
    expect(result.options.every((o) => o.feeKobo >= 0)).toBe(true);
  });

  it('keeps the earnings journal balanced and replay-safe', async () => {
    const [user] = await db.insert(schema.users).values({ email: 'partner@example.com', passwordHash: 'x' }).returning({ id: schema.users.id });
    const [creator] = await db.insert(schema.creators).values({ userId: user.id, name: 'Ada', promoCode: 'ADA99', verified: true }).returning({ id: schema.creators.id });
    const [wallet] = await db.insert(schema.walletAccounts).values({ userId: user.id, creatorId: creator.id }).returning({ id: schema.walletAccounts.id });

    const posted = await postJournal(db as never, 'test:event:1', 'test award', [
      { walletId: wallet.id, bucket: 'PENDING', amountKobo: 1000 },
      { walletId: null, bucket: 'PLATFORM', amountKobo: -1000 },
    ]);
    expect(posted).toBe(true);

    const replay = await postJournal(db as never, 'test:event:1', 'test award', [
      { walletId: wallet.id, bucket: 'PENDING', amountKobo: 1000 },
      { walletId: null, bucket: 'PLATFORM', amountKobo: -1000 },
    ]);
    expect(replay).toBe(false);

    await expect(postJournal(db as never, 'test:event:1', 'changed', [
      { walletId: wallet.id, bucket: 'PENDING', amountKobo: 2000 },
      { walletId: null, bucket: 'PLATFORM', amountKobo: -2000 },
    ])).rejects.toThrow();

    await expect(postJournal(db as never, 'test:event:2', 'unbalanced', [
      { walletId: wallet.id, bucket: 'PENDING', amountKobo: 1000 },
      { walletId: null, bucket: 'PLATFORM', amountKobo: -999 },
    ])).rejects.toThrow();
  });
});
