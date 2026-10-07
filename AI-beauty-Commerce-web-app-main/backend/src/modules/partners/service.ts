import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { userRoles } from '../auth/schema';
import { creators } from '../creators/schema';
import { distributors } from '../distributors/schema';
import { inventoryLocations, restockRequests, stockLevels, stockTransfers } from '../inventory/schema';
import { products, productVariants } from '../catalog/schema';
import { orders } from '../orders/schema';
import { getGuestOrder, getOrderView, getOwnOrder, transitionOrder } from '../orders/service';
import { type PartnerKind, walletFor, walletView } from '../ledger/service';
import { enqueueNotification } from '../notifications/service';
import { creatorMetrics } from '../creators/service';

export async function ownedPartner(db: Db, userId: string, kind: PartnerKind) {
  const [role] = await db.select().from(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, kind)));
  if (!role) throw Errors.forbidden('An approved partner account is required.');
  if (kind === 'CREATOR') {
    const [profile] = await db.select().from(creators).where(and(eq(creators.userId, userId), eq(creators.verified, true)));
    if (!profile) throw Errors.forbidden('No approved creator profile is linked to this account.');
    return { kind, profile, location: null };
  }
  const [profile] = await db.select().from(distributors).where(and(eq(distributors.userId, userId), eq(distributors.verified, true)));
  if (!profile) throw Errors.forbidden('No approved distributor profile is linked to this account.');
  const [location] = await db.select().from(inventoryLocations).where(eq(inventoryLocations.distributorId, profile.id));
  if (!location) throw Errors.conflict('Your location has not been configured yet.');
  return { kind, profile, location };
}

export async function partnerDashboard(db: Db, userId: string, kind: PartnerKind) {
  const partner = await ownedPartner(db, userId, kind);
  const wallet = await walletFor(db, kind, partner.profile.id, userId);
  const result = { ...partner, wallet: await walletView(db, wallet.id, userId) };
  if (!partner.location) return { ...result, metrics: await creatorMetrics(db, partner.profile.id, wallet.id), orders: [], inventory: [], transfers: [], restocks: [] };
  const locationId = partner.location.id;
  const [assigned, inventory, transfers, restocks] = await Promise.all([
    db.select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status, totalKobo: orders.totalKobo, paymentStatus: orders.paymentStatus, fulfilmentMethod: orders.fulfilmentMethod, shippingAddress: orders.shippingAddress, createdAt: orders.createdAt }).from(orders).where(and(eq(orders.fulfilmentLocationId, locationId), eq(orders.distributorId, partner.profile.id))).orderBy(desc(orders.createdAt)).limit(100),
    db.select({ pool: stockLevels.pool, variantId: stockLevels.variantId, sku: productVariants.sku, name: products.name, size: productVariants.sizeLabel, onHand: stockLevels.onHand, reserved: stockLevels.reserved }).from(stockLevels).innerJoin(productVariants, eq(productVariants.id, stockLevels.variantId)).innerJoin(products, eq(products.id, productVariants.productId)).where(eq(stockLevels.locationId, locationId)).limit(400),
    db.select().from(stockTransfers).where(eq(stockTransfers.destinationLocationId, locationId)).orderBy(desc(stockTransfers.dispatchedAt)).limit(50),
    db.select().from(restockRequests).where(eq(restockRequests.locationId, locationId)).orderBy(desc(restockRequests.createdAt)).limit(50),
  ]);
  const variants = await db.select({ id: productVariants.id, sku: productVariants.sku, name: products.name, size: productVariants.sizeLabel }).from(productVariants).innerJoin(products, eq(products.id, productVariants.productId)).where(and(eq(productVariants.isActive, true), eq(products.isActive, true))).limit(500);
  return { ...result, orders: assigned, inventory, transfers, restocks, variants };
}

const pinHash = (orderId: string, pin: string) => createHash('sha256').update(`${orderId}:${pin}`).digest('hex');

export async function issuePickupCode(db: Db, orderId: string, owner: { userId?: string; token?: string }) {
  if (owner.token) await getGuestOrder(db, orderId, owner.token);
  else if (owner.userId) await getOwnOrder(db, owner.userId, orderId);
  else throw Errors.notFound();
  return db.transaction(async tx => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).for('update');
    if (order.status !== 'READY_PICKUP' || order.paymentStatus !== 'PAID') throw Errors.conflict('Your order is not ready for collection.');
    if (order.pickupCodeExpiresAt && order.pickupCodeExpiresAt.getTime() - Date.now() > 14 * 60_000) throw Errors.rateLimited(60);
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const expiresAt = new Date(Date.now() + 15 * 60_000);
    await tx.update(orders).set({ pickupCodeHash: pinHash(order.id, code), pickupCodeExpiresAt: expiresAt, pickupCodeAttempts: 0 }).where(eq(orders.id, order.id));
    return { code, expiresAt };
  });
}

export async function partnerOrderAction(db: Db, userId: string, orderId: string, action: string, code?: string, note = '') {
  const partner = await ownedPartner(db, userId, 'DISTRIBUTOR');
  const result = await db.transaction(async tx => {
    const [order] = await tx.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.distributorId, partner.profile.id), eq(orders.fulfilmentLocationId, partner.location!.id))).for('update');
    if (!order) throw Errors.notFound('Order not found.');
    if (order.paymentStatus !== 'PAID') throw Errors.conflict('Only paid orders can be fulfilled.');
    const target: Record<string, string> = { ACCEPT: 'FULFILLING', DISPATCH: 'SHIPPED', READY_PICKUP: 'READY_PICKUP', CONFIRM_PICKUP: 'DELIVERED', COMPLETE_DELIVERY: 'DELIVERED' };
    if (!target[action]) throw Errors.badRequest('Unknown order action.');
    if (action === 'COMPLETE_DELIVERY' && (order.fulfilmentMethod !== 'DELIVERY' || note.trim().length < 6)) throw Errors.badRequest('Delivery evidence is required.');
    if (action === 'CONFIRM_PICKUP') {
      if (order.fulfilmentMethod !== 'PICKUP') throw Errors.badRequest('This is not a pickup order.');
      if (order.status === 'DELIVERED') return { order: await getOrderView(tx, orderId), invalidCode: false };
      if (order.status !== 'READY_PICKUP' || !order.pickupCodeHash || !order.pickupCodeExpiresAt || order.pickupCodeExpiresAt <= new Date() || order.pickupCodeAttempts >= 5) throw Errors.badRequest('Ask the customer for a new collection code.');
      const valid = !!code && timingSafeEqual(Buffer.from(pinHash(order.id, code), 'hex'), Buffer.from(order.pickupCodeHash, 'hex'));
      if (!valid) {
        await tx.update(orders).set({ pickupCodeAttempts: order.pickupCodeAttempts + 1 }).where(eq(orders.id, order.id));
        return { order: null, invalidCode: true };
      }
    }
    if (order.status === target[action]) return { order: await getOrderView(tx, orderId), invalidCode: false };
    const view = await transitionOrder(tx, orderId, target[action], { actor: 'admin', actorId: userId, pickupVerified: action === 'CONFIRM_PICKUP', note: `Partner ${action}. ${note}` });
    await enqueueNotification(tx, { userId: order.userId, channel: 'email', template: 'shipment.update', payload: { orderId, orderNumber: order.orderNumber, guestEmail: order.guestEmail, status: target[action], trackingRef: '' } });
    return { order: view, invalidCode: false };
  });
  if (result.invalidCode) throw Errors.badRequest('Collection code does not match.');
  return result.order;
}
