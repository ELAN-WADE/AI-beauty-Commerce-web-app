import { boolean, check, integer, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { productVariants } from '../catalog/schema';
import { users } from '../auth/schema';
import { inventoryLocations } from '../inventory/schema';

export const wholesalePrices = pgTable('wholesale_prices', {
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'restrict' }),
  tier: text('tier').notNull(),
  unitPriceKobo: integer('unit_price_kobo').notNull(),
  unitsPerCarton: integer('units_per_carton').notNull(),
  minimumCartons: integer('minimum_cartons').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, t => [
  primaryKey({ columns: [t.variantId, t.tier] }),
  check('wholesale_tier_allowed', sql`"tier" IN ('Bronze','Silver','Gold')`),
  check('wholesale_price_positive', sql`"unit_price_kobo" > 0 AND "units_per_carton" BETWEEN 1 AND 1000 AND "minimum_cartons" BETWEEN 1 AND 1000`),
]);

// A request identity for distributor-recorded direct sales. Retained with the
// stock movement, so retrying a lost response cannot deduct the units twice.
export const wholesaleStockEvents = pgTable('wholesale_stock_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  fingerprint: text('fingerprint').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  locationId: uuid('location_id').notNull().references(() => inventoryLocations.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});
