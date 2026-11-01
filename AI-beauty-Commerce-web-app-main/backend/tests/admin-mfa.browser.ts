import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { build } from 'esbuild';
import { chromium, expect as uiExpect, type Browser, type Page } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { fileURLToPath } from 'node:url';

let server: Server; let browser: Browser; let origin: string;
beforeAll(async () => {
  const bundle = await build({
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
      import {AppProvider} from './src/storefront/context/AppContext';
      import {RequireRole} from './src/storefront/components/auth/RequireRole';
      createRoot(document.getElementById('root')).render(<AppProvider><RequireRole allowedRoles={['SUPER_ADMIN']}><h1>Administrator dashboard</h1></RequireRole></AppProvider>);`,
      loader: 'tsx', resolveDir: fileURLToPath(new URL('../', import.meta.url)) },
    bundle: true, write: false, platform: 'browser', format: 'iife', logLevel: 'silent',
    define: { 'process.env.NODE_ENV': '"test"', 'process.env.NEXT_PUBLIC_API_URL': 'undefined', 'process.env.NEXT_PUBLIC_SENTRY_DSN': 'undefined', 'process.env.NEXT_PUBLIC_SUPABASE_URL': 'undefined', 'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': 'undefined' },
    plugins: [{ name: 'test-router', setup(builder) {
      builder.onResolve({ filter: /^next\/navigation$/ }, () => ({ path: 'router', namespace: 'test-router' }));
      builder.onLoad({ filter: /.*/, namespace: 'test-router' }, () => ({ contents: `const router={push:p=>history.pushState(null,'',p),back:()=>history.back()}; export const useRouter=()=>router; export const usePathname=()=>location.pathname;` }));
    } }],
  });
  const script = bundle.outputFiles[0].text;
  server = createServer((req, res) => {
    res.setHeader('Content-Type', req.url === '/app.js' ? 'text/javascript' : 'text/html');
    res.end(req.url === '/app.js' ? script : '<!doctype html><div id="root"></div><script src="/app.js"></script>');
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
}, 60000);
afterAll(async () => { await browser?.close(); await new Promise<void>(resolve => server?.close(() => resolve())); });

async function fixture(page: Page) {
  let primary = false, verified = false, failRead = false, proofCount = 0, verifiedReads = 0;
  let holdNext = false; let release: ((status: number) => void) | undefined;
  const user = () => ({ id: 'admin-ui-fixture', email: 'owner@example.test', emailVerified: true, roles: ['SUPER_ADMIN'], permissions: ['roles:grant'], mfaEnabled: true, mfaVerified: verified, signupIntent: 'CUSTOMER', profile: null });
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const reply = (status: number, json: unknown) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(json) });
    if (path === '/api/auth/admin/login') { primary = true; return reply(200, { ok: true }); }
    if (path === '/api/auth/mfa/verify') {
      if (!primary) return reply(401, { error: { code: 'unauthorized', message: 'Authentication required.' } });
      proofCount++;
      if (route.request().postDataJSON().code !== '222222') return reply(422, { error: { code: 'mfa_invalid', message: 'The MFA code is invalid or expired.' } });
      verified = true; return reply(200, { verified: true });
    }
    if (path === '/api/auth/me') {
      if (verified) verifiedReads++;
      if (holdNext) {
        holdNext = false;
        const snapshot = user();
        const status = await new Promise<number>(resolve => { release = resolve; });
        return reply(status, status === 200 ? snapshot : { error: { code: 'unauthorized' } });
      }
      if (verified && failRead) { failRead = false; return reply(503, { error: { code: 'service_unavailable', message: 'Temporary session read failure.' } }); }
      return primary ? reply(200, user()) : reply(401, { error: { code: 'unauthorized' } });
    }
    if (path === '/api/storefront/sync') return route.fulfill({ status: 200, contentType: 'text/event-stream', body: ': test\n\n' });
    return reply(200, { products: [], categories: [], creators: [], distributors: [], posts: [], reviews: [], items: [], orders: [], records: [], messages: [] });
  });
  await page.goto(origin + '/ops-0123456789abcdef');
  await page.getByLabel('Administrator email').fill('owner@example.test');
  await page.getByLabel('Password', { exact: true }).fill('Browser-fixture-password');
  await page.getByRole('button', { name: 'Sign in as administrator', exact: true }).click();
  await page.getByLabel('Authenticator or recovery code').waitFor();
  return { proofCount: () => proofCount, verifiedReads: () => verifiedReads, failRead: () => { failRead = true; }, expire: () => { primary = false; },
    hold: async () => { holdNext = true; await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await expect.poll(() => Boolean(release)).toBe(true); },
    release: (status: number) => release!(status),
  };
}

describe('administrator MFA through the actual provider, transport, and role gate', () => {
  it('keeps a rejected code on the challenge and opens the dashboard after a valid code', async () => {
    const page = await browser.newPage();
    try {
      const controls = await fixture(page);
      await page.getByLabel('Authenticator or recovery code').fill('111111');
      await page.getByRole('button', { name: 'Verify session', exact: true }).click();
      await uiExpect(page.getByRole('alert')).toHaveText('The MFA code is invalid or expired.');
      await uiExpect(page.getByLabel('Administrator email')).toHaveCount(0);
      await page.getByLabel('Authenticator or recovery code').fill('222222');
      await page.getByRole('button', { name: 'Verify session', exact: true }).click();
      await uiExpect(page.getByRole('heading', { name: 'Administrator dashboard' })).toBeVisible();
      expect(controls.verifiedReads()).toBe(1);
    } finally { await page.close(); }
  });
  it.each([200, 401])('does not let an older session response (%s) undo successful MFA', async status => {
    const page = await browser.newPage();
    try {
      const controls = await fixture(page); await controls.hold();
      await page.getByLabel('Authenticator or recovery code').fill('222222');
      await page.getByRole('button', { name: 'Verify session', exact: true }).click();
      await uiExpect(page.getByRole('heading', { name: 'Administrator dashboard' })).toBeVisible();
      const done = page.waitForResponse(response => response.url().endsWith('/api/auth/me') && response.status() === status);
      controls.release(status); const response = await done; await response.finished();
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      await uiExpect(page.getByRole('heading', { name: 'Administrator dashboard' })).toBeVisible();
    } finally { await page.close(); }
  });
  it('retries a failed session read without replaying an accepted authenticator code', async () => {
    const page = await browser.newPage();
    try {
      const controls = await fixture(page); controls.failRead();
      await page.getByLabel('Authenticator or recovery code').fill('222222');
      await page.getByRole('button', { name: 'Verify session', exact: true }).click();
      await uiExpect(page.getByRole('alert')).toHaveText('Temporary session read failure.');
      await page.getByRole('button', { name: 'Verify session', exact: true }).click();
      await uiExpect(page.getByRole('heading', { name: 'Administrator dashboard' })).toBeVisible();
      expect(controls.proofCount()).toBe(1);
    } finally { await page.close(); }
  });
  it('returns to login when the primary session actually expires', async () => {
    const page = await browser.newPage();
    try {
      const controls = await fixture(page); controls.expire();
      await page.getByLabel('Authenticator or recovery code').fill('222222');
      await page.getByRole('button', { name: 'Verify session', exact: true }).click();
      await uiExpect(page.getByLabel('Administrator email')).toBeVisible();
    } finally { await page.close(); }
  });
});
