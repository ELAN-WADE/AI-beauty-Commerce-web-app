import { createHash, randomBytes } from 'node:crypto';
import { and, desc, eq, lt, or, sql } from 'drizzle-orm';
import type { AppDb, Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { decodeCursor, encodeCursor } from '../../lib/cursor';
import { users } from '../auth/schema';
import { addresses } from '../users/schema';
import { productVariants, products } from '../catalog/schema';
import { releaseReservation, reserveStock } from '../inventory/service';
import { inventoryLocations, reservations } from '../inventory/schema';
import { distributors } from '../distributors/schema';
import { locateStock } from '../routing/service';
import { reverseCommissions } from '../ledger/service';
import { reverseContentRewards } from '../content-rewards/service';
import { consumeVoucher } from '../loyalty/service';
import { creatorDiscountKobo, validateCode } from '../creators/service';
import { feeFor } from '../shipping/service';
import { enqueueNotification } from '../notifications/service';
import { sealAuthUrl } from '../../lib/outbox-crypto';
import { cartItems, carts } from '../cart/schema';
import { resolveCart } from '../cart/service';
import { orderItems, orderStatusHistory, orders } from './schema';
import type { CheckoutInput } from '../cart/validation';
import { wholesaleTransition } from '../wholesale/lifecycle';

export type OrderActor = 'customer' | 'system' | 'admin';

// Order-number alphabet excludes ambiguous chars (0/O, 1/I/L).
const ORDER_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function makeOrderNumber(): string {
  const bytes = randomBytes(6);
  let s = 'DES-';
  for (const b of bytes) s += ORDER_ALPHABET[b % ORDER_ALPHABET.length];
  return s;
}

/**
 * Fulfilment state machine. PAID is enterable by actor 'system' ONLY (S4
 * webhook) — the frontend can never mark an order paid (§11). Customer may
 * only cancel their own PENDING order; all forward motion is staff/system.
 */
const TRANSITIONS: Record<string, { to: string; actors: OrderActor[] }[]> = {
  PENDING: [
    { to: 'PAID', actors: ['system'] },
    { to: 'CANCELLED', actors: ['customer', 'admin'] },
  ],
  PAID: [
    { to: 'FULFILLING', actors: ['admin'] },
    { to: 'CANCELLED', actors: ['admin'] },
    { to: 'REFUNDED', actors: ['admin'] },
  ],
  FULFILLING: [
    { to: 'READY_PICKUP', actors: ['admin'] },
    { to: 'SHIPPED', actors: ['admin'] },
    { to: 'REFUNDED', actors: ['admin'] },
  ],
  READY_PICKUP: [{ to: 'DELIVERED', actors: ['admin'] }, { to: 'REFUNDED', actors: ['admin'] }],
  SHIPPED: [
    { to: 'DELIVERED', actors: ['admin'] },
    { to: 'REFUNDED', actors: ['admin'] },
  ],
  DELIVERED: [{ to: 'REFUNDED', actors: ['admin'] }],
  CANCELLED: [],
  REFUNDED: [],
};

export function allowedTransition(from: string, to: string, actor: OrderActor): boolean {
  return (TRANSITIONS[from] ?? []).some((t) => t.to === to && t.actors.includes(actor));
}

export interface OrderView {
  id: string;
  kind: 'RETAIL' | 'WHOLESALE';
  wholesaleTerms: unknown;
  wholesaleDispatchedAt: Date | null;
  wholesaleReceivedAt: Date | null;
  wholesaleReturnedAt: Date | null;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotalKobo: number;
  deliveryFeeKobo: number;
  totalKobo: number;
  totalNgn: number;
  discountKobo: number;
  fulfilmentMethod: string;
  fulfilmentLocationId: string;
  fulfilment: unknown;
  shippingAddress: unknown;
  note: string;
  createdAt: Date;
  items: {
    variantId: string;
    productName: string;
    variantLabel: string;
    sku: string;
    unitPriceKobo: number;
    qty: number;
    lineTotalKobo: number;
  }[];
  history: { fromStatus: string | null; toStatus: string; actor: string; createdAt: Date }[];
}

const ORDER_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getOrderView(db: Db, orderId: string): Promise<OrderView> {
  // Malformed UUIDs must be 404, never a 500 PG cast error (enumeration + DoS safe).
  if (!ORDER_ID_RE.test(orderId.trim())) throw Errors.notFound('Order not found.');
  const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  const o = rows[0];
  if (!o) throw Errors.notFound('Order not found.');
  const [items, history] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, orderId)),
    db.select().from(orderStatusHistory).where(eq(orderStatusHistory.orderId, orderId)).orderBy(desc(orderStatusHistory.createdAt)),
  ]);
  return {
    id: o.id,
    kind: o.kind,
    wholesaleTerms: o.wholesaleTerms,
    wholesaleDispatchedAt: o.wholesaleDispatchedAt,
    wholesaleReceivedAt: o.wholesaleReceivedAt,
    wholesaleReturnedAt: o.wholesaleReturnedAt,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    subtotalKobo: o.subtotalKobo,
    deliveryFeeKobo: o.deliveryFeeKobo,
    totalKobo: o.totalKobo,
    totalNgn: o.totalKobo / 100,
    discountKobo: o.discountKobo,
    fulfilmentMethod: o.fulfilmentMethod,
    fulfilmentLocationId: o.fulfilmentLocationId,
    fulfilment: o.fulfilmentSnapshot,
    shippingAddress: o.shippingAddress,
    note: o.note,
    createdAt: o.createdAt,
    items: items.map((i) => ({
      variantId: i.variantId,
      productName: i.productName,
      variantLabel: i.variantLabel,
      sku: i.sku,
      unitPriceKobo: i.unitPriceKobo,
      qty: i.qty,
      lineTotalKobo: i.lineTotalKobo,
    })),
    history: history.map((h) => ({ fromStatus: h.fromStatus, toStatus: h.toStatus, actor: h.actor, createdAt: h.createdAt })),
  };
}

