import { describe, expect, it, beforeAll, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { contentRewardFor, contentRewardTotals, releaseContentRewards, reverseContentRewards, settleContentRewards, weekWindow } from '@/modules/content-rewards/service';
import { balances } from '@/modules/ledger/service';

describe('content reward math (pure)', () => {
  it('weeks start Monday 00:00 UTC', () => {
    const monday = weekWindow(new Date('2026-01-05T15:00:00Z'));
    expect(monday.start.toISOString()).toBe('2026-01-05T00:00:00.000Z');
    expect(monday.end.toISOString()).toBe('2026-01-12T00:00:00.000Z');
    const sunday = weekWindow(new Date('2026-01-11T23:59:59Z'));
    expect(sunday.start.toISOString()).toBe('2026-01-05T00:00:00.000Z');
  });

  it('pays basis points on net merchandise, never on likes or zero', () => {
    expect(contentRewardFor(10000, 200)).toBe(200);
    expect(contentRewardFor(120000, 200)).toBe(2400);
    expect(contentRewardFor(0, 200)).toBe(0);
    expect(contentRewardFor(-5, 200)).toBe(0);
    expect(contentRewardFor(10000, 0)).toBe(0);
  });
});

let db: PgliteDatabase<typeof schema>;

beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  const client = new PGlite({ extensions: { pgcrypto, uuid_ossp } });
  db = drizzle(client, { schema });
  await migrate(db as never, { migrationsFolder: './drizzle' });
}, 120000);

