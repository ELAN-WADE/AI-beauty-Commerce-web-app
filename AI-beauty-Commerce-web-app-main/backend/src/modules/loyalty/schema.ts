import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from '../auth/schema';
import { orders } from '../orders/schema';

/** timestamptz alias: timezone-aware timestamps everywhere (audit-safe). */
const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/** One loyalty account per user; balance is authoritative here (never derived). */
export const loyaltyAccounts = pgTable(
  'loyalty_accounts',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    points: integer('points').notNull().default(0),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  () => [check('loyalty_balance_nonnegative', sql`"points" >= 0`)],
);

/**
 * Append-only ledger. UNIQUE(account, ref_type, ref_id) makes earn-on-payment
 * idempotent (webhook replays can't double-credit). Balance changes ONLY via
 * these rows, applied in the same transaction.
 */
export const loyaltyTxns = pgTable(
  'loyalty_txns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => loyaltyAccounts.userId, { onDelete: 'cascade' }),
    points: integer('points').notNull(), // +earn / -redeem / ±adjust
    type: text('type').notNull(), // earn|redeem|adjust
    refType: text('ref_type'),
    refId: text('ref_id'),
    note: text('note').notNull().default(''),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('loyalty_txns_account_idx').on(t.accountId),
    uniqueIndex('loyalty_txn_ref_unique').on(t.accountId, t.refType, t.refId),
    check('loyalty_txn_type_allowed', sql`"type" IN ('earn','redeem','adjust')`),
    check('loyalty_txn_nonzero', sql`"points" <> 0`),
  ],
);

/** Redeemable vouchers minted from points; consumed atomically at checkout. */
export const loyaltyVouchers = pgTable(
  'loyalty_vouchers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull().unique(), // GLW-XXXXXX
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    amountKobo: integer('amount_kobo').notNull(),
    minSpendKobo: integer('min_spend_kobo').notNull().default(0),
    status: text('status').notNull().default('active'),
    redeemedOrderId: uuid('redeemed_order_id').references(() => orders.id, { onDelete: 'set null' }),
    expiresAt: timestamptz('expires_at'),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('vouchers_user_idx').on(t.userId),
    check('voucher_amount_positive', sql`"amount_kobo" > 0`),
    check('voucher_status_allowed', sql`"status" IN ('active','redeemed','expired','cancelled')`),
  ],
);
