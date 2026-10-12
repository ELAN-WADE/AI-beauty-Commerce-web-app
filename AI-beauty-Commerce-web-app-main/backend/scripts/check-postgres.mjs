import 'dotenv/config';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import postgres from 'postgres';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  const sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 5 });
  try {
    const [server] = await sql`select current_database() as database, current_user as username,
      current_setting('server_version') as version`;
    console.log(server);
    const migrations = readMigrationFiles({ migrationsFolder: fileURLToPath(new URL('../drizzle', import.meta.url)) });
    const applied = await sql`select hash, created_at from drizzle.__drizzle_migrations order by created_at`;
    assert.equal(applied.length, migrations.length, 'Pending or unexpected migrations; run npm run db:migrate.');
    for (const [index, migration] of migrations.entries()) {
      assert.equal(applied[index].hash, migration.hash, `Migration ${index} differs from the applied SQL.`);
      assert.equal(Number(applied[index].created_at), migration.folderMillis, `Migration ${index} timestamp mismatch.`);
    }
    const [counts] = await sql`select
      (select count(*)::int from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE') as tables,
      (select count(*)::int from roles) as roles,
      (select count(*)::int from permissions) as permissions,
      (select count(*)::int from products) as products,
      (select count(*)::int from product_variants) as variants,
      (select count(*)::int from stock_levels) as stock_rows,
      (select count(*)::int from orders) as orders`;
    assert.ok(counts.roles > 0 && counts.permissions > 0, 'RBAC seed is missing; run npm run db:seed.');
    const invalidStock = await sql`select 1 from stock_levels where on_hand < 0 or reserved < 0 or reserved > on_hand limit 1`;
    assert.equal(invalidStock.length, 0, 'Invalid inventory totals.');
    console.log(`Verified ${applied.length}/${migrations.length} migrations (including SQL hashes).`);
    console.log(counts);
    console.log('PostgreSQL schema, RBAC, and stock checks passed.');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch(error => { console.error(error.message ?? error); process.exitCode = 1; });
