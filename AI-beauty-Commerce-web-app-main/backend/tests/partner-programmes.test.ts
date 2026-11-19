import { acceptPartnerPolicy, requirePartnerPolicy } from '@/modules/partners/policy';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { partnerProgrammes } from '@/modules/partners/programmes';
import { submitApplication as applyCreator, reviewApplication as reviewCreator } from '@/modules/creators/service';
import { submitApplication as applyDistributor } from '@/modules/distributors/service';
import { writeProgramme } from '@/modules/partners/programme-memberships';
import { pendingAccountEmail, ACCOUNT_EMAIL_TEMPLATES } from '@/modules/notifications/account-email';
import { PARTNER_SUBMITTED_TEMPLATE } from '@/modules/partners/email';

let client: PGlite, db: ReturnType<typeof drizzle<typeof schema>>;
const pg = () => db as never;
beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } });
  db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: './drizzle' });
  await db.insert(schema.roles).values([{ id: 'CREATOR' }, { id: 'DISTRIBUTOR' }]).onConflictDoNothing();
}, 120000);
afterAll(async () => { await client?.close(); });
async function account() {
  const [user] = await db.insert(schema.users).values({ email: `${crypto.randomUUID()}@programme.test`, passwordHash: 'fixture' }).returning();
  return user.id;
}
it('starts empty and does not infer access from a role or another account profile', async () => {
  const user = await account(), other = await account();
  await db.insert(schema.userRoles).values({ userId: user, roleId: 'CREATOR' });
  await db.insert(schema.creators).values({ userId: other, name: 'Other', promoCode: other, verified: true });
  expect((await partnerProgrammes(pg(), user)).slice(0, 2).map(item => item.status)).toEqual(['not_applied', 'not_applied']);
});
it('exposes both workspaces only with each role and verified profile, and reflects revocation', async () => {
  const user = await account();
  await db.insert(schema.userRoles).values([{ userId: user, roleId: 'CREATOR' }, { userId: user, roleId: 'DISTRIBUTOR' }]);
  await db.insert(schema.creators).values({ userId: user, name: 'Creator', promoCode: user, verified: true });
  await db.insert(schema.distributors).values({ userId: user, name: 'Distributor', city: 'Lagos', verified: true });
  expect((await partnerProgrammes(pg(), user)).slice(0, 2).map(item => item.status)).toEqual(['approved', 'approved']);
  await db.update(schema.creators).set({ verified: false }).where(eq(schema.creators.userId, user));
  expect((await partnerProgrammes(pg(), user)).filter(item => item.status === 'approved').map(item => item.kind)).toEqual(['DISTRIBUTOR']);
});
it('does not grant access from a verified profile without its role or from an approved application alone', async () => {
  const user = await account();
  await db.insert(schema.creators).values({ userId: user, name: 'Creator', promoCode: user, verified: true });
  await db.insert(schema.creatorApplications).values({ userId: user, name: 'Creator', status: 'approved' });
  expect((await partnerProgrammes(pg(), user))[0].status).toBe('unavailable');
});
it('returns the latest account-owned application status without granting pending or declined access', async () => {
  const user = await account();
  await db.insert(schema.creatorApplications).values([
    { userId: user, name: 'Old', status: 'rejected', createdAt: new Date('2026-01-01') },
    { userId: user, name: 'New', status: 'pending', createdAt: new Date('2026-02-01') },
  ]);
  await db.insert(schema.distributorApplications).values({ userId: user, name: 'Distributor', city: 'Lagos', status: 'rejected' });
  expect((await partnerProgrammes(pg(), user)).slice(0, 2).map(item => item.status)).toEqual(['pending', 'rejected']);
});

