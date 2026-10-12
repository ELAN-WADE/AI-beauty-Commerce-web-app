import { and, asc, eq, inArray, isNotNull, lt, or, sql } from 'drizzle-orm';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { AppDb } from '../db/client';
import { users } from '../modules/auth/schema';
import { emailVerificationTokens, passwordResetTokens, userSessions } from '../modules/auth/schema';
import { pendingAuthEmail } from '../modules/auth/email';
import { cartItems, carts } from '../modules/cart/schema';
import { getCartView } from '../modules/cart/service';
import { releaseExpired } from '../modules/inventory/service';
import { claimBatch, discardAuthEmail, enqueueNotification, markFailed, markSent, recoverStaleSending } from '../modules/notifications/service';
import { notificationOutbox } from '../modules/notifications/schema';
import { getOrderView } from '../modules/orders/service';
import { orders } from '../modules/orders/schema';
import { paymentAttempts } from '../modules/payments/schema';
import { settleAttempt } from '../modules/payments/service';
import { skinAnalyses } from '../modules/skin/schema';
import { profiles } from '../modules/users/schema';
import { releaseCommissions } from '../modules/ledger/service';
import { awardOrderCommissions } from '../modules/ledger/service';
import { releaseContentRewards, settleContentRewards } from '../modules/content-rewards/service';
import { earnForOrder } from '../modules/loyalty/service';
import { communityMedia } from '../modules/community/schema';
import { communityBucket, deleteObject, s3, scansBucket } from '../lib/storage';
import { openAuthUrl } from '../lib/outbox-crypto';
import { isTermiiConfigured, smsCartAbandoned, smsOrderPaid, smsShipmentUpdate, termiiConfig, termiiSend } from '../lib/termii';
import {
  getEmailSender,
  renderCartAbandoned,
  renderOrderCreated,
  renderOrderPaid,
  renderShipmentUpdate,
  type EmailSender,
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

async function resolvePhone(db: AppDb, userId: string | null, payload: Record<string, unknown>, orderId?: string): Promise<string | null> {
  if (typeof payload.guestPhone === 'string' && payload.guestPhone) return payload.guestPhone;
  if (userId) {
    const p = await db.select({ phone: profiles.phone }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
    if (p[0]?.phone) return p[0].phone;
  }
  if (orderId) {
    try {
      const view = await getOrderView(db, orderId);
      const phone = (view.shippingAddress as { phone?: string } | null)?.phone;
      if (phone) return phone;
    } catch {
      // order gone — no phone available
    }
  }
  return null;
}

/** Send due outbox rows (order/shipment/cart/auth + post-payment side-effects). */
export async function processOutbox(db: AppDb, sender: EmailSender = getEmailSender()): Promise<TaskResult> {
  const recovered = await recoverStaleSending(db, 100).catch(() => 0);
  // Keep the 10-minute lease comfortably longer than a batch of SMTP timeouts.
  const rows = await claimBatch(db, 10);
  let sent = 0;
  let failed = 0;
  let discarded = 0;
  for (const row of rows) {
    try {
      const payload = row.payload as Record<string, unknown>;
      if (row.template.startsWith('auth.')) {
        const message = row.channel === 'email' ? await pendingAuthEmail(db, row) : null;
        if (!message) {
          await discardAuthEmail(db, row.id);
          discarded += 1;
          continue;
        }
        await sender.send(message);
        await markSent(db, row.id);
        sent += 1;
        continue;
      }
      // Post-payment side-effects: idempotent by construction (loyalty UNIQUE
      // account/earn/order, commissions UNIQUE order/wallet + journal eventKey).
      // A bug here retries with backoff — it never rolls back the PAID order.
      if (row.template === 'loyalty.earn') {
        const orderId = String(payload.orderId ?? '');
        const userId = typeof payload.userId === 'string' ? payload.userId : row.userId;
        const totalKobo = Number(payload.totalKobo ?? 0);
        if (!orderId || !userId || !Number.isSafeInteger(totalKobo)) {
          await markFailed(db, row.id);
          failed += 1;
          continue;
        }
        await earnForOrder(db, { userId, orderId, totalKobo });
        await markSent(db, row.id);
        sent += 1;
        continue;
      }
      if (row.template === 'commission.award') {
        const orderId = String(payload.orderId ?? '');
        if (!orderId) {
          await markFailed(db, row.id);
          failed += 1;
          continue;
        }
        await awardOrderCommissions(db, orderId);
        await markSent(db, row.id);
        sent += 1;
        continue;
      }
      if (row.channel === 'sms' || row.channel === 'whatsapp') {
        // Termii path (Nigeria-first): phone resolution, short templates.
        if (!isTermiiConfigured()) {
          await markFailed(db, row.id);
          failed += 1;
          continue;
        }
        const orderId = typeof payload.orderId === 'string' ? payload.orderId : undefined;
        const phone = await resolvePhone(db, row.userId, payload, orderId);
        if (!phone) {
          await markFailed(db, row.id);
          failed += 1;
          continue;
        }
        let text = '';
        if (row.template === 'order.paid' && orderId) {
          const view = await getOrderView(db, orderId);
          text = smsOrderPaid(view.orderNumber, view.totalKobo);
        } else if (row.template === 'shipment.update') {
          text = smsShipmentUpdate(String(payload.orderNumber ?? ''), String(payload.status ?? ''), String(payload.trackingRef ?? ''));
        } else if (row.template === 'cart.abandoned' && typeof payload.cartId === 'string') {
          const view = await getCartView(db, payload.cartId);
          if (view.lines.length === 0) {
            await markSent(db, row.id);
            continue;
          }
          text = smsCartAbandoned(view.subtotalKobo / 100);
        } else {
          await markFailed(db, row.id); // no short template — dead-letter, never blind-retry
          failed += 1;
          continue;
        }
        await termiiSend(fetch, termiiConfig(), { to: phone, text, channel: row.channel === 'whatsapp' ? 'whatsapp' : 'generic' });
        await markSent(db, row.id);
        sent += 1;
        continue;
      }
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
        const accessToken = row.template === 'order.created' && typeof payload.sealedAccessToken === 'string'
          ? openAuthUrl(payload.sealedAccessToken) : null;
        await sender.send({ ...msg, text: accessToken ? `${msg.text}\n\nTrack this guest order with your private access token: ${accessToken}\nKeep this token private; your email address alone cannot access your order.` : msg.text, to });
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
  return { task: 'outbox', ok: failed === 0, detail: `recovered=${recovered} claimed=${rows.length} sent=${sent} failed=${failed} discarded=${discarded} via=${sender.name}` };
}

/** Release expired stock reservations (oversell defence over time). */
export async function sweepReservations(db: AppDb): Promise<TaskResult> {
  const { expired } = await releaseExpired(db, 200);
  return { task: 'reservations', ok: true, detail: `expired=${expired}` };
}

/**
 * Abandoned carts (§7): registered-user carts untouched 24h+ with items get
 * ONE reminder per 7 days (dedupe checked against the outbox itself).
 * Per-cart advisory lock serializes concurrent workers so the check+enqueue
 * cannot double-queue the same cart.
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
    // xact lock must live inside the same transaction as check+enqueue.
    await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`abandoned:${s.cartId}`}, 0))`);
      const recent = await tx
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
      if (recent.length > 0) return;
      await enqueueNotification(tx, { userId: s.userId, channel: 'email', template: 'cart.abandoned', payload: { cartId: s.cartId, email: s.email } });
      queued += 1;
    });
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
    .orderBy(asc(skinAnalyses.createdAt))
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

/** Reconcile stranded payments: webhook received but settle failed transiently. */
export async function reconcilePayments(db: AppDb): Promise<TaskResult> {
  const cutoff = new Date(Date.now() - 5 * 60_000);
  const pending = await db
    .select({ reference: paymentAttempts.reference, provider: paymentAttempts.provider, providerRef: paymentAttempts.providerRef })
    .from(paymentAttempts)
    .innerJoin(orders, eq(orders.id, paymentAttempts.orderId))
    .where(and(
      or(
        inArray(paymentAttempts.status, ['initiated', 'authorization_open']),
        and(eq(paymentAttempts.status, 'success'), eq(orders.paymentStatus, 'UNPAID')),
      ),
      lt(paymentAttempts.updatedAt, cutoff),
      inArray(paymentAttempts.provider, ['stripe', 'opay', 'flutterwave']),
    ))
    .orderBy(asc(paymentAttempts.updatedAt))
    .limit(20);
  let settled = 0;
  let checked = 0;
  for (const p of pending) {
    if (p.provider === 'flutterwave' && !p.providerRef) {
      await db.update(paymentAttempts).set({ updatedAt: new Date() }).where(eq(paymentAttempts.reference, p.reference));
      continue;
    }
    checked += 1;
    try {
      const r = await settleAttempt(db, {
        provider: p.provider as 'stripe' | 'opay' | 'flutterwave',
        reference: p.reference,
        transactionId: p.providerRef ?? undefined,
      });
      if (r.settled) settled += 1;
    } catch {
      await db.update(paymentAttempts).set({ updatedAt: new Date() }).where(eq(paymentAttempts.reference, p.reference));
      continue; // transient: provider retry + next sweep
    }
  }
  return { task: 'payment-reconcile', ok: true, detail: `checked=${checked} settled=${settled}` };
}

export async function purgeExpiredOperationalData(db: AppDb): Promise<TaskResult> {
  await db.execute(sql`delete from request_quotas where reset_at < now() - interval '1 day'`);
  // An auth email older than its one-hour reset token is no longer useful.
  await db.execute(sql`update notification_outbox set payload = '{}'::jsonb, status = 'failed' where status in ('pending','sending') and ((template = 'auth.reset-password' and created_at < now() - interval '1 hour') or (template = 'auth.verify-email' and created_at < now() - interval '24 hours'))`);
  await db.execute(sql`delete from notification_outbox where status in ('sent','failed') and created_at < now() - interval '30 days'`);
  await db.delete(passwordResetTokens).where(lt(passwordResetTokens.expiresAt, new Date(Date.now() - 24 * 3600_000)));
  await db.delete(emailVerificationTokens).where(lt(emailVerificationTokens.expiresAt, new Date(Date.now() - 24 * 3600_000)));
  await db.delete(userSessions).where(lt(userSessions.expiresAt, new Date(Date.now() - 24 * 3600_000)));
  return { task: 'operational-retention', ok: true, detail: 'expired quotas, tokens, sessions, sensitive messages pruned' };
}

/** Reap staged community uploads never attached to a post (24h grace). */
export async function purgeStaleCommunityMedia(db: AppDb): Promise<TaskResult> {
  const cutoff = new Date(Date.now() - 24 * 3600_000);
  const rows = await db
    .select({ id: communityMedia.id, mediaKey: communityMedia.mediaKey })
    .from(communityMedia)
    .where(and(eq(communityMedia.status, 'pending'), lt(communityMedia.createdAt, cutoff)))
    .orderBy(asc(communityMedia.createdAt))
    .limit(100);
  let purged = 0;
  for (const r of rows) {
    try {
      await deleteObject(communityBucket(), r.mediaKey);
    } catch {
      continue; // storage hiccup: retry next sweep (row retained)
    }
    await db.update(communityMedia).set({ status: 'failed' }).where(eq(communityMedia.id, r.id));
    purged += 1;
  }
  return { task: 'community-media-purge', ok: true, detail: `purged=${purged}` };
}

export async function runAllTasks(db: AppDb): Promise<TaskResult[]> {
  const results: TaskResult[] = [];
  const clearEarnings = async (db: AppDb): Promise<TaskResult> => ({ task: 'commission-release', ok: true, detail: `released=${await releaseCommissions(db)}` });
  const settleContent = async (db: AppDb): Promise<TaskResult> => {
    const s = await settleContentRewards(db);
    const r = await releaseContentRewards(db);
    return { task: 'content-rewards', ok: true, detail: `settled=${s.settled} released=${r}` };
  };
  for (const task of [processOutbox, sweepReservations, sweepAbandonedCarts, purgeOldScans, purgeStaleCommunityMedia, clearEarnings, settleContent, reconcilePayments, purgeExpiredOperationalData]) {
    try {
      results.push(await task(db));
    } catch (err) {
      results.push({ task: task.name, ok: false, detail: String(err).slice(0, 200) });
    }
  }
  return results;
}
