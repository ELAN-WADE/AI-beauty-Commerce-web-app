import { afterAll, beforeAll, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { partnerProgrammes } from '@/modules/partners/programmes';

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
