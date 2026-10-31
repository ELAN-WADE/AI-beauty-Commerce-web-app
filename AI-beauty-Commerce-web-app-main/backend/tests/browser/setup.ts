import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

export default async function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || new URL(url).pathname === new URL(process.env.DATABASE_URL ?? url).pathname) throw new Error('Browser migrations require a separate TEST_DATABASE_URL.');
  const client = postgres(url, { max: 1 });
  try { await migrate(drizzle(client), { migrationsFolder: './drizzle' }); }
  finally { await client.end({ timeout: 5 }); }
}
