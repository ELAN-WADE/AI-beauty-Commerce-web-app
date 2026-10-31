import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { getDb } from './client';
import { databaseDiagnostics } from '../lib/database-diagnostics';

/** Apply pending ./drizzle migrations. Run order: generate → review → staging → prod. */
async function main() {
  const db = getDb();
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('migrations applied');
  process.exit(0);
}

main().catch((err) => {
  const diagnostic = databaseDiagnostics(err);
  console.error(JSON.stringify({ event: 'database_migration_failed',
    ...(diagnostic.databaseCode ? diagnostic : {
      databaseCode: 'MIGRATION_FAILED',
      databaseHint: 'Check the configured database and committed migration status.',
    }),
  }));
  process.exit(1);
});
