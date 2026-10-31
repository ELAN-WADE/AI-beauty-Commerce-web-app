import 'dotenv/config';
import { test, expect, appOrigin, apiOrigin, type Page } from './test';
import { createHash, createHmac, randomBytes, randomUUID, scryptSync } from 'node:crypto';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import * as schema from '../../src/db/schema';
const run = randomUUID().slice(0, 8);
const password = `Browser-${randomUUID()}`;
const accounts = { creator: `browser-creator-${run}@example.com`, distributor: `browser-distributor-${run}@example.com`, admin: `browser-admin-${run}@example.com` };
const client = postgres(process.env.TEST_DATABASE_URL!, { max: 2 });
const db = drizzle(client, { schema });
const ids: Record<string, string> = {};
function totp(secret: string) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bits = [...secret].map(char => alphabet.indexOf(char).toString(2).padStart(5, '0')).join('');
  const key = Buffer.from(bits.match(/.{8}/g)!.map(byte => parseInt(byte, 2)));
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const digest = createHmac('sha1', key).update(counter).digest(); const offset = digest[19] & 15;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');
}
test.beforeAll(async ({ request }) => {
  test.setTimeout(600000);
  await request.get("/api/auth/me", { timeout: 120000 });
  await request.post("/api/auth/login", { data: { email: "warmup@example.test", password: "invalid-test-password" }, timeout: 120000 });
  // Compile protected API routes before timing user interactions in the dev server.
  for (const path of ['/api/auth/mfa/setup', '/api/auth/mfa/confirm', '/api/auth/mfa/verify', '/api/auth/oauth/exchange']) {
    await request.post(`${apiOrigin}${path}`, { data: {}, timeout: 120000 });
  }
  for (const path of ['/api/admin/catalogue', '/api/admin/orders', '/api/admin/workspace', '/api/admin/users', '/api/admin/creators', '/api/admin/audit', '/api/admin/reviews', '/api/partner/workspace?kind=CREATOR', '/api/storefront', '/api/partner?kind=DISTRIBUTOR', '/api/creators/UNKNOWN/storefront', '/api/cart', '/api/products']) {
    await request.get(`${apiOrigin}${path}`, { timeout: 120000 });
  }
  await request.get('/api/admin/catalogue', { timeout: 120000 });
  const salt = randomBytes(16);
  const passwordHash = `scrypt$16384$8$1$${salt.toString('hex')}$${scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex')}`;
  await db.insert(schema.categories).values({ name: 'Facial Care', slug: 'facial-care' }).onConflictDoNothing();
  for (const [kind, email] of Object.entries(accounts)) {
    const roleId = kind === 'admin' ? 'SUPER_ADMIN' : kind.toUpperCase();
    await db.insert(schema.roles).values({ id: roleId }).onConflictDoNothing();
    const [user] = await db.insert(schema.users).values({ email, passwordHash, emailVerifiedAt: new Date() }).returning();
    ids[kind] = user.id;
    await db.insert(schema.userRoles).values({ userId: user.id, roleId });
    await db.insert(schema.profiles).values({ userId: user.id, displayName: `Browser ${kind} ${run}` });
  }
  await db.insert(schema.creators).values({ userId: ids.creator, name: `Creator ${run}`, promoCode: `TEST${run.toUpperCase()}`, verified: true });
  const [distributor] = await db.insert(schema.distributors).values({ userId: ids.distributor, name: `Distributor ${run}`, businessName: `Test hub ${run}`, city: 'Lagos', state: 'Lagos', phone: '+2348012345678', operatingHours: 'Mon-Sat 9-5', verified: true }).returning();
  await db.insert(schema.inventoryLocations).values({ code: `TEST-${run}`, name: `Test hub ${run}`, type: 'DISTRIBUTOR', distributorId: distributor.id, city: 'Lagos', state: 'Lagos', isActive: true });
});
test.afterAll(async () => { await client.end({ timeout: 5 }); });
async function login(page: Page, kind: keyof typeof accounts) {
  test.setTimeout(600000);
  await page.goto('/?screen=login');
  await expect(page.locator('input[type="email"]').first()).toBeVisible();
  await page.locator('input[type="email"]').first().fill(accounts[kind]);
  await page.locator('input[type="password"]').first().fill(password);
  const response = page.waitForResponse(response => response.url().endsWith('/api/auth/login') && response.request().method() === 'POST', { timeout: 120000 });
  await page.getByRole('button', { name: 'Sign In', exact: true }).last().click();
  expect((await response).status()).toBe(200);
  await expect.poll(async () => (await page.request.get('/api/auth/me', { timeout: 120000 })).status(), { timeout: 120000 }).toBe(200);
  if (kind === 'admin') {
    await page.getByLabel('Confirm your password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Set up authenticator', exact: true }).click();
    const key = page.getByLabel('Authenticator setup key'); await expect(key).toBeVisible();
    await page.getByLabel('Authenticator code', { exact: true }).fill(totp((await key.innerText()).trim()));
    await page.getByRole('button', { name: 'Verify session', exact: true }).click();
    await page.getByRole('button', { name: 'I saved my codes — continue' }).click();
  }
  await expect(page).not.toHaveURL(/screen=login/);
}
test('admin publishes full formulation; public catalogue and cart use persisted values', async ({ page, browser }) => {
  await login(page, 'admin');
  await page.goto('/?screen=admin-console&tab=products');
  await page.getByRole('button', { name: '+ New Formulation', exact: true }).last().click();
  await page.getByLabel('Product name', { exact: true }).fill(`Browser formulation ${run}`);
  await page.getByLabel('Product slug', { exact: true }).fill(`browser-formulation-${run}`);
  await page.getByLabel('Product description', { exact: true }).fill('Persisted formulation description with usage instructions.');
  await page.getByRole('button', { name: '2. Pricing', exact: true }).click();
  await page.getByLabel('SKU 1', { exact: true }).fill(`BROWSER-${run}`);
  await page.getByLabel('Price NGN 1', { exact: true }).fill('2500');
  await page.getByLabel('Stock quantity 1', { exact: true }).fill('12');
  await page.getByRole('button', { name: 'Publish to Catalog', exact: true }).click();
  await expect(page.getByText(`Browser formulation ${run}`, { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText(`Browser formulation ${run}`, { exact: true })).toBeVisible();
  const [product] = await db.select().from(schema.products).where(eq(schema.products.slug, `browser-formulation-${run}`));
  expect(product.description).toContain('Persisted formulation'); expect(product.presentation.howToUse).toBeTruthy();
  const [variant] = await db.select().from(schema.productVariants).where(eq(schema.productVariants.productId, product.id));
  expect(variant.priceKobo).toBe(250000);
  const customer = await browser.newContext(); const shop = await customer.newPage();
  await shop.goto('/?screen=catalogue');
  await expect(shop.getByText(`Browser formulation ${run}`, { exact: true }).first()).toBeVisible();
  const sid = randomUUID();
  expect((await shop.request.post('/api/cart/items', { headers: { 'X-Session-Id': sid }, data: { variantId: variant.id, qty: 2 } })).ok()).toBe(true);
  const cart = await (await shop.request.get('/api/cart', { headers: { 'X-Session-Id': sid } })).json(); expect(cart.lines).toHaveLength(1);
  expect((await shop.request.get('/api/admin/catalogue', { timeout: 120000 })).status()).toBe(401);
  // Exercise the cross-role publication/review graph using real cookie sessions.
  const creator = await browser.newContext();
  const actor = creator;
  expect((await actor.request.post('/api/auth/login', { data: { email: accounts.creator, password } })).status()).toBe(200);
  const post = (request: typeof page.request, path: string, data: unknown) => request.post(path, { headers: { 'Idempotency-Key': randomUUID() }, data, timeout: 120000 });
  const campaignResponse = await post(page.request, '/api/admin/workspace', { action: 'publish', type: 'CAMPAIGN', audience: 'CREATOR', active: true, title: `Browser campaign ${run}`, body: 'Create an educational formulation review.', url: '', productIds: [product.slug], details: { category: 'Education', commissionRate: '12%', deliverables: ['One review'], slots: 'Review required' } });
  expect(campaignResponse.ok()).toBe(true); const campaign = (await campaignResponse.json()).result;
  const opportunities = await (await actor.request.get('/api/partner/workspace?kind=CREATOR', { timeout: 120000 })).json();
  expect(opportunities.records.find((r: any) => r.id === campaign.id).data.details.deliverables).toEqual(['One review']);
  const entryResponse = await post(actor.request, '/api/partner/workspace', { action: 'apply', kind: 'CREATOR', publicationId: campaign.id, title: campaign.title, body: 'My educational pitch', url: '', productIds: [product.slug] });
  expect(entryResponse.ok()).toBe(true); const entry = (await entryResponse.json()).result;
  expect((await post(page.request, '/api/admin/workspace', { action: 'review', id: entry.id, version: entry.version, status: 'APPROVED', note: 'Approved by brand reviewer.' })).ok()).toBe(true);
  const collectionResponse = await post(actor.request, '/api/partner/workspace', { action: 'save', kind: 'CREATOR', type: 'STOREFRONT', status: 'SUBMITTED', title: `Browser collection ${run}`, body: 'My reviewed clinical picks.', url: '', productIds: [product.slug] });
  expect(collectionResponse.ok()).toBe(true); const collection = (await collectionResponse.json()).result;
  const code = `TEST${run.toUpperCase()}`;
  expect((await shop.request.get(`/api/creators/${code}/storefront`, { timeout: 120000 })).status()).toBe(404);
  expect((await post(page.request, '/api/admin/workspace', { action: 'review', id: collection.id, version: collection.version, status: 'APPROVED', note: 'Collection verified.' })).ok()).toBe(true);
  const publicCollectionResponse = await shop.request.get(`/api/creators/${code}/storefront`, { timeout: 120000 });
  expect(publicCollectionResponse.ok()).toBe(true);
  const publicCollection = await publicCollectionResponse.json(); expect(publicCollection.products[0].slug).toBe(product.slug);
  await shop.goto(`/?screen=creator-storefront&ref=${code}`);
  const collectionHeading = shop.getByRole('heading', { name: collection.title, exact: true });
  const retryCollection = shop.getByRole('button', { name: 'Retry collection', exact: true });
  await Promise.race([collectionHeading.waitFor({ state: 'visible', timeout: 120000 }), retryCollection.waitFor({ state: 'visible', timeout: 120000 })]);
  if (await retryCollection.isVisible()) await retryCollection.click();
  await expect(collectionHeading).toBeVisible();
  expect((await actor.request.post('/api/admin/workspace', { data: {} })).status()).toBe(403);
  await creator.close();
  await customer.close();
});
test('creator draft survives reload in the real content library', async ({ page }) => {
  await login(page, 'creator');
  await page.goto('/?screen=creators&workspace=create');
  await expect(page.getByPlaceholder('e.g. My 3-Drop Radiance Routine for Lekki Sun')).toBeVisible();
  await page.getByPlaceholder('e.g. My 3-Drop Radiance Routine for Lekki Sun').fill(`Browser draft ${run}`);
  await page.getByRole('button', { name: /Save Draft/i }).click();
  await expect(page.getByText('Draft saved to your content library.', { exact: true })).toBeVisible();
  await page.goto('/?screen=creators&workspace=content');
  await expect(page.getByText(`Browser draft ${run}`, { exact: true })).toBeVisible(); await page.reload();
  await expect(page.getByText(`Browser draft ${run}`, { exact: true })).toBeVisible();
  const rows = await db.select().from(schema.workspaceRecords).where(eq(schema.workspaceRecords.ownerId, ids.creator));
  expect(rows.some(row => row.title === `Browser draft ${run}` && row.status === 'DRAFT')).toBe(true);
  expect((await page.request.get('/api/admin/orders', { timeout: 120000 })).status()).toBe(403);
});
test('distributor saves owned hub settings through the real API', async ({ page }) => {
  await login(page, 'distributor');
  await page.goto('/?screen=distributor-portal&workspace=settings');
  await expect(page.getByLabel('Hub name')).toHaveValue(`Distributor ${run}`);
  await expect(page.getByLabel('Hub address')).toBeVisible();
  await page.getByLabel('Hub address').fill(`12 Browser Street ${run}, Lagos`);
  await page.getByRole('button', { name: 'Save Hub Settings', exact: true }).click();
  await expect(page.getByText('Hub Settings Saved Successfully ✓', { exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByLabel('Hub address')).toHaveValue(`12 Browser Street ${run}, Lagos`);
  const [profile] = await db.select().from(schema.distributors).where(eq(schema.distributors.userId, ids.distributor)); expect(profile.address).toContain(run);
  expect((await page.request.get('/api/partner?kind=CREATOR', { timeout: 120000 })).status()).toBe(403);
});
test('one-use OAuth proof restores a HttpOnly session across reload and logout', async ({ page }) => {
  const code = randomBytes(32).toString('hex'); const verifier = randomBytes(32).toString('hex');
  await db.insert(schema.oauthGrants).values({ codeHash: createHash('sha256').update(code).digest('hex'), userId: ids.creator, challenge: createHash('sha256').update(verifier).digest('base64url'), returnTo: `${appOrigin}/creators`, expiresAt: new Date(Date.now() + 60000) });
  await page.goto('/?screen=login'); await page.evaluate(value => sessionStorage.setItem('desla-oauth-verifier', value), verifier);
  await page.goto(`/?screen=creators&auth=google_success#oauth_code=${code}`);
  await expect.poll(async () => (await page.request.get('/api/auth/me', { timeout: 120000 })).status(), { timeout: 120000 }).toBe(200);
  await expect(page).not.toHaveURL(/oauth_code/);
  expect((await page.context().cookies()).find(cookie => cookie.name === 'desla_sid')?.httpOnly).toBe(true);
  await page.reload(); expect((await page.request.get('/api/auth/me', { timeout: 120000 })).status()).toBe(200);
  expect((await page.request.post('/api/auth/oauth/exchange', { data: { code, verifier } })).status()).toBe(410);
  expect((await page.request.post('/api/auth/logout')).ok()).toBe(true); expect((await page.request.get('/api/auth/me', { timeout: 120000 })).status()).toBe(401);
});
