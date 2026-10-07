import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { openAuthUrl } from '@/lib/outbox-crypto';
import type { EmailMessage, EmailSender } from '@/lib/email';
import { createSession, getSessionUser, login, register, requestPasswordReset, resendVerification, resetPassword, sha256Hex, verifyEmail, verifyPassword } from '@/modules/auth/service';
import { claimBatch, recoverStaleSending } from '@/modules/notifications/service';
import { processOutbox } from '@/worker/tasks';

let client: PGlite;
let db: PgliteDatabase<typeof schema>;
beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } });
  db = drizzle(client, { schema });
  await migrate(db as never, { migrationsFolder: './drizzle' });
  await db.insert(schema.roles).values({ id: 'CUSTOMER' }).onConflictDoNothing();
}, 120000);
afterAll(async () => { await client?.close(); });
beforeEach(async () => {
  vi.stubEnv('FRONTEND_URL', 'https://shop.example.com');
  vi.stubEnv('AUTH_EMAIL_ENCRYPTION_KEY', 'ab'.repeat(32));
  await db.delete(schema.notificationOutbox);
});
afterEach(() => vi.unstubAllEnvs());

function mailbox() {
  const messages: EmailMessage[] = [];
  const sender: EmailSender = { name: 'test', send: vi.fn(async (message: EmailMessage) => { messages.push(message); }) };
  return { sender, messages };
}
async function createAccount() {
  const email = `auth-${crypto.randomUUID()}@example.com`;
  const result = await register(db as never, { email, password: 'Original-password-1' });
  return { email, id: result.userId!, token: result.verificationToken! };
}
async function outbox() { return db.select().from(schema.notificationOutbox); }

