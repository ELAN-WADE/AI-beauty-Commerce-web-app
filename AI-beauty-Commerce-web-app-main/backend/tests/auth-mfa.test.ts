import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq, sql } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { mfaRecoveryCodes, userSessions, users, userRoles, roles } from '@/modules/auth/schema';
import { createSession, getSessionUser, hashPassword, sha256Hex } from '@/modules/auth/service';
import { beginMfaEnrollment, confirmMfaEnrollment, currentTotpCode, disableMfa, verifyMfaForSession, verifyTotp } from '@/modules/auth/mfa';
import { requirePerm } from '@/lib/admin';
import { openMfaSecret } from '@/lib/outbox-crypto';

const caller = vi.hoisted(() => ({ token: '' }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => ({ value: caller.token }) }) }));

let client: PGlite;
let db: PgliteDatabase<typeof schema>;
let passwordHash: string;
const password = 'Staff-password-for-tests';
const pg = () => db as never;

beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } });
  db = drizzle(client, { schema });
  await migrate(db as never, { migrationsFolder: './drizzle' });
  passwordHash = await hashPassword(password);
  await db.insert(roles).values([{ id: 'CUSTOMER' }, { id: 'SUPER_ADMIN' }]).onConflictDoNothing();
}, 120000);
afterAll(async () => { await client?.close(); });

async function session(userId: string) {
  const { token } = await createSession(pg(), userId);
  const [row] = await db.select().from(userSessions).where(eq(userSessions.tokenHash, sha256Hex(token)));
  return { ...row, token };
}

async function account(role = 'SUPER_ADMIN') {
  const [user] = await db.insert(users).values({ email: `${crypto.randomUUID()}@example.com`, passwordHash, emailVerifiedAt: new Date() }).returning();
  await db.insert(userRoles).values({ userId: user.id, roleId: role });
  const first = await session(user.id);
  return { user, first };
}

async function enroll(role?: string) {
  const { user, first } = await account(role);
  const enrollment = await beginMfaEnrollment(pg(), user.id, user.email, password);
  const code = currentTotpCode(enrollment.secret);
  const recovery = await confirmMfaEnrollment(pg(), user.id, first.id, code);
  return { user, first, enrollment, code, recovery };
}

