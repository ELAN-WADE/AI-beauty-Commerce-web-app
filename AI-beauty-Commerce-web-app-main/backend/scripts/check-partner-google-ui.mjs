import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const origin = process.env.LOCAL_STOREFRONT_URL || 'http://localhost:3000';
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
try {
  for (const [screen, label] of [['creators', 'Continue with Google as Creator'], ['distributor-portal', 'Continue with Google as Distributor']]) {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.goto(`${origin}/?screen=${screen}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.getByRole('button', { name: label, exact: true }).click({ timeout: 120000 });
      await page.waitForURL(url => url.hostname === 'accounts.google.com', { timeout: 120000 });
      await page.waitForLoadState('domcontentloaded', { timeout: 120000 });
      const text = await page.locator('body').innerText();
      const url = new URL(page.url());
      const rejected = /invalid_client|redirect_uri_mismatch|access blocked|error 400|error 401|deleted_client|OAuth client was not found/i.test(text) || /\/signin\/oauth\/error/.test(url.pathname);
      const signInReady = /sign in|choose an account|email or phone/i.test(text);
      console.log(JSON.stringify({ screen, providerHost: url.hostname, providerPath: url.pathname, rejected, signInReady }));
      assert.equal(rejected, false, `${screen}: Google rejected this OAuth configuration`);
      assert.equal(signInReady, true, `${screen}: Google sign-in prompt was not detected`);
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