describe('content reward settlement (postgres)', () => {
  it('settles approved creator posts from attributed orders, replays safely, releases to available', async () => {
    const [user] = await db.insert(schema.users).values({ email: 'content-creator@example.com', passwordHash: 'x' }).returning({ id: schema.users.id });
    const [creator] = await db
      .insert(schema.creators)
      .values({ userId: user.id, name: 'Test Creator', promoCode: 'CONTENT99', verified: true })
      .returning({ id: schema.creators.id });
    const [post] = await db
      .insert(schema.communityPosts)
      .values({ userId: user.id, creatorId: creator.id, authorName: 'Test', content: 'routine video post', visible: true, rewardEligible: true, createdAt: new Date('2026-01-06T12:00:00Z') })
      .returning({ id: schema.communityPosts.id });
    // Same creator, not approved: must never settle.
    await db.insert(schema.communityPosts).values({ userId: user.id, creatorId: creator.id, authorName: 'Test', content: 'draft post', visible: true, rewardEligible: false, createdAt: new Date('2026-01-06T12:00:00Z') });

    const mkOrder = async (n: string, key: string, subtotal: number, discount: number) => {
      const [o] = await db.insert(schema.orders).values({
        orderNumber: n, idempotencyKey: key, kind: 'RETAIL', status: 'DELIVERED', paymentStatus: 'PAID',
        subtotalKobo: subtotal, discountKobo: discount, totalKobo: subtotal - discount,
        creatorCode: 'CONTENT99', creatorId: creator.id, creatorCommissionBps: 1200,
        shippingAddress: { fullName: 'Buyer' }, createdAt: new Date('2026-01-07T12:00:00Z'),
      }).returning({ id: schema.orders.id });
      const [p] = await db.insert(schema.payments).values({ orderId: o.id, provider: 'flutterwave', reference: `REF-${n}`, amountKobo: subtotal - discount }).returning({ id: schema.payments.id });
      return { orderId: o.id, paymentId: p.id };
    };
    const a = await mkOrder('DES-CONTENT-1', 'content-key-1', 100000, 0);
    await mkOrder('DES-CONTENT-2', 'content-key-2', 50000, 10000);
    // Successful partial refund on order 1: net merchandise 140000 - 20000 = 120000.
    await db.insert(schema.refunds).values({ paymentId: a.paymentId, amountKobo: 20000, reason: 'partial', status: 'success' });

    const first = await settleContentRewards(db as never);
    expect(first.settled).toBe(1);
    const rows = await db.select().from(schema.contentRewards).where(eq(schema.contentRewards.postId, post.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].ordersAttributed).toBe(2);
    expect(rows[0].merchandiseKobo).toBe(120000);
    expect(rows[0].amountKobo).toBe(2400);
    expect(rows[0].releasedAt).toBeNull();

    // Replay converges: no duplicate row, no duplicate journal.
    const replay = await settleContentRewards(db as never);
    expect(replay.settled).toBe(0);
    expect(await db.select().from(schema.contentRewards)).toHaveLength(1);

    // Release after the hold: PENDING -> AVAILABLE, withdrawable.
    expect(await releaseContentRewards(db as never)).toBe(1);
    const totals = await contentRewardTotals(db as never, rows[0].walletId);
    expect(totals).toMatchObject({ contentPendingKobo: 0, contentAvailableKobo: 2400, contentPosts: 1 });
    const wallet = await balances(db as never, rows[0].walletId);
    expect(wallet.availableKobo).toBe(2400);
  });

  it('attributes each order once, snapshots the rate, reverses post-release refunds', async () => {
    const [user] = await db.insert(schema.users).values({ email: 'content-creator-2@example.com', passwordHash: 'x' }).returning({ id: schema.users.id });
    const [creator] = await db
      .insert(schema.creators)
      .values({ userId: user.id, name: 'Second Creator', promoCode: 'CONTENT98', verified: true })
      .returning({ id: schema.creators.id });
    // Two eligible posts, same creator, same week: the earlier post wins everything.
    const [first] = await db
      .insert(schema.communityPosts)
      .values({ userId: user.id, creatorId: creator.id, authorName: 'Two', content: 'first video', visible: true, rewardEligible: true, createdAt: new Date('2026-01-06T12:00:00Z') })
      .returning({ id: schema.communityPosts.id });
    const [second] = await db
      .insert(schema.communityPosts)
      .values({ userId: user.id, creatorId: creator.id, authorName: 'Two', content: 'second video', visible: true, rewardEligible: true, createdAt: new Date('2026-01-07T12:00:00Z') })
      .returning({ id: schema.communityPosts.id });
    const [o] = await db.insert(schema.orders).values({
      orderNumber: 'DES-CONTENT-3', idempotencyKey: 'content-key-3', kind: 'RETAIL', status: 'DELIVERED', paymentStatus: 'PAID',
      subtotalKobo: 200000, discountKobo: 0, totalKobo: 200000,
      creatorCode: 'CONTENT98', creatorId: creator.id, creatorCommissionBps: 1200,
      shippingAddress: { fullName: 'Buyer' }, createdAt: new Date('2026-01-08T12:00:00Z'),
    }).returning({ id: schema.orders.id });
    const [pay] = await db.insert(schema.payments).values({ orderId: o.id, provider: 'flutterwave', reference: 'REF-DES-CONTENT-3', amountKobo: 200000 }).returning({ id: schema.payments.id });

    expect((await settleContentRewards(db as never)).settled).toBe(1);
    expect(await db.select().from(schema.contentRewards)).toHaveLength(2); // 1 from prior test + 1 here
    const mine = await db.select().from(schema.contentRewards).where(eq(schema.contentRewards.postId, first.id));
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ ordersAttributed: 1, merchandiseKobo: 200000, amountKobo: 4000, rewardBps: 200 });
    expect(await db.select().from(schema.contentRewards).where(eq(schema.contentRewards.postId, second.id))).toHaveLength(0);

    // Rate changes after settlement must not rewrite earned rewards.
    vi.stubEnv('CONTENT_REWARD_BPS', '50');
    try {
      expect(await releaseContentRewards(db as never)).toBe(1);
    } finally {
      vi.unstubAllEnvs();
    }
    const snap = (await db.select().from(schema.contentRewards).where(eq(schema.contentRewards.postId, first.id)))[0];
    expect(snap.reversedKobo).toBe(0);
    expect(await contentRewardTotals(db as never, snap.walletId)).toMatchObject({ contentAvailableKobo: 4000 });

    // Post-release refund reverses proportionally from AVAILABLE, capped at balance.
    await db.insert(schema.refunds).values({ paymentId: pay.id, amountKobo: 40000, reason: 'late return', status: 'success' });
    await reverseContentRewards(db as never, o.id, 40000);
    expect(await contentRewardTotals(db as never, snap.walletId)).toMatchObject({ contentAvailableKobo: 3200, contentPendingKobo: 0 });
    const wallet = await balances(db as never, snap.walletId);
    expect(wallet.availableKobo).toBe(3200);
  });
});
