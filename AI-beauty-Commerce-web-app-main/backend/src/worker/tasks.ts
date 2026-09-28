import { and, desc, eq, isNotNull, lt, sql } from 'drizzle-orm';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { AppDb } from '../db/client';
import { users } from '../modules/auth/schema';
import { cartItems, carts } from '../modules/cart/schema';
import { getCartView } from '../modules/cart/service';
import { releaseExpired } from '../modules/inventory/service';
import { claimBatch, enqueueNotification, markFailed, markSent } from '../modules/notifications/service';
import { notificationOutbox } from '../modules/notifications/schema';
import { getOrderView } from '../modules/orders/service';
import { skinAnalyses } from '../modules/skin/schema';
import { s3, scansBucket } from '../lib/storage';
import {
  getEmailSender,
  renderCartAbandoned,
  renderOrderCreated,
  renderOrderPaid,
  renderShipmentUpdate,
} from '../lib/email';

export interface TaskResult {
  task: string;
  ok: boolean;
  detail: string;
}

async function resolveEmail(db: AppDb, userId: string | null, guestEmail?: string): Promise<string | null> {
  if (guestEmail) return guestEmail;
  if (!userId) return null;
  const u = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  return u[0]?.email ?? null;
}

/** Send due outbox rows (order/shipment/cart templates). */
export async function processOutbox(db: AppDb): Promise<TaskResult> {
  const sender = getEmailSender();
  const rows = await claimBatch(db, 50);
  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    try {
      const payload = row.payload as Record<string, unknown>;
      const to = await resolveEmail(db, row.userId, payload.guestEmail as string | undefined);
      if (!to) {
        await markFailed(db, row.id);
        failed += 1;
        continue;
      }
      if (row.template === 'order.created' || row.template === 'order.paid') {
        const orderId = String(payload.orderId ?? '');
        const view = await getOrderView(db, orderId);
        const msg = row.template === 'order.created'
          ? renderOrderCreated({ orderNumber: view.orderNumber, totalKobo: view.totalKobo })
          : renderOrderPaid({ orderNumber: view.orderNumber, totalKobo: view.totalKobo });
        await sender.send({ ...msg, to });
      } else if (row.template === 'shipment.update') {
        const msg = renderShipmentUpdate({
          orderNumber: String(payload.orderNumber ?? ''),
          status: String(payload.status ?? ''),
          trackingRef: String(payload.trackingRef ?? ''),
        });
        await sender.send({ ...msg, to });
      } else if (row.template === 'cart.abandoned') {
        const cartId = String(payload.cartId ?? '');
        const view = await getCartView(db, cartId);
        if (view.lines.length === 0) {
          await markSent(db, row.id); // cart emptied since — nothing to send
          continue;
        }
        const msg = renderCartAbandoned({
          lines: view.lines.map((l) => ({ name: l.productName, qty: l.qty, priceNgn: l.unitPriceKobo / 100 })),
          subtotalNgn: view.subtotalKobo / 100,
        });
        await sender.send({ ...msg, to });
      } else {
        await markFailed(db, row.id); // unknown template → dead-letter, never retry-blind
        failed += 1;
        continue;
      }
      await markSent(db, row.id);
      sent += 1;
    } catch {
      await markFailed(db, row.id);
      failed += 1;
    }
  }
  return { task: 'outbox', ok: true, detail: `claimed=${rows.length} sent=${sent} failed=${failed} via=${sender.name}` };
}

/** Release expired stock reservations (oversell defence over time). */
export async function sweepReservations(db: AppDb): Promise<TaskResult> {
  const { expired } = await releaseExpired(db, 200);
  return { task: 'reservations', ok: true, detail: `expired=${expired}` };
}

/**
 * Abandoned carts (§7): registered-user carts untouched 24h+ with items get
 * ONE reminder per 7 days (dedupe checked against the outbox itself).
 */
export async function sweepAbandonedCarts(db: AppDb): Promise<TaskResult> {
  const cutoff = new Date(Date.now() - 24 * 3600_000);
  const stale = await db
    .select({ cartId: carts.id, userId: carts.userId, email: users.email })
    .from(carts)
    .innerJoin(cartItems, eq(cartItems.cartId, carts.id))
    .innerJoin(users, eq(users.id, carts.userId))
    .where(and(lt(carts.updatedAt, cutoff)));
  const seen = new Set<string>();
  let queued = 0;
  for (const s of stale) {
    if (!s.userId || seen.has(s.cartId)) continue;
    seen.add(s.cartId);
    const recent = await db
      .select({ id: notificationOutbox.id })
      .from(notificationOutbox)
      .where(
        and(
          eq(notificationOutbox.template, 'cart.abandoned'),
          sql`${notificationOutbox.payload}->>'cartId' = ${s.cartId}`,
          sql`${notificationOutbox.createdAt} > now() - interval '7 days'`,
        ),
      )
      .limit(1);
    if (recent.length > 0) continue;
    await enqueueNotification(db, { userId: s.userId, channel: 'email', template: 'cart.abandoned', payload: { cartId: s.cartId, email: s.email } });
    queued += 1;
  }
  return { task: 'abandoned-carts', ok: true, detail: `stale-carts=${seen.size} queued=${queued}` };
}

/** Purge scan objects older than 30 days (retention promise, §14). */
export async function purgeOldScans(db: AppDb): Promise<TaskResult> {
  const cutoff = new Date(Date.now() - 30 * 24 * 3600_000);
  const rows = await db
    .select({ id: skinAnalyses.id, imageKey: skinAnalyses.imageKey })
    .from(skinAnalyses)
    .where(and(lt(skinAnalyses.createdAt, cutoff), isNotNull(skinAnalyses.imageKey)))
    .orderBy(desc(skinAnalyses.createdAt))
    .limit(100);
  let purged = 0;
  for (const r of rows) {
    if (!r.imageKey) continue;
    try {
      await s3().send(new DeleteObjectCommand({ Bucket: scansBucket(), Key: r.imageKey }));
    } catch {
      continue; // storage hiccup: retry next sweep (key retained)
    }
    await db.update(skinAnalyses).set({ imageKey: null }).where(eq(skinAnalyses.id, r.id));
    purged += 1;
  }
  return { task: 'scan-purge', ok: true, detail: `purged=${purged}` };
}

export async function runAllTasks(db: AppDb): Promise<TaskResult[]> {
  const results: TaskResult[] = [];
  for (const task of [processOutbox, sweepReservations, sweepAbandonedCarts, purgeOldScans]) {
    try {
      results.push(await task(db));
    } catch (err) {
      results.push({ task: task.name, ok: false, detail: String(err).slice(0, 200) });
    }
  }
  return results;
}
