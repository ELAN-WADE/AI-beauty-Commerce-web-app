import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from '../auth/schema';

// Operational/editorial records only. Money and stock remain in their existing ledgers.
export const workspaceRecords = pgTable('workspace_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'restrict' }),
  audience: text('audience').notNull(),
  kind: text('kind').notNull(),
  parentId: uuid('parent_id'),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  reviewNote: text('review_note').notNull().default(''),
  url: text('url').notNull().default(''),
  status: text('status').notNull(),
  data: jsonb('data').$type<{ productIds?: string[]; communityPostId?: string; details?: Record<string, unknown>; shipping?: { trackingReference: string; dispatchedAt: string; deliveredAt?: string } }>().notNull().default({}),
  version: integer('version').notNull().default(1),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [index('workspace_owner_kind_idx').on(t.ownerId, t.kind), index('workspace_public_idx').on(t.audience, t.status)]);
