import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { getDb } from './client';

/** Apply pending ./drizzle migrations. Run order: generate → review → staging → prod. */
async function main() {
  const db = getDb();
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('migrations applied');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
