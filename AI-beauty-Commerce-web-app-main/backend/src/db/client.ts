import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { assertProductionEnv } from '../lib/env';
import * as schema from './schema';

export type AppDb = PostgresJsDatabase<typeof schema>;

/** Transaction handle type (for services that accept db OR tx). */
export type DbTx = Parameters<Parameters<AppDb['transaction']>[0]>[0];

/** Anything that can run queries: root client or an open transaction. */
export type Db = AppDb | DbTx;

let pg: ReturnType<typeof postgres> | null = null;
let db: AppDb | null = null;

/** Fail-fast pooled client. Throws a clear error when DATABASE_URL is missing. */
export function getDb(): AppDb {
  if (db) return db;
  assertProductionEnv();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set (see backend/.env.example).');
  const sslMode = process.env.DATABASE_SSL_MODE;
  if (sslMode && !['disable', 'require', 'allow', 'prefer', 'verify-full'].includes(sslMode)) {
    throw new Error('DATABASE_SSL_MODE must be disable, require, allow, prefer, or verify-full.');
  }
  const isRemoteManaged = /render\.com|neon\.tech|supabase\.co|aws\.com/i.test(url);
  const effectiveSsl = sslMode
    ? (sslMode === 'disable' ? false : (sslMode as 'require' | 'allow' | 'prefer' | 'verify-full'))
    : (isRemoteManaged ? 'require' : undefined);
  pg = postgres(url, {
    max: 20, // per instance; PgBouncer in front when multi-instance (§9 proposal)
    idle_timeout: 20,
    connect_timeout: 10,
    ...(effectiveSsl !== undefined ? { ssl: effectiveSsl } : {}),
  });
  db = drizzle(pg, { schema });
  return db;
}

/** Release pooled connections on worker shutdown and one-shot completion. */
export async function closeDb(): Promise<void> {
  const client = pg;
  pg = null;
  db = null;
  if (client) await client.end({ timeout: 10 });
}
