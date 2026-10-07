import { createHash } from 'node:crypto';
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import type { AppDb, Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { orders } from '../orders/schema';
import { creators } from '../creators/schema';
import { distributors } from '../distributors/schema';
import { commissionAwards, ledgerEntries, ledgerJournals, partnerBankAccounts, walletAccounts, withdrawalRequests } from './schema';

export type PartnerKind = 'DISTRIBUTOR' | 'CREATOR';
export type Bucket = 'PENDING' | 'AVAILABLE' | 'HELD' | 'PLATFORM';
type Posting = { walletId: string | null; bucket: Bucket; amountKobo: number };
export function safeMoney(value: number): number {
  if (!Number.isSafeInteger(value)) throw Errors.badRequest('Invalid money amount.');
  return value;
}
export function commissionFor(base: number, bps: number): number {
  if (safeMoney(base) < 0 || !Number.isInteger(bps) || bps < 0 || bps > 5000) throw Errors.badRequest('Invalid commission inputs.');
  return Number(BigInt(base) * BigInt(bps) / 10000n);
}
export function cumulativeReversal(earned: number, refunded: number, total: number): number {
  if (safeMoney(earned) < 0 || safeMoney(refunded) < 0 || safeMoney(total) <= 0) throw Errors.badRequest('Invalid refund inputs.');
  return Number(BigInt(earned) * BigInt(Math.min(refunded, total)) / BigInt(total));
}
function policy(name: string, fallback: number, max: number) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < 0 || value > max) throw new Error(`Invalid ${name}`);
  return value;
}
export const minimumPayout = () => Math.max(1, policy('MIN_PAYOUT_KOBO', 1_000_000, 100_000_000));

export async function postJournal(db: Db, eventKey: string, description: string, postings: Posting[]): Promise<boolean> {
  const entries = postings.filter(p => p.amountKobo !== 0);
  if (entries.length < 2 || entries.reduce((s, p) => s + BigInt(safeMoney(p.amountKobo)), 0n) !== 0n) {
    throw Errors.badRequest('Journal must have balanced postings.');
  }
  const fingerprint = createHash('sha256').update(JSON.stringify(entries)).digest('hex');
  const [journal] = await db.insert(ledgerJournals).values({ eventKey, description, fingerprint }).onConflictDoNothing().returning();
  if (!journal) {
    const [prior] = await db.select().from(ledgerJournals).where(eq(ledgerJournals.eventKey, eventKey));
    if (prior.fingerprint !== fingerprint) throw Errors.conflict('Financial event changed on replay.');
    return false;
  }
  await db.insert(ledgerEntries).values(entries.map(p => ({ journalId: journal.id, ...p })));
  return true;
}

export async function walletFor(db: Db, kind: PartnerKind, ownerId: string, userId: string) {
  const owner = kind === 'CREATOR' ? { creatorId: ownerId } : { distributorId: ownerId };
  const [created] = await db.insert(walletAccounts).values({ userId, ...owner }).onConflictDoNothing().returning();
  const wallet = created ?? (await db.select().from(walletAccounts).where(kind === 'CREATOR' ? eq(walletAccounts.creatorId, ownerId) : eq(walletAccounts.distributorId, ownerId)))[0];
  if (!wallet || wallet.userId !== userId) throw Errors.conflict('Partner wallet ownership requires reconciliation.');
  return wallet;
}

export async function lockWallet(db: Db, walletId: string, userId?: string) {
  const [wallet] = await db.select().from(walletAccounts).where(and(eq(walletAccounts.id, walletId), userId ? eq(walletAccounts.userId, userId) : undefined)).for('update');
  if (!wallet) throw Errors.notFound('Wallet not found.');
  return wallet;
}
export async function balances(db: Db, walletId: string) {
  const sums = await db.select({ bucket: ledgerEntries.bucket, amount: sql<string>`sum(${ledgerEntries.amountKobo})::text` }).from(ledgerEntries).where(eq(ledgerEntries.walletId, walletId)).groupBy(ledgerEntries.bucket);
  const result = { pendingKobo: 0, availableKobo: 0, heldKobo: 0 };
  for (const row of sums) {
    const amount = safeMoney(Number(row.amount));
    if (row.bucket === 'PENDING') result.pendingKobo = amount;
    if (row.bucket === 'AVAILABLE') result.availableKobo = amount;
    if (row.bucket === 'HELD') result.heldKobo = amount;
  }
  return result;
}

/**
 * Award commissions for a paid order. All recipients settle in ONE transaction:
 * a crash mid-loop can never leave creator-paid-but-distributor-unpaid.
 * Idempotent per (order, wallet) + journal eventKey — worker replays converge.
 */
