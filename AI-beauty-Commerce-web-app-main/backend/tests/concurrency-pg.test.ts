import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import postgres from 'postgres';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { eq, inArray } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { adjustStock, reserveStock } from '@/modules/inventory/service';
import { awardOrderCommissions, balances } from '@/modules/ledger/service';
import { beginMfaEnrollment, confirmMfaEnrollment, currentTotpCode, verifyMfaForSession } from '@/modules/auth/mfa';
import { hashPassword } from '@/modules/auth/service';
import { claimBatch, recoverStaleSending } from '@/modules/notifications/service';

// True multi-connection proof (PGlite is single-connection and cannot test
// row locks or advisory locks). Runs only with a real PostgreSQL:
//   npm run test:postgres (loads TEST_DATABASE_URL from .env)
// CI provides this via the postgres service; local runs need docker compose up.
const URL = process.env.TEST_DATABASE_URL;
const run = URL ? describe : describe.skipIf(true);

// Also enforce isolation when Vitest is called directly (including CI).
function databaseIdentity(value: string) {
  const url = new globalThis.URL(value);
  const host = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ? 'loopback' : url.hostname;
  return `${host}:${url.port || '5432'}${decodeURIComponent(url.pathname)}`;
}
if (URL && process.env.DATABASE_URL && databaseIdentity(URL) === databaseIdentity(process.env.DATABASE_URL)) {
  throw new Error('Concurrency tests require a separate TEST_DATABASE_URL database.');
}

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
  it('allows only one concurrent use of each MFA TOTP or recovery code', async () => {
    const password = 'Concurrency-MFA-password';
    const [user] = await db!.insert(schema.users).values({ email: `mfa-race-${uid()}@example.com`, passwordHash: await hashPassword(password), emailVerifiedAt: new Date() }).returning();
    const sessions = await db!.insert(schema.userSessions).values(Array.from({ length: 8 }, () => ({
      userId: user.id, tokenHash: crypto.randomUUID(), expiresAt: new Date(Date.now() + 3600_000),
    }))).returning();
    const enrollment = await beginMfaEnrollment(db!, user.id, user.email, password);
    const recovery = await confirmMfaEnrollment(db!, user.id, sessions[0].id, currentTotpCode(enrollment.secret));
    const results = await Promise.allSettled(sessions.map(s => verifyMfaForSession(db!, user.id, s.id, recovery.recoveryCodes[0])));
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    // Use the next accepted time step, distinct from the enrollment proof.
    const nextCode = currentTotpCode(enrollment.secret, Date.now() + 30_000);
    const totpResults = await Promise.allSettled(sessions.map(s => verifyMfaForSession(db!, user.id, s.id, nextCode)));
    expect(totpResults.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  });

  it('claims outbox rows once across workers and recovers an expired lease', async () => {
    const rows = await db!.insert(schema.notificationOutbox).values(Array.from({ length: 6 }, () => ({
      channel: 'email', template: `test.concurrent.${uid()}`, payload: {}, createdAt: new Date(0),
    }))).returning();
    const ids = new Set(rows.map(r => r.id));
    const batches = await Promise.all(Array.from({ length: 3 }, () => claimBatch(db!, 2)));
    const claimed = batches.flat().filter(r => ids.has(r.id));
    expect(claimed).toHaveLength(6);
    expect(new Set(claimed.map(r => r.id)).size).toBe(6);
    await db!.update(schema.notificationOutbox).set({ nextAttemptAt: new Date(0) }).where(eq(schema.notificationOutbox.id, rows[0].id));
    await recoverStaleSending(db!);
    const [expired] = await db!.select().from(schema.notificationOutbox).where(eq(schema.notificationOutbox.id, rows[0].id));
    const [active] = await db!.select().from(schema.notificationOutbox).where(eq(schema.notificationOutbox.id, rows[1].id));
    expect(expired.status).toBe('pending');
    expect(active.status).toBe('sending');
    const reclaimed = await claimBatch(db!, 1);
    expect(reclaimed[0].id).toBe(rows[0].id);
    await db!.update(schema.notificationOutbox).set({ status: 'sent' }).where(inArray(schema.notificationOutbox.id, [...ids]));
  });
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
