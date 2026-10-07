import { bigint, check, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from '../auth/schema';
import { distributors } from '../distributors/schema';
import { creators } from '../creators/schema';
import { orders } from '../orders/schema';

const time = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const money = (name: string) => bigint(name, { mode: 'number' });

export const walletAccounts = pgTable('wallet_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  distributorId: uuid('distributor_id').references(() => distributors.id, { onDelete: 'restrict' }).unique(),
  creatorId: uuid('creator_id').references(() => creators.id, { onDelete: 'restrict' }).unique(),
  currency: text('currency').notNull().default('NGN'),
  createdAt: time('created_at').notNull().defaultNow(),
}, (t) => [
  index('wallets_user_idx').on(t.userId),
  check('wallet_exactly_one_owner', sql`("distributor_id" IS NOT NULL)::int + ("creator_id" IS NOT NULL)::int = 1`),
  check('wallet_ngn_only', sql`"currency" = 'NGN'`),
]);

/** One immutable journal per business event. Every journal must balance to zero. */
export const ledgerJournals = pgTable('ledger_journals', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventKey: text('event_key').notNull().unique(),
  fingerprint: text('fingerprint').notNull(),
  description: text('description').notNull(),
  createdAt: time('created_at').notNull().defaultNow(),
});
export const ledgerEntries = pgTable('ledger_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  journalId: uuid('journal_id').notNull().references(() => ledgerJournals.id, { onDelete: 'restrict' }),
  walletId: uuid('wallet_id').references(() => walletAccounts.id, { onDelete: 'restrict' }),
  bucket: text('bucket').notNull(),
  amountKobo: money('amount_kobo').notNull(),
}, (t) => [
  index('ledger_wallet_bucket_idx').on(t.walletId, t.bucket),
  index('ledger_journal_idx').on(t.journalId),
  check('ledger_bucket_owner', sql`("wallet_id" IS NULL AND "bucket" = 'PLATFORM') OR ("wallet_id" IS NOT NULL AND "bucket" IN ('PENDING','AVAILABLE','HELD'))`),
  check('ledger_safe_amount', sql`"amount_kobo" <> 0 AND "amount_kobo" BETWEEN -9007199254740991 AND 9007199254740991`),
]);

export const commissionAwards = pgTable('commission_awards', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'restrict' }),
  walletId: uuid('wallet_id').notNull().references(() => walletAccounts.id, { onDelete: 'restrict' }),
  amountKobo: money('amount_kobo').notNull(),
  reversedKobo: money('reversed_kobo').notNull().default(0),
  holdDays: integer('hold_days').notNull().default(14),
  releasedAt: time('released_at'),
  createdAt: time('created_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('commission_order_wallet_unique').on(t.orderId, t.walletId),
  check('commission_reversal_bounds', sql`"amount_kobo" > 0 AND "reversed_kobo" BETWEEN 0 AND "amount_kobo"`),
]);

export const partnerBankAccounts = pgTable('partner_bank_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id').notNull().references(() => walletAccounts.id, { onDelete: 'restrict' }),
  bankCode: text('bank_code').notNull(),
  bankName: text('bank_name').notNull(),
  accountNumber: text('account_number').notNull(),
  accountName: text('account_name').notNull(),
  verifiedBy: uuid('verified_by').references(() => users.id, { onDelete: 'restrict' }),
  verifiedAt: time('verified_at'),
  verificationNote: text('verification_note'),
  createdAt: time('created_at').notNull().defaultNow(),
}, (t) => [uniqueIndex('wallet_bank_unique').on(t.walletId, t.bankCode, t.accountNumber)]);

export const withdrawalRequests = pgTable('withdrawal_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id').notNull().references(() => walletAccounts.id, { onDelete: 'restrict' }),
  bankAccountId: uuid('bank_account_id').notNull().references(() => partnerBankAccounts.id, { onDelete: 'restrict' }),
  amountKobo: money('amount_kobo').notNull(),
  status: text('status').notNull().default('REQUESTED'),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'restrict' }),
  paymentReference: text('payment_reference').unique(),
  evidence: text('evidence').notNull().default(''),
  createdAt: time('created_at').notNull().defaultNow(),
  updatedAt: time('updated_at').notNull().defaultNow(),
}, (t) => [
  index('withdrawals_wallet_idx').on(t.walletId, t.createdAt),
  check('withdrawal_amount_positive', sql`"amount_kobo" > 0 AND "amount_kobo" <= 9007199254740991`),
  check('withdrawal_status_allowed', sql`"status" IN ('REQUESTED','APPROVED','PROCESSING','PAID','REJECTED','FAILED')`),
]);
