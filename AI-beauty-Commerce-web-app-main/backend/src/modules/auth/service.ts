import { createHash, randomBytes, scrypt as scryptCb, type ScryptOptions } from 'node:crypto';
import { and, eq, isNull, gt } from 'drizzle-orm';
import type { AppDb } from '../../db/client';
import { Errors } from '../../lib/errors';
import {
  emailVerificationTokens,
  passwordResetTokens,
  userRoles,
  userSessions,
  users,
} from './schema';

/** Manual promisification: @types/node overloads reject the 4-arg (options) form. */
function scryptAsync(password: string, salt: Buffer, keylen: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, options, (err, derived) =>
      err ? reject(err) : resolve(derived as Buffer),
    );
  });
}

// scrypt N=2^14, r=8, p=1, 64B key: OWASP-acceptable, zero native deps
// (argon2id aspirational later; same stored format version field allows migration).
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;

const SESSION_TTL_MS =
  Number(process.env.SESSION_TTL_DAYS ?? 30) * 24 * 60 * 60 * 1000;
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltHex, keyHex] = parts;
  const key = await scryptAsync(password, Buffer.from(saltHex, 'hex'), KEY_LEN, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  const expected = Buffer.from(keyHex, 'hex');
  return key.length === expected.length && timingSafeEq(key, expected);
}

function timingSafeEq(a: Buffer, b: Buffer): boolean {
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function sha256Hex(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function newRawToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

export interface SessionMeta {
  ip?: string;
  userAgent?: string;
}

/** Register: anti-enumeration — existing email returns success without creating (§12.8). */
export async function register(db: AppDb, input: { email: string; password: string }) {
  const email = normalizeEmail(input.email);
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    // Timing equalization: burn one scrypt so existing-vs-new is indistinguishable.
    await hashPassword(newRawToken(16));
    return { created: false as const, email, verificationToken: null as string | null };
  }
  const passwordHash = await hashPassword(input.password);
  const [user] = await db.insert(users).values({ email, passwordHash }).returning({ id: users.id });
  await db.insert(userRoles).values({ userId: user.id, roleId: 'CUSTOMER' });
  const verificationToken = await issueVerificationToken(db, user.id);
  return { created: true as const, email, userId: user.id, verificationToken };
}

export async function issueVerificationToken(db: AppDb, userId: string): Promise<string> {
  const raw = newRawToken();
  await db.insert(emailVerificationTokens).values({
    userId,
    tokenHash: sha256Hex(raw),
    expiresAt: new Date(Date.now() + VERIFY_TTL_MS),
  });
  return raw;
}

export async function verifyEmail(db: AppDb, rawToken: string): Promise<void> {
  const now = new Date();
  const rows = await db
    .select()
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.tokenHash, sha256Hex(rawToken)),
        isNull(emailVerificationTokens.consumedAt),
        gt(emailVerificationTokens.expiresAt, now),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) throw Errors.gone();
  await db.transaction(async (tx) => {
    await tx
      .update(emailVerificationTokens)
      .set({ consumedAt: now })
      .where(eq(emailVerificationTokens.id, row.id));
    await tx.update(users).set({ emailVerifiedAt: now }).where(eq(users.id, row.userId));
  });
}

/**
 * Login: ONE generic error for missing user / bad password / unverified-lockout
 * (enumeration resistance). Missing-user path still runs a full scrypt hash so
 * timing does not leak existence.
 */
export async function login(
  db: AppDb,
  input: { email: string; password: string },
  meta: SessionMeta = {},
) {
  const email = normalizeEmail(input.email);
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  if (!user) {
    await hashPassword(input.password); // timing equalisation, result discarded
    throw Errors.unauthorized('Invalid email or password.');
  }
  const now = new Date();
  if (user.lockedUntil && user.lockedUntil > now) {
    throw Errors.unauthorized('Invalid email or password.');
  }
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    const attempts = user.failedLoginAttempts + 1;
    await db
      .update(users)
      .set({
        failedLoginAttempts: attempts,
        lockedUntil: attempts >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCKOUT_MS) : null,
      })
      .where(eq(users.id, user.id));
    throw Errors.unauthorized('Invalid email or password.');
  }
  await db
    .update(users)
    .set({ failedLoginAttempts: 0, lockedUntil: null })
    .where(eq(users.id, user.id));
  return createSession(db, user.id, meta);
}

export async function createSession(db: AppDb, userId: string, meta: SessionMeta = {}) {
  const raw = newRawToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(userSessions).values({
    userId,
    tokenHash: sha256Hex(raw),
    ip: meta.ip,
    userAgent: meta.userAgent,
    expiresAt,
  });
  return { token: raw, expiresAt };
}