describe('account emails through database outbox and delivery worker', () => {
  it('atomically queues an encrypted verification link, delivers it, verifies once and then permits login', async () => {
    const account = await createAccount();
    const [queued] = await outbox();
    expect(queued).toMatchObject({ userId: account.id, status: 'pending', template: 'auth.verify-email' });
    expect(JSON.stringify(queued.payload)).not.toContain(account.token);
    const link = new URL(openAuthUrl((queued.payload as { sealedUrl: string }).sealedUrl));
    expect(link.origin).toBe('https://shop.example.com');
    expect(link.pathname).toBe('/verify-email');
    expect(link.searchParams.get('token')).toBe(account.token);
    const [stored] = await db.select().from(schema.emailVerificationTokens).where(eq(schema.emailVerificationTokens.userId, account.id));
    expect(stored.tokenHash).toBe(sha256Hex(account.token));
    await expect(login(db as never, { email: account.email, password: 'Original-password-1' })).rejects.toThrow('Verify your email');

    const { sender, messages } = mailbox();
    expect((await processOutbox(db as never, sender)).ok).toBe(true);
    expect(messages).toHaveLength(1);
    expect(messages[0].to).toBe(account.email);
    expect(messages[0].text).toContain(link.toString());
    expect(messages[0].text).toContain(stored.expiresAt.toUTCString());
    expect((await outbox())[0]).toMatchObject({ status: 'sent', payload: {} });
    await expect(verifyEmail(db as never, account.token)).resolves.toBe(account.id);
    await expect(verifyEmail(db as never, account.token)).rejects.toThrow();
    await expect(login(db as never, { email: account.email, password: 'Original-password-1' })).resolves.toHaveProperty('token');
  });

  it('rolls back the user, role, and token if the encrypted message cannot be queued', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AUTH_EMAIL_ENCRYPTION_KEY', '');
    const email = 'failed-enqueue@example.com';
    await expect(register(db as never, { email, password: 'Original-password-1' })).rejects.toThrow('AUTH_EMAIL_ENCRYPTION_KEY');
    expect(await db.select().from(schema.users).where(eq(schema.users.email, email))).toEqual([]);
    expect(await outbox()).toEqual([]);
  });

  it('does not create extra users or email for duplicate registration, unknown resets or verified resends', async () => {
    const account = await createAccount();
    const duplicate = await register(db as never, { email: account.email.toUpperCase(), password: 'Other-password-2' });
    expect(duplicate).toMatchObject({ created: false, verificationToken: null });
    await requestPasswordReset(db as never, 'unknown@example.com');
    await resendVerification(db as never, 'unknown@example.com');
    expect(await outbox()).toHaveLength(1);
    await verifyEmail(db as never, account.token);
    await resendVerification(db as never, account.email);
    expect(await outbox()).toHaveLength(1);
  });

  it('retries SMTP failure within the reset window, retaining the same single-use link until accepted', async () => {
    const account = await createAccount();
    await verifyEmail(db as never, account.token);
    await db.delete(schema.notificationOutbox);
    const reset = await requestPasswordReset(db as never, account.email);
    const [original] = await outbox();
    const failing: EmailSender = { name: 'unavailable', send: vi.fn(async () => { throw new Error('SMTP timeout'); }) };
    expect((await processOutbox(db as never, failing)).ok).toBe(false);
    const [retry] = await outbox();
    expect(retry).toMatchObject({ status: 'pending', attempts: 1, payload: original.payload });
    expect(retry.nextAttemptAt.getTime() - Date.now()).toBeGreaterThan(0);
    expect(retry.nextAttemptAt.getTime() - Date.now()).toBeLessThanOrEqual(60_000);
    await db.update(schema.notificationOutbox).set({ nextAttemptAt: new Date(0) }).where(eq(schema.notificationOutbox.id, retry.id));
    const { sender, messages } = mailbox();
    await processOutbox(db as never, sender);
    expect(messages[0].text).toContain(`/reset-password?token=${reset.resetToken}`);
    expect((await outbox())[0]).toMatchObject({ status: 'sent', attempts: 2, payload: {} });
  });

  it('scrubs the encrypted link after the retry limit instead of keeping it indefinitely', async () => {
    await createAccount();
    await db.update(schema.notificationOutbox).set({ attempts: 4 });
    const failing: EmailSender = { name: 'unavailable', send: async () => { throw new Error('SMTP unavailable'); } };
    await processOutbox(db as never, failing);
    expect((await outbox())[0]).toMatchObject({ status: 'failed', attempts: 5, payload: {} });
  });

  it('recovers an expired worker lease without reclaiming an active lease or a delivered message', async () => {
    await createAccount();
    const [claimed] = await claimBatch(db as never, 1);
    expect(await recoverStaleSending(db as never)).toBe(0);
    await db.update(schema.notificationOutbox).set({ nextAttemptAt: new Date(0) }).where(eq(schema.notificationOutbox.id, claimed.id));
    const { sender, messages } = mailbox();
    await processOutbox(db as never, sender);
    await processOutbox(db as never, sender);
    expect(messages).toHaveLength(1);
    expect((await outbox())[0]).toMatchObject({ status: 'sent', attempts: 2 });
  });

  it('discards expired reset links and queued verification emails once the address is verified', async () => {
    const account = await createAccount();
    await resendVerification(db as never, account.email);
    await verifyEmail(db as never, account.token);
    const reset = await requestPasswordReset(db as never, account.email);
    await db.update(schema.passwordResetTokens).set({ expiresAt: new Date(0) }).where(eq(schema.passwordResetTokens.tokenHash, sha256Hex(reset.resetToken!)));
    const { sender, messages } = mailbox();
    const result = await processOutbox(db as never, sender);
    expect(result.detail).toContain('discarded=3');
    expect(messages).toHaveLength(0);
    expect((await outbox()).every(r => r.status === 'failed' && JSON.stringify(r.payload) === '{}')).toBe(true);
    await expect(resetPassword(db as never, reset.resetToken!, 'Replacement-password-2')).rejects.toThrow();
  });

  it('resends verification with a new usable link, then invalidates all sibling verification tokens', async () => {
    const account = await createAccount();
    await db.delete(schema.notificationOutbox);
    await resendVerification(db as never, account.email);
    const { sender, messages } = mailbox();
    await processOutbox(db as never, sender);
    const link = new URL(messages[0].text.match(/https:\/\/\S+/)![0]);
    const token = link.searchParams.get('token')!;
    expect(token).not.toBe(account.token);
    await verifyEmail(db as never, token);
    await expect(verifyEmail(db as never, account.token)).rejects.toThrow();
  });

  it('resets the password once, revokes existing sessions and discards sibling reset emails', async () => {
    const account = await createAccount();
    await verifyEmail(db as never, account.token);
    await db.delete(schema.notificationOutbox);
    const session = await createSession(db as never, account.id);
    const first = await requestPasswordReset(db as never, account.email);
    const second = await requestPasswordReset(db as never, account.email);
    await resetPassword(db as never, first.resetToken!, 'Replacement-password-2');
    await expect(resetPassword(db as never, first.resetToken!, 'Another-password-3')).rejects.toThrow();
    await expect(resetPassword(db as never, second.resetToken!, 'Another-password-3')).rejects.toThrow();
    expect(await getSessionUser(db as never, session.token)).toBeNull();
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, account.id));
    expect(await verifyPassword('Replacement-password-2', user.passwordHash)).toBe(true);
    expect(await verifyPassword('Original-password-1', user.passwordHash)).toBe(false);
    const { sender, messages } = mailbox();
    await processOutbox(db as never, sender);
    expect(messages).toHaveLength(0);
  });
});