export async function awardOrderCommissions(db: AppDb, orderId: string) {
  return db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId));
    if (!order || order.paymentStatus !== 'PAID') throw Errors.conflict('Commission requires verified payment.');
    if (order.kind === 'WHOLESALE') return;
    const recipients: { walletId: string; bps: number }[] = [];
    if (order.creatorId && order.creatorCommissionBps) {
      const [creator] = await tx.select().from(creators).where(eq(creators.id, order.creatorId));
      if (creator?.userId) recipients.push({ walletId: (await walletFor(tx, 'CREATOR', creator.id, creator.userId)).id, bps: order.creatorCommissionBps });
    }
    if (order.distributorId && order.distributorCommissionBps) {
      const [partner] = await tx.select().from(distributors).where(eq(distributors.id, order.distributorId));
      if (partner?.userId) recipients.push({ walletId: (await walletFor(tx, 'DISTRIBUTOR', partner.id, partner.userId)).id, bps: order.distributorCommissionBps });
    }
    for (const recipient of recipients.sort((a, b) => a.walletId.localeCompare(b.walletId))) {
      await lockWallet(tx, recipient.walletId);
      const amount = commissionFor(Math.max(0, order.subtotalKobo - order.discountKobo), recipient.bps);
      if (!amount) continue;
      const [award] = await tx.insert(commissionAwards).values({ orderId, walletId: recipient.walletId, amountKobo: amount, holdDays: policy('COMMISSION_HOLD_DAYS', 14, 365) }).onConflictDoNothing().returning();
      if (!award) continue;
      await postJournal(tx, `commission:${orderId}:${recipient.walletId}`, `Commission on ${order.orderNumber}`, [
        { walletId: recipient.walletId, bucket: 'PENDING', amountKobo: amount },
        { walletId: null, bucket: 'PLATFORM', amountKobo: -amount },
      ]);
    }
  });
}

export async function reverseCommissions(db: Db, orderId: string, refundedKobo: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order) throw Errors.notFound();
  const awards = await db.select().from(commissionAwards).where(eq(commissionAwards.orderId, orderId)).orderBy(asc(commissionAwards.walletId));
  for (const a of awards) {
    await lockWallet(db, a.walletId);
    const [award] = await db.select().from(commissionAwards).where(eq(commissionAwards.id, a.id)).for('update');
    const reversed = cumulativeReversal(award.amountKobo, refundedKobo, order.totalKobo);
    const delta = reversed - award.reversedKobo;
    if (delta <= 0) continue;
    await postJournal(db, `reversal:${award.id}:${reversed}`, `Commission reversal on ${order.orderNumber}`, [
      { walletId: award.walletId, bucket: award.releasedAt ? 'AVAILABLE' : 'PENDING', amountKobo: -delta },
      { walletId: null, bucket: 'PLATFORM', amountKobo: delta },
    ]);
    await db.update(commissionAwards).set({ reversedKobo: reversed }).where(eq(commissionAwards.id, award.id));
  }
}

export async function releaseCommissions(db: Db) {
  const candidates = await db.select({ id: commissionAwards.id, orderId: orders.id }).from(commissionAwards)
    .innerJoin(orders, eq(orders.id, commissionAwards.orderId))
    .where(and(isNull(commissionAwards.releasedAt), eq(orders.status, 'DELIVERED'), sql`${orders.deliveredAt} + ${commissionAwards.holdDays} * interval '1 day' <= now()`)).limit(100);
  let released = 0;
  for (const candidate of candidates) await db.transaction(async tx => {
    // Same lock order as refunds: order -> wallet -> award.
    const [order] = await tx.select().from(orders).where(eq(orders.id, candidate.orderId)).for('update');
    if (order.status !== 'DELIVERED' || order.paymentStatus !== 'PAID') return;
    const pendingRefund = await tx.execute(sql`select 1 from refunds r join payments p on p.id=r.payment_id where p.order_id=${order.id} and r.status='pending' limit 1`);
    if (pendingRefund.length) return;
    const [a] = await tx.select().from(commissionAwards).where(eq(commissionAwards.id, candidate.id));
    await lockWallet(tx, a.walletId);
    const [award] = await tx.select().from(commissionAwards).where(eq(commissionAwards.id, a.id)).for('update');
    if (award.releasedAt) return;
    const amount = award.amountKobo - award.reversedKobo;
    if (amount > 0) await postJournal(tx, `release:${award.id}`, `Commission cleared for ${order.orderNumber}`, [
      { walletId: award.walletId, bucket: 'PENDING', amountKobo: -amount },
      { walletId: award.walletId, bucket: 'AVAILABLE', amountKobo: amount },
    ]);
    await tx.update(commissionAwards).set({ releasedAt: new Date() }).where(eq(commissionAwards.id, award.id));
    released++;
  });
  return released;
}