/** Validate cookie token → { user, roles }. Null = anonymous (callers 401). */
export async function getSessionUser(db: AppDb, rawToken: string | undefined) {
  if (!rawToken) return null;
  const now = new Date();
  const rows = await db
    .select({ session: userSessions, user: users })
    .from(userSessions)
    .innerJoin(users, eq(userSessions.userId, users.id))
    .where(
      and(
        eq(userSessions.tokenHash, sha256Hex(rawToken)),
        isNull(userSessions.revokedAt),
        gt(userSessions.expiresAt, now),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const roleRows = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .where(eq(userRoles.userId, row.user.id));
  return {
    user: row.user,
    roles: roleRows.map((r) => r.roleId),
    sessionId: row.session.id,
  };
}

export async function revokeSession(db: AppDb, rawToken: string): Promise<void> {
  await db
    .update(userSessions)
    .set({ revokedAt: new Date() })
    .where(eq(userSessions.tokenHash, sha256Hex(rawToken)));
}

export async function revokeAllSessions(db: AppDb, userId: string): Promise<void> {
  await db
    .update(userSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(userSessions.userId, userId), isNull(userSessions.revokedAt)));
}

const ASSIGNABLE_ROLES = ['CUSTOMER', 'SUPPORT', 'INVENTORY_MANAGER', 'STAFF', 'ADMIN', 'SUPER_ADMIN'] as const;

/**
 * Role grants (S7, roles:grant gated at the route). Escalation guards:
 * SUPER_ADMIN can only be granted by a SUPER_ADMIN, and nobody can strip
 * their own SUPER_ADMIN (anti-lockout).
 */
export async function grantRole(db: AppDb, input: { userId: string; roleId: string; grantedBy: string; granterRoles: string[] }) {
  if (!(ASSIGNABLE_ROLES as readonly string[]).includes(input.roleId)) {
    throw Errors.badRequest('Unknown role.');
  }
  if (input.roleId === 'SUPER_ADMIN' && !input.granterRoles.includes('SUPER_ADMIN')) {
    throw Errors.forbidden('Only a SUPER_ADMIN can grant SUPER_ADMIN.');
  }
  const target = await db.select({ id: users.id }).from(users).where(eq(users.id, input.userId)).limit(1);
  if (!target[0]) throw Errors.notFound('User not found.');
  await db.insert(userRoles).values({ userId: input.userId, roleId: input.roleId, grantedBy: input.grantedBy }).onConflictDoNothing();
  return { userId: input.userId, roleId: input.roleId };
}

export async function revokeRole(db: AppDb, input: { userId: string; roleId: string; revokedBy: string }) {
  if (input.roleId === 'SUPER_ADMIN' && input.userId === input.revokedBy) {
    throw Errors.badRequest('You cannot strip your own SUPER_ADMIN.');
  }
  const deleted = await db
    .delete(userRoles)
    .where(and(eq(userRoles.userId, input.userId), eq(userRoles.roleId, input.roleId)))
    .returning({ roleId: userRoles.roleId });
  if (deleted.length === 0) throw Errors.notFound('Role assignment not found.');
  return { userId: input.userId, roleId: input.roleId };
}

/** Reset request: always success (no enumeration); dev echoes token for MailHog-less flow. */
export async function requestPasswordReset(db: AppDb, email: string) {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizeEmail(email)))
    .limit(1);
  if (rows.length === 0) return { emailed: false as const, resetToken: null as string | null };
  const raw = newRawToken();
  await db.insert(passwordResetTokens).values({
    userId: rows[0].id,
    tokenHash: sha256Hex(raw),
    expiresAt: new Date(Date.now() + RESET_TTL_MS),
  });
  return { emailed: true as const, resetToken: raw };
}

export async function resetPassword(db: AppDb, rawToken: string, newPassword: string): Promise<void> {
  const now = new Date();
  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, sha256Hex(rawToken)),
        isNull(passwordResetTokens.consumedAt),
        gt(passwordResetTokens.expiresAt, now),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) throw Errors.gone();
  await db.transaction(async (tx) => {
    await tx
      .update(passwordResetTokens)
      .set({ consumedAt: now })
      .where(eq(passwordResetTokens.id, row.id));
    await tx
      .update(users)
      .set({ passwordHash: await hashPassword(newPassword), failedLoginAttempts: 0, lockedUntil: null })
      .where(eq(users.id, row.userId));
    await tx
      .update(userSessions)
      .set({ revokedAt: now }) // reset kills all sessions (fixation/hijack defence)
      .where(and(eq(userSessions.userId, row.userId), isNull(userSessions.revokedAt)));
  });
}
