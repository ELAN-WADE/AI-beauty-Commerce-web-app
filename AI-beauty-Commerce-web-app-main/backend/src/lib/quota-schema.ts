import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const requestQuotas = pgTable('request_quotas', {
  keyHash: text('key_hash').primaryKey(),
  hits: integer('hits').notNull(),
  resetAt: timestamp('reset_at', { withTimezone: true, mode: 'date' }).notNull(),
}, table => [index('request_quotas_reset_idx').on(table.resetAt)]);
