import { eq } from 'drizzle-orm';
import type { AppDb } from '../../db/client';
import { orders } from '../orders/schema';
import { awardOrderCommissions } from '../ledger/service';
import { claimBatch, markFailed, markSent, recoverStaleSending } from './service';

/** Financial jobs do not depend on SMTP or trigger any external messages. */
export async function dispatchCommissions(db: AppDb) {
  const filter = { templates: ['commission.award'] };
  await recoverStaleSending(db, 100, filter);
  const rows = await claimBatch(db, 10, filter);
  let settled = 0;
  let failed = 0;
  for (const row of rows) {
    try {
      const payload = row.payload as Record<string, unknown>;
      const orderId = payload.orderId;
      if (typeof orderId !== 'string' || !/^[0-9a-f-]{36}$/i.test(orderId)) throw new Error('Invalid order reference.');
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      if (!order) throw new Error('Order not found.');
      // A full refund closes the job; partial refunds are reconciled by award.
      if (order.paymentStatus !== 'REFUNDED' && order.status !== 'CANCELLED') {
        await awardOrderCommissions(db, orderId);
      }
      await markSent(db, row.id);
      settled++;
    } catch {
      await markFailed(db, row.id);
      failed++;
    }
  }
  return { settled, failed };
}
