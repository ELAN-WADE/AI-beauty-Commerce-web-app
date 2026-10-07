import { and, eq, gte, inArray, isNull, lt, sql } from 'drizzle-orm';
import type { AppDb, Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { communityPosts } from '../community/schema';
import { creators } from '../creators/schema';
import { orders } from '../orders/schema';
import { payments, refunds } from '../payments/schema';
import { commissionFor, lockWallet, postJournal, safeMoney, walletFor } from '../ledger/service';
import { contentRewardAttributions, contentRewards } from './schema';

function policy(name: string, fallback: number, max: number) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < 0 || value > max) throw new Error(`Invalid ${name}`);
  return value;
}

/** Share of weekly attributed merchandise paid to the creator (basis points). 0 = program paused. */
export const contentRewardBps = () => policy('CONTENT_REWARD_BPS', 200, 5000);
/** Weekly attributed merchandise below this (kobo) settles nothing — kills dust payouts. */
export const contentRewardMinMerchandiseKobo = () => Math.max(0, policy('CONTENT_REWARD_MIN_MERCHANDISE_KOBO', 50000, 1_000_000_000));
export const contentRewardHoldDays = () => policy('CONTENT_REWARD_HOLD_DAYS', 14, 365);

/** Pure: reward for net merchandise. Likes/views are never inputs. */
export function contentRewardFor(merchandiseKobo: number, bps = contentRewardBps()): number {
  if (!Number.isSafeInteger(merchandiseKobo) || merchandiseKobo <= 0 || bps <= 0) return 0;
  return commissionFor(merchandiseKobo, bps);
}

/** Monday-00:00-UTC settlement weeks. */
export function weekWindow(d: Date): { start: Date; end: Date } {
  const day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const back = (new Date(day).getUTCDay() + 6) % 7;
  const start = new Date(day - back * 86_400_000);
  return { start, end: new Date(start.getTime() + 7 * 86_400_000) };
}

/**
 * Unconsumed attributed orders for a creator in [start, end): paid retail
 * orders carrying their creatorId that no content reward has consumed yet.
 * Server-snapshotted order.creatorId is the only attribution key — never post
 * text, likes, or client claims. Ordered by creation so consumption is stable.
 */
export async function unattributedOrders(
  db: Db,
  creatorId: string,
  start: Date,
  end: Date,
  limit = 1000,
): Promise<{ id: string; netKobo: number }[]> {
  const rows = await db
    .select({ id: orders.id, netKobo: sql<number>`${orders.subtotalKobo} - ${orders.discountKobo}` })
    .from(orders)
    .where(
      and(
        eq(orders.creatorId, creatorId),
        eq(orders.kind, 'RETAIL'),
        inArray(orders.paymentStatus, ['PAID', 'REFUNDED']),
        gte(orders.createdAt, start),
        lt(orders.createdAt, end),
        sql`NOT EXISTS (SELECT 1 FROM ${contentRewardAttributions} a WHERE a.order_id = ${orders.id})`,
      ),
    )
    .orderBy(orders.createdAt, orders.id)
    .limit(limit);
  return rows;
}

/** Successful refunds against a set of orders (late refunds included). */
export async function refundedForOrders(db: Db, orderIds: string[]): Promise<number> {
  if (orderIds.length === 0) return 0;
  const [ret] = await db
    .select({ refunded: sql<string>`coalesce(sum(${refunds.amountKobo}), 0)::text` })
    .from(refunds)
    .innerJoin(payments, eq(payments.id, refunds.paymentId))
    .where(and(eq(refunds.status, 'success'), inArray(payments.orderId, orderIds)));
  return Number(ret.refunded);
}

/**
 * Weekly settlement: eligible posts ordered by creation (first post wins ties
 * across posts — one order feeds at most one reward). Each (post, week)
 * settles atomically — reward row + attribution rows + balanced journal
 * commit together — under a per-creator advisory lock so concurrent workers
 * cannot double-consume an order. Replay-safe: UNIQUE(post, window) +
 * UNIQUE(order) attribution + journal eventKey dedupe.
 */
