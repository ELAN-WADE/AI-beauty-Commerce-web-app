import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { AppDb } from '@/db/client';
import { Errors } from '@/lib/errors';
import { openMfaSecret, sealMfaSecret } from '@/lib/outbox-crypto';
import { mfaRecoveryCodes, userSessions, users } from './schema';
import { sha256Hex, verifyPassword } from './service';
import { audit } from '@/modules/audit/service';

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const PERIOD_SECONDS = 30;

function base32Encode(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let result = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) result += BASE32[(value << (5 - bits)) & 31];
  return result;
}

function base32Decode(value: string): Buffer {
  let bits = 0;
  let buffer = 0;
  const bytes: number[] = [];
  for (const char of value.replace(/=+$/g, '').toUpperCase()) {
    const digit = BASE32.indexOf(char);
    if (digit < 0) throw new Error('Invalid MFA secret.');
    buffer = (buffer << 5) | digit;
    bits += 5;
    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function totp(secret: string, counter: number): string {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', base32Decode(secret)).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24) | ((digest[offset + 1] & 0xff) << 16) | ((digest[offset + 2] & 0xff) << 8) | (digest[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, '0');
}

export function currentTotpCode(secret: string, now = Date.now()): string {
  return totp(secret, Math.floor(now / 1000 / PERIOD_SECONDS));
}

export function verifyTotp(secret: string, code: string, now = Date.now()): boolean {
  return matchingTotpStep(secret, code, now) !== null;
}

function matchingTotpStep(secret: string, code: string, now = Date.now()): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const candidate = Buffer.from(code);
  const counter = Math.floor(now / 1000 / PERIOD_SECONDS);
  for (let offset = -1; offset <= 1; offset += 1) {
    if (counter + offset < 0) continue;
    const expected = Buffer.from(totp(secret, counter + offset));
    if (candidate.length === expected.length && timingSafeEqual(candidate, expected)) return counter + offset;
  }
  return null;
}

function recoveryCode(): string {
  const value = randomBytes(8).toString('hex').toUpperCase();
  return `${value.slice(0, 8)}-${value.slice(8)}`;
}

function normalizedRecoveryHash(code: string): string {
  return sha256Hex(code.replace('-', '').toUpperCase());
}

export async function beginMfaEnrollment(db: AppDb, userId: string, email: string, password: string, requestId?: string, options: { restart?: boolean } = {}) {
  const [credentials] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, userId));
  if (!credentials) throw Errors.unauthorized();
  if (!(await verifyPassword(password, credentials.passwordHash))) throw Errors.passwordConfirmationFailed();
  const secret = await db.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).for('update');
    if (!user || user.passwordHash !== credentials.passwordHash) throw Errors.unauthorized();
    if (user.mfaEnabledAt) throw Errors.conflict('MFA is already enabled. Verify your current factor before changing it.');
    // Repeated setup requests/tabs must not invalidate the key already imported
    // into the authenticator. Only explicit password-confirmed restart rotates it.
    if (user.mfaSecretEncrypted && !options.restart) return openMfaSecret(user.mfaSecretEncrypted);
    const pendingSecret = base32Encode(randomBytes(20));
    await tx.update(users).set({ mfaSecretEncrypted: sealMfaSecret(pendingSecret), mfaLastTotpStep: null }).where(eq(users.id, userId));
    // A re-enrollment must not inherit step-up proofs from an earlier factor.
    await tx.update(userSessions).set({ mfaVerifiedAt: null }).where(eq(userSessions.userId, userId));
    await audit(tx, { actorId: userId, action: 'auth.mfa.setup', entityType: 'user', entityId: userId, requestId });
    return pendingSecret;
  });
  const label = encodeURIComponent(`Glowly:${email}`);
  const issuer = encodeURIComponent('Glowly');
  return {
    secret,
    provisioningUri: `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=${PERIOD_SECONDS}`,
  };
}

