import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import type { AppDb, Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { creatorApplications, creators } from './schema';
import { contentRewardTotals } from '../content-rewards/service';
import { userRoles } from '../auth/schema';
import { orders } from '../orders/schema';
import { payments, refunds } from '../payments/schema';
import { commissionAwards } from '../ledger/schema';

/** Pure: affiliate discount in kobo (capped at subtotal by the caller). */
export function creatorDiscountKobo(subtotalKobo: number, discountPercent: number): number {
  if (subtotalKobo <= 0 || discountPercent <= 0) return 0;
  return Math.min(subtotalKobo, Math.round((subtotalKobo * Math.min(50, discountPercent)) / 100));
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function validateCode(db: Db, code: string) {
  const rows = await db.select().from(creators).where(eq(creators.promoCode, normalizeCode(code))).limit(1);
  const creator = rows[0];
  if (!creator || !creator.verified) throw Errors.notFound('Creator code not found.');
  return {
    id: creator.id,
    userId: creator.userId,
    commissionBps: creator.commissionRate * 100,
    name: creator.name,
    handle: creator.handle,
    promoCode: creator.promoCode,
    discountPercent: creator.discountPercent,
  };
}

export async function listCreators(db: Db, limit = 20) {
  return db
    .select({
      name: creators.name,
      handle: creators.handle,
      platform: creators.platform,
      niche: creators.niche,
      avatarUrl: creators.avatarUrl,
      promoCode: creators.promoCode,
      discountPercent: creators.discountPercent,
    })
    .from(creators)
    .where(eq(creators.verified, true))
    .orderBy(asc(creators.name), asc(creators.promoCode))
    .limit(Math.min(50, Math.max(1, limit)));
}

/** Click tracking (best-effort attribution funnel; never blocks). */
export async function trackClick(db: AppDb, code: string): Promise<void> {
  await db
    .update(creators)
    .set({ clicks: sql`${creators.clicks} + 1` })
    .where(eq(creators.promoCode, normalizeCode(code)));
}

export async function submitApplication(db: AppDb, userId: string | undefined, input: { name: string; handle: string; platform: 'Instagram' | 'TikTok' | 'YouTube'; niche: string }) {
  const [row] = await db.insert(creatorApplications).values({ ...input, userId: userId ?? null }).returning();
  return row;
}

export async function listApplications(db: AppDb, status?: string) {
  return db
    .select()
    .from(creatorApplications)
    .where(status ? eq(creatorApplications.status, status) : undefined)
    .orderBy(desc(creatorApplications.createdAt))
    .limit(100);
}

export async function reviewApplication(
  db: Db,
  input: { applicationId: string; adminId: string; approve: boolean; promoCode?: string; discountPercent: number; commissionRate: number; note: string },
) {
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(creatorApplications).where(eq(creatorApplications.id, input.applicationId)).for('update').limit(1);
    const app = rows[0];
    if (!app) throw Errors.notFound('Application not found.');
    if (app.userId && app.userId === input.adminId) throw Errors.forbidden('You cannot review your own application.');
    if (app.status !== 'pending') throw Errors.conflict('Application already reviewed.');
    let creatorId: string | null = null;
    if (input.approve) {
      const code = normalizeCode(input.promoCode ?? '');
      const [c] = await tx
        .insert(creators)
        .values({
          userId: app.userId,
          name: app.name,
          handle: app.handle,
          platform: app.platform,
          niche: app.niche,
          promoCode: code,
          discountPercent: input.discountPercent,
          commissionRate: input.commissionRate,
          verified: true,
        })
        .onConflictDoNothing()
        .returning({ id: creators.id });
      if (!c) throw Errors.conflict('Promo code already taken.');
      creatorId = c.id;
      if (app.userId) await tx.insert(userRoles).values({ userId: app.userId, roleId: 'CREATOR', grantedBy: input.adminId }).onConflictDoNothing();
    }
    await tx
      .update(creatorApplications)
      .set({ status: input.approve ? 'approved' : 'rejected', reviewedBy: input.adminId, reviewNote: input.note, updatedAt: new Date() })
      .where(eq(creatorApplications.id, app.id));
    return { applicationId: app.id, status: input.approve ? 'approved' : 'rejected', creatorId };
  });
}

/** Financial display metrics are derived, never the seeded legacy counters. */
export async function creatorMetrics(db: Db, creatorId: string, walletId: string) {
  const [sales] = await db.select({
    ordersCount: sql<number>`count(*)::int`,
    paidMerchandiseKobo: sql<string>`coalesce(sum(${orders.subtotalKobo} - ${orders.discountKobo}), 0)::text`,
  }).from(orders).where(and(eq(orders.creatorId, creatorId), eq(orders.kind, 'RETAIL'), inArray(orders.paymentStatus, ['PAID', 'REFUNDED'])));
  const [returned] = await db.select({ refundedKobo: sql<string>`coalesce(sum(${refunds.amountKobo}), 0)::text` }).from(refunds)
    .innerJoin(payments, eq(payments.id, refunds.paymentId)).innerJoin(orders, eq(orders.id, payments.orderId))
    .where(and(eq(orders.creatorId, creatorId), eq(refunds.status, 'success')));
  const [earnings] = await db.select({ commissionNetKobo: sql<string>`coalesce(sum(${commissionAwards.amountKobo} - ${commissionAwards.reversedKobo}), 0)::text` })
    .from(commissionAwards).where(eq(commissionAwards.walletId, walletId));
  const content = await contentRewardTotals(db, walletId);
  return { ordersCount: sales.ordersCount, paidMerchandiseKobo: Number(sales.paidMerchandiseKobo), refundedKobo: Number(returned.refundedKobo), commissionNetKobo: Number(earnings.commissionNetKobo), ...content };
}
