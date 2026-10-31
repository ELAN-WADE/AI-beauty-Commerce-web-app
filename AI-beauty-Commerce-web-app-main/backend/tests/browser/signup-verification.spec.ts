import 'dotenv/config';
import { test, expect, appOrigin, apiOrigin } from './test';
import { createHash, randomUUID } from 'node:crypto';
import { requestQuotas } from '../../src/lib/quota-schema';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../src/db/schema';
import { openAuthUrl } from '../../src/lib/outbox-crypto';
const client = postgres(process.env.TEST_DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema });
test.beforeAll(async () => {
  await db.insert(schema.roles).values({ id: 'CUSTOMER' }).onConflictDoNothing();
  // Reset only this suite's shared quotas in the separate test database.
  for (const ip of ['unknown', '127.0.0.1', '::1', '::ffff:127.0.0.1']) {
    for (const namespace of ['register', 'verify', 'login:ip', 'oauth-start']) {
      const digest = createHash('sha256').update(`${namespace}:${ip}`).digest('hex');
      await db.delete(requestQuotas).where(eq(requestQuotas.keyHash, digest));
    }
  }
});
test.afterAll(async () => { await client.end({ timeout: 5 }); });

for (const [name, origin, intent, destination] of [
  ['customer on alternate loopback', appOrigin.replace('localhost', '127.0.0.1'), 'CUSTOMER', 'catalogue'],
  ['creator onboarding', appOrigin, 'CREATOR', 'creators'],
  ['distributor onboarding', appOrigin, 'DISTRIBUTOR', 'distributor-portal'],
]) test(`${name}: signup email link signs in and returns to destination`, async ({ page, browser }) => {
  test.setTimeout(480000);
  const email = `signup-${randomUUID()}@example.test`;
  const password = `Signup-${randomUUID()}!`;
  await page.goto(`${origin}/?screen=signup&intent=${intent}`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  const registered = page.waitForResponse(r => r.url().endsWith('/api/auth/register') && r.request().method() === 'POST', { timeout: 120000 });
  await page.getByRole('button', { name: /Create.*Account/i }).last().click();
  expect((await registered).status()).toBe(201);
  await expect(page.getByRole('heading', { name: 'Check Your Email', exact: true })).toBeVisible();
  expect((await page.request.get(`${origin}/api/auth/me`)).status()).toBe(401);
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  expect(user.signupIntent).toBe(intent);
  const [queued] = await db.select().from(schema.notificationOutbox).where(and(eq(schema.notificationOutbox.userId, user.id), eq(schema.notificationOutbox.template, 'auth.verify-email')));
  const emailUrl = new URL(openAuthUrl((queued.payload as { sealedUrl: string }).sealedUrl));
  // The delivery worker appends the persisted intent when rendering this queued link.
  emailUrl.searchParams.set('intent', user.signupIntent);
  // Open the captured email in a fresh browser: verification does not depend on the signup tab's storage.
  const recipient = await browser.newContext();
  try {
    const verification = await recipient.newPage();
    await verification.goto(emailUrl.toString(), { waitUntil: 'domcontentloaded' });
    await expect(verification.getByLabel('Verification token', { exact: true })).not.toBeEmpty();
    expect(verification.url()).not.toContain('token=');
    await verification.getByRole('button', { name: 'Verify Email', exact: true }).click();
    await expect(verification).toHaveURL(new RegExp(`screen=${destination}`));
    const me = await verification.request.get(`${appOrigin}/api/auth/me`, { timeout: 120000 });
    expect(me.status()).toBe(200);
    const account = await me.json(); expect(account.email).toBe(email); expect(account.roles).toEqual(['CUSTOMER']);
    expect((await recipient.cookies()).find(cookie => cookie.name === 'desla_sid')?.httpOnly).toBe(true);
    await verification.reload(); expect((await verification.request.get(`${appOrigin}/api/auth/me`, { timeout: 120000 })).status()).toBe(200);
    expect((await verification.request.post(`${appOrigin}/api/auth/verify-email`, { data: { token: emailUrl.searchParams.get('token') }, timeout: 120000 })).status()).toBe(410);
    expect((await verification.request.post(`${appOrigin}/api/auth/logout`, { timeout: 120000 })).status()).toBe(200);
    expect((await verification.request.post(`${appOrigin}/api/auth/login`, { data: { email, password }, timeout: 120000 })).status()).toBe(200);
  } finally { await recipient.close(); }
});


test('Google start preserves cookie binding across local host aliases', async ({ page }) => {
  test.setTimeout(300000);
  const origin = appOrigin.replace('localhost', '127.0.0.1');
  // Exercise our real redirect/cookie/callback; no provider credentials or consent.
  await page.route('https://accounts.google.com/**', route => route.abort());
  await page.goto(`${origin}/?screen=creators`, { waitUntil: 'domcontentloaded' });
  const providerRequest = page.waitForRequest(request => new URL(request.url()).hostname === 'accounts.google.com', { timeout: 120000 });
  await page.getByRole('button', { name: 'Continue with Google as Creator', exact: true }).click();
  const provider = new URL((await providerRequest).url());
  const callback = new URL(provider.searchParams.get('redirect_uri')!);
  expect(callback.origin).toBe(apiOrigin);
  callback.searchParams.set('state', provider.searchParams.get('state')!);
  callback.searchParams.set('error', 'access_denied');
  const returned = await page.goto(callback.toString(), { waitUntil: 'domcontentloaded' });
  expect(returned?.status()).toBe(200);
  await expect(page).toHaveURL(new RegExp(`^${origin}/.*`));
  // A wrong cookie host would instead lose state and return to the default storefront.
  const target = new URL(page.url());
  expect(target.pathname === '/creators' || target.searchParams.get('screen') === 'creators').toBe(true);
  const [request] = await db.select().from(schema.oauthRequests).where(eq(schema.oauthRequests.stateHash, createHash('sha256').update(provider.searchParams.get('state')!).digest('hex')));
  expect(request.consumedAt).not.toBeNull();
  expect((await page.context().cookies()).some(cookie => cookie.name === 'desla_oauth_browser')).toBe(false);
});
