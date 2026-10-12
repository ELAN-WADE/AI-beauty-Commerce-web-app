import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) throw new Error('TEST_DATABASE_URL is required; use a separate test database (see README).');

function databaseIdentity(value) {
  const url = new URL(value);
  const host = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ? 'loopback' : url.hostname;
  return `${host}:${url.port || '5432'}${decodeURIComponent(url.pathname)}`;
}

if (process.env.DATABASE_URL && databaseIdentity(testUrl) === databaseIdentity(process.env.DATABASE_URL)) {
  throw new Error('TEST_DATABASE_URL must point to a different database from DATABASE_URL.');
}

const root = fileURLToPath(new URL('../', import.meta.url));
const result = spawnSync(process.execPath, [fileURLToPath(new URL('../node_modules/vitest/vitest.mjs', import.meta.url)),
  'run', 'tests/concurrency-pg.test.ts'], { cwd: root, stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
