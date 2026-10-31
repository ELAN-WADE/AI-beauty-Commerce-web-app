import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { bootstrapAdmin, configuredAdminBootstrap } from '@/modules/auth/bootstrap';
import { createSession, getSessionUser, hashPassword, login, requestPasswordReset, resetPassword, verifyPassword } from '@/modules/auth/service';

let client: PGlite; let db: ReturnType<typeof drizzle<typeof schema>>;
beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } }); db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: './drizzle' });
  await db.insert(schema.roles).values([{ id: 'CUSTOMER' }, { id: 'SUPER_ADMIN' }]).onConflictDoNothing();
}, 120000);
afterAll(async () => { await client?.close(); });
afterEach(() => vi.unstubAllEnvs());
const pg = () => db as never;
const original = 'Original-admin-pass-1'; const replacement = 'Replacement-admin-pass-2';

describe('operator administrator provisioning and recovery', () => {
  it('provisions a verified allowlisted administrator who can sign in', async () => {
    vi.stubEnv('ADMIN_GOOGLE_EMAIL', 'owner@bootstrap.test');
    expect(await bootstrapAdmin(pg(), { email: ' OWNER@bootstrap.test ', password: original })).toMatchObject({ created: true });
    const session = await login(pg(), { email: 'owner@bootstrap.test', password: original }, {}, 'admin');
    expect((await getSessionUser(pg(), session.token))?.roles).toContain('SUPER_ADMIN');
  });
  it('preserves an existing password unless recovery is explicitly enabled', async () => {
    vi.stubEnv('ADMIN_GOOGLE_EMAIL', 'owner@bootstrap.test');
    const result = await bootstrapAdmin(pg(), { email: 'owner@bootstrap.test', password: replacement });
    expect(result.passwordChanged).toBe(false);
    await expect(login(pg(), { email: 'owner@bootstrap.test', password: original }, {}, 'admin')).resolves.toHaveProperty('token');
  });
  it('applies explicit recovery, clears lockout, revokes old sessions/reset proofs and retains MFA', async () => {
    vi.stubEnv('ADMIN_GOOGLE_EMAIL', 'owner@bootstrap.test');
    vi.stubEnv('FRONTEND_URL', 'https://shop.example.test');
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, 'owner@bootstrap.test'));
    const session = await createSession(pg(), user.id);
    const reset = await requestPasswordReset(pg(), user.email);
    await db.update(schema.users).set({ failedLoginAttempts: 5, lockedUntil: new Date(Date.now() + 900000), mfaSecretEncrypted: 'existing-encrypted-secret', mfaEnabledAt: new Date() }).where(eq(schema.users.id, user.id));
    expect(await bootstrapAdmin(pg(), { email: user.email, password: replacement, syncPassword: true })).toMatchObject({ passwordChanged: true });
    expect(await getSessionUser(pg(), session.token)).toBeNull();
    await expect(resetPassword(pg(), reset.resetToken!, 'Obsolete-reset-pass-3')).rejects.toMatchObject({ status: 410 });
    const [updated] = await db.select().from(schema.users).where(eq(schema.users.id, user.id));
    expect(updated.lockedUntil).toBeNull(); expect(updated.failedLoginAttempts).toBe(0);
    expect(updated.mfaSecretEncrypted).toBe('existing-encrypted-secret'); expect(updated.mfaEnabledAt).toBeTruthy();
    expect(await verifyPassword(original, updated.passwordHash)).toBe(false);
    await expect(login(pg(), { email: user.email, password: replacement }, {}, 'admin')).resolves.toHaveProperty('token');
  });
  it('does not revoke sessions or rehash on repeated startup with the same password', async () => {
    vi.stubEnv('ADMIN_GOOGLE_EMAIL', 'owner@bootstrap.test');
    const [before] = await db.select().from(schema.users).where(eq(schema.users.email, 'owner@bootstrap.test'));
    const session = await createSession(pg(), before.id);
    expect(await bootstrapAdmin(pg(), { email: before.email, password: replacement, syncPassword: true })).toMatchObject({ created: false, passwordChanged: false });
    const [after] = await db.select().from(schema.users).where(eq(schema.users.id, before.id));
    expect(after.passwordHash).toBe(before.passwordHash);
    expect(await getSessionUser(pg(), session.token)).toBeTruthy();
  });
  it('rejects a non-allowlisted account without granting roles', async () => {
    vi.stubEnv('ADMIN_GOOGLE_EMAIL', 'owner@bootstrap.test');
    await expect(bootstrapAdmin(pg(), { email: 'other@bootstrap.test', password: original, syncPassword: true })).rejects.toThrow('allowlist');
    expect(await db.select().from(schema.users).where(eq(schema.users.email, 'other@bootstrap.test'))).toHaveLength(0);
  });
  it('does not promote a pre-existing ordinary account while preserving its unknown password', async () => {
    vi.stubEnv('ADMIN_GOOGLE_EMAIL', 'ordinary@bootstrap.test');
    const [ordinary] = await db.insert(schema.users).values({ email: 'ordinary@bootstrap.test', passwordHash: await hashPassword(original) }).returning();
    await db.insert(schema.userRoles).values({ userId: ordinary.id, roleId: 'CUSTOMER' });
    await expect(bootstrapAdmin(pg(), { email: ordinary.email, password: replacement })).rejects.toThrow('explicit ADMIN_BOOTSTRAP_SYNC_PASSWORD');
    expect((await db.select().from(schema.userRoles).where(eq(schema.userRoles.userId, ordinary.id))).map(row => row.roleId)).toEqual(['CUSTOMER']);
    const [unchanged] = await db.select().from(schema.users).where(eq(schema.users.id, ordinary.id));
    expect(unchanged.emailVerifiedAt).toBeNull();
  });
  it('does not use local credentials in production and rejects partial configuration', () => {
    vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('ADMIN_BOOTSTRAP_EMAIL', ''); vi.stubEnv('ADMIN_BOOTSTRAP_PASSWORD', '');
    vi.stubEnv('LOCAL_ADMIN_EMAIL', 'local@bootstrap.test'); vi.stubEnv('LOCAL_ADMIN_PASSWORD', original);
    expect(configuredAdminBootstrap()).toBeNull();
    vi.stubEnv('ADMIN_BOOTSTRAP_EMAIL', 'owner@bootstrap.test');
    expect(() => configuredAdminBootstrap()).toThrow('both');
  });
});
