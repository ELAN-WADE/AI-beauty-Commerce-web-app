import {
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from '../auth/schema';
import { productVariants } from '../catalog/schema';
import { products } from '../catalog/schema';

/** timestamptz alias: timezone-aware timestamps everywhere (audit-safe). */
const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * One active cart per owner. Guests are keyed by client-generated session UUID
 * (X-Session-Id header / localStorage); login merges guest → user cart (S3).
 */
export const carts = pgTable(
  'carts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    sessionId: text('session_id'),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('one_cart_per_user').on(t.userId).where(sql`"user_id" IS NOT NULL`),
    uniqueIndex('one_cart_per_session').on(t.sessionId).where(sql`"session_id" IS NOT NULL`),
  ],
);

export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cartId: uuid('cart_id')
      .notNull()
      .references(() => carts.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'restrict' }),
    qty: integer('qty').notNull().default(1),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('cart_variant_unique').on(t.cartId, t.variantId),
    check('cart_qty_range', sql`"qty" >= 1 AND "qty" <= 99`),
  ],
);

export const wishlists = pgTable(
  'wishlists',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.variantId] })],
);

export const recentlyViewed = pgTable(
  'recently_viewed',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    viewedAt: timestamptz('viewed_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('recent_user_product_unique').on(t.userId, t.productId),
    index('recent_user_time_idx').on(t.userId, t.viewedAt),
  ],
);
