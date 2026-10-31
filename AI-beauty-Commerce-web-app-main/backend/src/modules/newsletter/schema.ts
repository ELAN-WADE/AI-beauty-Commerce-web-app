import { sql } from 'drizzle-orm';
import { check, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  status: text('status').notNull().default('PENDING'),
  source: text('source').notNull().default('website'),
  consentVersion: text('consent_version').notNull().default('journal-v1'),
  confirmTokenHash: text('confirm_token_hash').unique(),
  confirmExpiresAt: timestamptz('confirm_expires_at'),
  unsubscribeTokenHash: text('unsubscribe_token_hash').unique(),
  subscribedAt: timestamptz('subscribed_at').notNull().defaultNow(),
  confirmedAt: timestamptz('confirmed_at'),
  unsubscribedAt: timestamptz('unsubscribed_at'),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
}, () => [check('newsletter_status_allowed', sql`status IN ('PENDING','CONFIRMED','UNSUBSCRIBED')`)]);
