import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { and, eq } from 'drizzle-orm';
import * as s from '@/db/schema';
import { adjustStock, getLevels, releaseExpired } from '@/modules/inventory/service';
import { locateStock } from '@/modules/routing/service';
import { checkoutWholesale, quoteWholesale, recordDirectSale, wholesaleOrderAction } from '@/modules/wholesale/service';
import { initPayment, settleAttempt, createRefund, reconcileRefund } from '@/modules/payments/service';
import { transitionOrder } from '@/modules/orders/service';
import { returnWholesaleStock } from '@/modules/wholesale/lifecycle';
import { creatorMetrics } from '@/modules/creators/service';
import { awardOrderCommissions, reverseCommissions, walletFor } from '@/modules/ledger/service';

let db: PgliteDatabase<typeof s>;
let client: PGlite;
let n = 0;
beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } });
  db = drizzle(client, { schema: s });
  await migrate(db as never, { migrationsFolder: './drizzle' });
  await db.insert(s.roles).values({ id: 'DISTRIBUTOR', description: 'Distributor' }).onConflictDoNothing();
  vi.stubEnv('PAYSTACK_SECRET_KEY', 'test-key');
  vi.stubEnv('FLW_SECRET_KEY', 'test-key');
}, 120000);
afterAll(async () => { vi.unstubAllEnvs(); await client?.close(); });

async function fixture(stock = 240) {
  const suffix = ++n;
  const [user] = await db.insert(s.users).values({ email: `wholesale-${suffix}@example.com`, passwordHash: 'test' }).returning();
  await db.insert(s.userRoles).values({ userId: user.id, roleId: 'DISTRIBUTOR' });
  const [partner] = await db.insert(s.distributors).values({ userId: user.id, name: 'Test partner', city: 'Ota', state: 'Ogun', tier: 'Bronze', verified: true, commissionBps: 1200 }).returning();
  const [location] = await db.insert(s.inventoryLocations).values({ distributorId: partner.id, code: `WHO-${suffix}`, name: 'Ota store', city: 'Ota', state: 'Ogun', address: '1 Main Road', phone: '08012345678', isActive: true, pickupEnabled: true }).returning();
  const [brand] = await db.insert(s.brands).values({ name: `Test ${suffix}`, slug: `wh-brand-${suffix}` }).returning();
  const [category] = await db.insert(s.categories).values({ name: 'Test', slug: `wh-cat-${suffix}` }).returning();
  const [product] = await db.insert(s.products).values({ name: 'Oil', slug: `wh-oil-${suffix}`, brandId: brand.id, categoryId: category.id }).returning();
  const [variant] = await db.insert(s.productVariants).values({ productId: product.id, sku: `WHO-${suffix}`, priceKobo: 100000 }).returning();
  await db.insert(s.wholesalePrices).values({ variantId: variant.id, tier: 'Bronze', unitPriceKobo: 70000, unitsPerCarton: 24, minimumCartons: 1 });
  await adjustStock(db as never, { variantId: variant.id, delta: stock, reason: 'fixture' });
  const items = [{ variantId: variant.id, cartons: 1 }];
  const quote = await quoteWholesale(db as never, user.id, items);
  return { user, partner, location, variant, items, quote };
}
async function purchase(f: Awaited<ReturnType<typeof fixture>>) {
  return (await checkoutWholesale(db as never, f.user.id, `checkout-${f.variant.id}`, { items: f.items, quoteFingerprint: f.quote.quoteFingerprint })).order;
}
async function pay(order: Awaited<ReturnType<typeof purchase>>, userId: string, provider: 'paystack' | 'flutterwave' = 'paystack') {
  const attempt = await initPayment(db as never, { userId, orderId: order.id, provider, appUrl: 'http://localhost:3001', idempotencyKey: `test-payment-${order.id}-${provider}`, fetchFn: async () => new Response(JSON.stringify(provider === 'paystack' ? { status: true, data: { authorization_url: 'https://checkout.paystack.com/test' } } : { status: 'success', data: { link: 'https://checkout.flutterwave.com/test' } })) });
  const fetchFn = async () => new Response(JSON.stringify(provider === 'paystack' ? { status: true, data: { status: 'success', amount: order.totalKobo, currency: 'NGN' } } : { status: 'success', data: { status: 'successful', amount: order.totalKobo / 100, currency: 'NGN', tx_ref: attempt.reference } }));
  const input = { provider, reference: attempt.reference, transactionId: '123', fetchFn };
  expect((await settleAttempt(db as never, input)).settled).toBe(true);
  expect((await settleAttempt(db as never, input)).replay).toBe(true);
  return (await db.select().from(s.payments).where(eq(s.payments.orderId, order.id)))[0];
}
async function level(locationId: string, variantId: string, pool: 'PLATFORM' | 'WHOLESALE') {
  return (await db.select().from(s.stockLevels).where(and(eq(s.stockLevels.locationId, locationId), eq(s.stockLevels.variantId, variantId), eq(s.stockLevels.pool, pool))))[0]?.onHand ?? 0;
}

