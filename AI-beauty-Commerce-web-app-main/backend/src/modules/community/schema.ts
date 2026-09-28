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

/** timestamptz alias: timezone-aware timestamps everywhere (audit-safe). */
const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * Community posts (Desla Collective). Author role is server-derived:
 * 'Verified Buyer' when the author has any paid order, else 'Member'.
 * Visibility flag gives moderators a kill-switch without deleting history.
 */
export const communityPosts = pgTable(
  'community_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    authorName: text('author_name').notNull(),
    authorHandle: text('author_handle').notNull().default(''),
    authorAvatar: text('author_avatar').notNull().default(''),
    authorRole: text('author_role').notNull().default('Member'),
    content: text('content').notNull(),
    mediaType: text('media_type'),
    mediaUrl: text('media_url'),
    taggedProductId: uuid('tagged_product_id').references(() => products.id, { onDelete: 'set null' }),
    taggedHashtag: text('tagged_hashtag'),
    likesCount: integer('likes_count').notNull().default(0),
    commentsCount: integer('comments_count').notNull().default(0),
    visible: boolean('visible').notNull().default(true),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('posts_time_idx').on(t.createdAt),
    index('posts_product_idx').on(t.taggedProductId),
    check('post_media_allowed', sql`"media_type" IS NULL OR "media_type" IN ('image','video')`),
    check('post_likes_nonnegative', sql`"likes_count" >= 0`),
  ],
);

export const postLikes = pgTable(
  'post_likes',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => communityPosts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
);

/** Channel chat (routine, fragrance, deals…): authenticated, rate-limited. */
export const communityMessages = pgTable(
  'community_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    senderName: text('sender_name').notNull(),
    senderAvatar: text('sender_avatar').notNull().default(''),
    channel: text('channel').notNull().default('routine'),
    message: text('message').notNull(),
    likes: integer('likes').notNull().default(0),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('messages_channel_time_idx').on(t.channel, t.createdAt),
    check('message_likes_nonnegative', sql`"likes" >= 0`),
  ],
);
