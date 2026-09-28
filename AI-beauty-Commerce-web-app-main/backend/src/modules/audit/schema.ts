import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from '../auth/schema';

/** timestamptz alias: timezone-aware timestamps everywhere (audit-safe). */
const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * Append-only audit trail (§24). Written in the SAME transaction as the
 * business change it records. There is deliberately no update/delete path —
 * the application role only ever INSERTs and SELECTs here.
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorType: text('actor_type').notNull().default('user'), // user|system
    actorId: text('actor_id'),
    action: text('action').notNull(), // role.grant, product.price_change, refund.create, ...
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    before: jsonb('before'),
    after: jsonb('after'),
    ip: text('ip'),
    requestId: text('request_id'),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('audit_entity_idx').on(t.entityType, t.entityId),
    index('audit_actor_idx').on(t.actorId),
    index('audit_time_idx').on(t.createdAt),
  ],
);
