import { createHash } from 'node:crypto';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { productVariants, products } from '../catalog/schema';
import { HQ_LOCATION_ID, inventoryLocations, stockLevels } from '../inventory/schema';
import { adjustStock, reserveStock } from '../inventory/service';
import { orderItems, orders, orderStatusHistory } from '../orders/schema';
import { getOrderView, makeOrderNumber, transitionOrder } from '../orders/service';
import { ownedPartner } from '../partners/service';
import { feeFor } from '../shipping/service';
import { wholesalePrices, wholesaleStockEvents } from './schema';

type Line = { variantId: string; cartons: number };
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const boundedMoney = (n: number) => {
  if (!Number.isSafeInteger(n) || n < 0 || n > 2_000_000_000) throw Errors.badRequest('Order exceeds the supported amount. Reduce the quantities.');
  return n;
};

export async function wholesaleCatalogue(db: Db, userId: string) {
  const partner = await ownedPartner(db, userId, 'DISTRIBUTOR');
  const profile = partner.profile as { tier: string; name: string };
  const rows = await db.select({ variantId: productVariants.id, sku: productVariants.sku, name: products.name, size: productVariants.sizeLabel,
    unitPriceKobo: wholesalePrices.unitPriceKobo, unitsPerCarton: wholesalePrices.unitsPerCarton, minimumCartons: wholesalePrices.minimumCartons,
    available: sql<number>`coalesce(${stockLevels.onHand} - ${stockLevels.reserved}, 0)` })
    .from(wholesalePrices).innerJoin(productVariants, eq(productVariants.id, wholesalePrices.variantId)).innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(stockLevels, and(eq(stockLevels.variantId, productVariants.id), eq(stockLevels.locationId, HQ_LOCATION_ID), eq(stockLevels.pool, 'PLATFORM')))
    .where(and(eq(wholesalePrices.tier, profile.tier), eq(wholesalePrices.isActive, true), eq(productVariants.isActive, true), eq(products.isActive, true)))
    .orderBy(asc(products.name), asc(productVariants.sku)).limit(500);
  const purchases = await db.select().from(orders).where(and(eq(orders.kind, 'WHOLESALE'), eq(orders.userId, userId), eq(orders.wholesaleLocationId, partner.location!.id))).orderBy(desc(orders.createdAt)).limit(50);
  return { tier: profile.tier, location: partner.location, items: rows, orders: await Promise.all(purchases.map(o => getOrderView(db, o.id))) };
}

export async function quoteWholesale(db: Db, userId: string, input: Line[]) {
  const partner = await ownedPartner(db, userId, 'DISTRIBUTOR');
  const location = partner.location!;
  const tier = (partner.profile as { tier: string }).tier;
  if (!location.address || !location.phone) throw Errors.conflict('Ask staff to configure your delivery address and phone before purchasing.');
  const [hq] = await db.select().from(inventoryLocations).where(eq(inventoryLocations.id, HQ_LOCATION_ID));
  if (!hq?.isActive) throw Errors.conflict('HQ is not accepting wholesale orders.');
  const rows = await db.select({ price: wholesalePrices, variant: productVariants, name: products.name }).from(wholesalePrices)
    .innerJoin(productVariants, eq(productVariants.id, wholesalePrices.variantId)).innerJoin(products, eq(products.id, productVariants.productId))
    .where(and(eq(wholesalePrices.tier, tier), eq(wholesalePrices.isActive, true), eq(productVariants.isActive, true), eq(products.isActive, true), inArray(wholesalePrices.variantId, input.map(i => i.variantId))));
  const items = [...input].sort((a, b) => a.variantId.localeCompare(b.variantId)).map(line => {
    const row = rows.find(r => r.variant.id === line.variantId);
    if (!row || line.cartons < row.price.minimumCartons) throw Errors.badRequest('An item is unavailable for your tier or below its carton minimum.');
    const qty = line.cartons * row.price.unitsPerCarton;
    if (!Number.isSafeInteger(qty) || qty > 100_000) throw Errors.badRequest('Quantity is too large.');
    return { variantId: line.variantId, productName: row.name, sku: row.variant.sku, variantLabel: row.variant.sizeLabel, cartons: line.cartons,
      unitsPerCarton: row.price.unitsPerCarton, minimumCartons: row.price.minimumCartons, qty, unitPriceKobo: row.price.unitPriceKobo,
      lineTotalKobo: boundedMoney(qty * row.price.unitPriceKobo) };
  });
  const subtotalKobo = boundedMoney(items.reduce((n, i) => n + i.lineTotalKobo, 0));
  const deliveryFeeKobo = (await feeFor(db, { city: location.city, state: location.state })).feeKobo;
  const quote = { tier, locationId: location.id, shippingAddress: { fullName: partner.profile.name, phone: location.phone, street: location.address, city: location.city, state: location.state, country: 'NG' },
    items, subtotalKobo, deliveryFeeKobo, totalKobo: boundedMoney(subtotalKobo + deliveryFeeKobo) };
  return { ...quote, quoteFingerprint: hash(quote) };
}

