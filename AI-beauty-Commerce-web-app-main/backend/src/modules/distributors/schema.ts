import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from '../auth/schema';
import { productVariants } from '../catalog/schema';

/** timestamptz alias: timezone-aware timestamps everywhere (audit-safe). */
const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/** Verified fulfilment partners (proposal §6 distributor workflows). */
export const distributors = pgTable(
  'distributors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'restrict' }).unique(),
    commissionBps: integer('commission_bps').notNull().default(0),
    name: text('name').notNull(),
    businessName: text('business_name').notNull().default(''),
    city: text('city').notNull(),
    state: text('state').notNull().default(''),
    address: text('address').notNull().default(''),
    phone: text('phone').notNull().default(''),
    whatsapp: text('whatsapp').notNull().default(''),
    verified: boolean('verified').notNull().default(false),
    tier: text('tier').notNull().default('Bronze'),
    isOnlineOnly: boolean('is_online_only').notNull().default(false),
    pickupAvailable: boolean('pickup_available').notNull().default(true),
    operatingHours: text('operating_hours').notNull().default(''),
    rating: numeric('rating', { precision: 3, scale: 2 }).notNull().default('5'),
    reviewsCount: integer('reviews_count').notNull().default(0),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('distributors_city_idx').on(t.city),
    check('distributor_commission_bps', sql`"commission_bps" BETWEEN 0 AND 5000`),
    check('distributor_tier_allowed', sql`"tier" IN ('Bronze','Silver','Gold')`),
    check('distributor_rating_range', sql`"rating" >= 0 AND "rating" <= 5`),
  ],
);

/** Per-distributor variant stock: powers "in stock near you" (city-scoped). */
export const distributorStock = pgTable(
  'distributor_stock',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    distributorId: uuid('distributor_id')
      .notNull()
      .references(() => distributors.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(0),
    available: boolean('available').notNull().default(true),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('distributor_variant_unique').on(t.distributorId, t.variantId),
    index('distributor_stock_variant_idx').on(t.variantId),
    check('distributor_qty_nonnegative', sql`"quantity" >= 0`),
  ],
);

/** Partnership applications (approved → distributor row; proposal §6). */
export const distributorApplications = pgTable(
  'distributor_applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    businessName: text('business_name').notNull().default(''),
    city: text('city').notNull(),
    state: text('state').notNull().default(''),
    address: text('address').notNull().default(''),
    phone: text('phone').notNull().default(''),
    whatsapp: text('whatsapp').notNull().default(''),
    status: text('status').notNull().default('pending'),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewNote: text('review_note').notNull().default(''),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('distributor_apps_status_idx').on(t.status),
    check('distributor_app_status_allowed', sql`"status" IN ('pending','approved','rejected')`),
  ],
);
