import { afterAll, beforeAll, expect, it } from 'vitest';
import { build } from 'esbuild';
import { chromium, expect as ui, type Browser } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import tailwind from 'tailwindcss';

let server: Server, browser: Browser, origin: string;
const creator = { kind: 'CREATOR', label: 'Creator Studio', status: 'approved' };
const distributor = { kind: 'DISTRIBUTOR', label: 'Distributor Hub', status: 'approved' };
beforeAll(async () => {
  const component = readFileSync(new URL('../src/storefront/components/partner/shell/PartnerProgrammeSelector.tsx', import.meta.url), 'utf8');
  const css = (await postcss([tailwind({ content: [{ raw: component, extension: 'tsx' }] })]).process('@tailwind base; @tailwind utilities;', { from: undefined })).css;
  const bundle = await build({
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
      import {FixtureProvider} from './src/storefront/context/AppContext';
      import {PartnerProgrammeSelector} from './src/storefront/components/partner/shell/PartnerProgrammeSelector';
      createRoot(document.getElementById('root')).render(<FixtureProvider><PartnerProgrammeSelector kind={location.search.includes('distributor')?'DISTRIBUTOR':'CREATOR'}/></FixtureProvider>);`,
      loader: 'tsx', resolveDir: fileURLToPath(new URL('../', import.meta.url)) },
    bundle: true, write: false, platform: 'browser', format: 'iife', logLevel: 'silent',
    plugins: [{ name: 'fixture-context', setup(builder) {
      builder.onResolve({ filter: /context\/AppContext$/ }, () => ({ path: 'context', namespace: 'fixture' }));
      builder.onResolve({ filter: /lib\/owned-api$/ }, () => ({ path: 'api', namespace: 'fixture' }));
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: args.path === 'api'
        ? `export async function apiFetch(path,init){const response=await fetch(path,init); if(!response.ok) throw Error('unavailable');return response.json();}`
        : `import React from 'react'; const Context=React.createContext(null);export const useApp=()=>React.useContext(Context);
          export function FixtureProvider({children}){const [owner,setOwner]=React.useState('owner'); window.setOwner=setOwner;
          return React.createElement(Context.Provider,{value:{authUser:owner?{id:owner}:null,refreshAuth:async()=>{window.refreshes=(window.refreshes||0)+1;if(window.failRefresh)throw Error('offline');},navigateTo:screen=>{window.screenOpened=screen;}}},children);}`,
        resolveDir: fileURLToPath(new URL('../', import.meta.url)), loader: 'jsx' }));
    } }],
  });
  server = createServer((req, res) => {
    res.setHeader('Content-Type', req.url === '/app.js' ? 'text/javascript' : 'text/html');
    res.end(req.url === '/app.js' ? bundle.outputFiles[0].text : `<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style><div id="root" style="padding:16px"></div><script src="/app.js"></script>`);
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${(server.address() as {port:number}).port}`;
  browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
}, 60000);
afterAll(async () => { await browser?.close(); await new Promise<void>(resolve => server?.close(() => resolve())); });

it('switches approved workspaces with an auth refresh on mobile and keeps the control within the viewport', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await page.route('**/api/partner/programmes', route => route.fulfill({ json: { programmes: [creator, distributor] } }));
    await page.goto(origin);
    const select = page.getByRole('combobox', { name: 'Current partner programme' });
    await ui(select).toHaveValue('CREATOR');
    await select.selectOption('DISTRIBUTOR');
    await ui.poll(() => page.evaluate(() => (window as any).screenOpened)).toBe('distributor-portal');
    expect(await page.evaluate(() => (window as any).refreshes)).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await page.close(); }
});
it('keeps pending programmes out of approved choices and routes to the existing application page', async () => {
  const page = await browser.newPage();
  try {
    await page.route('**/api/partner/programmes', route => route.fulfill({ json: { programmes: [creator, { ...distributor, status: 'pending' }] } }));
    await page.goto(origin);
    await ui(page.getByRole('combobox')).toHaveValue('CREATOR');
    expect(await page.locator('option').allTextContents()).toEqual(['Creator Studio']);
    await page.getByRole('button', { name: 'Distributor Hub application pending' }).click();
    await ui.poll(() => page.evaluate(() => (window as any).screenOpened)).toBe('distributor-portal');
  } finally { await page.close(); }
});
it('can return to an approved workspace from an unapproved programme and retries failed discovery', async () => {
  const page = await browser.newPage(); let calls = 0;
  try {
    await page.route('**/api/partner/programmes', route => ++calls === 1 ? route.fulfill({ status: 503, body: '{}' }) : route.fulfill({ json: { programmes: [creator, { ...distributor, status: 'not_applied' }] } }));
    await page.goto(origin + '?distributor');
    await page.getByRole('button', { name: 'Retry' }).click();
    const select = page.getByRole('combobox');
    await ui(select).toBeEnabled();
    await select.selectOption('CREATOR');
    await ui.poll(() => page.evaluate(() => (window as any).screenOpened)).toBe('creators');
  } finally { await page.close(); }
});
it('discards a delayed previous-account response', async () => {
  const page = await browser.newPage(); let calls = 0; let release: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  try {
    await page.route('**/api/partner/programmes', async route => {
      const first = ++calls === 1;
      if (first) await held;
      await route.fulfill({ json: { programmes: first ? [creator, distributor] : [creator] } }).catch(() => {});
    });
    await page.goto(origin);
    await ui.poll(() => calls).toBe(1);
    await page.evaluate(() => (window as any).setOwner('another-account'));
    await ui(page.getByRole('combobox')).toHaveValue('CREATOR');
    release!();
    await page.waitForTimeout(100);
    expect(await page.locator('option').allTextContents()).toEqual(['Creator Studio']);
  } finally { release!(); await page.close(); }
});
