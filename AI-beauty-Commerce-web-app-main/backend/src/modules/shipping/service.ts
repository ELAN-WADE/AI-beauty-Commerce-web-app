import { createHash } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import type { AppDb, Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { allowedTransition, getOrderView, transitionOrder } from '../orders/service';
import { orders } from '../orders/schema';
import { enqueueNotification } from '../notifications/service';
import { shipmentEvents, shipments, shippingZones } from './schema';

const FALLBACK_FEE_KOBO = 450000; // ₦4,500 HQ interstate when zones table is empty

/** Zone match: city → state → DEFAULT row → hardcoded fallback. */
export async function feeFor(db: Db, address: { city?: string; state?: string }): Promise<{ feeKobo: number; etaText: string }> {
  const zones = await db.select().from(shippingZones);
  if (zones.length === 0) return { feeKobo: FALLBACK_FEE_KOBO, etaText: '3-5 business days' };
  const city = (address.city ?? '').trim().toLowerCase();
  const state = (address.state ?? '').trim().toLowerCase();
  const hit =
    zones.find((z) => z.city && z.city.toLowerCase() === city) ??
    zones.find((z) => z.state && z.state.toLowerCase() === state) ??
    zones.find((z) => z.city === '' && z.state === 'DEFAULT');
  if (!hit) return { feeKobo: FALLBACK_FEE_KOBO, etaText: '3-5 business days' };
  return { feeKobo: hit.feeKobo, etaText: hit.etaText };
}

export async function createShipment(db: AppDb, input: { orderId: string; provider: 'local' | 'gig' | 'dhl'; trackingRef: string }) {
  const o = await db.select({ id: orders.id, status: orders.status }).from(orders).where(eq(orders.id, input.orderId)).limit(1);
  if (!o[0]) throw Errors.notFound('Order not found.');
  if (!['PAID', 'FULFILLING'].includes(o[0].status)) {
    throw Errors.badRequest('Shipments require a paid order.');
  }
  const [s] = await db.insert(shipments).values({ orderId: input.orderId, provider: input.provider, trackingRef: input.trackingRef }).onConflictDoNothing().returning({ id: shipments.id });
  if (!s) throw Errors.conflict('Shipment already exists for this order.');
  await db.insert(shipmentEvents).values({ shipmentId: s.id, status: 'preparing', note: 'Shipment created' });
  const full = await db.select().from(shipments).where(eq(shipments.id, s.id)).limit(1);
  return full[0];
}

/**
 * Courier scan events. Delivered/dispatched scans auto-advance the ORDER via
 * the guarded machine (only when the current state allows — never forced).
 */
export async function addShipmentEvent(
  db: AppDb,
  input: { shipmentId: string; status: 'preparing' | 'dispatched' | 'in_transit' | 'delivered' | 'failed'; location: string; note: string },
) {
  return db.transaction(async (tx) => {
    const s = await tx.select().from(shipments).where(eq(shipments.id, input.shipmentId)).limit(1);
    const shipment = s[0];
    if (!shipment) throw Errors.notFound('Shipment not found.');
    await tx.insert(shipmentEvents).values({ shipmentId: shipment.id, status: input.status, location: input.location, note: input.note });
    await tx.update(shipments).set({ status: input.status, updatedAt: new Date() }).where(eq(shipments.id, shipment.id));

    const o = await tx.select().from(orders).where(eq(orders.id, shipment.orderId)).limit(1);
    const order = o[0];
    const advance: Record<string, string> = { dispatched: 'FULFILLING', in_transit: 'SHIPPED', delivered: 'DELIVERED' };
    const target = advance[input.status];
    if (order && target && allowedTransition(order.status, target, 'admin')) {
      await transitionOrder(tx, order.id, target, { actor: 'admin', note: `shipment:${shipment.id} ${input.status}` });
    }
    if (order && ['dispatched', 'in_transit', 'delivered', 'failed'].includes(input.status)) {
      await enqueueNotification(tx, {
        userId: order.userId,
        channel: 'email',
        template: 'shipment.update',
        payload: { orderId: order.id, orderNumber: order.orderNumber, status: input.status, trackingRef: shipment.trackingRef, guestEmail: order.guestEmail },
      });
    }
    const events = await tx.select().from(shipmentEvents).where(eq(shipmentEvents.shipmentId, shipment.id)).orderBy(desc(shipmentEvents.createdAt));
    return { shipmentId: shipment.id, status: input.status, events };
  });
}

export async function getShipmentForOrder(db: Db, orderId: string, owner: { userId?: string; guestToken?: string }) {
  const o = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const order = o[0];
  if (!order) throw Errors.notFound('Order not found.');
   const ok = (!!owner.userId && order.userId === owner.userId) || (!order.userId && !!owner.guestToken && !!order.guestAccessTokenHash && /^[a-f0-9]{64}$/.test(owner.guestToken) && order.guestAccessTokenHash === createHash('sha256').update(owner.guestToken).digest('hex'));
  if (!ok) throw Errors.notFound('Order not found.');
  const s = await db.select().from(shipments).where(eq(shipments.orderId, orderId)).limit(1);
  if (!s[0]) return { shipment: null, events: [] };
  const events = await db.select().from(shipmentEvents).where(eq(shipmentEvents.shipmentId, s[0].id)).orderBy(desc(shipmentEvents.createdAt));
  return { shipment: s[0], events, order: await getOrderView(db, orderId) };
}
