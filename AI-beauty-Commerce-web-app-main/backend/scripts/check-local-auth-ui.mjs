import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const origin = process.env.LOCAL_STOREFRONT_URL || 'http://localhost:3000';
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const [screen, button] of [['login', null], ['creators', 'Continue with Google as Creator'], ['distributor-portal', 'Continue with Google as Distributor']]) {
    const response = await page.goto(`${origin}/?screen=${screen}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    assert.equal(response?.status(), 200);
    const control = button ? page.getByRole('button', { name: button, exact: true }) : page.locator('input[type="email"]').first();
    await control.waitFor({ state: 'visible', timeout: 120000 });
    console.log(JSON.stringify({ screen, status: 'ready' }));
  }
  if (process.env.LOCAL_ADMIN_EMAIL && process.env.LOCAL_ADMIN_PASSWORD) {
    await page.goto(`${origin}/?screen=login`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.locator('input[type="email"]').first().fill(process.env.LOCAL_ADMIN_EMAIL);
    await page.locator('input[type="password"]').first().fill(process.env.LOCAL_ADMIN_PASSWORD);
    const loginResponse = page.waitForResponse(response => response.url().endsWith('/api/auth/login') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Sign In', exact: true }).last().click();
    assert.equal((await loginResponse).status(), 200);
    await page.getByLabel('Authenticator or recovery code', { exact: true }).waitFor({ state: 'visible', timeout: 120000 });
    console.log(JSON.stringify({ adminLogin: 'accepted', nextStep: 'authenticator verification' }));
    const logout = await page.request.post(`${origin}/api/auth/logout`, { headers: { origin }, data: {} });
    assert.equal(logout.status(), 200);
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ runtimeErrors: errors.length }));
} finally { await browser.close(); }
