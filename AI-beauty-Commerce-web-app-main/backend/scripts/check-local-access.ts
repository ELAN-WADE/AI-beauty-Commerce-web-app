import { strict as assert } from 'node:assert';
import { randomBytes } from 'node:crypto';
import { chromium } from '@playwright/test';
import { currentTotpCode } from '../src/modules/auth/mfa';

// Exercise the running local app with accounts created by `npm run dev:access`.
// Passwords are supplied at runtime; this script never prints credentials.
const origin = 'http://localhost:3005';
const prefix = process.env.LOCAL_ACCESS_PREFIX;
const cases = [
  { role: 'CUSTOMER', suffix: 'customer', path: '/catalogue' },
  { role: 'CREATOR', suffix: 'creator', path: '/creators' },
  { role: 'DISTRIBUTOR', suffix: 'distributor', path: '/distributor' },
  { role: 'SUPER_ADMIN', suffix: 'super_admin', path: '/admin' },
] as const;

async function main() {
  assert(prefix && /^local-\d+$/.test(prefix), 'Set LOCAL_ACCESS_PREFIX from the local account bootstrap.');
  for (const item of cases) assert(process.env[`LOCAL_${item.role}_PASSWORD`], `Set LOCAL_${item.role}_PASSWORD.`);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const item of cases) {
      const context = await browser.newContext();
      const page = await context.newPage();
      page.setDefaultTimeout(60000);
      page.setDefaultNavigationTimeout(180000);
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      const email = `${prefix}-${item.suffix}@example.test`;
      const password = process.env[`LOCAL_${item.role}_PASSWORD`]!;
      async function signIn() {
        await page.goto(`${origin}/login`, { waitUntil: 'domcontentloaded' });
        await page.locator('input[type="email"]').first().fill(email);
        await page.locator('input[type="password"]').first().fill(password);
        await page.locator('button[type="submit"]').filter({ hasText: /^Sign In$/ }).click();
      }
      let recoveryCodes: string[] = [];
      try {
        await signIn();
        if (item.role === 'SUPER_ADMIN') {
          await page.getByRole('heading', { name: 'Set Up Administrator Verification' }).waitFor();
          const denied = await page.request.get(`${origin}/api/admin/catalogue`);
          assert.equal(denied.status(), 403, 'Admin writes/reads must require MFA.');
          await page.getByLabel('Confirm your password').fill(password);
          await page.getByRole('button', { name: 'Set up authenticator', exact: true }).click();
          const key = page.getByLabel('Authenticator setup key');
          await key.waitFor();
          const secret = (await key.innerText()).trim();
          await page.getByLabel('Authenticator code', { exact: true }).fill(currentTotpCode(secret));
          await page.getByRole('button', { name: 'Verify session', exact: true }).click();
          const recovery = page.getByLabel('Recovery codes');
          await recovery.waitFor();
          recoveryCodes = await recovery.locator('code').allTextContents();
          assert.equal(recoveryCodes.length, 10);
          await page.getByRole('button', { name: 'I saved my codes — continue' }).click();
        }
        await page.waitForURL(url => url.pathname === item.path);
        const me = await (await page.request.get(`${origin}/api/auth/me`)).json();
        assert(me.roles.includes(item.role), `${item.role} missing in restored session`);
        const cookies = await context.cookies(origin);
        assert(cookies.some(cookie => cookie.httpOnly && cookie.path === '/'), 'Session cookie should be HttpOnly.');
        if (item.role === 'CUSTOMER') {
          assert.equal((await page.request.get(`${origin}/api/partner?kind=CREATOR`)).status(), 403);
          assert.equal((await page.request.get(`${origin}/api/admin/catalogue`)).status(), 403);
        } else if (item.role === 'CREATOR' || item.role === 'DISTRIBUTOR') {
          const response = await page.request.get(`${origin}/api/partner?kind=${item.role}`);
          assert.equal(response.status(), 200);
          assert.equal((await response.json()).profile.userId, me.id);
          const other = item.role === 'CREATOR' ? 'DISTRIBUTOR' : 'CREATOR';
          assert.equal((await page.request.get(`${origin}/api/partner?kind=${other}`)).status(), 403);
          await page.getByText(item.role === 'CREATOR' ? 'Creator Office' : 'Distributor Hub', { exact: true }).first().waitFor();
        } else {
          assert.equal((await page.request.get(`${origin}/api/admin/catalogue`)).status(), 200);
          await page.request.post(`${origin}/api/auth/logout`, { headers: { Origin: origin } });
          await signIn();
          await page.getByRole('heading', { name: 'Verify Administrator Sign-In' }).waitFor();
          await page.getByLabel('Authenticator or recovery code').fill(recoveryCodes[0]);
          await page.getByRole('button', { name: 'Verify session', exact: true }).click();
          await page.waitForURL(url => url.pathname === '/admin');
          assert.equal((await page.request.get(`${origin}/api/admin/catalogue`)).status(), 200);
        }
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);
        assert.equal((await page.request.get(`${origin}/api/auth/me`)).status(), 200);
        assert.deepEqual(errors, [], `${item.role} browser runtime errors`);
        console.log(`${item.role}: browser sign-in, redirect, session reload, and API permissions passed.`);
      } finally {
        // Leave the provided local admin unenrolled so the user can enroll their own authenticator.
        if (recoveryCodes.length > 1) {
          const reset = await page.request.post(`${origin}/api/auth/mfa/disable`, { headers: { Origin: origin }, data: { code: recoveryCodes[1] } });
          assert.equal(reset.status(), 200, 'Restore local admin to its original unenrolled state.');
        }
        await context.close();
      }
    }

    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(180000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const email = `local-flow-${Date.now()}@example.test`;
    const password = randomBytes(18).toString('base64url');
    const newPassword = randomBytes(18).toString('base64url');
    const destination = 'intent=CREATOR&returnTo=%2Fcreators';
    try {
      await page.goto(`${origin}/signup?${destination}`, { waitUntil: 'domcontentloaded' });
      await page.locator('input[type="email"]').first().fill(email);
      await page.locator('input[type="password"]').first().fill(password);
      await page.locator('button[type="submit"]').filter({ hasText: /^Create account$/ }).click();
      await page.getByRole('heading', { name: 'Verify Your Email' }).waitFor();
      assert.match(await page.getByPlaceholder('Paste token from email').inputValue(), /^[a-f0-9]{64}$/);
      assert.equal((await page.request.get(`${origin}/api/auth/me`)).status(), 401, 'Registration must not authenticate an unverified email.');
      await page.getByRole('button', { name: 'Verify Email', exact: true }).click();
      await page.getByRole('heading', { name: 'Sign In to Desla!' }).waitFor();
      await page.locator('input[type="email"]').first().fill(email);
      await page.locator('input[type="password"]').first().fill(password);
      await page.locator('button[type="submit"]').filter({ hasText: /^Sign In$/ }).click();
      await page.waitForURL(url => url.pathname === '/creators');
      await page.getByRole('heading', { name: 'Apply for your creator workspace' }).waitFor();
      const member = await (await page.request.get(`${origin}/api/auth/me`)).json();
      assert.equal(member.signupIntent, 'CREATOR');
      assert.deepEqual(member.roles, ['CUSTOMER'], 'Onboarding intent must not self-grant a partner role.');

      await page.goto(`${origin}/forgot-password?${destination}`, { waitUntil: 'domcontentloaded' });
      await page.getByLabel('Email address', { exact: true }).fill(email);
      await page.getByRole('button', { name: 'Send reset link', exact: true }).click();
      await page.getByRole('heading', { name: 'Reset Password', exact: true }).waitFor();
      assert.match(await page.getByPlaceholder('Paste token from email').inputValue(), /^[a-f0-9]{64}$/);
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await page.getByRole('heading', { name: 'Create New Password' }).waitFor();
      await page.getByPlaceholder('Enter new password', { exact: true }).fill(newPassword);
      await page.getByPlaceholder('Confirm new password', { exact: true }).fill(newPassword);
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await page.getByRole('heading', { name: 'Sign In to Desla!' }).waitFor();
      assert.equal((await page.request.get(`${origin}/api/auth/me`)).status(), 401, 'Password reset must revoke the previous session.');
      assert.equal((await page.request.post(`${origin}/api/auth/login`, { headers: { Origin: origin }, data: { email, password } })).status(), 401, 'The old password must stop working.');
      await page.locator('input[type="email"]').first().fill(email);
      await page.locator('input[type="password"]').first().fill(newPassword);
      await page.locator('button[type="submit"]').filter({ hasText: /^Sign In$/ }).click();
      await page.waitForURL(url => url.pathname === '/creators');
      await page.getByRole('heading', { name: 'Apply for your creator workspace' }).waitFor();
      assert.deepEqual(errors, [], 'Account-flow browser runtime errors');
      console.log('REGISTRATION/RESET: email verification, preserved creator intent, approval gate, password change, and session revocation passed.');
    } finally { await context.close(); }
  } finally { await browser.close(); }
}

main().catch(error => { console.error(error instanceof Error ? error.message : 'Local browser verification failed.'); process.exitCode = 1; });