export async function walletView(db: Db, walletId: string, userId: string) {
  const [wallet] = await db.select().from(walletAccounts).where(and(eq(walletAccounts.id, walletId), eq(walletAccounts.userId, userId)));
  if (!wallet) throw Errors.notFound();
  const [balance, entries, banks, withdrawals] = await Promise.all([
    balances(db, walletId),
    db.select({ id: ledgerEntries.id, bucket: ledgerEntries.bucket, amountKobo: ledgerEntries.amountKobo, description: ledgerJournals.description, createdAt: ledgerJournals.createdAt }).from(ledgerEntries).innerJoin(ledgerJournals, eq(ledgerJournals.id, ledgerEntries.journalId)).where(eq(ledgerEntries.walletId, walletId)).orderBy(desc(ledgerJournals.createdAt), desc(ledgerEntries.id)).limit(100),
    db.select().from(partnerBankAccounts).where(eq(partnerBankAccounts.walletId, walletId)).limit(20),
    db.select().from(withdrawalRequests).where(eq(withdrawalRequests.walletId, walletId)).orderBy(desc(withdrawalRequests.createdAt)).limit(50),
  ]);
  return { id: walletId, currency: 'NGN', ...balance, minimumPayoutKobo: minimumPayout(), holdDays: policy('COMMISSION_HOLD_DAYS', 14, 365), entries, banks: banks.map(({ accountNumber, verificationNote, ...b }) => ({ ...b, maskedNumber: `••••••${accountNumber.slice(-4)}` })), withdrawals };
}

export async function requestWithdrawal(db: Db, userId: string, key: string, input: { walletId: string; bankAccountId: string; amountKobo: number }) {
  return db.transaction(async tx => {
    await lockWallet(tx, input.walletId, userId);
    const [prior] = await tx.select().from(withdrawalRequests).where(eq(withdrawalRequests.idempotencyKey, key));
    if (prior) {
      if (prior.walletId !== input.walletId || prior.bankAccountId !== input.bankAccountId || prior.amountKobo !== input.amountKobo) throw Errors.conflict('Idempotency key reused with different input.');
      return prior;
    }
    if (safeMoney(input.amountKobo) < minimumPayout()) throw Errors.badRequest('Amount is below the minimum payout.');
    const [bank] = await tx.select().from(partnerBankAccounts).where(and(eq(partnerBankAccounts.id, input.bankAccountId), eq(partnerBankAccounts.walletId, input.walletId)));
    if (!bank?.verifiedAt) throw Errors.badRequest('Choose a verified bank account.');
    if ((await balances(tx, input.walletId)).availableKobo < input.amountKobo) throw Errors.badRequest('Insufficient available earnings.');
    const [request] = await tx.insert(withdrawalRequests).values({ ...input, idempotencyKey: key }).returning();
    await postJournal(tx, `withdrawal.hold:${request.id}`, 'Payout requested — funds held', [
      { walletId: input.walletId, bucket: 'AVAILABLE', amountKobo: -input.amountKobo },
      { walletId: input.walletId, bucket: 'HELD', amountKobo: input.amountKobo },
    ]);
    return request;
  });
}

export async function reviewWithdrawal(db: Db, actorId: string, input: { id: string; status: 'APPROVED' | 'PROCESSING' | 'PAID' | 'REJECTED' | 'FAILED'; evidence: string; paymentReference?: string }) {
  return db.transaction(async tx => {
    const [preview] = await tx.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, input.id));
    if (!preview) throw Errors.notFound();
    await lockWallet(tx, preview.walletId);
    const [request] = await tx.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, input.id)).for('update');
    if (request.status === input.status) {
      if (input.status === 'PAID' && request.paymentReference !== input.paymentReference) throw Errors.conflict('Payout already recorded with another reference.');
      return request;
    }
    const transitions: Record<string, string[]> = { REQUESTED: ['APPROVED', 'REJECTED'], APPROVED: ['PROCESSING', 'REJECTED'], PROCESSING: ['PAID', 'FAILED'] };
    if (!transitions[request.status]?.includes(input.status)) throw Errors.conflict('Invalid payout transition.');
    if (!input.evidence.trim()) throw Errors.badRequest('Reconciliation evidence is required.');
    if (['APPROVED', 'PROCESSING'].includes(input.status) && (await balances(tx, request.walletId)).availableKobo < 0) throw Errors.conflict('Refund balance must be reconciled before payout.');
    if (input.status === 'PAID' && !input.paymentReference?.trim()) throw Errors.badRequest('Actual bank transfer reference is required.');
    if (['PAID', 'REJECTED', 'FAILED'].includes(input.status)) await postJournal(tx, `withdrawal.close:${request.id}`, `Payout ${input.status.toLowerCase()}`, [
      { walletId: request.walletId, bucket: 'HELD', amountKobo: -request.amountKobo },
      { walletId: input.status === 'PAID' ? null : request.walletId, bucket: input.status === 'PAID' ? 'PLATFORM' : 'AVAILABLE', amountKobo: request.amountKobo },
    ]);
    const [updated] = await tx.update(withdrawalRequests).set({ status: input.status, reviewedBy: actorId, evidence: input.evidence, paymentReference: input.paymentReference ?? request.paymentReference, updatedAt: new Date() }).where(eq(withdrawalRequests.id, request.id)).returning();
    return updated;
  });
}
