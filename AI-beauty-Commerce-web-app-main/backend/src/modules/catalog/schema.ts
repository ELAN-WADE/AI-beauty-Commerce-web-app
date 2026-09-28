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
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/** timestamptz alias: timezone-aware timestamps everywhere (audit-safe). */
const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull().default(''),
  logoUrl: text('logo_url'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
});

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    parentId: uuid('parent_id').references((): AnyPgColumn => categories.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description').notNull().default(''),
    imageUrl: text('image_url'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [index('categories_parent_idx').on(t.parentId)],
);

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id, { onDelete: 'restrict' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    // Public, URL-safe, non-sequential identifier (frontend uses this, never raw ids).
    slug: text('slug').notNull().unique(),
    tagline: text('tagline').notNull().default(''),
    description: text('description').notNull().default(''),
    subCategory: text('sub_category').notNull().default(''),
    hashtag: text('hashtag'),
    // Denormalized review counters (reviews module S5 maintains these in-tx).
    rating: numeric('rating', { precision: 3, scale: 2 }).notNull().default('0'),
    reviewsCount: integer('reviews_count').notNull().default(0),
    isBestseller: boolean('is_bestseller').notNull().default(false),
    isNew: boolean('is_new').notNull().default(false),
    isFlashSale: boolean('is_flash_sale').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('products_brand_idx').on(t.brandId),
    index('products_category_idx').on(t.categoryId),
    index('products_active_created_idx').on(t.isActive, t.createdAt),
    check('rating_range', sql`"rating" >= 0 AND "rating" <= 5`),
    check('reviews_count_nonnegative', sql`"reviews_count" >= 0`),
  ],
);

/**
 * Variants hold the AUTHORITATIVE price (kobo integers — Paystack speaks kobo,
 * floats are banned). Client totals are never trusted (§6).
 */
export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: text('sku').notNull().unique(),
    sizeLabel: text('size_label').notNull().default('Standard'),
    priceKobo: integer('price_kobo').notNull(),
    compareAtKobo: integer('compare_at_kobo'),
    isActive: boolean('is_active').notNull().default(true),
    position: integer('position').notNull().default(0),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('variant_product_size_unique').on(t.productId, t.sizeLabel),
    check('price_positive', sql`"price_kobo" > 0`),
  ],
);

export const productImages = pgTable(
  'product_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    alt: text('alt').notNull().default(''),
    position: integer('position').notNull().default(0),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('product_images_product_idx').on(t.productId),
    uniqueIndex('product_image_url_unique').on(t.productId, t.url),
  ],
);

/** Structured facets (benefit, skin-type, concern…) — never free-text blobs. */
export const attributes = pgTable('attributes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
});

export const productAttributes = pgTable(
  'product_attributes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    attributeId: uuid('attribute_id')
      .notNull()
      .references(() => attributes.id, { onDelete: 'restrict' }),
    value: text('value').notNull(),
  },
  (t) => [
    uniqueIndex('product_attribute_value_unique').on(t.productId, t.attributeId, t.value),
    index('product_attributes_product_idx').on(t.productId),
  ],
);

export const ingredients = pgTable('ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description').notNull().default(''),
});

/** `detail` carries the formulation note (e.g. "35%") from the source data. */
export const productIngredients = pgTable(
  'product_ingredients',
  {
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    ingredientId: uuid('ingredient_id')
      .notNull()
      .references(() => ingredients.id, { onDelete: 'restrict' }),
    detail: text('detail').notNull().default(''),
  },
  (t) => [
    uniqueIndex('product_ingredient_unique').on(t.productId, t.ingredientId),
    index('product_ingredients_product_idx').on(t.productId),
  ],
);
