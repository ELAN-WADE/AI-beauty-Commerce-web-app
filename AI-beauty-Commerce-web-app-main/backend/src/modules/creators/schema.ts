import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from '../auth/schema';

/** timestamptz alias: timezone-aware timestamps everywhere (audit-safe). */
const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * Creators / affiliates. Money counters are BIGINT kobo; promo codes are
 * uppercase, unique, and the ONLY customer-facing identifier (ids stay private).
 */
export const creators = pgTable(
  'creators',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    handle: text('handle').notNull().default(''),
    platform: text('platform').notNull().default('Instagram'),
    niche: text('niche').notNull().default(''),
    avatarUrl: text('avatar_url').notNull().default(''),
    promoCode: text('promo_code').notNull().unique(),
    discountPercent: integer('discount_percent').notNull().default(10),
    commissionRate: integer('commission_rate').notNull().default(12),
    totalSalesKobo: bigint('total_sales_kobo', { mode: 'number' }).notNull().default(0),
    commissionEarnedKobo: bigint('commission_earned_kobo', { mode: 'number' }).notNull().default(0),
    clicks: integer('clicks').notNull().default(0),
    ordersCount: integer('orders_count').notNull().default(0),
    verified: boolean('verified').notNull().default(false),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    check('creator_platform_allowed', sql`"platform" IN ('Instagram','TikTok','YouTube')`),
    check('creator_discount_range', sql`"discount_percent" >= 0 AND "discount_percent" <= 50`),
    check('creator_commission_range', sql`"commission_rate" >= 0 AND "commission_rate" <= 50`),
  ],
);

export const creatorApplications = pgTable(
  'creator_applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    handle: text('handle').notNull().default(''),
    platform: text('platform').notNull().default('Instagram'),
    niche: text('niche').notNull().default(''),
    status: text('status').notNull().default('pending'),
    reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
    reviewNote: text('review_note').notNull().default(''),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('creator_apps_status_idx').on(t.status),
    check('creator_app_status_allowed', sql`"status" IN ('pending','approved','rejected')`),
    check('creator_app_platform_allowed', sql`"platform" IN ('Instagram','TikTok','YouTube')`),
  ],
);
