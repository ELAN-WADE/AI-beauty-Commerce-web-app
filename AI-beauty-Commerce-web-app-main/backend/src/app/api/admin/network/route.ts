import { NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { requirePerm } from '@/lib/admin';
import { hasPermission } from '@/lib/permissions';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { audit } from '@/modules/audit/service';
import { users, userRoles } from '@/modules/auth/schema';
import { creators } from '@/modules/creators/schema';
import { distributors } from '@/modules/distributors/schema';
import { inventoryLocations, restockRequests, stockLevels, stockTransfers } from '@/modules/inventory/schema';
import { adjustStock } from '@/modules/inventory/service';
import { dispatchTransfer, receiveTransfer } from '@/modules/inventory/transfers';
import { productVariants, products } from '@/modules/catalog/schema';
import { partnerBankAccounts, walletAccounts, withdrawalRequests } from '@/modules/ledger/schema';
import { reviewWithdrawal } from '@/modules/ledger/service';
import { networkCommand } from '@/modules/partners/validation';
import { wholesalePrices } from '@/modules/wholesale/schema';
import { returnWholesaleStock } from '@/modules/wholesale/lifecycle';
import { orders } from '@/modules/orders/schema';

export const GET = api(async ({ req }) => {
  if (!checkRateLimit(`network:${clientIp(req)}`, Limits.admin).allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const auth = await requirePerm(db, 'network:manage');
  const finance = await hasPermission(db, auth.userId, 'payouts:manage');
  const [locations, stock, partners, affiliates, customers, transfers, restocks, banks, withdrawals] = await Promise.all([
    db.select().from(inventoryLocations).orderBy(inventoryLocations.code).limit(200),
    db.select({ pool: stockLevels.pool, locationId: stockLevels.locationId, variantId: stockLevels.variantId, sku: productVariants.sku, name: products.name, onHand: stockLevels.onHand, reserved: stockLevels.reserved }).from(stockLevels).innerJoin(productVariants, eq(productVariants.id, stockLevels.variantId)).innerJoin(products, eq(products.id, productVariants.productId)).limit(2000),
    db.select().from(distributors).limit(200), db.select().from(creators).limit(200),
    db.select({ id: users.id, email: users.email }).from(users).limit(200),
    db.select().from(stockTransfers).orderBy(desc(stockTransfers.dispatchedAt)).limit(100),
    db.select().from(restockRequests).orderBy(desc(restockRequests.createdAt)).limit(100),
    finance ? db.select().from(partnerBankAccounts).orderBy(desc(partnerBankAccounts.createdAt)).limit(100) : Promise.resolve([]),
    finance ? db.select().from(withdrawalRequests).orderBy(desc(withdrawalRequests.createdAt)).limit(100) : Promise.resolve([]),
  ]);
  const variants = await db.select({ id: productVariants.id, sku: productVariants.sku, size: productVariants.sizeLabel, name: products.name }).from(productVariants).innerJoin(products, eq(products.id, productVariants.productId)).limit(1000);
  const prices = await db.select().from(wholesalePrices).limit(1500);
  const wholesaleOrders = await db.select({ id: orders.id, orderNumber: orders.orderNumber, status: orders.status, paymentStatus: orders.paymentStatus, totalKobo: orders.totalKobo, destinationId: orders.wholesaleLocationId, dispatchedAt: orders.wholesaleDispatchedAt, receivedAt: orders.wholesaleReceivedAt, returnedAt: orders.wholesaleReturnedAt }).from(orders).where(eq(orders.kind, 'WHOLESALE')).orderBy(desc(orders.createdAt)).limit(50);
  return NextResponse.json({ locations, stock, partners, creators: affiliates, users: customers, variants, transfers, restocks, banks, withdrawals, finance, wholesalePrices: prices, wholesaleOrders });
});

export const POST = api(async ({ req, requestId }) => {
  if (!checkRateLimit(`network-write:${clientIp(req)}`, Limits.admin).allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const input = networkCommand.parse(await readJson(req));
  const auth = await requirePerm(db, ['verifyBank', 'payout'].includes(input.action) ? 'payouts:manage' : 'network:manage');
  const result = await db.transaction(async tx => {
    let result: unknown;
    if (input.action === 'wholesalePrice') {
      const { action, ...price } = input;
      [result] = await tx.insert(wholesalePrices).values(price).onConflictDoUpdate({ target: [wholesalePrices.variantId, wholesalePrices.tier], set: { ...price, updatedAt: new Date() } }).returning();
    } else if (input.action === 'wholesaleReturn') {
      result = await returnWholesaleStock(tx, input.orderId, input.evidence);
    } else if (input.action === 'location') {
      const { action, id, ...fields } = input;
      if (fields.type === 'DISTRIBUTOR' && !fields.distributorId) throw Errors.badRequest('Distributor locations need an approved partner.');
      if (fields.distributorId) {
        const [partner] = await tx.select().from(distributors).where(eq(distributors.id, fields.distributorId));
        if (!partner?.verified || (fields.isActive && !partner.userId)) throw Errors.badRequest('Link an approved partner account before activating this location.');
      }
      if (fields.pickupEnabled && (!fields.phone || !fields.operatingHours)) throw Errors.badRequest('Pickup requires a phone number and operating hours.');
      if (id) {
        const [existing] = await tx.select().from(inventoryLocations).where(eq(inventoryLocations.id, id)).for('update');
        if (!existing) throw Errors.notFound();
        if (existing.distributorId !== fields.distributorId) throw Errors.badRequest('Location ownership is fixed; create a new location for another partner.');
        [result] = await tx.update(inventoryLocations).set(fields).where(eq(inventoryLocations.id, id)).returning();
      } else [result] = await tx.insert(inventoryLocations).values(fields).returning();
    } else if (input.action === 'link') {
      const table = input.kind === 'CREATOR' ? creators : distributors;
      const [partner] = await tx.select().from(table).where(eq(table.id, input.partnerId)).for('update');
      if (!partner) throw Errors.notFound('Partner not found.');
      const [owner] = await tx.select({ id: users.id }).from(users).where(eq(users.id, input.userId));
      if (!owner) throw Errors.notFound('Account not found.');
      const [wallet] = await tx.select().from(walletAccounts).where(input.kind === 'CREATOR' ? eq(walletAccounts.creatorId, partner.id) : eq(walletAccounts.distributorId, partner.id));
      if (wallet && wallet.userId !== input.userId) throw Errors.conflict('Existing financial ownership cannot be reassigned here.');
      if (input.kind === 'CREATOR') {
        if (input.commissionBps % 100) throw Errors.badRequest('Creator rates currently use whole percentages.');
        await tx.update(creators).set({ userId: input.userId, commissionRate: input.commissionBps / 100 }).where(eq(creators.id, partner.id));
      } else await tx.update(distributors).set({ userId: input.userId, commissionBps: input.commissionBps, ...(input.tier ? { tier: input.tier } : {}) }).where(eq(distributors.id, partner.id));
      await tx.insert(userRoles).values({ userId: input.userId, roleId: input.kind, grantedBy: auth.userId }).onConflictDoNothing();
      result = { linked: true };
    } else if (input.action === 'adjust') {
      result = await adjustStock(tx, { ...input, refType: 'admin', refId: auth.userId });
    } else if (input.action === 'transfer') {
      const key = req.headers.get('Idempotency-Key');
      if (!key || key.length < 8 || key.length > 128) throw Errors.badRequest('Idempotency-Key is required.');
      result = await dispatchTransfer(tx, auth.userId, key, input);
    } else if (input.action === 'receive') result = await receiveTransfer(tx, input.transferId, auth.userId);
    else if (input.action === 'payout') result = await reviewWithdrawal(tx, auth.userId, input);
    else if (input.action === 'verifyBank') {
      const [bank] = await tx.select().from(partnerBankAccounts).where(eq(partnerBankAccounts.id, input.bankAccountId)).for('update');
      if (!bank) throw Errors.notFound();
      [result] = await tx.update(partnerBankAccounts).set({ verifiedBy: auth.userId, verifiedAt: new Date(), verificationNote: input.evidence }).where(eq(partnerBankAccounts.id, bank.id)).returning({ id: partnerBankAccounts.id });
    } else {
      const [request] = await tx.select().from(restockRequests).where(eq(restockRequests.id, input.id)).for('update');
      if (!request) throw Errors.notFound();
      const allowed: Record<string, string[]> = { REQUESTED: ['APPROVED', 'REJECTED'], APPROVED: ['FULFILLED', 'REJECTED'] };
      if (request.status !== input.status && !allowed[request.status]?.includes(input.status)) throw Errors.conflict('Invalid restock transition.');
      [result] = await tx.update(restockRequests).set({ status: input.status }).where(eq(restockRequests.id, input.id)).returning();
    }
    // Bank numbers and collection codes never enter the general audit log.
    await audit(tx, { actorId: auth.userId, action: `network.${input.action}`, entityType: 'network', after: { action: input.action, detail: input.action === 'payout' ? input.status : undefined }, requestId });
    return result;
  });
  return NextResponse.json({ result });
});
