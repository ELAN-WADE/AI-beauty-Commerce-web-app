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
    for (const r of rows) {
      await tx.update(notificationOutbox).set({ status: 'sending', attempts: r.attempts + 1 }).where(eq(notificationOutbox.id, r.id));
    }
    return rows;
  });
}

export async function markSent(db: AppDb, id: string): Promise<void> {
  await db.update(notificationOutbox).set({ status: 'sent' }).where(eq(notificationOutbox.id, id));
}

/** Failure with quadratic backoff; 5 strikes → dead (failed) for inspection. */
export async function markFailed(db: AppDb, id: string): Promise<void> {
  const rows = await db.select().from(notificationOutbox).where(eq(notificationOutbox.id, id)).limit(1);
  const row = rows[0];
  if (!row) return;
  if (row.attempts >= 5) {
    await db.update(notificationOutbox).set({ status: 'failed' }).where(eq(notificationOutbox.id, id));
    return;
  }
  const backoffMin = row.attempts * row.attempts * 5;
  await db
    .update(notificationOutbox)
    .set({ status: 'pending', nextAttemptAt: new Date(Date.now() + backoffMin * 60_000) })
    .where(eq(notificationOutbox.id, id));
}
