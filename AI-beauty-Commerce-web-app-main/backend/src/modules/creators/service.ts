import { desc, eq, sql } from 'drizzle-orm';
import type { AppDb, Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { creatorApplications, creators } from './schema';

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
    .orderBy(desc(creators.ordersCount))
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
  db: AppDb,
  input: { applicationId: string; adminId: string; approve: boolean; promoCode?: string; discountPercent: number; commissionRate: number; note: string },
) {
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(creatorApplications).where(eq(creatorApplications.id, input.applicationId)).for('update').limit(1);
    const app = rows[0];
    if (!app) throw Errors.notFound('Application not found.');
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
    }
    await tx
      .update(creatorApplications)
      .set({ status: input.approve ? 'approved' : 'rejected', reviewedBy: input.adminId, reviewNote: input.note, updatedAt: new Date() })
      .where(eq(creatorApplications.id, app.id));
    return { applicationId: app.id, status: input.approve ? 'approved' : 'rejected', creatorId };
  });
}

/** Called on verified payment: attribute sales + commission (idempotent per order). */
export async function recordAttributedSale(db: Db, promoCode: string | null, orderTotalKobo: number): Promise<void> {
  if (!promoCode) return;
  const rows = await db.select().from(creators).where(eq(creators.promoCode, normalizeCode(promoCode))).limit(1);
  const creator = rows[0];
  if (!creator || !creator.verified) return;
  const commission = Math.round((orderTotalKobo * creator.commissionRate) / 100);
  // Atomic increments: concurrent settlements can't lose sales.
  await db
    .update(creators)
    .set({
      totalSalesKobo: sql`${creators.totalSalesKobo} + ${orderTotalKobo}`,
      commissionEarnedKobo: sql`${creators.commissionEarnedKobo} + ${commission}`,
      ordersCount: sql`${creators.ordersCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(creators.id, creator.id));
}
