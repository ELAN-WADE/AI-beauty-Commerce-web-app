import { and, eq, inArray } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { orderItems, orders } from '../orders/schema';
import { payments, refunds } from '../payments/schema';
import { adjustStock } from '../inventory/service';

/** Called with the order row locked, inside the order transition transaction. */
export async function wholesaleTransition(db: Db, order: typeof orders.$inferSelect, to: string, receipt: boolean) {
  if (order.kind !== 'WHOLESALE') return {};
  if (to === 'CANCELLED' && order.paymentStatus !== 'UNPAID') throw Errors.conflict('Refund a paid wholesale order instead of cancelling it.');
  if (['FULFILLING', 'SHIPPED'].includes(to)) {
    const refund = await db.select({ id: refunds.id }).from(refunds).innerJoin(payments, eq(payments.id, refunds.paymentId))
      .where(and(eq(payments.orderId, order.id), inArray(refunds.status, ['pending', 'success']))).limit(1);
    if (refund.length || order.paymentStatus !== 'PAID') throw Errors.conflict('Resolve the wholesale refund before dispatch.');
  }
  if (to === 'SHIPPED') return { wholesaleDispatchedAt: new Date() };
  if (to === 'DELIVERED') {
    if (!receipt || !order.wholesaleLocationId || order.wholesaleReturnedAt) throw Errors.conflict('The purchasing distributor must confirm wholesale receipt.');
    if (!order.wholesaleReceivedAt) {
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).orderBy(orderItems.variantId);
      for (const item of items) await adjustStock(db, { locationId: order.wholesaleLocationId, pool: 'WHOLESALE', variantId: item.variantId, delta: item.qty, reason: 'wholesale.receive', refType: 'order', refId: order.id });
    }
    return { wholesaleReceivedAt: order.wholesaleReceivedAt ?? new Date() };
  }
  if (to === 'REFUNDED' && !order.wholesaleDispatchedAt && !order.wholesaleRestoredAt) {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).orderBy(orderItems.variantId);
    for (const item of items) await adjustStock(db, { locationId: order.fulfilmentLocationId, variantId: item.variantId, delta: item.qty, reason: 'wholesale.refund.before_dispatch', refType: 'order', refId: order.id });
    return { wholesaleRestoredAt: new Date() };
  }
  return {};
}

/** Physical full-order return, distinct from a financial refund. Replay-safe. */
export async function returnWholesaleStock(db: Db, orderId: string, evidence: string) {
  if (evidence.trim().length < 6) throw Errors.badRequest('Record return receipt evidence.');
  return db.transaction(async tx => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for('update');
    if (!order || order.kind !== 'WHOLESALE') throw Errors.notFound('Wholesale order not found.');
    if (order.wholesaleReturnedAt) return { returned: true };
    if (!order.wholesaleDispatchedAt || order.wholesaleRestoredAt) throw Errors.conflict('Only dispatched stock can be physically returned.');
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id)).orderBy(orderItems.variantId);
    for (const item of items) {
      if (order.wholesaleReceivedAt) await adjustStock(tx, { locationId: order.wholesaleLocationId!, pool: 'WHOLESALE', variantId: item.variantId, delta: -item.qty, reason: `wholesale.return: ${evidence}`, refType: 'order', refId: order.id });
      await adjustStock(tx, { locationId: order.fulfilmentLocationId, variantId: item.variantId, delta: item.qty, reason: `wholesale.return: ${evidence}`, refType: 'order', refId: order.id });
    }
    await tx.update(orders).set({ wholesaleReturnedAt: new Date(), wholesaleRestoredAt: new Date(), updatedAt: new Date() }).where(eq(orders.id, order.id));
    return { returned: true };
  });
}
