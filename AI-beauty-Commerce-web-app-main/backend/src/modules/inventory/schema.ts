import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { productVariants } from '../catalog/schema';

/** timestamptz alias: timezone-aware timestamps everywhere (audit-safe). */
const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

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
    variantId: uuid('variant_id')
      .primaryKey()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    onHand: integer('on_hand').notNull().default(0),
    reserved: integer('reserved').notNull().default(0),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  () => [
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
