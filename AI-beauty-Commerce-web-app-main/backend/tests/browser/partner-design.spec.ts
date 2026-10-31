import 'dotenv/config';
import { test, expect, appOrigin, apiOrigin, type Page } from './test';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../../src/db/schema';

const run = randomUUID().slice(0, 8);
const email = `portal-design-${run}@example.com`;
const password = `Portal-${randomUUID()}`;
const client = postgres(process.env.TEST_DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema });

test.beforeAll(async () => {
  const salt = randomBytes(16);
  const hash = `scrypt$16384$8$1$${salt.toString('hex')}$${scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex')}`;
  const [user] = await db.insert(schema.users).values({ email, passwordHash: hash, emailVerifiedAt: new Date() }).returning();
  for (const roleId of ['CREATOR', 'DISTRIBUTOR']) {
    await db.insert(schema.roles).values({ id: roleId }).onConflictDoNothing();
    await db.insert(schema.userRoles).values({ userId: user.id, roleId });
  }
  await db.insert(schema.profiles).values({ userId: user.id, displayName: `Portal ${run}` });
  await db.insert(schema.creators).values({ userId: user.id, name: `Creator ${run}`, promoCode: `DESIGN${run.toUpperCase()}`, verified: true });
  const [distributor] = await db.insert(schema.distributors).values({ userId: user.id, name: `Distributor ${run}`, city: 'Lagos', verified: true }).returning();
  await db.insert(schema.inventoryLocations).values({ code: `DESIGN-${run}`, name: `Design hub ${run}`, type: 'DISTRIBUTOR', distributorId: distributor.id, city: 'Lagos', state: 'Lagos', isActive: false });
});
test.afterAll(async () => { await client.end({ timeout: 5 }); });

async function signIn(page: Page, origin: string) {
  const response = await page.request.post(`${origin}/api/auth/login`, { data: { email, password } });
  expect(response.ok()).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
}

for (const [name, origin] of [['root storefront', appOrigin], ['backend storefront', apiOrigin]]) {
  test(`${name}: original creator grid, all destinations, social connection modal, and browser history`, async ({ page }) => {
    await signIn(page, origin);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}/creators`);
    await expect(page.getByRole('heading', { name: 'Studio Navigation Workspace', exact: true })).toBeVisible();
    await expect(page.locator('main [role="link"]')).toHaveCount(9);
    await page.getByRole('button', { name: 'Matrix', exact: true }).click();
    await expect(page.locator('main [role="link"]')).toHaveCount(9);
    await page.getByRole('button', { name: 'Production & Media', exact: true }).click();
    await expect(page.locator('main [role="link"]')).toHaveCount(3);
    await page.getByRole('button', { name: 'All Destinations', exact: true }).click();
    await page.getByRole('button', { name: 'Bento', exact: true }).click();

    const destinations = [
      ['create', 'Open Create Studio workspace to author routines and videos'],
      ['campaigns', 'Explore available brand campaigns and collaborative briefs'],
      ['content', 'Manage your published and draft creator content library'],
      ['pr-room', 'Access complimentary PR package allocations and courier tracking'],
      ['earnings', 'Inspect affiliate earnings, commission ledgers, and payout withdrawals'],
      ['storefront', 'Manage your creator shoppable storefront showcase'],
      ['links', 'Manage affiliate tracking links and promotional vouchers'],
      ['settings', 'Manage creator profile, payout bank details, and notification preferences'],
    ];
    for (const [route, label] of destinations) {
      await page.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`workspace=${route}$`));
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Workspace pages' })).toHaveCount(0);
      await expect(page.getByRole('complementary', { name: 'Floating workspace rail' })).toBeVisible();
      if (route === 'create') {
        await page.getByRole('button', { name: '+ Connect TikTok', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'TikTok Creator Connection', exact: true })).toBeVisible();
        await expect(page.getByPlaceholder('Available after authorization')).toHaveAttribute('readonly', '');
        await expect(page.getByRole('button', { name: 'Open Login', exact: true })).toBeDisabled();
        await expect(page.getByText('Developer app credentials and callback URLs have not been configured yet.')).toBeVisible();
        const modal = page.locator('div.fixed.inset-0').filter({ has: page.getByRole('heading', { name: 'TikTok Creator Connection', exact: true }) });
        await modal.getByRole('button', { name: 'Cancel', exact: true }).click();
      }
      await page.getByRole('button', { name: 'Creator Office', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Studio Navigation Workspace', exact: true })).toBeVisible();
    }
    await page.getByRole('link', { name: /Inspect performance telemetry/ }).click();
    await expect(page.getByRole('heading', { name: 'Performance Telemetry', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Open Full Earnings Ledger', exact: true }).click();
    await expect(page).toHaveURL(/workspace=earnings$/);
    await page.goBack();
    await expect(page.getByRole('heading', { name: 'Studio Navigation Workspace', exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Studio Navigation Workspace', exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test(`${name}: original distributor grid, every operations screen, and mobile navigation`, async ({ page }) => {
    await signIn(page, origin);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}/distributor`);
    await expect(page.getByRole('heading', { name: 'Distributor Operations Console', exact: true })).toBeVisible();
    await expect(page.locator('main [role="link"]')).toHaveCount(9);
    await page.getByRole('button', { name: 'Lab & Wholesale', exact: true }).click();
    await expect(page.locator('main [role="link"]')).toHaveCount(3);
    await page.getByRole('button', { name: 'All Operations', exact: true }).click();
    const labels = await page.locator('main [role="link"]').evaluateAll(tiles => tiles.map(tile => tile.getAttribute('aria-label')!));
    for (const label of labels) {
      await page.getByRole('link', { name: label, exact: true }).click();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Workspace pages' })).toHaveCount(0);
      await expect(page.getByRole('complementary', { name: 'Floating hub operations rail' })).toBeVisible();
      await page.getByRole('button', { name: 'Distributor Hub', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Distributor Operations Console', exact: true })).toBeVisible();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('link', { name: 'Open hub orders and same-day dispatch queue', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Orders & Fulfilment Queue', exact: true })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Floating hub operations rail' })).toBeHidden();
    expect(await page.locator('body').evaluate(body => body.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
