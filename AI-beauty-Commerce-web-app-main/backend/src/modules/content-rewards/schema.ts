import { bigint, check, index, integer, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { communityPosts } from '../community/schema';
import { creators } from '../creators/schema';
import { walletAccounts } from '../ledger/schema';
import { orders } from '../orders/schema';

const time = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const money = (name: string) => bigint(name, { mode: 'number' });

/**
 * Creator content rewards (Desla Collective).
 * One row per (post, Monday-UTC settlement window). Money moves ONLY through
 * the ledger: settle posts PENDING, release moves PENDING → AVAILABLE after
 * the hold, refunds before release shrink the entitlement via reversedKobo.
 * Replays converge on UNIQUE(post_id, window_start) + journal eventKeys.
 * No per-like payouts: entitlement derives from verified attributed orders.
 */
export const contentRewards = pgTable('content_rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id')
    .notNull()
    .references(() => communityPosts.id, { onDelete: 'cascade' }),
  creatorId: uuid('creator_id')
    .notNull()
    .references(() => creators.id, { onDelete: 'restrict' }),
  walletId: uuid('wallet_id')
    .notNull()
    .references(() => walletAccounts.id, { onDelete: 'restrict' }),
  windowStart: time('window_start').notNull(),
  windowEnd: time('window_end').notNull(),
  ordersAttributed: integer('orders_attributed').notNull().default(0),
  merchandiseKobo: money('merchandise_kobo').notNull().default(0),
  amountKobo: money('amount_kobo').notNull(),
  reversedKobo: money('reversed_kobo').notNull().default(0),
  // Snapshotted at settlement: later policy changes never rewrite earned rewards.
  rewardBps: integer('reward_bps').notNull().default(200),
  holdDays: integer('hold_days').notNull().default(14),
  releasedAt: time('released_at'),
  note: text('note').notNull().default(''),
  createdAt: time('created_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('content_reward_post_window_unique').on(t.postId, t.windowStart),
  index('content_reward_wallet_idx').on(t.walletId),
  index('content_reward_creator_idx').on(t.creatorId),
  check('content_reward_window_ordered', sql`"window_end" > "window_start"`),
  check('content_reward_amount_positive', sql`"amount_kobo" > 0 AND "amount_kobo" <= 9007199254740991`),
  check('content_reward_reversal_bounds', sql`"reversed_kobo" >= 0 AND "reversed_kobo" <= "amount_kobo"`),
  check('content_reward_counts_nonnegative', sql`"orders_attributed" >= 0 AND "merchandise_kobo" >= 0`),
  check('content_reward_bps_range', sql`"reward_bps" BETWEEN 0 AND 5000`),
]);

/**
 * Attribution ledger: which orders a reward paid for. order_id UNIQUE means
 * one order feeds at most one content reward (first eligible post wins) —
 * N approved posts can never multiply the same sale. Audit trail + replay key.
 */
export const contentRewardAttributions = pgTable('content_reward_attributions', {
  rewardId: uuid('reward_id')
    .notNull()
    .references(() => contentRewards.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'restrict' }),
  createdAt: time('created_at').notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.rewardId, t.orderId] }),
  uniqueIndex('content_reward_attribution_order_unique').on(t.orderId),
]);
