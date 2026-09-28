import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  strict: true,
  verbose: true,
  dbCredentials: {
    // drizzle-kit generate does not need a live DB; migrate/seed do.
    url:
      process.env.DATABASE_URL ??
      'postgres://glowly:glowly_dev_only@localhost:5432/glowly_dev',
  },
});
