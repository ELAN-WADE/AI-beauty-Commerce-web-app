import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Feature flags (Part XIII rollout control): kill-switches and gradual
 * rollouts WITHOUT redeploying. Missing row = code default (usually on for
 * established features). Toggled with plain SQL/DB console — no UI needed:
 *   INSERT INTO feature_flags (key, enabled, note) VALUES ('stripe', false, 'incident-42')
 *   ON CONFLICT (key) DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = now();
 */
export const featureFlags = pgTable('feature_flags', {
  key: text('key').primaryKey(),
  enabled: boolean('enabled').notNull().default(true),
  note: text('note').notNull().default(''),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
