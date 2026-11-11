import { beforeAll, afterAll, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { applyProgramme, programmeActivity, reviewProgramme, reviewProgrammeSubmission } from '@/modules/partners/programme-service';
import { pendingProgrammeEmail } from '@/modules/notifications/programme-email';
let client:PGlite, db:ReturnType<typeof drizzle<typeof schema>>, owner:string, other:string, admin:string;
const pg=()=>db as never;
beforeAll(async()=>{
 const {pgcrypto}=await import('@electric-sql/pglite/contrib/pgcrypto'); const {uuid_ossp}=await import('@electric-sql/pglite/contrib/uuid_ossp');
 client=new PGlite({extensions:{pgcrypto,uuid_ossp}});db=drizzle(client,{schema});await migrate(db,{migrationsFolder:'./drizzle'});
 const people=await db.insert(schema.users).values(['owner','other','admin'].map(name=>({email:name+'@programme.example.test',passwordHash:'fixture',emailVerifiedAt:new Date()}))).returning();[owner,other,admin]=people.map(p=>p.id);
},120000);
afterAll(async()=>{vi.unstubAllEnvs();await client?.close();});
it('requires programme-specific approval and agreement evidence on the same account',async()=>{
 const row=await applyProgramme(pg(),owner,'inner','Actual ambassador background and experience.');
 expect((await applyProgramme(pg(),owner,'inner','Duplicate request with retained original.')).id).toBe(row.id);
 await expect(programmeActivity(pg(),owner,'inner')).rejects.toMatchObject({status:403});
 await expect(reviewProgramme(pg(),admin,row.id,true,'Reviewed','','agreement')).rejects.toMatchObject({status:400});
 await reviewProgramme(pg(),admin,row.id,true,'Approved after verification','verification-ref','agreement-ref');
 expect((await db.select().from(schema.userRoles).where(eq(schema.userRoles.userId,owner))).map(r=>r.roleId)).toEqual(['PARTNER_AMBASSADOR']);
 await expect(programmeActivity(pg(),owner,'creative')).rejects.toMatchObject({status:403});
 await expect(programmeActivity(pg(),other,'inner')).rejects.toMatchObject({status:403});
 await expect(reviewProgramme(pg(),admin,row.id,true,'Repeated','ref','ref')).rejects.toMatchObject({status:409});
});
it('prevents duplicate activities and routes actual submissions through review',async()=>{
 const input={title:'Real ambassador activity',body:'Details of an actual completed activity.',url:'https://example.test/activity',idempotencyKey:crypto.randomUUID()};
 const [first]=await programmeActivity(pg(),owner,'inner',input),[retry]=await programmeActivity(pg(),owner,'inner',input);expect(retry.id).toBe(first.id);
 await expect(programmeActivity(pg(),owner,'inner',{...input,body:'Different content for the same key.'})).rejects.toMatchObject({status:409});
 await reviewProgrammeSubmission(pg(),admin,first.id,true,'Accepted actual work');expect((await programmeActivity(pg(),owner,'inner'))[0].status).toBe('APPROVED');
 const next=await applyProgramme(pg(),owner,'creative','Actual content-production experience.');await reviewProgramme(pg(),admin,next.id,true,'Background reviewed','creative-verification','creative-agreement');
 expect(await programmeActivity(pg(),owner,'creative')).toEqual([]);
 expect((await db.select().from(schema.userRoles).where(eq(schema.userRoles.userId,owner))).map(r=>r.roleId).sort()).toEqual(['PARTNER_AMBASSADOR','PARTNER_CREATIVE']);
});
it('renders the persisted decision only for its verified recipient and current version',async()=>{
 vi.stubEnv('FRONTEND_URL','https://shop.example.test');
 const [mail]=await db.select().from(schema.notificationOutbox).where(eq(schema.notificationOutbox.template,'partner.programme-reviewed'));
 const rendered=await pendingProgrammeEmail(pg(),mail);expect(rendered?.to).toBe('owner@programme.example.test');expect(rendered?.text).toContain('/partners?programme=inner');
 expect(await pendingProgrammeEmail(pg(),{...mail,userId:other})).toBeNull();
 expect(await pendingProgrammeEmail(pg(),{...mail,payload:{...mail.payload as object,version:999}})).toBeNull();
});
