// Read-only, anonymous browser measurements. Run against `next start` for
// production numbers; development includes compilation and diagnostic overhead.
// Example: node scripts/check-rendering-performance.mjs --output .local/performance/before.json
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const output = process.argv[process.argv.indexOf('--output') + 1];
if (!process.argv.includes('--output') || !output) throw new Error('--output path is required');
const origins = (process.env.PERF_ORIGINS || 'http://localhost:3000,http://localhost:3005').split(',');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  for (const origin of origins) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__renderMetrics = { lcp: 0, cls: 0, longTasks: 0, longTaskMs: 0 };
      for (const type of ['largest-contentful-paint', 'layout-shift', 'longtask']) {
        try {
          new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
              if (type === 'largest-contentful-paint') window.__renderMetrics.lcp = entry.startTime;
              if (type === 'layout-shift' && !entry.hadRecentInput) window.__renderMetrics.cls += entry.value;
              if (type === 'longtask') { window.__renderMetrics.longTasks++; window.__renderMetrics.longTaskMs += entry.duration; }
            }
          }).observe({ type, buffered: true });
        } catch { /* unsupported browser entry type */ }
      }
    });
    for (const visit of ['first', 'repeat']) {
      const errors = [];
      const apiFailures = [];
      const onError = error => errors.push(error.message);
      const onResponse = response => {
        const pathname = new URL(response.url()).pathname;
        if (pathname.startsWith('/api/') && response.status() >= 500) apiFailures.push({ path: pathname, status: response.status() });
      };
      page.on('pageerror', onError);
      page.on('response', onResponse);
      const response = await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 180000 });
      await page.locator('main').first().waitFor({ state: 'visible', timeout: 180000 });
      await page.waitForTimeout(5000);
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const resources = performance.getEntriesByType('resource');
        const scripts = resources.filter(entry => entry.initiatorType === 'script');
        return {
          ttfbMs: navigation.responseStart - navigation.requestStart,
          domContentLoadedMs: navigation.domContentLoadedEventEnd,
          ...window.__renderMetrics,
          scriptRequests: scripts.length,
          scriptTransferredBytes: scripts.reduce((sum, entry) => sum + entry.transferSize, 0),
          scriptDecodedBytes: scripts.reduce((sum, entry) => sum + entry.decodedBodySize, 0),
          apiRequests: resources.filter(entry => new URL(entry.name).pathname.startsWith('/api/')).map(entry => new URL(entry.name).pathname),
          visibleBrandLoader: !!document.querySelector('[aria-label="Loading Desla"]'),
          mainTextCharacters: document.querySelector('main')?.textContent?.length || 0,
        };
      });
      const result = { origin, visit, status: response?.status(), observationWindowMs: 5000, ...metrics, apiFailures, runtimeErrors: errors };
      results.push(result);
      console.log(JSON.stringify(result));
      page.off('pageerror', onError);
      page.off('response', onResponse);
    }
    await context.close();
  }
} finally { await browser.close(); }
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, JSON.stringify({ measuredAt: new Date().toISOString(), results }, null, 2));
