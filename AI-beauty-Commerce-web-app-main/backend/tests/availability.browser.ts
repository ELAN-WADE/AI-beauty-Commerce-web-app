import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { build } from 'esbuild';
import { chromium, expect as browserExpect, type Browser } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { fileURLToPath } from 'node:url';

let server: Server, browser: Browser, origin: string;
beforeAll(async () => {
  const bundle = await build({
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
      import {FlexCarousel} from './src/storefront/components/ui/FlexCarousel';
      function App(){const [shop,setShop]=React.useState(false);return <><h1>Storefront available</h1><button onClick={()=>setShop(true)}>Shop now</button>{shop?<p>Catalogue available</p>:<div style={{height:300}}><FlexCarousel items={[1,2,3].map(n=>({src:'/image-'+n+'.svg',alt:'Hero '+n}))}/></div>}</>}
      createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);`, loader: 'tsx', resolveDir: fileURLToPath(new URL('../', import.meta.url)) },
    bundle: true, write: false, outdir: 'fixture-output', platform: 'browser', format: 'iife', logLevel: 'silent', define: { 'process.env.NODE_ENV': '"production"' },
  });
  const script = bundle.outputFiles.find(file => file.path.endsWith('.js'))!.text;
  const css = bundle.outputFiles.find(file => file.path.endsWith('.css'))!.text;
  server = createServer((req, res) => {
    if (req.url === '/app.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(script); }
    else if (req.url?.endsWith('.svg')) { res.setHeader('Content-Type', 'image/svg+xml'); res.end('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="140"><rect width="100" height="140" fill="gold"/></svg>'); }
    else { res.setHeader('Content-Type', 'text/html'); res.end(`<!doctype html><meta name="viewport" content="width=device-width"><style>${css}</style><div id="root"></div><script src="/app.js"></script>`); }
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
}, 60000);
afterAll(async () => { await browser?.close(); await new Promise<void>(resolve => server?.close(() => resolve())); });

describe('hero graphics failure cannot crash shopping', () => {
  for (const failure of ['no-webgl', 'webgl1-only', 'context-throws', 'context-lost']) {
    it(`keeps the storefront usable with ${failure}`, async () => {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
      if (failure !== 'context-lost') await page.addInitScript(mode => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
          if (/webgl/.test(type)) {
            if (mode === 'context-throws') throw new Error('GPU denied');
            if (mode === 'no-webgl' || type === 'webgl2') return null;
          }
          return (original as Function).call(this, type, ...args);
        } as typeof original;
      }, failure);
      try {
        await page.goto(origin);
        if (failure === 'context-lost') {
          await browserExpect(page.locator('.flex-carousel canvas')).toBeVisible();
          await page.locator('.flex-carousel canvas').evaluate(canvas => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
        }
        await browserExpect(page.locator('.flex-carousel__fallback img')).toHaveCount(3);
        await browserExpect(page.getByRole('heading', { name: 'Storefront available' })).toBeVisible();
        await page.getByRole('button', { name: 'Shop now' }).click();
        await browserExpect(page.getByText('Catalogue available')).toBeVisible();
        expect(errors).toEqual([]);
      } finally { await page.close(); }
    });
  }
});