it('queues one acknowledgement per creator application, then sends the committed decision and admin note', async () => {
  const user = await account(), admin = await account();
  await db.update(schema.users).set({ emailVerifiedAt: new Date() }).where(eq(schema.users.id, user));
  const input = { name: 'Partner Test', handle: 'partnertest', platform: 'Instagram' as const, niche: 'skincare' };
  const application = await applyCreator(pg(), user, input);
  expect((await applyCreator(pg(), user, input)).id).toBe(application.id);
  let queued = await db.select().from(schema.notificationOutbox).where(eq(schema.notificationOutbox.userId, user));
  expect(queued).toHaveLength(1);
  expect(ACCOUNT_EMAIL_TEMPLATES).toContain(PARTNER_SUBMITTED_TEMPLATE);
  const acknowledgement = await pendingAccountEmail(pg(), queued[0]);
  expect(acknowledgement?.subject).toContain('Desla');
  expect(acknowledgement?.text).toContain('under review');
  expect(acknowledgement?.text).toContain(application.id);
  expect(await pendingAccountEmail(pg(), { ...queued[0], userId: admin })).toBeNull();
  await reviewCreator(pg(), { applicationId: application.id, adminId: admin, approve: true, discountPercent: 5, commissionRate: 10, note: 'Identity and portfolio reviewed.' });
  queued = await db.select().from(schema.notificationOutbox).where(eq(schema.notificationOutbox.userId, user));
  const decision = queued.find(row => row.template === 'partner.application-reviewed')!;
  const email = await pendingAccountEmail(pg(), decision);
  expect(email?.subject).toContain('approved');
  expect(email?.text).toContain('Identity and portfolio reviewed.');
  expect(email?.text).toContain('Approved creator ID:');
  expect(await pendingAccountEmail(pg(), queued.find(row => row.template === PARTNER_SUBMITTED_TEMPLATE)!)).toBeNull();
});

it('acknowledges distributor and influencer applications without granting approved access', async () => {
  const user = await account();
  await db.update(schema.users).set({ emailVerifiedAt: new Date() }).where(eq(schema.users.id, user));
  await applyDistributor(pg(), user, { name: 'Distributor', businessName: 'Test', city: 'Lagos', state: 'Lagos', address: '1 Test Street', phone: '08012345678', whatsapp: '' });
  await writeProgramme(pg(), user, { action: 'apply', programme: 'INFLUENCER', name: 'Ambassador', profileUrl: 'https://example.com/profile', motivation: 'I create skincare educational content for my audience.' });
  const queued = await db.select().from(schema.notificationOutbox).where(eq(schema.notificationOutbox.userId, user));
  expect(queued).toHaveLength(2);
  for (const row of queued) {
    const email = await pendingAccountEmail(pg(), row);
    expect(email?.text).toContain('under review');
    expect(email?.subject).toContain('Desla');
    expect(email?.text).not.toMatch(/glowly|glowy/i);
  }
  expect((await partnerProgrammes(pg(), user)).filter(item => item.status === 'approved')).toHaveLength(0);
});

it('requires account-owned, role-specific policy acceptance and saves retries once', async () => {
 const user = await account(), other = await account();
 await expect(requirePartnerPolicy(pg(), user, 'CREATOR')).rejects.toMatchObject({ status: 403 });
 await acceptPartnerPolicy(pg(), user, 'CREATOR');
 await acceptPartnerPolicy(pg(), user, 'CREATOR');
 await expect(requirePartnerPolicy(pg(), user, 'CREATOR')).resolves.toBeUndefined();
 await expect(requirePartnerPolicy(pg(), other, 'CREATOR')).rejects.toMatchObject({ status: 403 });
 await expect(requirePartnerPolicy(pg(), user, 'DISTRIBUTOR')).rejects.toMatchObject({ status: 403 });
 const rows = await db.select().from(schema.workspaceRecords).where(eq(schema.workspaceRecords.ownerId, user));
 expect(rows.filter(row => row.kind === 'PARTNER_POLICY_ACCEPTANCE')).toHaveLength(1);
 expect(rows[0].body).toContain('Privacy and confidentiality');
});