export async function confirmMfaEnrollment(db: AppDb, userId: string, sessionId: string, code: string, requestId?: string) {
  const codes = Array.from({ length: 10 }, recoveryCode);
  await db.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).for('update');
    if (!user || !user.mfaSecretEncrypted || user.mfaEnabledAt) throw Errors.conflict('Start MFA setup before confirming it.');
    const step = matchingTotpStep(openMfaSecret(user.mfaSecretEncrypted), code);
    if (step === null) throw Errors.mfaInvalid('The code did not match this setup key. Check the authenticator entry and automatic device time, then try a new code.');
    const now = new Date();
    await tx.update(users).set({ mfaEnabledAt: now, mfaLastTotpStep: step }).where(eq(users.id, userId));
    await tx.delete(mfaRecoveryCodes).where(eq(mfaRecoveryCodes.userId, userId));
    await tx.insert(mfaRecoveryCodes).values(codes.map((value) => ({ userId, codeHash: normalizedRecoveryHash(value) })));
    const [session] = await tx.update(userSessions).set({ mfaVerifiedAt: now }).where(and(eq(userSessions.id, sessionId), eq(userSessions.userId, userId), isNull(userSessions.revokedAt), gt(userSessions.expiresAt, now))).returning({ id: userSessions.id });
    if (!session) throw Errors.unauthorized();
    await audit(tx, { actorId: userId, action: 'auth.mfa.enabled', entityType: 'user', entityId: userId, requestId });
  });
  return { recoveryCodes: codes };
}

export async function verifyMfaForSession(db: AppDb, userId: string, sessionId: string, code: string, requestId?: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).for('update');
    if (!user?.mfaEnabledAt || !user.mfaSecretEncrypted) throw Errors.conflict('MFA is not enabled.');
    const secret = openMfaSecret(user.mfaSecretEncrypted);
    const step = matchingTotpStep(secret, code);
    if (step !== null) {
      if (user.mfaLastTotpStep !== null && step <= user.mfaLastTotpStep) throw Errors.mfaInvalid('This MFA code has already been used. Wait for a new code.');
      await tx.update(users).set({ mfaLastTotpStep: step }).where(eq(users.id, userId));
    } else {
      const [recovery] = await tx.select({ id: mfaRecoveryCodes.id }).from(mfaRecoveryCodes)
        .where(and(eq(mfaRecoveryCodes.userId, userId), eq(mfaRecoveryCodes.codeHash, normalizedRecoveryHash(code))))
        .for('update').limit(1);
      if (!recovery) throw Errors.mfaInvalid();
      await tx.delete(mfaRecoveryCodes).where(eq(mfaRecoveryCodes.id, recovery.id));
    }
    const [session] = await tx.update(userSessions).set({ mfaVerifiedAt: new Date() })
      .where(and(eq(userSessions.id, sessionId), eq(userSessions.userId, userId), isNull(userSessions.revokedAt), gt(userSessions.expiresAt, new Date())))
      .returning({ id: userSessions.id });
    if (!session) throw Errors.unauthorized();
    await audit(tx, { actorId: userId, action: 'auth.mfa.verified', entityType: 'user', entityId: userId, requestId });
  });
}

export async function disableMfa(db: AppDb, userId: string, code: string, requestId?: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).for('update');
    if (!user?.mfaEnabledAt || !user.mfaSecretEncrypted) throw Errors.mfaInvalid('A valid MFA code is required to disable MFA.');
    const step = matchingTotpStep(openMfaSecret(user.mfaSecretEncrypted), code);
    if (step !== null) {
      if (user.mfaLastTotpStep !== null && step <= user.mfaLastTotpStep) throw Errors.mfaInvalid('This MFA code has already been used. Wait for a new code.');
    } else {
      const [recovery] = await tx.select({ id: mfaRecoveryCodes.id }).from(mfaRecoveryCodes)
        .where(and(eq(mfaRecoveryCodes.userId, userId), eq(mfaRecoveryCodes.codeHash, normalizedRecoveryHash(code))))
        .for('update').limit(1);
      if (!recovery) throw Errors.mfaInvalid('A valid MFA code is required to disable MFA.');
      await tx.delete(mfaRecoveryCodes).where(eq(mfaRecoveryCodes.id, recovery.id));
    }
    await tx.delete(mfaRecoveryCodes).where(eq(mfaRecoveryCodes.userId, userId));
    await tx.update(users).set({ mfaSecretEncrypted: null, mfaEnabledAt: null, mfaLastTotpStep: null }).where(eq(users.id, userId));
    await tx.update(userSessions).set({ mfaVerifiedAt: null }).where(eq(userSessions.userId, userId));
    await audit(tx, { actorId: userId, action: 'auth.mfa.disabled', entityType: 'user', entityId: userId, requestId });
  });
}

export function isMfaVerificationFresh(enabledAt: Date | null, verifiedAt: Date | null, now = Date.now()): boolean {
  // Temporary client-access mode; existing factors remain available for re-enabling.
  if (process.env.ADMIN_MFA_REQUIRED === 'false') return true;
  return Boolean(enabledAt && verifiedAt && verifiedAt >= enabledAt && verifiedAt.getTime() <= now
    && now - verifiedAt.getTime() < 12 * 60 * 60_000);
}