export async function transitionOrder(
  db: Db,
  orderId: string,
  to: string,
  opts: { actor: OrderActor; actorId?: string; note?: string; pickupVerified?: boolean; wholesaleReceipt?: boolean },
): Promise<OrderView> {
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(orders).where(eq(orders.id, orderId)).for('update').limit(1);
    const order = rows[0];
    if (!order) throw Errors.notFound('Order not found.');
    if (!allowedTransition(order.status, to, opts.actor)) {
      throw Errors.badRequest(`Cannot move order from ${order.status} to ${to}.`);
    }
    if ((to === 'READY_PICKUP' && order.fulfilmentMethod !== 'PICKUP') || (to === 'SHIPPED' && order.fulfilmentMethod === 'PICKUP')) throw Errors.badRequest('Action does not match fulfilment method.');
    if (to === 'DELIVERED' && order.fulfilmentMethod === 'PICKUP' && !opts.pickupVerified) throw Errors.badRequest('Verify the customer collection code first.');
    const wholesaleChanges = await wholesaleTransition(tx, order, to, opts.wholesaleReceipt === true);
    // Cancelling a PENDING order returns its reservations to the pool.
    if (to === 'CANCELLED' && order.status === 'PENDING') {
      const active = await tx.select({ id: reservations.id }).from(reservations).where(and(eq(reservations.refType, 'order'), eq(reservations.refId, orderId), eq(reservations.status, 'active')));
      for (const r of active) {
        await releaseReservation(tx, r.id);
      }
    }
    await tx
      .update(orders)
      .set({
        ...wholesaleChanges,
        status: to,
        paymentStatus: to === 'PAID' ? 'PAID' : to === 'REFUNDED' ? 'REFUNDED' : order.paymentStatus,
        deliveredAt: to === 'DELIVERED' ? new Date() : order.deliveredAt,
        pickupCodeHash: to === 'DELIVERED' ? null : order.pickupCodeHash,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));
    if (to === 'CANCELLED' && order.paymentStatus === 'PAID') {
      await reverseCommissions(tx, orderId, order.totalKobo);
      await reverseContentRewards(tx, orderId, order.totalKobo);
    }
    await tx.insert(orderStatusHistory).values({
      orderId,
      fromStatus: order.status,
      toStatus: to,
      actor: opts.actor === 'admin' && opts.actorId ? `admin:${opts.actorId}` : opts.actor,
      note: (opts.note ?? '').slice(0, 500),
    });
    return getOrderView(tx, orderId);
  });
}

