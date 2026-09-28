import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from '../auth/schema';
import { products } from '../catalog/schema';

/** timestamptz alias: timezone-aware timestamps everywhere (audit-safe). */
const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const skinProfiles = pgTable('skin_profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  skinType: text('skin_type').notNull().default(''),
  concerns: text('concerns').array().notNull().default([]),
  notes: text('notes').notNull().default(''),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
});

/**
 * Analysis jobs. Consent is RECORDED (accepted flag + policy version + time),
 * never assumed. Images live in a PRIVATE bucket under generated keys; the DB
 * holds the key, never the bytes. Retention purge runs in the S7 worker.
 */
export const skinAnalyses = pgTable(
  'skin_analyses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('pending'),
    // Explicit opt-in, recorded with policy version. Rows are only created
    // after the route validates consentAccepted === true (§14).
    consentAccepted: boolean('consent_accepted').notNull(),
    consentVersion: text('consent_version').notNull().default(''),
    imageKey: text('image_key'),
    imageMime: text('image_mime'),
    imageBytes: integer('image_bytes'),
    error: text('error').notNull().default(''),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
    updatedAt: timestamptz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('analyses_user_time_idx').on(t.userId, t.createdAt),
    check('analysis_status_allowed', sql`"status" IN ('pending','processing','complete','failed')`),
  ],
);

/** Structured, Zod-validated result (1–1 with the job). Model output, not truth. */
export const analysisResults = pgTable(
  'analysis_results',
  {
    analysisId: uuid('analysis_id')
      .primaryKey()
      .references(() => skinAnalyses.id, { onDelete: 'cascade' }),
    skinType: text('skin_type').notNull().default(''),
    concerns: text('concerns').array().notNull().default([]),
    hydration: integer('hydration').notNull().default(50),
    oiliness: integer('oiliness').notNull().default(50),
    sensitivity: integer('sensitivity').notNull().default(50),
    texture: integer('texture').notNull().default(50),
    summary: text('summary').notNull().default(''),
    createdAt: timestamptz('created_at').notNull().defaultNow(),
  },
  () => [
    check('metrics_range', sql`"hydration" BETWEEN 0 AND 100 AND "oiliness" BETWEEN 0 AND 100 AND "sensitivity" BETWEEN 0 AND 100 AND "texture" BETWEEN 0 AND 100`),
  ],
);
