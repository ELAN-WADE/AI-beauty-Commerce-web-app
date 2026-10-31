import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { assertProductionEnv } from '../lib/env';
import { databasePoolOptions, databaseSslOptions } from '../lib/database-options';
import * as schema from './schema';

export type AppDb = PostgresJsDatabase<typeof schema>;

/** Transaction handle type (for services that accept db OR tx). */
export type DbTx = Parameters<Parameters<AppDb['transaction']>[0]>[0];

/** Anything that can run queries: root client or an open transaction. */
export type Db = AppDb | DbTx;

// Next server bundles/HMR must share a process-wide client, not create a pool
// for each re-evaluated copy of this module.
const state = globalThis as typeof globalThis & {
  __deslaDatabase?: { client: ReturnType<typeof postgres>; database: AppDb };
};

/** Fail-fast pooled client. Throws a clear error when DATABASE_URL is missing. */
export function getDb(): AppDb {
  if (state.__deslaDatabase) return state.__deslaDatabase.database;
  assertProductionEnv();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set (see backend/.env.example).');
  const pg = postgres(url, {
    ...databasePoolOptions(),
    ...databaseSslOptions(url, process.env.DATABASE_SSL_MODE),
  });
  const db = drizzle(pg, { schema });
  state.__deslaDatabase = { client: pg, database: db };
  return db;
}

/** Release pooled connections on worker shutdown and one-shot completion. */
export async function closeDb(): Promise<void> {
  const client = state.__deslaDatabase?.client;
  delete state.__deslaDatabase;
  if (client) await client.end({ timeout: 10 });
}
