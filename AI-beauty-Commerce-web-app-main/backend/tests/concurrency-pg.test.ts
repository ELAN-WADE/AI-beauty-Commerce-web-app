import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import postgres from 'postgres';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { adjustStock, reserveStock } from '@/modules/inventory/service';
import { awardOrderCommissions, balances } from '@/modules/ledger/service';

// True multi-connection proof (PGlite is single-connection and cannot test
// row locks or advisory locks). Runs only with a real PostgreSQL:
//   TEST_DATABASE_URL=postgres://glowly:glowly_dev_only@localhost:5432/glowly_dev npm test -- concurrency-pg
// CI provides this via the postgres service; local runs need docker compose up.
const URL = process.env.TEST_DATABASE_URL;
const run = URL ? describe : describe.skipIf(true);

let sql: ReturnType<typeof postgres> | null = null;
let db: PostgresJsDatabase<typeof schema> | null = null;

beforeAll(async () => {
  if (!URL) return;
  sql = postgres(URL, { max: 12 });
  db = drizzle(sql, { schema });
  await migrate(db as never, { migrationsFolder: './drizzle' });
}, 120000);

afterAll(async () => {
  await sql?.end({ timeout: 5 });
});

const uid = () => crypto.randomUUID().slice(0, 8);

run('multi-connection concurrency proof (real postgres)', () => {
  it('ten concurrent checkouts on the last unit reserve exactly once, never oversell', async () => {
    const tag = uid();
    const [brand] = await db!.insert(schema.brands).values({ name: `Race Brand ${tag}`, slug: `race-brand-${tag}` }).returning({ id: schema.brands.id });
    const [category] = await db!.insert(schema.categories).values({ name: `Race ${tag}`, slug: `race-cat-${tag}` }).returning({ id: schema.categories.id });
    const [product] = await db!.insert(schema.products).values({ brandId: brand.id, categoryId: category.id, name: `Race Oil ${tag}`, slug: `race-oil-${tag}` }).returning({ id: schema.products.id });
    const [variant] = await db!.insert(schema.productVariants).values({ productId: product.id, sku: `RACE-${tag}`, priceKobo: 100000 }).returning({ id: schema.productVariants.id });
    await adjustStock(db as never, { variantId: variant.id, delta: 1, reason: 'race seed' });

    const attempts = await Promise.allSettled(
      Array.from({ length: 10 }, (_, i) => reserveStock(db as never, { variantId: variant.id, qty: 1, refType: 'order', refId: `race-${tag}-${i}`, ttlMinutes: 30 })),
    );
    expect(attempts.filter((a) => a.status === 'fulfilled')).toHaveLength(1);
    expect(attempts.filter((a) => a.status === 'rejected')).toHaveLength(9);

    const levels = await db!.select().from(schema.stockLevels).where(eq(schema.stockLevels.variantId, variant.id));
    const total = levels.reduce((s, l) => s + l.onHand, 0);
    const reserved = levels.reduce((s, l) => s + l.reserved, 0);
    expect(total).toBe(1);
    expect(reserved).toBe(1);
  });

  it('concurrent commission awards converge on one row and one balanced journal', async () => {
    const tag = uid();
    const [user] = await db!.insert(schema.users).values({ email: `race-${tag}@example.com`, passwordHash: 'x' }).returning({ id: schema.users.id });
    const [creator] = await db!
      .insert(schema.creators)
      .values({ userId: user.id, name: `Race Creator ${tag}`, promoCode: `RACE${tag.toUpperCase()}`, verified: true })
      .returning({ id: schema.creators.id, userId: schema.creators.userId });
    const [order] = await db!.insert(schema.orders).values({
      orderNumber: `DES-RACE-${tag.toUpperCase()}`, idempotencyKey: `race-key-${tag}`, kind: 'RETAIL',
      status: 'DELIVERED', paymentStatus: 'PAID', subtotalKobo: 100000, discountKobo: 0, totalKobo: 100000,
      creatorId: creator.id, creatorCommissionBps: 1200,
      shippingAddress: { fullName: 'Buyer' },
    }).returning({ id: schema.orders.id });

    await Promise.all([awardOrderCommissions(db as never, order.id), awardOrderCommissions(db as never, order.id)]);
    const awards = await db!.select().from(schema.commissionAwards).where(eq(schema.commissionAwards.orderId, order.id));
    expect(awards).toHaveLength(1);
    expect(awards[0].amountKobo).toBe(12000);
    const wallet = await balances(db as never, awards[0].walletId);
    expect(wallet.pendingKobo).toBe(12000);
    expect(creator.userId).toBe(user.id);
  });
});