describe('wholesale inventory and money boundaries', () => {
  it('snapshots prices, replays checkout and payment, and credits only owned stock on receipt', async () => {
    const f = await fixture();
    const order = await purchase(f);
    expect((await purchase(f)).id).toBe(order.id);
    expect(order.items[0].unitPriceKobo).toBe(70000);
    await pay(order, f.user.id);
    expect(await level(s.HQ_LOCATION_ID, f.variant.id, 'PLATFORM')).toBe(216);
    expect(await db.select().from(s.commissionAwards).where(eq(s.commissionAwards.orderId, order.id))).toHaveLength(0);
    expect(await db.select().from(s.loyaltyTxns).where(eq(s.loyaltyTxns.refId, order.id))).toHaveLength(0);
    await transitionOrder(db as never, order.id, 'FULFILLING', { actor: 'admin' });
    await transitionOrder(db as never, order.id, 'SHIPPED', { actor: 'admin' });
    await expect(transitionOrder(db as never, order.id, 'DELIVERED', { actor: 'admin' })).rejects.toThrow();
    await wholesaleOrderAction(db as never, f.user.id, order.id, 'receive');
    await wholesaleOrderAction(db as never, f.user.id, order.id, 'receive');
    expect(await level(f.location.id, f.variant.id, 'WHOLESALE')).toBe(24);
    expect(await level(f.location.id, f.variant.id, 'PLATFORM')).toBe(0);
    expect((await getLevels(db as never, [f.variant.id], f.location.id)).get(f.variant.id)?.available).toBe(0);
    expect((await locateStock(db as never, { city: 'Ota', state: 'Ogun', method: 'PICKUP', items: [{ variantId: f.variant.id, qty: 1 }] })).options).toHaveLength(0);
    const sale = { variantId: f.variant.id, qty: 2, note: 'Direct shop sale' };
    await recordDirectSale(db as never, f.user.id, `sale-${order.id}`, sale);
    await recordDirectSale(db as never, f.user.id, `sale-${order.id}`, sale);
    expect(await level(f.location.id, f.variant.id, 'WHOLESALE')).toBe(22);
    await expect(recordDirectSale(db as never, f.user.id, `sale-${order.id}`, { ...sale, qty: 3 })).rejects.toThrow();
  });

  it('rejects changed terms, wrong owners and oversells without leaving an order', async () => {
    const f = await fixture(23);
    await expect(purchase(f)).rejects.toThrow();
    expect(await db.select().from(s.orders).where(eq(s.orders.userId, f.user.id))).toHaveLength(0);
    await db.update(s.wholesalePrices).set({ unitPriceKobo: 75000 }).where(eq(s.wholesalePrices.variantId, f.variant.id));
    await expect(purchase(f)).rejects.toThrow('terms changed');
    const other = await fixture();
    const order = await purchase(other);
    await expect(wholesaleOrderAction(db as never, f.user.id, order.id, 'cancel')).rejects.toThrow();
    await wholesaleOrderAction(db as never, other.user.id, order.id, 'cancel');
    expect((await getLevels(db as never, [other.variant.id], s.HQ_LOCATION_ID)).get(other.variant.id)?.reserved).toBe(0);
  });

  it('reacquires expired reservations for Flutterwave payment and refunds before dispatch once', async () => {
    const f = await fixture();
    const order = await purchase(f);
    await db.update(s.reservations).set({ expiresAt: new Date(0) }).where(eq(s.reservations.refId, order.id));
    await releaseExpired(db as never);
    const payment = await pay(order, f.user.id, 'flutterwave');
    const refund = await createRefund(db as never, { paymentId: payment.id, amountKobo: payment.amountKobo, reason: 'Cancelled before dispatch', adminId: f.user.id, idempotencyKey: crypto.randomUUID(), fetchFn: async () => new Response(JSON.stringify({ status: 'success', data: { id: 99 } })) });
    expect(refund.status).toBe('pending');
    await reconcileRefund(db as never, { refundId: refund.refundId, adminId: f.user.id, status: 'success', evidence: 'Provider dashboard verified refund 99' });
    expect(await level(s.HQ_LOCATION_ID, f.variant.id, 'PLATFORM')).toBe(240);
    expect(await level(f.location.id, f.variant.id, 'WHOLESALE')).toBe(0);
    await expect(transitionOrder(db as never, order.id, 'FULFILLING', { actor: 'admin' })).rejects.toThrow();
    await expect(createRefund(db as never, { paymentId: payment.id, amountKobo: 1, reason: 'Replay', adminId: f.user.id, idempotencyKey: crypto.randomUUID() })).rejects.toThrow();
  });

  it('does not restore shipped stock on refund; physical returns are separately replay-safe', async () => {
    const f = await fixture();
    const order = await purchase(f);
    const payment = await pay(order, f.user.id);
    await transitionOrder(db as never, order.id, 'FULFILLING', { actor: 'admin' });
    await transitionOrder(db as never, order.id, 'SHIPPED', { actor: 'admin' });
    await wholesaleOrderAction(db as never, f.user.id, order.id, 'receive');
    const refund = await createRefund(db as never, { paymentId: payment.id, amountKobo: payment.amountKobo, reason: 'Return', adminId: f.user.id, idempotencyKey: crypto.randomUUID(), fetchFn: async () => new Response(JSON.stringify({ status: true })) });
    await reconcileRefund(db as never, { refundId: refund.refundId, adminId: f.user.id, status: 'success', evidence: 'Provider dashboard confirms completed refund' });
    expect(await level(s.HQ_LOCATION_ID, f.variant.id, 'PLATFORM')).toBe(216);
    expect(await level(f.location.id, f.variant.id, 'WHOLESALE')).toBe(24);
    await returnWholesaleStock(db as never, order.id, 'All cartons received by HQ');
    await returnWholesaleStock(db as never, order.id, 'All cartons received by HQ');
    expect(await level(s.HQ_LOCATION_ID, f.variant.id, 'PLATFORM')).toBe(240);
    expect(await level(f.location.id, f.variant.id, 'WHOLESALE')).toBe(0);
  });

  it('holds ambiguous provider refund results and prevents a second provider call', async () => {
    const f = await fixture();
    const order = await purchase(f);
    const payment = await pay(order, f.user.id);
    const key = crypto.randomUUID();
    const input = { paymentId: payment.id, amountKobo: payment.amountKobo, reason: 'Customer requested refund', adminId: f.user.id, idempotencyKey: key };
    await expect(createRefund(db as never, { ...input, fetchFn: async () => { throw new Error('provider timeout'); } })).rejects.toThrow();
    const replay = await createRefund(db as never, { ...input, fetchFn: async () => { throw new Error('must not call provider'); } });
    expect(replay).toMatchObject({ replay: true, status: 'pending' });
    await expect(createRefund(db as never, { ...input, idempotencyKey: crypto.randomUUID() })).rejects.toThrow('awaiting reconciliation');
  });

  it('derives creator earnings from snapshotted awards including reversals, not seeded totals', async () => {
    const f = await fixture();
    const [creator] = await db.insert(s.creators).values({ userId: f.user.id, name: 'Test creator', promoCode: `TEST${n}`, commissionRate: 12, verified: true, totalSalesKobo: 99999999 }).returning();
    const [order] = await db.insert(s.orders).values({ userId: f.user.id, creatorId: creator.id, creatorCommissionBps: 1200, orderNumber: `METRIC-${n}`, status: 'PAID', paymentStatus: 'PAID', subtotalKobo: 10000, totalKobo: 10000, shippingAddress: {}, idempotencyKey: `metric-${n}` }).returning();
    await awardOrderCommissions(db as never, order.id);
    await awardOrderCommissions(db as never, order.id);
    await db.update(s.creators).set({ commissionRate: 5 }).where(eq(s.creators.id, creator.id));
    const wallet = await walletFor(db as never, 'CREATOR', creator.id, f.user.id);
    expect(await creatorMetrics(db as never, creator.id, wallet.id)).toMatchObject({ ordersCount: 1, paidMerchandiseKobo: 10000, commissionNetKobo: 1200 });
    await reverseCommissions(db as never, order.id, 5000);
    expect((await creatorMetrics(db as never, creator.id, wallet.id)).commissionNetKobo).toBe(600);
  });
});
