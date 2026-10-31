import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt, sql } from 'drizzle-orm';
import type { AppDb, Db } from '../../db/client';
import type { EmailMessage } from '../../lib/email';
import { Errors } from '../../lib/errors';
import { openAuthUrl, sealAuthUrl } from '../../lib/outbox-crypto';
import { frontendOrigin } from '../auth/email';
import { enqueueNotification } from '../notifications/service';
import { newsletterSubscribers } from './schema';

export const newsletterHash = (value: string) => createHash('sha256').update(value).digest('hex');
const newToken = () => randomBytes(32).toString('hex');
function newsletterLink(action: 'confirm' | 'unsubscribe', token: string) {
  const url = new URL('/newsletter', frontendOrigin());
  url.searchParams.set('action', action);
  // Fragments keep the bearer link out of access logs and referrer headers.
  url.hash = new URLSearchParams({ token }).toString();
  return url.toString();
}

/** Consent and its confirmation email are committed together; duplicates are private. */
export async function subscribeNewsletter(db: AppDb, input: { email: string; source?: string }) {
  const email = input.email.trim().toLowerCase();
  await db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`newsletter:${email}`}, 0))`);
    const [existing] = await tx.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email)).for('update');
    if (existing?.status === 'CONFIRMED') return;
    const now = new Date();
    // Duplicate clicks do not invalidate an email already on its way.
    if (existing?.status === 'PENDING' && existing.updatedAt.getTime() > now.getTime() - 60000) return;
    const token = newToken();
    const values = { status: 'PENDING', source: input.source ?? 'website', consentVersion: 'journal-v1', confirmTokenHash: newsletterHash(token), confirmExpiresAt: new Date(now.getTime() + 86400000), subscribedAt: now, updatedAt: now };
    const [subscriber] = existing
      ? await tx.update(newsletterSubscribers).set(values).where(eq(newsletterSubscribers.id, existing.id)).returning()
      : await tx.insert(newsletterSubscribers).values({ ...values, email }).returning();
    await enqueueNotification(tx, { channel: 'email', template: 'newsletter.confirm', payload: { subscriberId: subscriber.id, sealedToken: sealAuthUrl(token) } });
  });
}

export async function confirmNewsletter(db: AppDb, token: string) {
  return db.transaction(async tx => {
    const [subscriber] = await tx.update(newsletterSubscribers).set({ status: 'CONFIRMED', confirmedAt: new Date(), unsubscribedAt: null, confirmTokenHash: null, confirmExpiresAt: null, updatedAt: new Date() }).where(and(eq(newsletterSubscribers.confirmTokenHash, newsletterHash(token)), eq(newsletterSubscribers.status, 'PENDING'), gt(newsletterSubscribers.confirmExpiresAt, new Date()))).returning();
    if (!subscriber) throw Errors.gone('This confirmation link has expired or was already used. Request a new invitation.');
    const unsubscribe = newToken();
    await tx.update(newsletterSubscribers).set({ unsubscribeTokenHash: newsletterHash(unsubscribe) }).where(eq(newsletterSubscribers.id, subscriber.id));
    await enqueueNotification(tx, { channel: 'email', template: 'newsletter.welcome', payload: { subscriberId: subscriber.id, sealedToken: sealAuthUrl(unsubscribe) } });
  });
}

/** Idempotent: the same unsubscribe link can safely be retried. */
export async function unsubscribeNewsletter(db: Db, token: string) {
  const rows = await db.update(newsletterSubscribers).set({ status: 'UNSUBSCRIBED', unsubscribedAt: new Date(), confirmTokenHash: null, confirmExpiresAt: null, updatedAt: new Date() }).where(eq(newsletterSubscribers.unsubscribeTokenHash, newsletterHash(token))).returning({ id: newsletterSubscribers.id });
  if (!rows.length) throw Errors.gone('This unsubscribe link is invalid. Use the latest email from the Journal.');
}

/** Recheck consent/token state at delivery time so stale queued messages are discarded. */
export async function pendingNewsletterEmail(db: Db, row: { template: string; payload: unknown }): Promise<EmailMessage | null> {
  const payload = row.payload as { subscriberId?: string; sealedToken?: string } | null;
  if (!payload?.subscriberId || !payload.sealedToken) return null;
  const token = openAuthUrl(payload.sealedToken);
  const [subscriber] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.id, payload.subscriberId));
  if (!subscriber) return null;
  if (row.template === 'newsletter.confirm') {
    if (subscriber.status !== 'PENDING' || subscriber.confirmTokenHash !== newsletterHash(token) || !subscriber.confirmExpiresAt || subscriber.confirmExpiresAt <= new Date()) return null;
    return { to: subscriber.email, subject: 'Confirm your Formulation Journal subscription', text: `Confirm that you want to receive Desla! product news and the Formulation Journal:\n\n${newsletterLink('confirm', token)}\n\nThis link expires in 24 hours. If you did not request this invitation, ignore this email; you will not be subscribed.` };
  }
  if (row.template === 'newsletter.welcome' && subscriber.status === 'CONFIRMED' && subscriber.unsubscribeTokenHash === newsletterHash(token)) {
    return { to: subscriber.email, subject: 'Welcome to the Formulation Journal', text: `Your Desla! Formulation Journal subscription is confirmed.\n\nUnsubscribe at any time:\n${newsletterLink('unsubscribe', token)}` };
  }
  return null;
}
