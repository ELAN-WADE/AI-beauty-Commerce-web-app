import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { build } from 'esbuild';
import { chromium, expect as ui, type Browser } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync } from 'node:fs';
import postcss from 'postcss';
import tailwind from 'tailwindcss';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '@/db/schema';
import { programmeCommand, adminProgrammeCommand } from '@/modules/partners/programme-validation';
import { programmeWorkspace, writeProgramme, adminProgrammeList, reviewProgramme } from '@/modules/partners/programme-memberships';
import { partnerProgrammes } from '@/modules/partners/programmes';
let server: Server, browser: Browser, origin: string, client: PGlite, db: ReturnType<typeof drizzle<typeof schema>>, owner: string, actor: string;
const pg = () => db as never;
beforeAll(async () => {
  vi.stubEnv('FRONTEND_URL', 'https://desla.example.test');
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto'); const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } }); db = drizzle(client, { schema }); await migrate(db, { migrationsFolder: './drizzle' });
  const people = await db.insert(schema.users).values(['partner','reviewer'].map(name => ({ email: name+'@browser-role.test', passwordHash:'fixture', emailVerifiedAt:new Date() }))).returning(); [owner, actor] = people.map(user => user.id);
  const files = ['components/partner/InfluencerProgramme.tsx','components/admin/ProgrammeApplicationsPanel.tsx','components/partner/shell/PartnerProgrammeSelector.tsx'];
  const raw = files.map(file => readFileSync(new URL('../src/storefront/'+file, import.meta.url), 'utf8')).join('\n');
  const css = (await postcss([tailwind({ content:[{raw,extension:'tsx'}] })]).process('@tailwind base; @tailwind utilities;', {from:undefined})).css;
  const bundle = await build({stdin:{contents:`import React from 'react'; import {createRoot} from 'react-dom/client'; import {InfluencerProgramme} from './src/storefront/components/partner/InfluencerProgramme'; import {ProgrammeApplicationsPanel} from './src/storefront/components/admin/ProgrammeApplicationsPanel'; createRoot(document.getElementById('root')).render(location.pathname==='/reviewer'?<div style={{padding:24}}><ProgrammeApplicationsPanel onReviewed={()=>{}}/></div>:<InfluencerProgramme/>);`,loader:'tsx',resolveDir:fileURLToPath(new URL('../',import.meta.url))},bundle:true,write:false,platform:'browser',format:'iife',logLevel:'silent',plugins:[{name:'test-context',setup(builder){
    builder.onResolve({filter:/context\/AppContext$/},()=>({path:'context',namespace:'fixture'}));
    builder.onResolve({filter:/lib\/owned-api$/},()=>({path:'api',namespace:'fixture'}));
    builder.onLoad({filter:/.*/,namespace:'fixture'},args=>({resolveDir:fileURLToPath(new URL('../',import.meta.url)),contents:args.path==='api'?`export async function apiFetch(path,init){const r=await fetch(path,init);const b=await r.json();if(!r.ok)throw Error(b.error.message);return b;}`:`export const useApp=()=>({authUser:{id:'browser-role-fixture',email:'partner@browser-role.test',profile:{displayName:'Browser Partner'}},authLoading:false,refreshAuth:async()=>{},navigateTo:()=>{},requestCustomerSignIn:()=>{},loginWithGoogle:()=>{}});`}));
  }}]});
  server=createServer(async(req,res)=>{
    if(req.url?.startsWith('/api/')){
      try {
        const admin=req.headers.cookie?.includes('fixture=reviewer'); let body=''; for await(const chunk of req)body+=chunk;
        let result:unknown;
        if(req.url.startsWith('/api/admin/')){if(!admin){res.statusCode=403;throw Error('Staff fixture required');}result=req.method==='POST'?{result:await reviewProgramme(pg(),actor,adminProgrammeCommand.parse(JSON.parse(body)))}:await adminProgrammeList(pg());}
        else if(req.url.startsWith('/api/partner/programmes'))result={programmes:await partnerProgrammes(pg(),owner)};
        else result=req.method==='POST'?{result:await writeProgramme(pg(),owner,programmeCommand.parse(JSON.parse(body)))}:await programmeWorkspace(pg(),owner,'INFLUENCER');
        res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result));
      } catch(error){res.statusCode=(error as {status?:number}).status||res.statusCode>=400&&res.statusCode||500;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:{message:(error as Error).message}}));}
      return;
    }
    if (!['/app.js','/reviewer','/partner-programme','/'].includes(req.url || '')) { res.statusCode=404; res.end(); return; }
    res.setHeader('Content-Type',req.url==='/app.js'?'text/javascript':'text/html');
    if(req.url!=='/app.js')res.setHeader('Set-Cookie',`fixture=${req.url==='/reviewer'?'reviewer':'partner'}; Path=/; SameSite=Lax`);
    res.end(req.url==='/app.js'?bundle.outputFiles[0].text:`<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style><div id="root"></div><script src="/app.js"></script>`);
  });
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));origin=`http://127.0.0.1:${(server.address() as {port:number}).port}`;
  browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||undefined});
},120000);
afterAll(async()=>{await browser?.close();server?.closeAllConnections();await new Promise<void>(resolve=>server?.close(()=>resolve()));await client?.close();vi.unstubAllEnvs();});
it('completes application, admin approval, agreement, assignment and deliverable review in the existing design',async()=>{
  const partner=await browser.newPage({viewport:{width:390,height:844}}), admin=await browser.newPage();const exceptions:string[]=[];partner.on('pageerror',error=>exceptions.push(error.message));admin.on('pageerror',error=>exceptions.push(error.message));
  try{
    await partner.goto(origin+'/partner-programme');
    await partner.getByLabel('Full name',{exact:true}).fill('Browser Partner');
    await partner.getByLabel('Public social profile URL').fill('https://www.instagram.com/brandpartner/');
    await partner.getByLabel('About your audience and proposed partnership').fill('I run a skincare audience and would like to represent Desla through campaigns.');
    await partner.getByRole('button',{name:'Submit application',exact:true}).click();
    await ui(partner.getByRole('heading',{name:'Application: submitted',exact:true})).toBeVisible();
    await admin.goto(origin+'/reviewer');
    const row=admin.getByRole('article',{name:'Browser Partner influencer ambassador application'});
    await row.getByLabel('Programme review note for Browser Partner').fill('Audience and account reviewed.');
    await row.getByLabel('Verification reference').fill('reviewer-check-001');
    await row.getByLabel('Programme agreement',{exact:true}).fill('Represent Desla in agreed campaigns. Submit deliverables for review. Any compensation must follow a written approved campaign schedule.');
    await row.getByRole('button',{name:'Approve Influencer / Ambassador',exact:true}).click();
    await ui(row.getByText('Awaiting applicant acceptance',{exact:false})).toBeVisible();
    await partner.getByRole('button',{name:'Refresh workspace',exact:true}).click();
    await partner.getByRole('checkbox').check();
    await partner.getByRole('button',{name:'Accept agreement and open workspace'}).click();
    await ui(partner.getByRole('heading',{name:'Campaigns & brand activities'})).toBeVisible();
    await admin.getByRole('button',{name:'Refresh programme applications',exact:true}).click();
    await row.getByLabel('Activity title',{exact:true}).fill('Seasonal brand story');
    await row.getByLabel('Activity brief',{exact:true}).fill('Publish an approved skincare brand story and include the required disclosure.');
    await row.getByRole('button',{name:'Assign activity',exact:true}).click();
    await ui(row.getByRole('heading',{name:'Seasonal brand story',exact:true})).toBeVisible();
    await partner.getByRole('button',{name:'Refresh workspace',exact:true}).click();
    await partner.getByLabel('Published deliverable URL').fill('https://www.instagram.com/p/brandstory/');
    await partner.getByLabel('Delivery note',{exact:true}).fill('Published with the agreed disclosure.');
    await partner.getByRole('button',{name:'Submit for review',exact:true}).click();
    await ui(partner.getByText('Review status: submitted',{exact:true})).toBeVisible();
    await admin.getByRole('button',{name:'Refresh programme applications',exact:true}).click();
    await row.getByLabel('Deliverable review note',{exact:true}).fill('Approved content and disclosure.');
    await row.getByRole('button',{name:'Approve deliverable',exact:true}).click();
    await ui(row.getByText('completed',{exact:true})).toBeVisible();
    await partner.getByRole('button',{name:'Refresh workspace',exact:true}).click();
    await ui(partner.getByText('Review status: approved',{exact:true})).toBeVisible();
    expect(await partner.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(exceptions).toEqual([]);
    mkdirSync('.local/ui-checks',{recursive:true});await partner.screenshot({path:'.local/ui-checks/combined-partner-role.png',fullPage:true});
  }catch(error){throw new Error((error as Error).message+'\nAdmin UI: '+(await admin.locator('body').innerText()).slice(-2500)+'\nPartner UI: '+(await partner.locator('body').innerText()).slice(-1500));}finally{await partner.close();await admin.close();}
},90000);
