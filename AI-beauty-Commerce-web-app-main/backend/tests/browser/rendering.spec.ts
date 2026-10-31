import 'dotenv/config';
import { test, expect, appOrigin, apiOrigin } from './test';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../../src/db/schema';
const tag = randomUUID().slice(0, 8);
const slug = `ssr-formulation-${tag}`;
const name = `SSR formulation ${tag}`;
const client = postgres(process.env.TEST_DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema });
test.beforeAll(async () => {
  const [brand] = await db.insert(schema.brands).values({ name: `SSR brand ${tag}`, slug: `ssr-brand-${tag}` }).returning();
  const [category] = await db.insert(schema.categories).values({ name: `SSR category ${tag}`, slug: `ssr-category-${tag}` }).returning();
  const [product] = await db.insert(schema.products).values({ name, slug, brandId: brand.id, categoryId: category.id, description: 'Persisted server rendered formulation.' }).returning();
  const [variant] = await db.insert(schema.productVariants).values({ productId: product.id, sku: `SSR-${tag}`, sizeLabel: '50ml', priceKobo: 250000 }).returning();
  await db.insert(schema.stockLevels).values({ variantId: variant.id, onHand: 3 });
});
test.afterAll(async () => { await client.end({ timeout: 5 }); });
test('public home and catalogue contain real product cards before JavaScript', async ({ request, page }) => {
  for (const route of ['/', '/catalogue']) {
    const response = await request.get(`${apiOrigin}${route}`, { timeout: 120000 });
    expect(response.status()).toBe(200);
    const html = await response.text();
    // Actual card markup rather than product text inside the RSC JSON seed.
    expect(html).toMatch(new RegExp(String.raw`<h[1-6][^>]*>\s*${name}\s*</h[1-6]>`));
  }
  const errors: string[] = [];
  const catalogueReads: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (new URL(request.url()).pathname === '/api/products') catalogueReads.push(request.url());
  });
  await page.goto(`${apiOrigin}/catalogue`);
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  await expect(page.locator('[aria-label="Loading Desla"]')).toBeHidden();
  // Confirm hydration completed; opening filters depends on the client handlers.
  await page.getByRole('button', { name: /filter/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Filter & Sort Formulations', exact: true })).toBeVisible();
  expect(catalogueReads).toEqual([]);
  expect(errors).toEqual([]);
});
test('backend product response contains the persisted server-rendered HTML', async ({ request }) => {
  const response = await request.get(`${apiOrigin}/products/${slug}`, { timeout: 120000 });
  expect(response.status()).toBe(200);
  const html = await response.text();
  // Check actual heading markup, not the RSC JSON payload. Next streaming may
  // place it in a boundary that its small reveal script later moves into view.
  expect(html).toMatch(new RegExp(String.raw`<h1[^>]*>\s*${name}\s*</h1>`));
  expect(html).toContain('Persisted server rendered formulation.');
  const missing = await request.get(`${apiOrigin}/products/missing-${tag}`, { timeout: 120000 });
  expect([200, 404]).toContain(missing.status());
  const missingHtml = await missing.text();
  expect(missingHtml).toContain('This page could not be found');
  expect(missingHtml).toContain('name="robots" content="noindex"');
});
