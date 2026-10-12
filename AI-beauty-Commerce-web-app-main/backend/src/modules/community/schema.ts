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
import { creators } from '../creators/schema';

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
    // True only when media arrived through the verified upload pipeline
    // (server key + HEAD + magic bytes). URL-pasted media stays false.
    mediaVerified: boolean('media_verified').notNull().default(false),
    // Creator attribution for content rewards (set server-side from the
    // author's verified creator profile; null for non-creator posts).
    creatorId: uuid('creator_id').references(() => creators.id, { onDelete: 'set null' }),
    // Admin-gated: only rewardEligible + visible posts settle. Approval is the
    // anti-farming control — likes/views alone never pay.
    rewardEligible: boolean('reward_eligible').notNull().default(false),
    likesCount: integer('likes_count').notNull().default(0),
    commentsCount: integer('comments_count').notNull().default(0),
    visible: boolean('visible').notNull().default(true),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('posts_time_idx').on(t.createdAt),
    index('posts_product_idx').on(t.taggedProductId),
    index('posts_creator_idx').on(t.creatorId),
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

/**
 * Staged community uploads. Row first (server key), bytes second (presigned
 * PUT), verification third (HEAD + magic bytes at post time). Single-use:
 * attaching consumes the row, so one upload cannot back two posts. Orphaned
 * pending rows are reaped by the worker after 24h (object deleted too).
 */
export const communityMedia = pgTable(
  'community_media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    postId: uuid('post_id').references(() => communityPosts.id, { onDelete: 'set null' }),
    mediaKey: text('media_key').notNull().unique(),
    mime: text('mime').notNull(),
    bytes: integer('bytes').notNull(),
    status: text('status').notNull().default('pending'),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('community_media_user_idx').on(t.userId, t.createdAt),
    check('community_media_mime_allowed', sql`"mime" IN ('image/jpeg','image/png','image/webp','video/mp4','video/webm')`),
    check('community_media_bytes_positive', sql`"bytes" > 0 AND "bytes" <= 67108864`),
    check('community_media_status_allowed', sql`"status" IN ('pending','attached','failed')`),
  ],
);
