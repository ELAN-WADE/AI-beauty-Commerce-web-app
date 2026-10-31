import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { orders } from '../orders/schema';
import { paymentAttempts } from '../payments/schema';

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export type CryptoAsset = 'USDT' | 'BTC' | 'ETH' | 'SOL';
export type CryptoNetwork = 'TRC20' | 'ERC20' | 'Bitcoin' | 'Solana';
export type CryptoStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'EXPIRED' | 'FAILED';

export const cryptoPayments = pgTable(
  'crypto_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    attemptId: uuid('attempt_id')
      .references(() => paymentAttempts.id, { onDelete: 'set null' }),
    asset: text('asset').$type<CryptoAsset>().notNull(),
    network: text('network').$type<CryptoNetwork>().notNull(),
    depositAddress: text('deposit_address').notNull(),
    amountKobo: integer('amount_kobo').notNull(),
    amountCrypto: text('amount_crypto').notNull(),
    exchangeRateNgn: text('exchange_rate_ngn').notNull(),
    networkFeeCrypto: text('network_fee_crypto').notNull().default('0'),
    totalCrypto: text('total_crypto').notNull(),
    txHash: text('tx_hash'),
    confirmations: integer('confirmations').notNull().default(0),
    requiredConfirmations: integer('required_confirmations').notNull().default(1),
    status: text('status').$type<CryptoStatus>().notNull().default('PENDING'),
    expiresAt: timestamptz('expires_at').notNull(),
    verifiedAt: timestamptz('verified_at'),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('crypto_payments_order_idx').on(t.orderId),
    index('crypto_payments_status_idx').on(t.status),
    index('crypto_payments_tx_hash_idx').on(t.txHash),
    check(
      'crypto_status_allowed',
      sql`"status" IN ('PENDING','CONFIRMED','COMPLETED','EXPIRED','FAILED')`,
    ),
  ],
);

