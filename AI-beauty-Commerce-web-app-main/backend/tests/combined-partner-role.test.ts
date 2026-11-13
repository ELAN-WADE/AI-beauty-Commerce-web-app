import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { and, eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { programmeCommand } from '@/modules/partners/programme-validation';
import { programmeMembership, programmeWorkspace, programmePendingCount, requireProgrammeAccess, reviewProgramme, writeProgramme } from '@/modules/partners/programme-memberships';
import { partnerProgrammes } from '@/modules/partners/programmes';
import { ownedPartner } from '@/modules/partners/service';
import { pendingProgrammeEmail } from '@/modules/partners/programme-email';
let client: PGlite, db: ReturnType<typeof drizzle<typeof schema>>, actor: string;
const pg = () => db as never;
beforeAll(async () => {
  vi.stubEnv('FRONTEND_URL', 'https://desla.example.test');
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } }); db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: './drizzle' });
  actor = await account();
}, 120000);
afterAll(async () => { vi.unstubAllEnvs(); await client?.close(); });
async function account(verified = true) { const [user] = await db.insert(schema.users).values({ email: `${crypto.randomUUID()}@partner.test`, passwordHash: 'fixture', emailVerifiedAt: verified ? new Date() : null }).returning(); return user.id; }
async function apply(userId: string) { return writeProgramme(pg(), userId, { action: 'apply', programme: 'INFLUENCER', name: 'Partner', profileUrl: 'https://www.instagram.com/partner/', motivation: 'I would like to promote the brand through audience-led campaigns.' }); }
async function approve(userId: string) {
  const member = await programmeMembership(pg(), userId, 'INFLUENCER');
  return reviewProgramme(pg(), actor, { action: 'review', id: member!.id, version: member!.version, decision: 'APPROVED', note: 'Eligibility reviewed.', agreement: 'Represent Desla according to the campaign briefs. Compensation requires a separate agreed campaign schedule.', verificationReference: 'review-verified-001' });
}
async function activate(userId: string) { await apply(userId); await approve(userId); const member = await programmeMembership(pg(), userId, 'INFLUENCER'); await writeProgramme(pg(), userId, { action: 'accept', programme: 'INFLUENCER', version: member!.version }); return (await programmeMembership(pg(), userId, 'INFLUENCER'))!; }
it('uses exactly three partner choices and never introduces a separate Ambassador role', async () => {
  const user = await account();
  expect((await partnerProgrammes(pg(), user)).map(item => item.kind)).toEqual(['CREATOR', 'DISTRIBUTOR', 'INFLUENCER']);
  expect(programmeCommand.safeParse({ action: 'apply', programme: 'AMBASSADOR', name: 'Partner', profileUrl: 'https://example.test/profile', motivation: 'I would like to represent the brand.' }).success).toBe(false);
});
it('requires verified email and prevents duplicate active applications or signup role grants', async () => {
  await expect(apply(await account(false))).rejects.toMatchObject({ status: 403 });
  const user = await account(); await apply(user);
  await expect(apply(user)).rejects.toMatchObject({ status: 409 });
  expect(await db.select().from(schema.userRoles).where(eq(schema.userRoles.userId, user))).toHaveLength(0);
  expect((await partnerProgrammes(pg(), user)).find(item => item.kind === 'INFLUENCER')?.status).toBe('pending');
});
it('requires approval evidence and agreement acceptance before the single combined role activates', async () => {
  const user = await account(); await apply(user); const pending = (await programmeMembership(pg(), user, 'INFLUENCER'))!;
  await expect(reviewProgramme(pg(), actor, { action: 'review', id: pending.id, version: pending.version, decision: 'APPROVED', note: 'Approved.', agreement: '', verificationReference: '' })).rejects.toMatchObject({ status: 400 });
  await approve(user);
  await expect(requireProgrammeAccess(pg(), user, 'INFLUENCER')).rejects.toMatchObject({ status: 403 });
  expect((await partnerProgrammes(pg(), user)).find(item => item.kind === 'INFLUENCER')?.status).toBe('agreement_required');
  await expect(writeProgramme(pg(), user, { action: 'accept', programme: 'INFLUENCER', version: pending.version })).rejects.toMatchObject({ status: 409 });
  const approved = (await programmeMembership(pg(), user, 'INFLUENCER'))!;
  await writeProgramme(pg(), user, { action: 'accept', programme: 'INFLUENCER', version: approved.version });
  expect((await db.select().from(schema.userRoles).where(eq(schema.userRoles.userId, user))).map(item => item.roleId)).toEqual(['INFLUENCER']);
  await expect(requireProgrammeAccess(pg(), user, 'INFLUENCER')).resolves.toMatchObject({ status: 'APPROVED' });
  await expect(ownedPartner(pg(), user, 'CREATOR')).rejects.toMatchObject({ status: 403 });
  await expect(ownedPartner(pg(), user, 'DISTRIBUTOR')).rejects.toMatchObject({ status: 403 });
});
it('assigns once on retry, isolates owners, supports revision and reviews a real deliverable', async () => {
  const user = await account(), other = await account(); const member = await activate(user); await activate(other);
  const assignment = { action: 'assign' as const, requestId: crypto.randomUUID(), id: member.id, title: 'Launch campaign', brief: 'Publish the assigned brand story and submit the official post URL.' };
  const task = await reviewProgramme(pg(), actor, assignment) as typeof schema.workspaceRecords.$inferSelect;
  const retry = await reviewProgramme(pg(), actor, assignment) as typeof schema.workspaceRecords.$inferSelect;
  expect(retry.id).toBe(task.id);
  await expect(writeProgramme(pg(), other, { action: 'submit', programme: 'INFLUENCER', taskId: task.id, version: task.version, url: 'https://www.instagram.com/p/example/', note: 'Published campaign.' })).rejects.toMatchObject({ status: 404 });
  expect((await programmeWorkspace(pg(), other, 'INFLUENCER')).tasks).toHaveLength(0);
  const delivery = await writeProgramme(pg(), user, { action: 'submit', programme: 'INFLUENCER', taskId: task.id, version: task.version, url: 'https://www.instagram.com/p/example/', note: 'Published campaign.' }) as typeof schema.workspaceRecords.$inferSelect;
  await reviewProgramme(pg(), actor, { action: 'review-submission', id: delivery.id, version: delivery.version, approved: false, note: 'Please include the agreed disclosure.' });
  const revisedTask = (await programmeWorkspace(pg(), user, 'INFLUENCER')).tasks[0];
  const revision = await writeProgramme(pg(), user, { action: 'submit', programme: 'INFLUENCER', taskId: task.id, version: revisedTask.version, url: 'https://www.instagram.com/p/revised/', note: 'Disclosure added.' }) as typeof schema.workspaceRecords.$inferSelect;
  expect(revision.id).toBe(delivery.id);
  await reviewProgramme(pg(), actor, { action: 'review-submission', id: revision.id, version: revision.version, approved: true, note: 'Deliverable accepted.' });
  const workspace = await programmeWorkspace(pg(), user, 'INFLUENCER');
  expect(workspace.tasks[0].status).toBe('COMPLETED'); expect(workspace.submissions).toHaveLength(1); expect(workspace.submissions[0].status).toBe('APPROVED');
});
it('revokes role and operational access immediately and suppresses obsolete approval emails', async () => {
  const user = await account(); const member = await activate(user);
  const [mail] = await db.select().from(schema.notificationOutbox).where(and(eq(schema.notificationOutbox.userId, user), eq(schema.notificationOutbox.template, 'partner.programme-reviewed')));
  const approvedMail = await pendingProgrammeEmail(pg(), mail);
  expect(approvedMail?.text).toContain('/partner-programme');
  await reviewProgramme(pg(), actor, { action: 'review', id: member.id, version: member.version, decision: 'REVOKED', note: 'Programme ended.', agreement: '', verificationReference: '' });
  await expect(requireProgrammeAccess(pg(), user, 'INFLUENCER')).rejects.toMatchObject({ status: 403 });
  expect(await db.select().from(schema.userRoles).where(eq(schema.userRoles.userId, user))).toHaveLength(0);
  expect((await programmeWorkspace(pg(), user, 'INFLUENCER')).canOperate).toBe(false);
  expect(await pendingProgrammeEmail(pg(), mail)).toBeNull();
});

