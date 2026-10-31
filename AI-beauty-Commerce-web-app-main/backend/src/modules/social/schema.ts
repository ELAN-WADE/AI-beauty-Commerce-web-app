import { pgTable, text, uuid, timestamp, jsonb, primaryKey, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { users, userSessions } from '../auth/schema';
const time = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
export const socialConnections = pgTable('social_connections', {
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  accountId: text('account_id').notNull(),
  profile: jsonb('profile').$type<{ handle: string; displayName: string; followers: number | null; profileUrl: string }>().notNull(),
  tokenEncrypted: text('token_encrypted').notNull(),
  expiresAt: time('expires_at').notNull(),
  updatedAt: time('updated_at').notNull().defaultNow(),
}, table => [primaryKey({ columns: [table.userId, table.provider] }), uniqueIndex('social_provider_account_unique').on(table.provider, table.accountId)]);
export const socialOAuthRequests = pgTable('social_oauth_requests', {
  stateHash: text('state_hash').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionId: uuid('session_id').notNull().references(() => userSessions.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  browserHash: text('browser_hash').notNull(),
  callbackUrl: text('callback_url').notNull(),
  expiresAt: time('expires_at').notNull(),
  consumedAt: time('consumed_at'),
  choicesEncrypted: text('choices_encrypted'),
}, table => [index('social_oauth_owner_idx').on(table.userId, table.sessionId)]);
