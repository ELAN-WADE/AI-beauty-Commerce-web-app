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
import { users } from '../auth/schema';
import { products } from '../catalog/schema';
import { orders } from '../orders/schema';

/** timestamptz alias: timezone-aware timestamps everywhere (audit-safe). */
const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * Reviews are product-level (match storefront). verified_purchase is set
 * SERVER-side (paid order containing the product) — never from the client.
 * Unverified reviews queue as pending; verified auto-approve.
 */
export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
    authorName: text('author_name').notNull(),
    rating: integer('rating').notNull(),
    title: text('title').notNull().default(''),
    comment: text('comment').notNull().default(''),
    verifiedPurchase: boolean('verified_purchase').notNull().default(false),
    status: text('status').notNull().default('pending'),
    helpfulCount: integer('helpful_count').notNull().default(0),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('reviews_product_status_idx').on(t.productId, t.status),
    index('reviews_user_idx').on(t.userId),
    check('review_rating_range', sql`"rating" >= 1 AND "rating" <= 5`),
    check('review_status_allowed', sql`"status" IN ('pending','approved','rejected')`),
    check('review_helpful_nonnegative', sql`"helpful_count" >= 0`),
  ],
);

export const reviewHelpful = pgTable(
  'review_helpful',
  {
    reviewId: uuid('review_id')
      .notNull()
      .references(() => reviews.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.reviewId, t.userId] })],
);
