import { randomBytes } from 'node:crypto';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { AppDb, Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { loyaltyAccounts, loyaltyTxns, loyaltyVouchers } from './schema';

/** Earn rule (documented, changeable in one place): 1 point per ₦100 spent. */
export function earnPointsForKobo(totalKobo: number): number {
  return Math.floor(totalKobo / 10000);
}

/** Voucher tiers: points → kobo at ₦1 per point. */
export const VOUCHER_TIERS: Record<number, number> = { 500: 50000, 1000: 100000, 2500: 250000 };

const VOUCHER_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function makeVoucherCode(): string {
  const bytes = randomBytes(6);
  let s = 'GLW-';
  for (const b of bytes) s += VOUCHER_ALPHABET[b % VOUCHER_ALPHABET.length];
  return s;
}

export async function getOrCreateAccount(db: Db, userId: string) {
  const [account] = await db.insert(loyaltyAccounts).values({ userId }).onConflictDoNothing().returning();
  if (account) return account;
  const rows = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.userId, userId)).limit(1);
  return rows[0];
}

/**
 * Credit earn points for a paid order. UNIQUE(account, earn, order, id) makes
 * webhook replays converge — second call credits nothing (returns credited:false).
 */
export async function earnForOrder(db: Db, input: { userId: string; orderId: string; totalKobo: number }) {
  const points = earnPointsForKobo(input.totalKobo);
  if (points <= 0) return { credited: false, points: 0 };
  const account = await getOrCreateAccount(db, input.userId);
  const [txn] = await db
    .insert(loyaltyTxns)
    .values({ accountId: account.userId, points, type: 'earn', refType: 'order', refId: input.orderId, note: `Earned on order ${input.orderId}`.slice(0, 300) })
    .onConflictDoNothing()
    .returning({ id: loyaltyTxns.id });
  if (!txn) return { credited: false, points };
  // Atomic increment (no read-then-write: concurrent webhooks can't lose updates).
  await db.update(loyaltyAccounts).set({ points: sql`${loyaltyAccounts.points} + ${points}`, updatedAt: new Date() }).where(eq(loyaltyAccounts.userId, input.userId));
  return { credited: true, points };
}

export async function redeemToVoucher(db: AppDb, userId: string, points: number) {
  const amountKobo = VOUCHER_TIERS[points];
  if (!amountKobo) throw Errors.badRequest('Choose a valid tier.');
  return db.transaction(async (tx) => {
    const account = await getOrCreateAccount(tx, userId);
    if (account.points < points) throw Errors.badRequest('Insufficient points.');
    const code = makeVoucherCode();
    const [voucher] = await tx
      .insert(loyaltyVouchers)
      .values({ code, userId, amountKobo, minSpendKobo: amountKobo })
      .returning();
    await tx.insert(loyaltyTxns).values({ accountId: userId, points: -points, type: 'redeem', refType: 'voucher', refId: voucher.id, note: `Redeemed ${points}pts → ${code}` });
    // Atomic decrement; the DB CHECK (points >= 0) is the backstop — map it to 422.
    try {
      await tx.update(loyaltyAccounts).set({ points: sql`${loyaltyAccounts.points} - ${points}`, updatedAt: new Date() }).where(eq(loyaltyAccounts.userId, userId));
    } catch (err) {
      if (err instanceof Error && 'code' in err && (err as { code: string }).code === '23514') {
        throw Errors.badRequest('Insufficient points.');
      }
      throw err;
    }
    return voucher;
  });
}

/**
 * Consume a voucher inside the checkout transaction: ownership, active, fresh,
 * min-spend checks; discount capped at the subtotal (never negative totals).
 */
export async function consumeVoucher(
  tx: Db,
  input: { userId?: string; code: string; subtotalKobo: number; orderId: string },
): Promise<{ discountKobo: number; voucherId: string }> {
  const rows = await tx.select().from(loyaltyVouchers).where(eq(loyaltyVouchers.code, input.code.trim().toUpperCase())).for('update').limit(1);
  const v = rows[0];
  if (!v || v.status !== 'active') throw Errors.badRequest('Voucher is invalid or already used.');
  if (input.userId && v.userId !== input.userId) throw Errors.badRequest('Voucher does not belong to this account.');
  if (v.expiresAt && v.expiresAt < new Date()) throw Errors.badRequest('Voucher has expired.');
  if (input.subtotalKobo < v.minSpendKobo) throw Errors.badRequest('Order does not meet the voucher minimum spend.');
  const discountKobo = Math.min(v.amountKobo, input.subtotalKobo);
  await tx.update(loyaltyVouchers).set({ status: 'redeemed', redeemedOrderId: input.orderId }).where(eq(loyaltyVouchers.id, v.id));
  return { discountKobo, voucherId: v.id };
}

export async function getLoyaltyView(db: Db, userId: string) {
  const account = await getOrCreateAccount(db, userId);
  const [vouchers, txns] = await Promise.all([
    db.select().from(loyaltyVouchers).where(eq(loyaltyVouchers.userId, userId)).orderBy(desc(loyaltyVouchers.createdAt)).limit(20),
    db.select().from(loyaltyTxns).where(eq(loyaltyTxns.accountId, userId)).orderBy(desc(loyaltyTxns.createdAt)).limit(20),
  ]);
  return { points: account.points, vouchers, activity: txns, tiers: Object.entries(VOUCHER_TIERS).map(([points, amountKobo]) => ({ points: Number(points), amountKobo })) };
}

export async function adjustPoints(db: AppDb, adminId: string, input: { userId: string; points: number; note: string }) {
  return db.transaction(async (tx) => {
    const account = await getOrCreateAccount(tx, input.userId);
    if (account.points + input.points < 0) throw Errors.badRequest('Adjustment would drive the balance negative.');
    await tx.insert(loyaltyTxns).values({ accountId: input.userId, points: input.points, type: 'adjust', refType: 'admin', refId: adminId, note: input.note.slice(0, 300) });
    try {
      await tx.update(loyaltyAccounts).set({ points: sql`${loyaltyAccounts.points} + ${input.points}`, updatedAt: new Date() }).where(eq(loyaltyAccounts.userId, input.userId));
    } catch (err) {
      if (err instanceof Error && 'code' in err && (err as { code: string }).code === '23514') {
        throw Errors.badRequest('Adjustment would drive the balance negative.');
      }
      throw err;
    }
    const after = await tx.select({ points: loyaltyAccounts.points }).from(loyaltyAccounts).where(eq(loyaltyAccounts.userId, input.userId)).limit(1);
    return { points: after[0]?.points ?? 0 };
  });
}
