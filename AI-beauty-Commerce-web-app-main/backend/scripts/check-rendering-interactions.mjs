// Public, anonymous reads only. React's development hook counts card renders;
// this is a diagnostic check, not a production latency benchmark.
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const origin of (process.env.PERF_ORIGINS || 'http://localhost:3000,http://localhost:3005').split(',')) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(120000);
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.log(JSON.stringify({ origin, runtimeError: error.message })); });
    await page.addInitScript(() => {
      window.__cardRenders = 0;
      const renderers = new Map();
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
        supportsFiber: true, renderers,
        inject(renderer) { const id = renderers.size + 1; renderers.set(id, renderer); return id; },
        onCommitFiberUnmount() {},
        onCommitFiberRoot(_renderer, root) {
          const visit = fiber => {
            if (!fiber) return;
            if ((fiber.type?.displayName === 'ProductCard' || fiber.elementType?.displayName === 'ProductCard') && (fiber.flags & 1)) window.__cardRenders++;
            visit(fiber.child); visit(fiber.sibling);
          };
          visit(root.current);
        },
      };
    });
    await page.goto(`${origin}${new URL(origin).port === '3000' ? '/?screen=catalogue' : '/catalogue'}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
    const card = page.locator('article').filter({ has: page.getByRole('button', { name: /wishlist/i }) }).first();
    await card.waitFor({ state: 'visible', timeout: 120000 }).catch(async error => {
      console.log(JSON.stringify({ origin, runtimeErrors: errors, mainText: (await page.locator('main').first().innerText()).slice(0, 1500) }));
      throw error;
    });
    // SSR buttons can be visible before their click handlers are hydrated.
    await page.waitForFunction(() => window.__cardRenders > 0, undefined, { timeout: 120000 });
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    await page.getByRole('heading', { name: 'Filter & Sort Formulations', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    // Warm the lazy filter module before counting the isolated state update.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const initialCardRenders = await page.evaluate(() => window.__cardRenders);
    assert.ok(initialCardRenders > 0, 'The development hook must observe real product cards');
    const started = Date.now();
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    await page.getByRole('heading', { name: 'Filter & Sort Formulations', exact: true }).waitFor();
    const openingMs = Date.now() - started;
    const cardRendersForFilter = await page.evaluate(initial => window.__cardRenders - initial, initialCardRenders);
    assert.equal(cardRendersForFilter, 0, 'Opening filters must not render the product cards again');
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await card.getByRole('heading').click();
    await page.getByRole('dialog').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Close modal', exact: true }).click();
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ origin, initialCardRenders, cardRendersForFilter, warmFilterOpeningMs: openingMs, lazyFilters: 'passed', lazyQuickView: 'passed', runtimeErrors: 0 }));
    await page.close();
  }
} finally { await browser.close(); }
