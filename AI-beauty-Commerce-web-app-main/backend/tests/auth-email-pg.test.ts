import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { openAuthUrl } from '@/lib/outbox-crypto';
import type { EmailMessage, EmailSender } from '@/lib/email';
import { createSession, getSessionUser, login, register, requestPasswordReset, resendVerification, resetPassword, sha256Hex, verifyEmail, verifyEmailAndCreateSession, verifyPassword } from '@/modules/auth/service';
import { claimBatch, recoverStaleSending } from '@/modules/notifications/service';
import { processOutbox } from '@/worker/tasks';
import { submitApplication as applyCreator, reviewApplication as reviewCreator } from '@/modules/creators/service';
import { submitApplication as applyDistributor, reviewApplication as reviewDistributor } from '@/modules/distributors/service';
import { pendingPartnerReviewEmail, PARTNER_REVIEW_TEMPLATE } from '@/modules/partners/email';
import { updateProfile, getProfile, createAddress, listAddresses, updateAddress, deleteAddress } from '@/modules/users/service';
import { ACCOUNT_EMAIL_TEMPLATES } from '@/modules/notifications/account-email';

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

describe('verified account to partner approval and email', () => {
  it('allows only the configured privileged account through administrator password sign-in', async () => {
    const owner = await createAccount(); const other = await createAccount();
    vi.stubEnv('ADMIN_GOOGLE_EMAIL', owner.email);
    await verifyEmail(db as never, owner.token); await verifyEmail(db as never, other.token);
    await expect(login(db as never, { email: owner.email, password: 'Original-password-1' }, {}, 'admin')).rejects.toMatchObject({ status: 401 });
    await db.insert(schema.roles).values({ id: 'SUPER_ADMIN' }).onConflictDoNothing();
    await db.insert(schema.userRoles).values([{ userId: owner.id, roleId: 'SUPER_ADMIN' }, { userId: other.id, roleId: 'SUPER_ADMIN' }]);
    await expect(login(db as never, { email: other.email, password: 'Original-password-1' }, {}, 'admin')).rejects.toMatchObject({ status: 401 });
    expect(await db.select().from(schema.userSessions).where(eq(schema.userSessions.userId, other.id))).toHaveLength(0);
    const session = await login(db as never, { email: owner.email, password: 'Original-password-1' }, {}, 'admin');
    expect((await getSessionUser(db as never, session.token))?.roles).toContain('SUPER_ADMIN');
  });
  it('starts with no profile or addresses and saves details only for their owner', async () => {
    const account = await createAccount(); const other = await createAccount();
    expect(await getProfile(db as never, account.id)).toBeNull();
    expect(await listAddresses(db as never, account.id)).toEqual([]);
    await updateProfile(db as never, account.id, { displayName: 'Submitted name', phone: '+2348000000000' });
    expect((await getProfile(db as never, account.id))?.displayName).toBe('Submitted name');
    expect(await getProfile(db as never, other.id)).toBeNull();
    const address = await createAddress(db as never, account.id, { label: 'Delivery', fullName: 'Submitted name', phone: '+2348000000000', street: 'Submitted street', city: 'Lagos', state: 'Lagos', country: 'NG', isDefault: true });
    expect((await listAddresses(db as never, account.id))[0].id).toBe(address.id);
    expect(await listAddresses(db as never, other.id)).toEqual([]);
    await expect(updateAddress(db as never, other.id, address.id, { city: 'Abuja' })).rejects.toThrow('Address not found');
    await expect(deleteAddress(db as never, other.id, address.id)).rejects.toThrow('Address not found');
    await deleteAddress(db as never, account.id, address.id);
    expect(await listAddresses(db as never, account.id)).toEqual([]);
  });
  async function verifiedAccount() {
    const account = await createAccount();
    await verifyEmail(db as never, account.token);
    return account;
  }
  it('requires email proof, creates one creator request, and delivers the persisted promo code after approval', async () => {
    await db.insert(schema.roles).values([{ id: 'CREATOR' }, { id: 'DISTRIBUTOR' }]).onConflictDoNothing();
    const account = await createAccount();
    const admin = await verifiedAccount();
    const input = { name: 'Actual applicant', handle: '@applicant', platform: 'Instagram' as const, niche: 'Skincare' };
    await expect(applyCreator(db as never, account.id, input)).rejects.toThrow('Verify your email');
    await verifyEmail(db as never, account.token);
    const application = await applyCreator(db as never, account.id, input);
    expect((await applyCreator(db as never, account.id, input)).id).toBe(application.id);
    await db.delete(schema.notificationOutbox);
    await expect(reviewCreator(db as never, { applicationId: application.id, adminId: account.id, approve: true, promoCode: 'OWNREVIEW', discountPercent: 10, commissionRate: 12, note: '' })).rejects.toThrow('own application');
    expect(await outbox()).toHaveLength(0);
    const review = { applicationId: application.id, adminId: admin.id, approve: true, promoCode: `C${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`, discountPercent: 8, commissionRate: 15, note: 'Welcome aboard.' };
    await expect(db.transaction(async tx => {
      await reviewCreator(tx as never, review);
      throw new Error('Simulated audit failure');
    })).rejects.toThrow('Simulated audit failure');
    expect(await outbox()).toHaveLength(0);
    expect((await db.select().from(schema.creatorApplications).where(eq(schema.creatorApplications.id, application.id)))[0].status).toBe('pending');
    await reviewCreator(db as never, review);
    await expect(reviewCreator(db as never, review)).rejects.toThrow('already reviewed');
    const [queued] = await outbox();
    expect(await outbox()).toHaveLength(1);
    expect(queued.template).toBe(PARTNER_REVIEW_TEMPLATE);
    const { sender, messages } = mailbox();
    await processOutbox(db as never, sender);
    expect(messages).toHaveLength(1);
    expect(messages[0].to).toBe(account.email);
    const [profile] = await db.select().from(schema.creators).where(eq(schema.creators.userId, account.id));
    expect(messages[0].text).toContain(profile.promoCode);
    expect(profile.promoCode).toBe(review.promoCode.toUpperCase());
    expect(messages[0].text).toContain('8%');
    expect(messages[0].text).toContain('15%');
    expect(messages[0].text).toContain('https://shop.example.com/creators');
    const session = await login(db as never, { email: account.email, password: 'Original-password-1' });
    expect((await getSessionUser(db as never, session.token))?.roles).toContain('CREATOR');
    expect(await pendingPartnerReviewEmail(db as never, { ...queued, userId: admin.id })).toBeNull();
    await db.delete(schema.userRoles).where(eq(schema.userRoles.userId, account.id));
    expect(await pendingPartnerReviewEmail(db as never, queued)).toBeNull();
  });

  it('grants the distributor role on the same account and sends an approval with no invented inventory', async () => {
    await db.insert(schema.roles).values({ id: 'DISTRIBUTOR' }).onConflictDoNothing();
    const account = await verifiedAccount(); const admin = await verifiedAccount();
    const app = await applyDistributor(db as never, account.id, { name: 'Distributor applicant', businessName: 'Applicant business', city: 'Lagos', state: 'Lagos', address: 'Submitted address', phone: '+2348000000000', whatsapp: '' });
    await db.delete(schema.notificationOutbox);
    await reviewDistributor(db as never, { applicationId: app.id, adminId: admin.id, approve: true, note: 'Approved after review.' });
    const { sender, messages } = mailbox(); await processOutbox(db as never, sender);
    expect(messages).toHaveLength(1); expect(messages[0].to).toBe(account.email);
    expect(messages[0].text).toContain('https://shop.example.com/distributor');
    const session = await login(db as never, { email: account.email, password: 'Original-password-1' });
    expect((await getSessionUser(db as never, session.token))?.roles).toContain('DISTRIBUTOR');
  });

  it('emails a rejection note without granting a role and discards invalid queue payloads', async () => {
    const account = await verifiedAccount(); const admin = await verifiedAccount();
    const app = await applyCreator(db as never, account.id, { name: 'Applicant', handle: '', platform: 'TikTok', niche: '' });
    await db.delete(schema.notificationOutbox);
    await reviewCreator(db as never, { applicationId: app.id, adminId: admin.id, approve: false, discountPercent: 0, commissionRate: 0, note: 'Please complete your public profile.' });
    const { sender, messages } = mailbox(); await processOutbox(db as never, sender);
    expect(messages).toHaveLength(1); expect(messages[0].text).toContain('Please complete your public profile.');
    expect(await db.select().from(schema.creators).where(eq(schema.creators.userId, account.id))).toEqual([]);
    expect(await pendingPartnerReviewEmail(db as never, { userId: account.id, template: PARTNER_REVIEW_TEMPLATE, payload: { kind: 'CREATOR', status: 'approved', applicationId: 'invalid' } })).toBeNull();
  });
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
  it('recovers and claims account mail without touching commerce or marketing jobs', async () => {
    const account = await createAccount();
    const [auth] = await outbox();
    const [commerce] = await db.insert(schema.notificationOutbox).values({ userId: account.id, channel: 'email', template: 'order.paid', payload: {}, status: 'sending', nextAttemptAt: new Date(0) }).returning();
    await db.update(schema.notificationOutbox).set({ status: 'sending', nextAttemptAt: new Date(0) }).where(eq(schema.notificationOutbox.id, auth.id));
    const filter = { templates: ACCOUNT_EMAIL_TEMPLATES };
    expect(await recoverStaleSending(db as never, 100, filter)).toBe(1);
    expect((await claimBatch(db as never, 10, filter)).map(row => row.id)).toEqual([auth.id]);
    expect((await db.select().from(schema.notificationOutbox).where(eq(schema.notificationOutbox.id, commerce.id)))[0].status).toBe('sending');
  });
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

  it('keeps duplicate accounts intact, reissues verification and gives verified accounts sign-in guidance', async () => {
    const account = await createAccount();
    const duplicate = await register(db as never, { email: account.email.toUpperCase(), password: 'Other-password-2' });
    expect(duplicate).toMatchObject({ created: false, verificationToken: null });
    await requestPasswordReset(db as never, 'unknown@example.com');
    await resendVerification(db as never, 'unknown@example.com');
    expect(await outbox()).toHaveLength(2);
    expect(await db.select().from(schema.users).where(eq(schema.users.email, account.email))).toHaveLength(1);
    await verifyEmail(db as never, account.token);
    await resendVerification(db as never, account.email);
    expect(await outbox()).toHaveLength(3);
    const { sender, messages } = mailbox();
    await processOutbox(db as never, sender);
    expect(messages).toHaveLength(1);
    expect(messages[0].subject).toBe('Your Desla! account is already verified');
    expect(messages[0].text).toContain('https://shop.example.com/login');
    expect(messages[0].text).toContain('https://shop.example.com/forgot-password');
    expect(messages[0].text).not.toContain('token=');
    await expect(login(db as never, { email: account.email, password: 'Original-password-1' })).resolves.toHaveProperty('token');
    await expect(login(db as never, { email: account.email, password: 'Other-password-2' })).rejects.toThrow();
  });

  it('sends account access instructions for verified duplicate signup without issuing a new proof or changing intent', async () => {
    const account = await createAccount(); await verifyEmail(db as never, account.token);
    await db.delete(schema.notificationOutbox);
    const result = await register(db as never, { email: account.email, password: 'Different-password-3', intent: 'DISTRIBUTOR' });
    expect(result).toMatchObject({ created: false, userId: null, verificationToken: null });
    expect((await outbox())[0].template).toBe('auth.account-access');
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, account.id));
    expect(user.signupIntent).toBe('CUSTOMER');
    expect(await verifyPassword('Original-password-1', user.passwordHash)).toBe(true);
    expect(await db.select().from(schema.emailVerificationTokens).where(eq(schema.emailVerificationTokens.userId, account.id))).toHaveLength(1);
    const { sender, messages } = mailbox(); await processOutbox(db as never, sender);
    expect(messages).toHaveLength(1); expect(messages[0].to).toBe(account.email);
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


describe('verification signs the account in', () => {
  it('creates a usable session only once after email proof and keeps password login working', async () => {
    const account = await createAccount();
    const session = await verifyEmailAndCreateSession(db as never, account.token);
    expect((await getSessionUser(db as never, session.token))?.user.id).toBe(account.id);
    await expect(verifyEmailAndCreateSession(db as never, account.token)).rejects.toMatchObject({ status: 410 });
    await expect(login(db as never, { email: account.email, password: 'Original-password-1' })).resolves.toHaveProperty('token');
  });
});

