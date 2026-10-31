// Captured API responses test the UI handoffs without changing live records.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const id = number => `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
const order = (number, label) => ({ id: id(number), orderNumber: label, status: 'PAID', paymentStatus: 'PAID', fulfilmentMethod: 'PICKUP', subtotalKobo: 12345, deliveryFeeKobo: 0, totalKobo: 12345, createdAt: '2026-10-30T10:00:00Z', shippingAddress: { fullName: 'Saved recipient', street: 'Saved address', city: 'Lagos', state: 'Lagos', phone: '+2348000000000' }, items: [{ variantId: id(8), productName: 'Saved formulation', variantLabel: '50ml', sku: 'REAL-SKU', unitPriceKobo: 12345, qty: 1, lineTotalKobo: 12345 }], history: [{ toStatus: 'PAID', createdAt: '2026-10-30T10:01:00Z' }] });
try {
  for (const [name, origin, screen] of [
    ['root', 'http://localhost:3000', (value, extra = '') => `/?screen=${value}${extra}`],
    ['backend', 'http://localhost:3005', (value, extra = '') => ({ account: '/account', orders: '/orders', creators: '/creators', 'distributor-portal': '/distributor', 'order-confirmed': '/order-confirmed' })[value] + (extra ? '?' + extra.slice(1) : '')],
  ]) {
    const context = await browser.newContext(); const page = await context.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && /empty string.*src|useEffect must not|destroy is not a function/i.test(message.text())) errors.push(message.text()); });
    let roles = ['CUSTOMER', 'DISTRIBUTOR']; const own = order(2, 'DES-OWN001'); const assigned = order(3, 'DES-HUB001'); const actions = []; const submissions = [];
    await page.route('**/api/**', async route => {
      const req = route.request(); const url = new URL(req.url()); const path = url.pathname;
      if (path === '/api/auth/me') return route.fulfill({ json: { id: id(1), email: 'audit-shopper@example.test', emailVerified: true, roles, signupIntent: 'CUSTOMER', profile: { displayName: 'Audit Shopper', phone: '+2348000000000' } } });
      if (path === '/api/orders') return route.fulfill({ json: { orders: [{ ...own, totalNgn: own.totalKobo / 100 }], hasMore: false, nextCursor: null } });
      if (path === `/api/orders/${own.id}`) return route.fulfill({ json: own });
      if (path.endsWith('/pickup-code')) return route.fulfill({ json: { code: '246810', expiresAt: new Date(Date.now() + 900000).toISOString() } });
      if (path === '/api/partner' && req.method() === 'GET') return route.fulfill({ json: { profile: { id: id(4), name: 'Owned partner', handle: '@owned', city: 'Lagos', state: 'Lagos', address: 'Saved location', phone: '+2348000000000', operatingHours: '', promoCode: 'OWNED', verified: true }, location: { id: id(5), deliveryEnabled: true }, metrics: {}, wallet: { entries: [], availableKobo: 0, banks: [] }, orders: [{ ...assigned, items: assigned.items.map(item => ({ ...item, size: item.variantLabel, quantity: item.qty, priceKobo: item.unitPriceKobo })) }], inventory: [], transfers: [], restocks: [] } });
      if (path === '/api/partner' && req.method() === 'POST') {
        const body = req.postDataJSON(); actions.push(body.transition);
        assigned.status = ({ ACCEPT: 'FULFILLING', READY_PICKUP: 'READY_PICKUP', CONFIRM_PICKUP: 'DELIVERED' })[body.transition];
        return route.fulfill({ json: { result: assigned } });
      }
      if (path === '/api/partner/workspace' && req.method() === 'GET') return route.fulfill({ json: { records: [] } });
      if (path === '/api/partner/workspace' && req.method() === 'POST') { const body = req.postDataJSON(); submissions.push(body); return route.fulfill({ json: { result: { id: id(6), version: 1, ...body } } }); }
      if (path === '/api/me/addresses') return route.fulfill({ json: { addresses: [] } });
      if (path === '/api/me/loyalty') return route.fulfill({ json: { points: 0 } });
      return route.fulfill({ status: 503, json: { error: { code: 'unavailable', message: 'This browser check has no live records.' } } });
    });
    await page.goto(origin + screen('account'), { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.getByRole('heading', { name: 'Audit Shopper', exact: true }).waitFor({ timeout: 120000 });
    await page.getByText('Order #DES-OWN001', { exact: true }).waitFor();
    assert.doesNotMatch(await page.locator('body').innerText(), /DES-HUB001/);
    await page.getByRole('button', { name: 'Track order →', exact: true }).first().click();
    await page.getByText('Tracking: #DES-OWN001', { exact: true }).waitFor({ timeout: 120000 });
    assert.equal(await page.getByRole('button', { name: 'Get pickup code', exact: true }).count(), 0);
    assert.doesNotMatch(await page.locator('body').innerText(), /DES-HUB001|Emeka|15–20 Mins|2\.4 km|PS-84920/);
    own.status = 'READY_PICKUP';
    await page.getByRole('button', { name: 'Refresh orders', exact: true }).click();
    await page.getByRole('button', { name: 'Get pickup code', exact: true }).click();
    await page.getByText('246810', { exact: true }).waitFor();
    const refreshed = page.waitForResponse(response => new URL(response.url()).pathname === `/api/orders/${own.id}`);
    await page.getByRole('button', { name: 'Refresh orders', exact: true }).click();
    await refreshed;
    assert.equal(await page.getByText('246810', { exact: true }).isVisible(), true);
    await page.goto(origin + screen('distributor-portal', '&workspace=orders'), { waitUntil: 'domcontentloaded' });
    for (const [label, expectedStatus] of [['Accept order for preparation', 'FULFILLING'], ['Mark ready for pickup', 'READY_PICKUP'], ['Confirm customer pickup', 'DELIVERED']]) {
      await page.getByText('DES-HUB001', { exact: true }).click();
      const button = page.getByRole('button', { name: label, exact: true }); await button.waitFor();
      if (label === 'Confirm customer pickup') await page.getByLabel('Customer collection code', { exact: true }).fill('246810');
      await button.click();
      await page.getByText(`Order DES-HUB001 updated: ${expectedStatus}.`, { exact: true }).waitFor();
    }
    assert.deepEqual(actions, ['ACCEPT', 'READY_PICKUP', 'CONFIRM_PICKUP']);
    await page.goto(origin + screen('order-confirmed'), { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'No order to display', exact: true }).waitFor();
    assert.doesNotMatch(await page.locator('body').innerText(), /510|829104|authorized via|Paystack/);
    roles = ['CUSTOMER', 'CREATOR'];
    await page.goto(origin + screen('creators', '&workspace=create'), { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /Technique Masterclass/ }).click();
    await page.getByLabel('Tutorial title', { exact: true }).fill('Entered technique');
    await page.getByLabel('Tutorial step 1 title', { exact: true }).fill('Entered step');
    await page.getByLabel('Tutorial step 1 instructions', { exact: true }).fill('Entered instructions retained through submission.');
    const submitted = page.waitForResponse(response => response.url().includes('/api/partner/workspace') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Submit for review', exact: true }).click();
    await submitted;
    await page.getByRole('heading', { name: 'My Content Library', exact: true }).waitFor();
    assert.equal(submissions.length, 1); assert.equal(submissions[0].status, 'SUBMITTED'); assert.match(submissions[0].body, /Entered instructions retained through submission/);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ storefront: name, personalOrdersSeparated: true, realTrackingAndPickupCode: true, distributorPickupFlow: 'passed', noFabricatedConfirmation: true, creatorStepsRetained: true, runtimeErrors: 0 }));
    await context.close();
  }
} finally { await browser.close(); }