it('does not trust a manually assigned role without verified accepted membership', async () => {
  const user = await account();
  await db.insert(schema.roles).values({ id: 'INFLUENCER' }).onConflictDoNothing();
  await db.insert(schema.userRoles).values({ userId: user, roleId: 'INFLUENCER' });
  await expect(requireProgrammeAccess(pg(), user, 'INFLUENCER')).rejects.toMatchObject({ status: 403 });
  const member = await activate(user);
  await db.update(schema.workspaceRecords).set({ data: { details: { ...member.data.details, verified: false } } }).where(eq(schema.workspaceRecords.id, member.id));
  await expect(requireProgrammeAccess(pg(), user, 'INFLUENCER')).rejects.toMatchObject({ status: 403 });
});
it('counts pending requests and lets a declined applicant resubmit without acquiring another role', async () => {
  const before = await programmePendingCount(pg()); const user = await account(); await apply(user);
  expect(await programmePendingCount(pg())).toBe(before + 1);
  const member = (await programmeMembership(pg(), user, 'INFLUENCER'))!;
  await reviewProgramme(pg(), actor, { action: 'review', id: member.id, version: member.version, decision: 'REJECTED', note: 'Please provide additional audience detail.', agreement: '', verificationReference: '' });
  expect(await programmePendingCount(pg())).toBe(before);
  await apply(user);
  const resubmitted = (await programmeMembership(pg(), user, 'INFLUENCER'))!;
  expect(resubmitted.id).toBe(member.id); expect(resubmitted.status).toBe('SUBMITTED');
  expect(await db.select().from(schema.userRoles).where(eq(schema.userRoles.userId, user))).toHaveLength(0);
});
