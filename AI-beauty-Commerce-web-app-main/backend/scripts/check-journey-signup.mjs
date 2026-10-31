import dotenv from 'dotenv';
import { spawn } from 'node:child_process';
import path from 'node:path';
for (const file of ['.env.development.local', '.env.local', '.env.development', '.env']) dotenv.config({ path: file });
if (!process.env.TEST_DATABASE_URL || new URL(process.env.TEST_DATABASE_URL).pathname === new URL(process.env.DATABASE_URL).pathname) throw new Error('Signup checks require a separate test database.');
const child = spawn(process.execPath, [path.resolve('node_modules/@playwright/test/cli.js'), 'test', 'tests/browser/signup-verification.spec.ts', '--workers=1'], {
  stdio: 'inherit', env: { ...process.env, BROWSER_APP_PORT: '3220', BROWSER_API_PORT: '3225', BROWSER_DIST_DIR: '.journey-browser', BROWSER_RESULTS_DIR: 'test-results-journey-signup' },
});
process.exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => resolve(code ?? 1)); });