export async function checkoutWholesale(db: Db, userId: string, key: string, input: { items: Line[]; quoteFingerprint: string }) {
  const fingerprint = hash(input);
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`checkout:${key}`}, 0))`);
    const [prior] = await tx.select().from(orders).where(eq(orders.idempotencyKey, key));
    if (prior) {
      if (prior.kind !== 'WHOLESALE' || prior.userId !== userId || prior.checkoutFingerprint !== fingerprint) throw Errors.conflict('Idempotency key reused with different input.');
      return { order: await getOrderView(tx, prior.id), replay: true };
    }
    const quote = await quoteWholesale(tx, userId, input.items);
    if (quote.quoteFingerprint !== input.quoteFingerprint) throw Errors.conflict('Wholesale terms changed. Review a new quote before ordering.');
    const [order] = await tx.insert(orders).values({ kind: 'WHOLESALE', orderNumber: makeOrderNumber(), userId, wholesaleLocationId: quote.locationId,
      wholesaleTerms: quote, fulfilmentLocationId: HQ_LOCATION_ID, fulfilmentMethod: 'DELIVERY', fulfilmentSnapshot: { name: 'Lagos HQ', destination: quote.shippingAddress },
      subtotalKobo: quote.subtotalKobo, deliveryFeeKobo: quote.deliveryFeeKobo, totalKobo: quote.totalKobo, shippingAddress: quote.shippingAddress,
      idempotencyKey: key, checkoutFingerprint: fingerprint }).returning();
    await tx.insert(orderItems).values(quote.items.map(({ cartons, unitsPerCarton, minimumCartons, ...item }) => ({ ...item, orderId: order.id })));
    await tx.insert(orderStatusHistory).values({ orderId: order.id, toStatus: 'PENDING', actor: `customer:${userId}`, note: 'Wholesale invoice created.' });
    for (const item of quote.items) await reserveStock(tx, { locationId: HQ_LOCATION_ID, variantId: item.variantId, qty: item.qty, refType: 'order', refId: order.id, ttlMinutes: 30 });
    return { order: await getOrderView(tx, order.id), replay: false };
  });
}

export async function wholesaleOrderAction(db: Db, userId: string, orderId: string, action: 'receive' | 'cancel') {
  const partner = await ownedPartner(db, userId, 'DISTRIBUTOR');
  return db.transaction(async tx => {
    const [order] = await tx.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.kind, 'WHOLESALE'), eq(orders.userId, userId), eq(orders.wholesaleLocationId, partner.location!.id))).for('update');
    if (!order) throw Errors.notFound('Wholesale order not found.');
    if (action === 'cancel') {
      if (order.status === 'CANCELLED') return getOrderView(tx, order.id);
      return transitionOrder(tx, order.id, 'CANCELLED', { actor: 'customer', actorId: userId });
    }
    if (order.wholesaleReceivedAt) return getOrderView(tx, order.id);
    if (order.status !== 'SHIPPED') throw Errors.conflict('Only dispatched, unrefunded orders can be received. Contact staff for a returned shipment.');
    return transitionOrder(tx, order.id, 'DELIVERED', { actor: 'admin', actorId: userId, wholesaleReceipt: true, note: 'Receipt confirmed by purchasing distributor.' });
  });
}

export async function recordDirectSale(db: Db, userId: string, key: string, input: { variantId: string; qty: number; note: string }) {
  const partner = await ownedPartner(db, userId, 'DISTRIBUTOR');
  return db.transaction(async tx => {
    const fingerprint = hash(input);
    const [created] = await tx.insert(wholesaleStockEvents).values({ userId, locationId: partner.location!.id, idempotencyKey: key, fingerprint }).onConflictDoNothing().returning();
    if (!created) {
      const [prior] = await tx.select().from(wholesaleStockEvents).where(eq(wholesaleStockEvents.idempotencyKey, key));
      if (prior.userId !== userId || prior.locationId !== partner.location!.id || prior.fingerprint !== fingerprint) throw Errors.conflict('Idempotency key reused with different input.');
      return { recorded: true };
    }
    await adjustStock(tx, { locationId: partner.location!.id, pool: 'WHOLESALE', variantId: input.variantId, delta: -input.qty, reason: `direct.sale: ${input.note}`, refType: 'wholesale_sale', refId: created.id });
    return { recorded: true };
  });
}
