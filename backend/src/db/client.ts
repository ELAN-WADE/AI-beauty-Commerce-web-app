import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type AppDb = PostgresJsDatabase<typeof schema>;

let pg: ReturnType<typeof postgres> | null = null;
let db: AppDb | null = null;

/** Fail-fast pooled client. Throws a clear error when DATABASE_URL is missing. */
export function getDb(): AppDb {
  if (db) return db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set (see backend/.env.example).');
  pg = postgres(url, {
    max: 20, // per instance; PgBouncer in front when multi-instance (§9 proposal)
    idle_timeout: 20,
    connect_timeout: 10,
  });
  db = drizzle(pg, { schema });
  return db;
}
