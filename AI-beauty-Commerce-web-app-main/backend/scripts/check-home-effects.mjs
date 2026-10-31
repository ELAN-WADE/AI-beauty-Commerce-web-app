import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && /useEffect must not|returned null|destroy is not a function/i.test(message.text())) errors.push(message.text()); });
  for (const screen of ['home', 'desktop-home']) {
    const response = await page.goto(`http://localhost:3000/?screen=${screen}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    assert.equal(response?.status(), 200);
    await page.locator('main').first().waitFor({ state: 'visible', timeout: 120000 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    console.log(JSON.stringify({ screen, rendered: true }));
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ effectCleanupErrors: 0, runtimeErrors: 0 }));
} finally { await browser.close(); }
