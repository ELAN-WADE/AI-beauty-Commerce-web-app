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
import { orders } from '../orders/schema';

/** timestamptz alias: timezone-aware timestamps everywhere (audit-safe). */
const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * Delivery fee reference data (seeded in migration 0004). Checkout matches
 * city → state → DEFAULT. S5 prices the fee; S3's hardcoded 0 is retired.
 */
export const shippingZones = pgTable(
  'shipping_zones',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    city: text('city').notNull().default(''),
    state: text('state').notNull().default(''),
    feeKobo: integer('fee_kobo').notNull(),
    etaText: text('eta_text').notNull().default(''),
  },
  (t) => [
    uniqueIndex('shipping_zone_unique').on(t.city, t.state),
    check('zone_fee_nonnegative', sql`"fee_kobo" >= 0`),
  ],
);

/** One shipment per order (v1; multi-parcel later without breaking this). */
export const shipments = pgTable(
  'shipments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .unique()
      .references(() => orders.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull().default('local'), // local|gig|dhl
    trackingRef: text('tracking_ref').notNull().default(''),
    status: text('status').notNull().default('preparing'),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    check('shipment_status_allowed', sql`"status" IN ('preparing','dispatched','in_transit','delivered','failed')`),
  ],
);

export const shipmentEvents = pgTable(
  'shipment_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    shipmentId: uuid('shipment_id')
      .notNull()
      .references(() => shipments.id, { onDelete: 'cascade' }),
    status: text('status').notNull(),
    location: text('location').notNull().default(''),
    note: text('note').notNull().default(''),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [index('shipment_events_shipment_idx').on(t.shipmentId)],
);
