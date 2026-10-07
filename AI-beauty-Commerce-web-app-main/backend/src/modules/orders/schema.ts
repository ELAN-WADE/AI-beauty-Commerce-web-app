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
import { users } from '../auth/schema';
import { productVariants } from '../catalog/schema';
import { HQ_LOCATION_ID, inventoryLocations } from '../inventory/schema';
import { distributors } from '../distributors/schema';
import { creators } from '../creators/schema';

/** timestamptz alias: timezone-aware timestamps everywhere (audit-safe). */
const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * Orders: fulfilment status and money status are SEPARATE columns.
 * status: PENDING → PAID → FULFILLING → SHIPPED → DELIVERED (+CANCELLED/REFUNDED).
 * paymentStatus: UNPAID → PAID|FAILED (+REFUNDED). Only the S4 webhook (actor
 * 'system') may write PAID — enforced in transitionOrder, not just convention.
 */
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: text('order_number').notNull().unique(), // DES-XXXXXX (human ref)
    kind: text('kind').$type<'RETAIL' | 'WHOLESALE'>().notNull().default('RETAIL'),
    wholesaleLocationId: uuid('wholesale_location_id').references(() => inventoryLocations.id, { onDelete: 'restrict' }),
    wholesaleTerms: jsonb('wholesale_terms'),
    wholesaleDispatchedAt: timestamptz('wholesale_dispatched_at'),
    wholesaleReceivedAt: timestamptz('wholesale_received_at'),
    wholesaleReturnedAt: timestamptz('wholesale_returned_at'),
    wholesaleRestoredAt: timestamptz('wholesale_restored_at'),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    guestEmail: text('guest_email'),
    guestAccessTokenHash: text('guest_access_token_hash'),
    status: text('status').notNull().default('PENDING'),
    paymentStatus: text('payment_status').notNull().default('UNPAID'),
    subtotalKobo: integer('subtotal_kobo').notNull().default(0),
    // S5 loyalty voucher + S8 affiliate discounts (both server-validated).
    discountKobo: integer('discount_kobo').notNull().default(0),
    creatorCode: text('creator_code'),
    creatorId: uuid('creator_id').references(() => creators.id, { onDelete: 'restrict' }),
    creatorCommissionBps: integer('creator_commission_bps').notNull().default(0),
    distributorId: uuid('distributor_id').references(() => distributors.id, { onDelete: 'restrict' }),
    distributorCommissionBps: integer('distributor_commission_bps').notNull().default(0),
    fulfilmentLocationId: uuid('fulfilment_location_id').notNull().default(HQ_LOCATION_ID).references(() => inventoryLocations.id, { onDelete: 'restrict' }),
    fulfilmentMethod: text('fulfilment_method').notNull().default('DELIVERY'),
    fulfilmentSnapshot: jsonb('fulfilment_snapshot'),
    deliveredAt: timestamptz('delivered_at'),
    pickupCodeHash: text('pickup_code_hash'),
    pickupCodeExpiresAt: timestamptz('pickup_code_expires_at'),
    pickupCodeAttempts: integer('pickup_code_attempts').notNull().default(0),
    // S3: delivery priced by S5 shipping module (0 until then — documented).
    deliveryFeeKobo: integer('delivery_fee_kobo').notNull().default(0),
    totalKobo: integer('total_kobo').notNull().default(0),
    shippingAddress: jsonb('shipping_address').notNull(),
    note: text('note').notNull().default(''),
    // Idempotency-Key from POST /api/checkout (replay returns prior order, §12).
    idempotencyKey: text('idempotency_key').notNull().unique(),
    checkoutFingerprint: text('checkout_fingerprint').notNull().default(''),
    guestSessionId: text('guest_session_id'),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('orders_user_time_idx').on(t.userId, t.createdAt),
    index('orders_status_time_idx').on(t.status, t.createdAt),
    index('orders_location_status_idx').on(t.fulfilmentLocationId, t.status),
    index('orders_wholesale_location_idx').on(t.wholesaleLocationId, t.createdAt),
    check('order_kind_allowed', sql`"kind" IN ('RETAIL','WHOLESALE')`),
    check('wholesale_order_integrity', sql`"kind" <> 'WHOLESALE' OR ("wholesale_location_id" IS NOT NULL AND "user_id" IS NOT NULL AND "distributor_id" IS NULL AND "creator_id" IS NULL AND "creator_commission_bps" = 0 AND "distributor_commission_bps" = 0 AND "discount_kobo" = 0 AND "fulfilment_method" = 'DELIVERY')`),
    check('order_fulfilment_method', sql`"fulfilment_method" IN ('DELIVERY','PICKUP')`),
    check('order_commission_rates', sql`"creator_commission_bps" BETWEEN 0 AND 5000 AND "distributor_commission_bps" BETWEEN 0 AND 5000`),
    check('order_status_allowed', sql`"status" IN ('PENDING','PAID','FULFILLING','READY_PICKUP','SHIPPED','DELIVERED','CANCELLED','REFUNDED')`),
    check('payment_status_allowed', sql`"payment_status" IN ('UNPAID','PAID','FAILED','REFUNDED')`),
    check('order_totals_nonnegative', sql`"subtotal_kobo" >= 0 AND "delivery_fee_kobo" >= 0 AND "total_kobo" >= 0 AND "discount_kobo" >= 0`),
  ],
);

/** Price snapshots: what the customer paid per line, immutable after creation. */
export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'restrict' }),
    productName: text('product_name').notNull(),
    variantLabel: text('variant_label').notNull(),
    sku: text('sku').notNull(),
    unitPriceKobo: integer('unit_price_kobo').notNull(),
    qty: integer('qty').notNull(),
    lineTotalKobo: integer('line_total_kobo').notNull(),
  },
  (t) => [
    index('order_items_order_idx').on(t.orderId),
    check('order_item_qty_positive', sql`"qty" > 0`),
    check('order_item_price_positive', sql`"unit_price_kobo" > 0 AND "line_total_kobo" >= 0`),
  ],
);

/** Status history: every transition recorded with actor (audit trail). */
export const orderStatusHistory = pgTable(
  'order_status_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    fromStatus: text('from_status'),
    toStatus: text('to_status').notNull(),
    actor: text('actor').notNull(), // customer|system|admin:<uuid>
    note: text('note').notNull().default(''),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [index('order_history_order_idx').on(t.orderId)],
);
