import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { productVariants } from '../catalog/schema';
import { distributors } from '../distributors/schema';
import { users } from '../auth/schema';

/** timestamptz alias: timezone-aware timestamps everywhere (audit-safe). */
const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * SIMPLE MODE (default): single-location shop.
 * Use HQ_LOCATION_ID + pool 'PLATFORM' and ignore other locations.
 * stockLevels PK is (locationId, variantId, pool) but simple callers must NOT
 * pass locationId/pool — service defaults apply. available = on_hand - reserved.
 *
 * MULTI-LOCATION MODE (opt-in): only routing/service.ts + partner network may
 * pass explicit locationId. WHOLESALE pool is isolated from PLATFORM and never
 * fulfils retail checkout. Do not add new pools without a migration + routing update.
 */
export const HQ_LOCATION_ID = '00000000-0000-4000-8000-000000000001';
export type StockPool = 'PLATFORM' | 'WHOLESALE';

export const inventoryLocations = pgTable('inventory_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  type: text('type').notNull().default('DISTRIBUTOR'),
  distributorId: uuid('distributor_id').references(() => distributors.id, { onDelete: 'restrict' }).unique(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  address: text('address').notNull().default(''),
  phone: text('phone').notNull().default(''),
  operatingHours: text('operating_hours').notNull().default(''),
  deliveryEnabled: boolean('delivery_enabled').notNull().default(true),
  pickupEnabled: boolean('pickup_enabled').notNull().default(false),
  deliveryFeeKobo: integer('delivery_fee_kobo'),
  etaText: text('eta_text').notNull().default('Delivery estimate confirmed with your order.'),
  isActive: boolean('is_active').notNull().default(false),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
}, (t) => [
  index('locations_city_state_idx').on(t.city, t.state),
  check('location_type_allowed', sql`"type" IN ('WAREHOUSE','DISTRIBUTOR','RETAIL_STORE')`),
  check('location_fee_nonnegative', sql`"delivery_fee_kobo" IS NULL OR "delivery_fee_kobo" >= 0`),
]);

/**
 * Inventory strategy (§13): central ledger per variant.
 * available = on_hand - reserved (computed, never stored).
 * DB enforces on_hand >= 0 AND reserved <= on_hand; the reservation flow
 * additionally locks the row (SELECT … FOR UPDATE) so concurrent checkouts
 * cannot oversell.
 */
export const stockLevels = pgTable(
  'stock_levels',
  {
    locationId: uuid('location_id').notNull().default(HQ_LOCATION_ID).references(() => inventoryLocations.id, { onDelete: 'restrict' }),
    pool: text('pool').$type<StockPool>().notNull().default('PLATFORM'),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    onHand: integer('on_hand').notNull().default(0),
    reserved: integer('reserved').notNull().default(0),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.locationId, t.variantId, t.pool] }),
    check('stock_pool_allowed', sql`"pool" IN ('PLATFORM','WHOLESALE')`),
    index('stock_variant_idx').on(t.variantId),
    check('on_hand_nonnegative', sql`"on_hand" >= 0`),
    check('reserved_nonnegative', sql`"reserved" >= 0`),
    check('reserved_within_on_hand', sql`"reserved" <= "on_hand"`),
  ],
);

/** Append-only movement log: every stock change leaves a row (audit trail). */
export const inventoryMovements = pgTable(
  'inventory_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    locationId: uuid('location_id').notNull().default(HQ_LOCATION_ID).references(() => inventoryLocations.id, { onDelete: 'restrict' }),
    pool: text('pool').$type<StockPool>().notNull().default('PLATFORM'),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    delta: integer('delta').notNull(),
    reason: text('reason').notNull(), // purchase|sale|adjustment|reserve|commit|release|expire
    refType: text('ref_type'),
    refId: text('ref_id'),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('movements_variant_time_idx').on(t.variantId, t.createdAt),
  ],
);

/**
 * Reservations: soft-hold stock for a cart/order with TTL. Sweeper releases
 * expired rows (S5 worker; service exists now). Lifecycle:
 * active → committed (paid) | released (cancelled) | expired (sweeper).
 */
export const reservations = pgTable(
  'reservations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    locationId: uuid('location_id').notNull().default(HQ_LOCATION_ID).references(() => inventoryLocations.id, { onDelete: 'restrict' }),
    pool: text('pool').$type<StockPool>().notNull().default('PLATFORM'),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    refType: text('ref_type').notNull(), // cart|order
    refId: text('ref_id').notNull(),
    qty: integer('qty').notNull(),
    status: text('status').notNull().default('active'),
    expiresAt: timestamptz('expires_at').notNull(),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('reservations_sweep_idx').on(t.status, t.expiresAt),
    index('reservations_variant_idx').on(t.variantId),
    check('reservation_qty_positive', sql`"qty" > 0`),
  ],
);

export const stockTransfers = pgTable('stock_transfers', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceLocationId: uuid('source_location_id').notNull().references(() => inventoryLocations.id, { onDelete: 'restrict' }),
  destinationLocationId: uuid('destination_location_id').notNull().references(() => inventoryLocations.id, { onDelete: 'restrict' }),
  status: text('status').notNull().default('DISPATCHED'),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  fingerprint: text('fingerprint').notNull(),
  dispatchedBy: uuid('dispatched_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  receivedBy: uuid('received_by').references(() => users.id, { onDelete: 'restrict' }),
  dispatchedAt: timestamptz('dispatched_at').notNull().defaultNow(),
  receivedAt: timestamptz('received_at'),
  note: text('note').notNull().default(''),
}, (t) => [
  index('transfers_destination_idx').on(t.destinationLocationId, t.status),
  check('transfer_locations_differ', sql`"source_location_id" <> "destination_location_id"`),
  check('transfer_status_allowed', sql`"status" IN ('DISPATCHED','RECEIVED')`),
]);

export const transferItems = pgTable('transfer_items', {
  transferId: uuid('transfer_id').notNull().references(() => stockTransfers.id, { onDelete: 'restrict' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'restrict' }),
  qty: integer('qty').notNull(),
}, (t) => [primaryKey({ columns: [t.transferId, t.variantId] }), check('transfer_qty_positive', sql`"qty" > 0`)]);

export const restockRequests = pgTable('restock_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  locationId: uuid('location_id').notNull().references(() => inventoryLocations.id, { onDelete: 'restrict' }),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'restrict' }),
  requestedBy: uuid('requested_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  qty: integer('qty').notNull(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  status: text('status').notNull().default('REQUESTED'),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
}, (t) => [index('restocks_location_idx').on(t.locationId), check('restock_qty_positive', sql`"qty" > 0`)]);