describe('MFA authorization and recovery', () => {
  it('keeps one pending setup key across repeated requests and tabs', async () => {
    const { user, first } = await account();
    const firstSetup = await beginMfaEnrollment(pg(), user.id, user.email, password);
    const repeated = await Promise.all([
      beginMfaEnrollment(pg(), user.id, user.email, password),
      beginMfaEnrollment(pg(), user.id, user.email, password),
    ]);
    expect(repeated.map(result => result.secret)).toEqual([firstSetup.secret, firstSetup.secret]);
    await expect(confirmMfaEnrollment(pg(), user.id, first.id, currentTotpCode(firstSetup.secret))).resolves.toHaveProperty('recoveryCodes');
  });
  it('rotates only an unconfirmed key after explicit password-confirmed replacement', async () => {
    const { user, first } = await account();
    const old = await beginMfaEnrollment(pg(), user.id, user.email, password);
    await expect(beginMfaEnrollment(pg(), user.id, user.email, 'incorrect-password', undefined, { restart: true })).rejects.toMatchObject({ code: 'password_confirmation_failed' });
    const replacement = await beginMfaEnrollment(pg(), user.id, user.email, password, undefined, { restart: true });
    expect(replacement.secret).not.toBe(old.secret);
    const [stored] = await db.select().from(users).where(eq(users.id, user.id));
    expect(openMfaSecret(stored.mfaSecretEncrypted!)).toBe(replacement.secret);
    await confirmMfaEnrollment(pg(), user.id, first.id, currentTotpCode(replacement.secret));
    await expect(beginMfaEnrollment(pg(), user.id, user.email, password, undefined, { restart: true })).rejects.toMatchObject({ status: 409 });
  });
  it('matches independent RFC 6238 SHA-1 vectors', () => {
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
    expect(verifyTotp(secret, '287082', 59_000)).toBe(true);
    expect(verifyTotp(secret, '081804', 1111111109000)).toBe(true);
    expect(verifyTotp(secret, '287083', 59_000)).toBe(false);
    expect(verifyTotp(secret, '12x082', 59_000)).toBe(false);
    expect(verifyTotp(secret, '287082', 89_000)).toBe(true);
    expect(verifyTotp(secret, '287082', 119_000)).toBe(false);
  });

  it('requires password confirmation and rejects mass-assigned setup data', async () => {
    const { user } = await account();
    await expect(beginMfaEnrollment(pg(), user.id, user.email, 'wrong')).rejects.toMatchObject({ status: 422, code: 'password_confirmation_failed' });
    const [unchanged] = await db.select().from(users).where(eq(users.id, user.id));
    expect(unchanged.mfaSecretEncrypted).toBeNull();
    const { mfaSetupSchema } = await import('@/modules/auth/validation');
    expect(mfaSetupSchema.safeParse({ password, mfaEnabled: true }).success).toBe(false);
  });

  it('rejects a consumed TOTP across sessions and factor-disable, but accepts one-time recovery', async () => {
    const { user, first, code, recovery, enrollment } = await enroll();
    const second = await session(user.id);
    await expect(verifyMfaForSession(pg(), user.id, second.id, code)).rejects.toMatchObject({ status: 422, code: 'mfa_invalid' });
    await expect(disableMfa(pg(), user.id, code)).rejects.toMatchObject({ status: 422, code: 'mfa_invalid' });
    await verifyMfaForSession(pg(), user.id, second.id, recovery.recoveryCodes[0]);
    await expect(verifyMfaForSession(pg(), user.id, second.id, recovery.recoveryCodes[0])).rejects.toMatchObject({ status: 422, code: 'mfa_invalid' });
    const [stored] = await db.select().from(users).where(eq(users.id, user.id));
    expect(stored.mfaSecretEncrypted).not.toContain(enrollment.secret);
    const codes = await db.select().from(mfaRecoveryCodes).where(eq(mfaRecoveryCodes.userId, user.id));
    expect(codes).toHaveLength(9);
    expect(JSON.stringify(codes)).not.toContain(recovery.recoveryCodes[1]);
    await disableMfa(pg(), user.id, recovery.recoveryCodes[1]);
    const [reset] = await db.select().from(users).where(eq(users.id, user.id));
    expect(reset.mfaEnabledAt).toBeNull();
    expect(reset.mfaSecretEncrypted).toBeNull();
    caller.token = first.token;
    await expect(requirePerm(pg(), 'roles:grant')).rejects.toMatchObject({ code: 'mfa_required' });
  });

  it('rejects expired, revoked, or another user’s sessions without burning recovery codes', async () => {
    const { user, recovery } = await enroll();
    const expired = await session(user.id);
    const revoked = await session(user.id);
    const { first: other } = await account();
    await db.update(userSessions).set({ expiresAt: new Date(0) }).where(eq(userSessions.id, expired.id));
    await db.update(userSessions).set({ revokedAt: new Date() }).where(eq(userSessions.id, revoked.id));
    for (const id of [expired.id, revoked.id, other.id]) {
      await expect(verifyMfaForSession(pg(), user.id, id, recovery.recoveryCodes[0])).rejects.toMatchObject({ status: 401 });
    }
    const valid = await session(user.id);
    await verifyMfaForSession(pg(), user.id, valid.id, recovery.recoveryCodes[0]);
  });
  it('retains password authentication after a rejected factor and opens admin permissions after a valid proof', async () => {
    const { user, recovery, enrollment } = await enroll();
    const second = await session(user.id);
    let invalid = '000000';
    while (verifyTotp(enrollment.secret, invalid)) invalid = String(Number(invalid) + 1).padStart(6, '0');
    await expect(verifyMfaForSession(pg(), user.id, second.id, invalid)).rejects.toMatchObject({ status: 422, code: 'mfa_invalid' });
    expect((await getSessionUser(pg(), second.token))?.user.id).toBe(user.id);
    caller.token = second.token;
    await expect(requirePerm(pg(), 'roles:grant')).rejects.toMatchObject({ code: 'mfa_required' });
    await verifyMfaForSession(pg(), user.id, second.id, recovery.recoveryCodes[0]);
    await expect(requirePerm(pg(), 'roles:grant')).resolves.toMatchObject({ userId: user.id });
  });

  it('does not allow enrollment confirmation into an expired session', async () => {
    const { user, first } = await account();
    const enrollment = await beginMfaEnrollment(pg(), user.id, user.email, password);
    await db.update(userSessions).set({ expiresAt: new Date(0) }).where(eq(userSessions.id, first.id));
    await expect(confirmMfaEnrollment(pg(), user.id, first.id, currentTotpCode(enrollment.secret))).rejects.toMatchObject({ status: 401 });
    const [unchanged] = await db.select().from(users).where(eq(users.id, user.id));
    expect(unchanged.mfaEnabledAt).toBeNull();
    expect(await db.select().from(mfaRecoveryCodes).where(eq(mfaRecoveryCodes.userId, user.id))).toHaveLength(0);
  });

  it('enforces real permission checks and MFA freshness including SUPER_ADMIN', async () => {
    const { user, first, recovery } = await enroll();
    caller.token = first.token;
    await expect(requirePerm(pg(), 'roles:grant')).resolves.toMatchObject({ userId: user.id });
    const second = await session(user.id);
    caller.token = second.token;
    await expect(requirePerm(pg(), 'roles:grant')).rejects.toMatchObject({ code: 'mfa_required' });
    await verifyMfaForSession(pg(), user.id, second.id, recovery.recoveryCodes[0]);
    await expect(requirePerm(pg(), 'roles:grant')).resolves.toMatchObject({ userId: user.id });
    for (const timestamp of [new Date(Date.now() - 13 * 3600_000), new Date(Date.now() + 3600_000)]) {
      await db.update(userSessions).set({ mfaVerifiedAt: timestamp }).where(eq(userSessions.id, second.id));
      await expect(requirePerm(pg(), 'roles:grant')).rejects.toMatchObject({ code: 'mfa_required' });
    }
    const customer = await enroll('CUSTOMER');
    caller.token = customer.first.token;
    await expect(requirePerm(pg(), 'roles:grant')).rejects.toMatchObject({ code: 'forbidden' });
    caller.token = '';
    await expect(requirePerm(pg(), 'roles:grant')).rejects.toMatchObject({ status: 401 });
  });

  it('rolls back enrollment and recovery codes if its audit insert fails', async () => {
    const { user, first } = await account();
    const enrollment = await beginMfaEnrollment(pg(), user.id, user.email, password);
    await db.execute(sql`CREATE FUNCTION reject_mfa_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
      IF NEW.action = 'auth.mfa.enabled' THEN RAISE EXCEPTION 'test audit failure'; END IF;
      RETURN NEW; END $$`);
    await db.execute(sql`CREATE TRIGGER reject_mfa_audit BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION reject_mfa_audit()`);
    try {
      await expect(confirmMfaEnrollment(pg(), user.id, first.id, currentTotpCode(enrollment.secret))).rejects.toThrow();
      const [unchanged] = await db.select().from(users).where(eq(users.id, user.id));
      expect(unchanged.mfaEnabledAt).toBeNull();
      expect(await db.select().from(mfaRecoveryCodes).where(eq(mfaRecoveryCodes.userId, user.id))).toHaveLength(0);
    } finally {
      await db.execute(sql`DROP TRIGGER reject_mfa_audit ON audit_logs`);
      await db.execute(sql`DROP FUNCTION reject_mfa_audit()`);
    }
    await expect(confirmMfaEnrollment(pg(), user.id, first.id, currentTotpCode(enrollment.secret))).resolves.toHaveProperty('recoveryCodes');
  });
});
