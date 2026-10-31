import { appPort, apiPort, appOrigin, apiOrigin } from './tests/browser/browser-env';
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

const database = process.env.TEST_DATABASE_URL;
if (!database) throw new Error('TEST_DATABASE_URL is required for browser integration tests.');
if (new URL(database).pathname === new URL(process.env.DATABASE_URL ?? database).pathname) throw new Error('Browser tests require a separate test database.');

export default defineConfig({
  testDir: './tests/browser',
  outputDir: process.env.BROWSER_RESULTS_DIR || 'test-results',
  reporter: [['list'], ['json', { outputFile: path.join(process.env.BROWSER_RESULTS_DIR || 'test-results', 'summary.json') }]],
  globalSetup: './tests/browser/setup.ts',
  timeout: 180000,
  expect: { timeout: 120000 },
  workers: 1,
  fullyParallel: false,
  use: { actionTimeout: 30000, navigationTimeout: 120000, baseURL: appOrigin, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: [
    { command: `node node_modules/next/dist/bin/next dev -p ${apiPort}`, url: `${apiOrigin}/api/health`, timeout: 180000, reuseExistingServer: false, env: { NODE_ENV: 'development', PLAYWRIGHT_NEXT_DIST: '1', NEXT_DIST_DIR: process.env.BROWSER_DIST_DIR || '.next-browser', DATABASE_URL: database, APP_URL: apiOrigin, FRONTEND_URL: appOrigin, GOOGLE_REDIRECT_URI: `${apiOrigin}/api/auth/oauth/google/callback`, PAYMENTS_ENABLED: 'false' } },
    { command: `node node_modules/next/dist/bin/next dev -p ${appPort}`, cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), url: appOrigin, timeout: 180000, reuseExistingServer: false, env: { NODE_ENV: 'development', PLAYWRIGHT_NEXT_DIST: '1', NEXT_DIST_DIR: process.env.BROWSER_DIST_DIR || '.next-browser', NEXT_PUBLIC_API_URL: apiOrigin, API_UPSTREAM_URL: apiOrigin } },
  ],
});