export async function settleContentRewards(db: AppDb, now = new Date(), postLimit = 200): Promise<{ settled: number }> {
  const bps = contentRewardBps();
  if (bps <= 0) return { settled: 0 };
  const minMerch = contentRewardMinMerchandiseKobo();
  const holdDays = contentRewardHoldDays();
  const currentWeekStart = weekWindow(now).start;
  const posts = await db
    .select({ id: communityPosts.id, creatorId: communityPosts.creatorId, createdAt: communityPosts.createdAt })
    .from(communityPosts)
    .where(
      and(
        eq(communityPosts.visible, true),
        eq(communityPosts.rewardEligible, true),
        lt(communityPosts.createdAt, currentWeekStart),
      ),
    )
    .orderBy(communityPosts.createdAt)
    .limit(postLimit);
  let settled = 0;
  for (const post of posts) {
    if (!post.creatorId) continue;
    const [creator] = await db.select().from(creators).where(eq(creators.id, post.creatorId)).limit(1);
    if (!creator?.userId || !creator.verified) continue;
    const owner = { id: creator.id, userId: creator.userId };
    const done = await db
      .select({ ws: contentRewards.windowStart })
      .from(contentRewards)
      .where(eq(contentRewards.postId, post.id));
    const doneSet = new Set(done.map((r) => (r.ws as Date).toISOString()));
    let w = weekWindow(post.createdAt as Date);
    for (let guard = 0; guard < 26 && w.end <= currentWeekStart; guard++) {
      const key = w.start.toISOString();
      const week = { start: w.start, end: w.end };
      w = { start: w.end, end: new Date(w.end.getTime() + 7 * 86_400_000) };
      if (doneSet.has(key)) continue;
      const outcome = await settlePostWeek(db, { postId: post.id, creator: owner, week, key, bps, minMerch, holdDays });
      if (outcome === 'settled') settled += 1;
    }
  }
  return { settled };
}

