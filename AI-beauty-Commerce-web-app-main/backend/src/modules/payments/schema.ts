import {
  check,
  index,
  integer,
  jsonb,
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

/**
 * Every provider redirect/API handshake starts here. One row per init attempt;
 * retries from the frontend reuse the row via idempotency_key (no duplicates).
 */
export const paymentAttempts = pgTable(
  'payment_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(), // flutterwave|paystack|opay|transfer
    amountKobo: integer('amount_kobo').notNull(),
    currency: text('currency').notNull().default('NGN'),
    reference: text('reference').notNull().unique(), // our tx_ref / merchant order no.
    idempotencyKey: text('idempotency_key').notNull().unique(),
    status: text('status').notNull().default('initiated'),
    authorizationUrl: text('authorization_url'),
    providerRef: text('provider_ref'), // flw transaction_id / opay orderNo / paystack ref
    expiresAt: timestamptz('expires_at'),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('attempts_order_idx').on(t.orderId),
    check('attempt_amount_positive', sql`"amount_kobo" > 0`),
    check(
      'attempt_status_allowed',
      sql`"status" IN ('initiated','authorization_open','success','failed','expired')`,
    ),
  ],
);

/** Exactly one successful payment per order (UNIQUE order_id). Webhook replays converge here. */
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .unique()
      .references(() => orders.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull(),
    reference: text('reference').notNull().unique(),
    amountKobo: integer('amount_kobo').notNull(),
    currency: text('currency').notNull().default('NGN'),
    paidAt: timestamptz('paid_at').notNull().defaultNow(),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [check('payment_amount_positive', sql`"amount_kobo" > 0`)],
);

/**
 * Raw provider callbacks, append-only. Replay-safe via UNIQUE(provider,
 * provider_event_id): flutterwave transaction id, paystack reference:event,
 * opay orderNo. Payload retained for dispute forensics.
 */
export const paymentEvents = pgTable(
  'payment_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: text('provider').notNull(),
    providerEventId: text('provider_event_id').notNull(),
    reference: text('reference'),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').notNull(),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('payment_event_dedupe').on(t.provider, t.providerEventId),
    index('payment_events_reference_idx').on(t.reference),
  ],
);

export const refunds = pgTable(
  'refunds',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    paymentId: uuid('payment_id')
      .notNull()
      .references(() => payments.id, { onDelete: 'cascade' }),
    amountKobo: integer('amount_kobo').notNull(),
    reason: text('reason').notNull(),
    status: text('status').notNull().default('pending'),
    providerRef: text('provider_ref'),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('refunds_payment_idx').on(t.paymentId),
    check('refund_amount_positive', sql`"amount_kobo" > 0`),
    check('refund_status_allowed', sql`"status" IN ('pending','success','failed')`),
  ],
);

/**
 * Manual bank-transfer claims: customer paid to the business account directly
 * and submits proof. Admin confirms (with evidence) → system marks PAID.
 * Nothing here can mark an order paid by itself.
 */
export const transferClaims = pgTable(
  'transfer_claims',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    senderName: text('sender_name').notNull(),
    amountKobo: integer('amount_kobo').notNull(),
    bankName: text('bank_name').notNull().default(''),
    narration: text('narration').notNull().default(''), // sender's transfer reference
    transferDate: text('transfer_date').notNull().default(''),
    status: text('status').notNull().default('pending'),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewNote: text('review_note').notNull().default(''),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('claims_status_idx').on(t.status),
    index('claims_order_idx').on(t.orderId),
    check('claim_amount_positive', sql`"amount_kobo" > 0`),
    check('claim_status_allowed', sql`"status" IN ('pending','confirmed','rejected')`),
  ],
);
