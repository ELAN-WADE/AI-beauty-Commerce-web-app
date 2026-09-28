import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from '../auth/schema';

/** timestamptz alias: timezone-aware timestamps everywhere (audit-safe). */
const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

/**
 * Transactional outbox: producers insert in the SAME tx as the business
 * change (guaranteed enqueue); a worker (S5+ runner) claims batches and sends.
 * Sending never blocks checkout/payment paths.
 */
export const notificationOutbox = pgTable(
  'notification_outbox',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    channel: text('channel').notNull(), // email|sms|whatsapp|push
    template: text('template').notNull(), // order.created|order.paid|shipment.update|...
    payload: jsonb('payload').notNull(),
    status: text('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    nextAttemptAt: timestamptz('next_attempt_at').notNull().defaultNow(),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('outbox_claim_idx').on(t.status, t.nextAttemptAt),
    check('outbox_channel_allowed', sql`"channel" IN ('email','sms','whatsapp','push')`),
    check('outbox_status_allowed', sql`"status" IN ('pending','sending','sent','failed')`),
  ],
);