async function settlePostWeek(
  db: AppDb,
  input: {
    postId: string;
    creator: { id: string; userId: string };
    week: { start: Date; end: Date };
    key: string;
    bps: number;
    minMerch: number;
    holdDays: number;
  },
): Promise<'settled' | 'skipped' | 'duplicate'> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`content-reward:${input.creator.id}:${input.key}`}, 0))`);
    const [exists] = await tx
      .select({ id: contentRewards.id })
      .from(contentRewards)
      .where(and(eq(contentRewards.postId, input.postId), eq(contentRewards.windowStart, input.week.start)));
    if (exists) return 'duplicate' as const;
    const candidates = await unattributedOrders(tx, input.creator.id, input.week.start, input.week.end);
    if (candidates.length === 0) return 'skipped' as const;
    const refunded = await refundedForOrders(tx, candidates.map((c) => c.id));
    const gross = candidates.reduce((s, c) => s + c.netKobo, 0);
    const net = Math.max(0, gross - refunded);
    if (net < input.minMerch) return 'skipped' as const;
    const amount = contentRewardFor(net, input.bps);
    if (amount <= 0) return 'skipped' as const;
    const wallet = await walletFor(tx, 'CREATOR', input.creator.id, input.creator.userId);
    await lockWallet(tx, wallet.id);
    const [row] = await tx
      .insert(contentRewards)
      .values({
        postId: input.postId,
        creatorId: input.creator.id,
        walletId: wallet.id,
        windowStart: input.week.start,
        windowEnd: input.week.end,
        ordersAttributed: candidates.length,
        merchandiseKobo: net,
        amountKobo: amount,
        rewardBps: input.bps,
        holdDays: input.holdDays,
      })
      .onConflictDoNothing()
      .returning({ id: contentRewards.id });
    if (!row) return 'duplicate' as const;
    await tx
      .insert(contentRewardAttributions)
      .values(candidates.map((c) => ({ rewardId: row.id, orderId: c.id })))
      .onConflictDoNothing();
    await postJournal(tx, `content-reward:${input.postId}:${input.key}`, `Content reward w/c ${input.key.slice(0, 10)} (${candidates.length} attributed orders)`, [
      { walletId: wallet.id, bucket: 'PENDING', amountKobo: amount },
      { walletId: null, bucket: 'PLATFORM', amountKobo: -amount },
    ]);
    return 'settled' as const;
  });
}

/**
 * Release matured rewards PENDING → AVAILABLE. Refunds that landed after
 * settlement shrink the entitlement first (reversedKobo), computed from the
 * reward's SNAPSHOT rate — live policy changes never rewrite earned rewards.
 */
export async function releaseContentRewards(db: AppDb): Promise<number> {
  const rows = await db.select().from(contentRewards).where(isNull(contentRewards.releasedAt)).limit(100);
  let released = 0;
  for (const r of rows) {
    if ((r.windowEnd as Date).getTime() + r.holdDays * 86_400_000 > Date.now()) continue;
    await db.transaction(async (tx) => {
      await lockWallet(tx, r.walletId);
      const [cur] = await tx.select().from(contentRewards).where(eq(contentRewards.id, r.id)).for('update');
      if (!cur || cur.releasedAt) return;
      const orderIds = (
        await tx.select({ id: contentRewardAttributions.orderId }).from(contentRewardAttributions).where(eq(contentRewardAttributions.rewardId, cur.id))
      ).map((a) => a.id);
      const gross = await tx
        .select({ merch: sql<string>`coalesce(sum(${orders.subtotalKobo} - ${orders.discountKobo}), 0)::text` })
        .from(orders)
        .where(inArray(orders.id, orderIds.length > 0 ? orderIds : ['00000000-0000-0000-0000-000000000000']));
      const refunded = await refundedForOrders(tx, orderIds);
      const entitled = contentRewardFor(Math.max(0, Number(gross[0].merch) - refunded), cur.rewardBps);
      const reversed = Math.min(cur.amountKobo, Math.max(0, cur.amountKobo - entitled));
      if (reversed > 0) {
        await postJournal(tx, `content-reward-reversal:${cur.id}:${reversed}`, 'Content reward reversal (refunds)', [
          { walletId: cur.walletId, bucket: 'PENDING', amountKobo: -reversed },
          { walletId: null, bucket: 'PLATFORM', amountKobo: reversed },
        ]);
        await tx.update(contentRewards).set({ reversedKobo: reversed }).where(eq(contentRewards.id, cur.id));
      }
      const payout = cur.amountKobo - reversed;
      if (payout > 0) {
        await postJournal(tx, `content-reward-release:${cur.id}`, 'Content reward cleared', [
          { walletId: cur.walletId, bucket: 'PENDING', amountKobo: -payout },
          { walletId: cur.walletId, bucket: 'AVAILABLE', amountKobo: payout },
        ]);
      }
      await tx.update(contentRewards).set({ releasedAt: new Date() }).where(eq(contentRewards.id, cur.id));
      released += 1;
    });
  }
  return released;
}

/**
 * Late-refund reversal AFTER release: a refund reconciled after the reward
 * cleared shrinks AVAILABLE proportionally (capped at the remaining balance),
 * mirroring commission reversals. Called alongside reverseCommissions from the
 * refund/cancel paths — same tx, same money guarantees.
 */
export async function reverseContentRewards(db: Db, orderId: string, refundedKobo: number) {
  const links = await db.select().from(contentRewardAttributions).where(eq(contentRewardAttributions.orderId, orderId));
  if (links.length === 0) return;
  for (const link of links) {
    const [reward] = await db.select().from(contentRewards).where(eq(contentRewards.id, link.rewardId)).for('update');
    if (!reward) continue;
    await lockWallet(db, reward.walletId);
    const [cur] = await db.select().from(contentRewards).where(eq(contentRewards.id, link.rewardId)).for('update');
    if (!cur) continue;
    const delta = Math.min(
      cur.amountKobo - cur.reversedKobo,
      Math.max(0, Math.floor((safeMoney(refundedKobo) * cur.rewardBps) / 10000)),
    );
    if (delta <= 0) continue;
    await postJournal(db, `content-reward-late-reversal:${cur.id}:${orderId}`, 'Content reward reversal (post-release refund)', [
      { walletId: cur.walletId, bucket: cur.releasedAt ? 'AVAILABLE' : 'PENDING', amountKobo: -delta },
      { walletId: null, bucket: 'PLATFORM', amountKobo: delta },
    ]);
    await db.update(contentRewards).set({ reversedKobo: cur.reversedKobo + delta }).where(eq(contentRewards.id, cur.id));
  }
}

/** Wallet-level net content earnings split for creator dashboards. */
export async function contentRewardTotals(db: Db, walletId: string) {
  const rows = await db
    .select({ released: contentRewards.releasedAt, amount: contentRewards.amountKobo, reversed: contentRewards.reversedKobo })
    .from(contentRewards)
    .where(eq(contentRewards.walletId, walletId));
  let pending = 0;
  let available = 0;
  for (const r of rows) {
    const net = r.amount - r.reversed;
    if (r.released) available += net;
    else pending += net;
  }
  return { contentPendingKobo: pending, contentAvailableKobo: available, contentPosts: rows.length };
}
