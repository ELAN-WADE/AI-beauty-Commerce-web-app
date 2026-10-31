// Browser rendering checks with captured API responses; no live account writes.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let account = null;
  let savedProfile = null;
  await page.route('**/api/**', async route => {
    const req = route.request(); const path = new URL(req.url()).pathname;
    if (path === '/api/auth/me') return route.fulfill({ status: account ? 200 : 401, json: account || { error: { message: 'Sign in', code: 'unauthorized' } } });
    if (path === '/api/me/profile' && req.method() === 'PATCH') {
      savedProfile = req.postDataJSON(); account.profile = savedProfile;
      return route.fulfill({ json: { profile: savedProfile } });
    }
    if (path === '/api/orders') return route.fulfill({ json: { orders: [], hasMore: false, nextCursor: null } });
    if (path === '/api/me/addresses') return route.fulfill({ json: { addresses: [] } });
    if (path === '/api/auth/register') return route.fulfill({ status: 201, json: { ok: true, email: 'ui-check@example.test' } });
    return route.fulfill({ status: 503, json: { error: { code: 'unavailable', message: 'No fixture for this endpoint.' } } });
  });
  await page.goto('http://localhost:3000/?screen=account', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.getByRole('heading', { name: 'Your account', exact: true }).waitFor({ timeout: 120000 });
  assert.doesNotMatch(await page.locator('main').first().innerText(), /Amina|Bello|Maitama|amina.bello/);
  account = { id: 'account-ui-check', email: 'ui-check@example.test', emailVerified: true, roles: ['CUSTOMER'], profile: null };
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByLabel('Profile name', { exact: true }).waitFor({ timeout: 120000 });
  assert.equal(await page.getByLabel('Profile name', { exact: true }).inputValue(), '');
  assert.doesNotMatch(await page.locator('body').innerText(), /Amina Bello|DES-98214|Wuse Express Courier|DESLA-GOLD-5K|Maitama address/);
  await page.getByText('No orders yet.', { exact: true }).waitFor();
  await page.getByText('No saved vouchers yet.', { exact: true }).waitFor();
  await page.getByLabel('Profile name', { exact: true }).fill('Saved account name');
  await page.getByLabel('Profile phone', { exact: true }).fill('+2348000000000');
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
  await page.getByText('Profile saved.', { exact: true }).waitFor();
  assert.deepEqual(savedProfile, { displayName: 'Saved account name', phone: '+2348000000000' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Saved account name', exact: true }).waitFor();
  account = null;
  await page.goto('http://localhost:3000/?screen=signup', { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="email"]').first().fill('ui-check@example.test');
  await page.locator('input[type="password"]').first().fill('Ui-check-password-1');
  await page.getByRole('button', { name: /Create.*Account/i }).last().click();
  await page.getByRole('heading', { name: 'Check Your Email', exact: true }).waitFor();
  assert.equal(await page.getByLabel('Verification token', { exact: true }).inputValue(), '');
  assert.equal(await page.getByLabel('Verification token', { exact: true }).isVisible(), false);
  await page.getByRole('button', { name: 'Go to sign in', exact: true }).click();
  await page.getByRole('button', { name: 'Sign In', exact: true }).last().waitFor();
  await page.goto(`http://localhost:3000/verify-email?token=${'a'.repeat(64)}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Verify Your Email', exact: true }).waitFor();
  assert.equal(await page.getByLabel('Verification token', { exact: true }).inputValue(), 'a'.repeat(64));
  assert.equal(await page.getByRole('button', { name: 'Verify Email', exact: true }).isVisible(), true);
  assert.doesNotMatch(await page.locator('body').innerText(), /Dev token:/);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ guestIdentity: 'empty', profileSaveAndReload: 'passed', signupRequiresEmailProof: true, runtimeErrors: 0 }));
} finally { await browser.close(); }
