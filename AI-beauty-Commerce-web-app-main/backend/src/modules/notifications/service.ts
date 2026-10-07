import { and, asc, eq, lte } from 'drizzle-orm';
import type { AppDb, Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { notificationOutbox } from './schema';

export const CHANNELS = ['email', 'sms', 'whatsapp', 'push'] as const;
export type Channel = (typeof CHANNELS)[number];

/** Insert in the SAME tx as the business change — enqueue is guaranteed. */
export async function enqueueNotification(
  db: Db,
  input: { userId?: string | null; channel: Channel; template: string; payload: Record<string, unknown> },
) {
  if (!(CHANNELS as readonly string[]).includes(input.channel)) {
    throw Errors.badRequest('Unknown notification channel.');
  }
  const [row] = await db
    .insert(notificationOutbox)
    .values({ userId: input.userId ?? null, channel: input.channel, template: input.template.slice(0, 120), payload: input.payload })
    .returning({ id: notificationOutbox.id });
  return row;
}

/** Worker claim: oldest due rows, row-locked SKIP LOCKED (multi-worker safe). */
export async function claimBatch(db: AppDb, limit = 50) {
  const lim = Math.min(200, Math.max(1, limit));
  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(notificationOutbox)
      .where(and(eq(notificationOutbox.status, 'pending'), lte(notificationOutbox.nextAttemptAt, new Date())))
      .orderBy(asc(notificationOutbox.createdAt))
      .limit(lim)
      .for('update', { skipLocked: true });
    const leaseUntil = new Date(Date.now() + 10 * 60_000);
    for (const r of rows) {
      await tx.update(notificationOutbox).set({ status: 'sending', attempts: r.attempts + 1, nextAttemptAt: leaseUntil }).where(eq(notificationOutbox.id, r.id));
    }
    return rows;
  });
}

/**
 * Crash recovery: a worker that dies after claim leaves rows in `sending`
 * with an expired lease. Reset them to pending so the next sweep retries.
 */
export async function recoverStaleSending(db: AppDb, limit = 100): Promise<number> {
  const now = new Date();
  const stale = await db
    .select({ id: notificationOutbox.id })
    .from(notificationOutbox)
    .where(and(eq(notificationOutbox.status, 'sending'), lte(notificationOutbox.nextAttemptAt, now)))
    .limit(Math.min(200, Math.max(1, limit)));
  let recovered = 0;
  for (const r of stale) {
    const changed = await db.update(notificationOutbox).set({ status: 'pending' }).where(and(
      eq(notificationOutbox.id, r.id), eq(notificationOutbox.status, 'sending'), lte(notificationOutbox.nextAttemptAt, now),
    )).returning({ id: notificationOutbox.id });
    recovered += changed.length;
  }
  return recovered;
}

/** Obsolete one-time links are terminal and must not retain their secret payload. */
export async function discardAuthEmail(db: AppDb, id: string): Promise<void> {
  await db.update(notificationOutbox).set({ status: 'failed', payload: {} }).where(eq(notificationOutbox.id, id));
}

export async function markSent(db: AppDb, id: string): Promise<void> {
  const [row] = await db.select({ template: notificationOutbox.template, payload: notificationOutbox.payload }).from(notificationOutbox).where(eq(notificationOutbox.id, id));
  const payload = row?.payload as Record<string, unknown> | undefined;
  await db.update(notificationOutbox).set({ status: 'sent', ...(row?.template.startsWith('auth.') ? { payload: {} } : payload?.sealedAccessToken ? { payload: { ...payload, sealedAccessToken: undefined } } : {}) }).where(eq(notificationOutbox.id, id));
}

/** Failure with quadratic backoff; 5 strikes → dead (failed) for inspection. */
export async function markFailed(db: AppDb, id: string): Promise<void> {
  const rows = await db.select().from(notificationOutbox).where(eq(notificationOutbox.id, id)).limit(1);
  const row = rows[0];
  if (!row) return;
  if (row.attempts >= 5) {
    await db.update(notificationOutbox).set({ status: 'failed', ...(row.template.startsWith('auth.') ? { payload: {} } : {}) }).where(eq(notificationOutbox.id, id));
    return;
  }
  // Auth links have a one-hour reset TTL: retry after 1, 2, 4, 8 minutes,
  // instead of the commerce schedule (5, 20, 45, 80 minutes).
  const backoffMin = row.template.startsWith('auth.') ? 2 ** Math.max(0, row.attempts - 1) : row.attempts * row.attempts * 5;
  await db
    .update(notificationOutbox)
    .set({ status: 'pending', nextAttemptAt: new Date(Date.now() + backoffMin * 60_000) })
    .where(eq(notificationOutbox.id, id));
}
