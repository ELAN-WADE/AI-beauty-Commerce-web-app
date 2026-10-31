import 'dotenv/config';
import { test, expect, appOrigin, apiOrigin } from './test';
import { createHmac, randomBytes, randomUUID, scryptSync } from 'node:crypto';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../../src/db/schema';

const run = randomUUID().slice(0, 8);
const email = `portal-isolation-${run}@example.com`;
const password = `Isolation-${randomUUID()}`;
const client = postgres(process.env.TEST_DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema });
let recoveryCodes: string[] = [];
function totp(secret: string) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bits = [...secret].map(char => alphabet.indexOf(char).toString(2).padStart(5, '0')).join('');
  const key = Buffer.from(bits.match(/.{8}/g)!.map(byte => parseInt(byte, 2)));
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const digest = createHmac('sha1', key).update(counter).digest(); const offset = digest[19] & 15;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');
}
test.beforeAll(async () => {
  const salt = randomBytes(16);
  const passwordHash = `scrypt$16384$8$1$${salt.toString('hex')}$${scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex')}`;
  const [user] = await db.insert(schema.users).values({ email, passwordHash, emailVerifiedAt: new Date() }).returning();
  for (const roleId of ['CREATOR', 'DISTRIBUTOR', 'ADMIN']) {
    await db.insert(schema.roles).values({ id: roleId }).onConflictDoNothing();
    await db.insert(schema.userRoles).values({ userId: user.id, roleId });
  }
  await db.insert(schema.profiles).values({ userId: user.id, displayName: `Isolation ${run}` });
  await db.insert(schema.creators).values({ userId: user.id, name: `Creator ${run}`, promoCode: `ISO${run.toUpperCase()}`, verified: true });
  const [distributor] = await db.insert(schema.distributors).values({ userId: user.id, name: `Distributor ${run}`, city: 'Lagos', verified: true }).returning();
  await db.insert(schema.inventoryLocations).values({ code: `ISO-${run}`, name: `Isolation hub ${run}`, type: 'DISTRIBUTOR', distributorId: distributor.id, city: 'Lagos', state: 'Lagos', isActive: false });
});
test.afterAll(async () => { await client.end({ timeout: 5 }); });

for (const [name, origin] of [['root', appOrigin], ['backend', apiOrigin]]) {
  for (const [portal, entry, heading] of [
    ['Creator', 'Join Creator Studio', 'Studio Navigation Workspace'],
    ['Distributor', 'Join Distributor Hub', 'Distributor Operations Console'],
    ['Admin', 'Admin Portal', 'Delsla!™ Central Operations'],
  ]) test(`${name}: ${portal} preview entry opens only its original portal`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const errors: string[] = [];
    const apiRequests: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url()); });
    await page.goto(`${origin}/?preview=design`, { waitUntil: 'domcontentloaded' });
    // The floating Admin Portal entry was removed from all shells; it must never render.
    await expect(page.getByRole('button', { name: 'Admin Portal', exact: true })).toHaveCount(0);
    if (portal === 'Admin') await page.goto(name === 'backend' ? `${origin}/admin?preview=design` : `${origin}/?preview=design&screen=admin-console`, { waitUntil: 'domcontentloaded' });
    else await page.locator('article[role="button"]').filter({ hasText: entry }).click();
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await expect(page.getByRole('note')).toContainText(`${portal} design preview`);
    await expect(page.getByRole('button', { name: 'Admin Portal', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Creator Studio', exact: true })).toHaveCount(0);
    if (portal === 'Creator') {
      await page.getByRole('button', { name: 'Creator Settings', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Studio Settings', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Creator Support', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Creator Support Concierge', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Distributor Operations Console', exact: true })).toHaveCount(0);
    } else if (portal === 'Distributor') {
      await page.getByRole('button', { name: 'Hub Settings', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Distributor Hub Settings', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Studio Navigation Workspace', exact: true })).toHaveCount(0);
    } else {
      for (const label of ['Formulations & Taxonomy', 'Editorial CMS', 'Orders & Dispatch', 'Creator Press Room', 'Customer Intelligence', 'Inventory Management', 'Distributor Hubs', 'NIP Claims', 'Security & Audit', 'Overview']) {
        const tab = page.locator('aside').getByTitle(label, { exact: true });
        await tab.click();
        await expect(tab).toHaveClass(/bg-\[#0F0F10\]/);
      }
      await expect(page.getByRole('heading', { name: 'Studio Navigation Workspace', exact: true })).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Distributor Operations Console', exact: true })).toHaveCount(0);
    }
    expect((await page.context().cookies()).filter(cookie => cookie.name.includes('desla_sid'))).toEqual([]);
    expect(apiRequests).toEqual([]);
    expect(errors).toEqual([]);
  });

  for (const [path, heading, signIn] of [
    ['/creators', 'Studio Navigation Workspace', 'Sign In with Email & Password'],
    ['/distributor', 'Distributor Operations Console', 'Sign In with Email & Password'],
    ['/admin', 'Delsla!™ Central Operations', 'Executive Staff Sign In'],
  ]) {
    test(`${name}: ${path} sign-in returns to the chosen portal even for a multi-role account`, async ({ page }) => {
      test.setTimeout(300000);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`${origin}${path}`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: path === '/admin' ? /^(Executive Staff Sign In|Sign In with Staff Account)$/ : signIn, exact: true }).click();
      await page.getByPlaceholder('amina.bello@example.com').fill(email);
      await page.locator('input[type="password"]').first().fill(password);
      await page.getByRole('button', { name: 'Sign In', exact: true }).last().click();
      // This fixture also has an ADMIN role: every new session must complete MFA.
      if (recoveryCodes.length) {
        await page.getByLabel('Authenticator or recovery code', { exact: true }).fill(recoveryCodes.shift()!);
        await page.getByRole('button', { name: 'Verify session', exact: true }).click();
      } else {
        await page.getByLabel('Confirm your password', { exact: true }).fill(password);
        await page.getByRole('button', { name: 'Set up authenticator', exact: true }).click();
        const key = page.getByLabel('Authenticator setup key'); await expect(key).toBeVisible();
        await page.getByLabel('Authenticator code', { exact: true }).fill(totp((await key.innerText()).trim()));
        await page.getByRole('button', { name: 'Verify session', exact: true }).click();
        await expect(page.getByLabel('Recovery codes', { exact: true })).toBeVisible();
        recoveryCodes = await page.getByLabel('Recovery codes', { exact: true }).locator('code').allTextContents();
        expect(recoveryCodes).toHaveLength(10);
        await page.getByRole('button', { name: 'I saved my codes — continue', exact: true }).click();
      }
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      await expect(page.getByRole('note')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Admin Portal', exact: true })).toHaveCount(0);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    });
  }
}