interface CheckoutParams {
  userId?: string;
  sessionId?: string;
  input: CheckoutInput;
  idempotencyKey: string;
  ip?: string;
}

/**
 * Atomic checkout (§6): cart → address → AUTHORITATIVE pricing → order +
 * items + history → reservations → cart cleared. One transaction; any failure
 * (empty cart, inactive variant, insufficient stock) rolls back everything.
 * Client totals are not read at all — strict() rejects them at the route.
 */
export async function checkout(
  db: AppDb,
  params: CheckoutParams,
): Promise<{ order: OrderView; replay: boolean }> {
  return db.transaction(async (tx) => {
    const fingerprint = createHash('sha256').update(JSON.stringify(params.input)).digest('hex');
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`checkout:${params.idempotencyKey}`}, 0))`);
    const [prior] = await tx.select().from(orders).where(eq(orders.idempotencyKey, params.idempotencyKey));
    if (prior) {
      const sameOwner = params.userId ? prior.userId === params.userId : !prior.userId && !!params.sessionId && prior.guestSessionId === params.sessionId && prior.guestEmail === params.input.guestEmail;
      if (!sameOwner || prior.checkoutFingerprint !== fingerprint) throw Errors.conflict('Idempotency key reused for different checkout details.');
      return { order: await getOrderView(tx, prior.id), replay: true };
    }
    const cart = await resolveCart(tx, { userId: params.userId, sessionId: params.sessionId });
    await tx.select().from(carts).where(eq(carts.id, cart.id)).for('update').limit(1);
    const lines = await tx
      .select({ item: cartItems, variant: productVariants, productName: products.name, productActive: products.isActive })
      .from(cartItems)
      .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(eq(cartItems.cartId, cart.id))
      .for('update');
    if (lines.length === 0) throw Errors.badRequest('Cart is empty.');
    for (const l of lines) {
      if (!l.variant.isActive || !l.productActive) {
        throw Errors.badRequest(`"${l.productName}" is no longer available.`);
      }
    }

    // Address: owned addressId (ownership verified) or guest address + email.
    let shippingAddress: Record<string, unknown>;
    let email: string | null = null;
    if (params.input.addressId) {
      if (!params.userId) throw Errors.badRequest('Saved addresses require login.');
      const addr = await tx
        .select()
        .from(addresses)
        .where(and(eq(addresses.id, params.input.addressId), eq(addresses.userId, params.userId)))
        .limit(1);
      if (!addr[0]) throw Errors.notFound('Address not found.');
      const a = addr[0];
      shippingAddress = { fullName: a.fullName, phone: a.phone, street: a.street, city: a.city, state: a.state, postalCode: a.postalCode, country: a.country };
      const u = await tx.select({ email: users.email }).from(users).where(eq(users.id, params.userId)).limit(1);
      email = u[0]?.email ?? null;
    } else {
      shippingAddress = { ...params.input.guestAddress };
      email = params.input.guestEmail ?? null;
    }

    // AUTHORITATIVE pricing from variant rows (never client input).
    const subtotalKobo = lines.reduce((s, l) => s + l.variant.priceKobo * l.item.qty, 0);
    const routing = await locateStock(tx, {
      city: typeof shippingAddress.city === 'string' ? shippingAddress.city : '',
      state: typeof shippingAddress.state === 'string' ? shippingAddress.state : '',
      method: params.input.fulfilmentMethod,
      items: lines.map(l => ({ variantId: l.variant.id, qty: l.item.qty })),
    });
    if (params.input.fulfilmentMethod === 'PICKUP' && !params.input.fulfilmentLocationId) throw Errors.badRequest('Select a pickup location.');
    const option = params.input.fulfilmentLocationId ? routing.options.find(o => o.locationId === params.input.fulfilmentLocationId) : routing.options[0];
    if (!option) throw Errors.conflict('Your complete bag is not available at the selected location. Review delivery options.');
    const [location] = await tx.select().from(inventoryLocations).where(eq(inventoryLocations.id, option.locationId)).for('share');
    if (!location.isActive) throw Errors.conflict('Location is no longer accepting orders.');
    const partner = location.distributorId ? (await tx.select().from(distributors).where(eq(distributors.id, location.distributorId)))[0] : null;
    const deliveryFeeKobo = option.feeKobo;

    // Affiliate code (if supplied): validated BEFORE the order exists.
    let creatorCode: string | null = null;
    let creatorDiscount = 0;
    let creatorId: string | null = null;
    let creatorCommissionBps = 0;
    if (params.input.creatorCode) {
      try {
        const creator = await validateCode(tx, params.input.creatorCode);
        creatorCode = creator.promoCode;
        creatorId = creator.id;
        creatorCommissionBps = creator.userId && creator.userId !== params.userId ? creator.commissionBps : 0;
        creatorDiscount = creatorDiscountKobo(subtotalKobo, creator.discountPercent);
      } catch {
        throw Errors.badRequest('Invalid creator code.');
      }
    }

    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber: makeOrderNumber(),
        userId: params.userId,
        guestEmail: params.userId ? null : email,
        guestAccessTokenHash: params.userId ? null : params.input.guestAccessToken ? createHash('sha256').update(params.input.guestAccessToken).digest('hex') : null,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        subtotalKobo,
        deliveryFeeKobo,
        discountKobo: creatorDiscount,
        creatorCode,
        creatorId,
        creatorCommissionBps,
        distributorId: partner?.id ?? null,
        distributorCommissionBps: partner?.commissionBps ?? 0,
        fulfilmentLocationId: location.id,
        fulfilmentMethod: params.input.fulfilmentMethod,
        fulfilmentSnapshot: option,
        totalKobo: Math.max(0, subtotalKobo + deliveryFeeKobo - creatorDiscount),
        shippingAddress,
        note: params.input.note,
        idempotencyKey: params.idempotencyKey,
        checkoutFingerprint: fingerprint,
        guestSessionId: params.userId ? null : params.sessionId,
      })
      .returning({ id: orders.id });

    if (!params.userId && !params.input.guestAccessToken) throw Errors.badRequest('Guest access token is required.');
    // Loyalty voucher (if supplied): validated + consumed atomically here.
    let discountKobo = creatorDiscount;
    if (params.input.voucherCode) {
      const consumed = await consumeVoucher(tx, {
        userId: params.userId,
        code: params.input.voucherCode,
        subtotalKobo,
        orderId: order.id,
      });
      discountKobo += consumed.discountKobo;
      await tx
        .update(orders)
        .set({ discountKobo, totalKobo: Math.max(0, subtotalKobo + deliveryFeeKobo - discountKobo) })
        .where(eq(orders.id, order.id));
    }
    await tx.insert(orderItems).values(
      lines.map((l) => ({
        orderId: order.id,
        variantId: l.variant.id,
        productName: l.productName,
        variantLabel: l.variant.sizeLabel,
        sku: l.variant.sku,
        unitPriceKobo: l.variant.priceKobo,
        qty: l.item.qty,
        lineTotalKobo: l.variant.priceKobo * l.item.qty,
      })),
    );
    await tx.insert(orderStatusHistory).values({
      orderId: order.id,
      fromStatus: null,
      toStatus: 'PENDING',
      actor: 'customer',
      note: `Checkout from ${params.ip ?? 'unknown ip'}`.slice(0, 200),
    });

    // Reserve every line (TTL 30 min; S4 commits on verified payment).
    for (const l of lines.sort((a, b) => a.variant.id.localeCompare(b.variant.id))) {
      await reserveStock(tx, { locationId: location.id, variantId: l.variant.id, qty: l.item.qty, refType: 'order', refId: order.id, ttlMinutes: 30 });
    }
    await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    await enqueueNotification(tx, {
      userId: params.userId ?? null,
      channel: 'email',
      template: 'order.created',
       payload: { orderId: order.id, guestEmail: params.userId ? null : email, totalKobo: subtotalKobo + deliveryFeeKobo - discountKobo,
         ...(params.userId ? {} : { sealedAccessToken: sealAuthUrl(params.input.guestAccessToken!) }) },
    });
    return { order: await getOrderView(tx, order.id), replay: false };
  });
}

// ---------- Reads (ownership enforced) ----------

export async function listOwnOrders(db: AppDb, userId: string, limit = 20, cursorRaw?: string) {
  const cursor = decodeCursor(cursorRaw);
  const lim = Math.min(100, Math.max(1, limit));
  const conds = [eq(orders.userId, userId)];
  const rows = await db
    .select()
    .from(orders)
    .where(
      cursor
        ? and(...conds, or(lt(orders.createdAt, new Date(cursor.k)), and(eq(orders.createdAt, new Date(cursor.k)), lt(orders.id, cursor.id))))
        : and(...conds),
    )
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .limit(lim + 1);
  const hasMore = rows.length > lim;
  const page = (hasMore ? rows.slice(0, lim) : rows).map(summarize);
  const last = rows[Math.min(lim, rows.length) - 1];
  return { orders: page, hasMore, nextCursor: hasMore && last ? encodeCursor({ k: (last.createdAt as Date).toISOString(), id: last.id }) : null };
}

function summarize(o: typeof orders.$inferSelect) {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    totalKobo: o.totalKobo,
    totalNgn: o.totalKobo / 100,
    createdAt: o.createdAt,
  };
}

async function resolveOwnOrderId(db: AppDb, userId: string, idOrNumber: string): Promise<string> {
  const input = idOrNumber.trim();
  if (ORDER_ID_RE.test(input)) {
    const rows = await db.select({ id: orders.id }).from(orders).where(and(eq(orders.id, input), eq(orders.userId, userId))).limit(1);
    if (!rows[0]) throw Errors.notFound('Order not found.');
    return rows[0].id;
  }
  const rows = await db.select({ id: orders.id }).from(orders).where(and(eq(orders.orderNumber, input.toUpperCase()), eq(orders.userId, userId))).limit(1);
  if (!rows[0]) throw Errors.notFound('Order not found.');
  return rows[0].id;
}

export async function getOwnOrder(db: AppDb, userId: string, orderId: string): Promise<OrderView> {
  return getOrderView(db, await resolveOwnOrderId(db, userId, orderId));
}

/** Guest lookup requires possession of the 256-bit order capability, not PII. */
export async function getGuestOrder(db: Db, orderId: string, token: string): Promise<OrderView> {
  const input = orderId.trim();
  if (!/^[a-f0-9]{64}$/.test(token)) throw Errors.notFound('Order not found.');
  const rows = ORDER_ID_RE.test(input)
    ? await db.select({ id: orders.id, hash: orders.guestAccessTokenHash }).from(orders).where(eq(orders.id, input)).limit(1)
    : await db.select({ id: orders.id, hash: orders.guestAccessTokenHash }).from(orders).where(eq(orders.orderNumber, input.toUpperCase())).limit(1);
  const row = rows[0];
  if (!row || !row.hash || row.hash !== createHash('sha256').update(token).digest('hex')) {
    throw Errors.notFound('Order not found.');
  }
  return getOrderView(db, row.id);
}

export async function requireGuestOrder(db: Db, orderId: string, token?: string) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) throw Errors.notFound('Order not found.');
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || !order.guestAccessTokenHash || order.guestAccessTokenHash !== createHash('sha256').update(token).digest('hex')) {
    throw Errors.notFound('Order not found.');
  }
  return order;
}

export async function listAllOrders(db: AppDb, opts: { status?: string; limit?: number } = {}) {
  const conds = opts.status ? [eq(orders.status, opts.status)] : [];
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
  const rows = await db
    .select()
    .from(orders)
    .where(conds.length > 0 ? and(...conds) : undefined)
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .limit(limit + 1);
  const hasMore = rows.length > limit;
  return { orders: (hasMore ? rows.slice(0, limit) : rows).map(summarize), hasMore };
}

export async function getOrderById(db: AppDb, orderId: string): Promise<OrderView> {
  return getOrderView(db, orderId); // throws 404 when missing
}
