import {partnerReferrals} from '../referrals/schema';
import {validateReferral} from '../referrals/service';
import { enqueuePartnerReviewEmail } from '../partners/email';
import { getTableColumns, and, asc, desc, eq, inArray, sql } from 'drizzle-orm';

import type { AppDb, Db } from '../../db/client';

import { Errors } from '../../lib/errors';

import { creatorApplications, creators } from './schema';

import { contentRewardTotals } from '../content-rewards/service';

import { userRoles, users } from '../auth/schema';

import { orders } from '../orders/schema';

import { payments, refunds } from '../payments/schema';

import { commissionAwards } from '../ledger/schema';

import { walletFor } from '../ledger/service';



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

  if (!creator) {
    const referral=await validateReferral(db,normalizeCode(code));
    return {id:referral.id,userId:referral.userId,commissionBps:referral.commissionBps,name:'Influencer / Ambassador',handle:'',promoCode:referral.code,discountPercent:0,recipientKind:'INFLUENCER' as const};
  }
  if (!creator.verified) throw Errors.notFound('Creator code not found.');
  if(/^IA[A-F0-9]{32}$/.test(creator.promoCode)){const [conflict]=await db.select().from(partnerReferrals).where(eq(partnerReferrals.code,creator.promoCode));if(conflict)throw Errors.conflict('Ambiguous partner code.');}

  return {

    id: creator.id,
    recipientKind: 'CREATOR' as const,

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

  if (!userId) throw Errors.unauthorized('Sign in before submitting a partner application.');

  return db.transaction(async tx => {

    const [account] = await tx.select().from(users).where(eq(users.id, userId)).for('update');

    if (!account?.emailVerifiedAt) throw Errors.forbidden('Verify your email before applying.');

    const [approved] = await tx.select({ id: creators.id }).from(creators).where(and(eq(creators.userId, userId), eq(creators.verified, true))).limit(1);

    if (approved) throw Errors.conflict('Your partner account is already approved. Refresh your session.');

    const [pending] = await tx.select().from(creatorApplications).where(and(eq(creatorApplications.userId, userId), eq(creatorApplications.status, 'pending'))).limit(1);

    if (pending) return pending;

    const [row] = await tx.insert(creatorApplications).values({ ...input, userId }).returning();

    return row;

  });

}



export async function listApplications(db: AppDb, status?: string) {

  return db

    .select({ ...getTableColumns(creatorApplications), email: users.email, emailVerifiedAt: users.emailVerifiedAt })

    .from(creatorApplications)

    .leftJoin(users, eq(users.id, creatorApplications.userId))

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

      if (!app.userId) throw Errors.conflict('This request has no linked account. The applicant must sign in and submit a new application.');

      const [account] = await tx.select().from(users).where(eq(users.id, app.userId)).for('update');

      if (!account?.emailVerifiedAt) throw Errors.conflict('The applicant must verify their email before approval.');

      const [existing] = await tx.select({ id: creators.id }).from(creators).where(eq(creators.userId, app.userId)).limit(1);

      if (existing) throw Errors.conflict('A partner profile already exists for this account.');

      let code = normalizeCode(input.promoCode ?? '');

      if (!code) {

        const base = (app.handle || app.name || 'GLOW').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8) || 'CREATOR';

        code = `${base}10`;

      }

      if(/^IA[A-F0-9]{32}$/.test(code))throw Errors.badRequest('This code format is reserved for influencer and ambassador referrals.');
      let finalCode = code;

      let candidate = await tx.select({ id: creators.id }).from(creators).where(eq(creators.promoCode, finalCode)).limit(1);

      let attempt = 1;

      while (candidate.length > 0 && attempt <= 5) {

        finalCode = `${code}${Math.floor(10 + Math.random() * 90)}`;

        candidate = await tx.select({ id: creators.id }).from(creators).where(eq(creators.promoCode, finalCode)).limit(1);

        attempt++;

      }

      const [c] = await tx

        .insert(creators)

        .values({

          userId: app.userId,

          name: app.name,

          handle: app.handle,

          platform: app.platform,

          niche: app.niche,

          promoCode: finalCode,

          discountPercent: input.discountPercent,

          commissionRate: input.commissionRate,

          verified: true,

        })

        .onConflictDoNothing()

        .returning({ id: creators.id });

      if (!c) throw Errors.conflict('Promo code already taken.');

      creatorId = c.id;

      if (app.userId) {

        await tx.insert(userRoles).values({ userId: app.userId, roleId: 'CREATOR', grantedBy: input.adminId }).onConflictDoNothing();

        await walletFor(tx, 'CREATOR', c.id, app.userId);

      }

    }

    await tx

      .update(creatorApplications)

      .set({ status: input.approve ? 'approved' : 'rejected', reviewedBy: input.adminId, reviewNote: input.note, updatedAt: new Date() })

      .where(eq(creatorApplications.id, app.id));

    await enqueuePartnerReviewEmail(tx, { userId: app.userId, kind: 'CREATOR', applicationId: app.id, approved: input.approve });
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





export async function applicationCounts(db: Db) {

  const [counts] = await db.select({

    pending: sql<number>`count(*) filter (where ${creatorApplications.status} = 'pending')::int`,

    approved: sql<number>`count(*) filter (where ${creatorApplications.status} = 'approved')::int`,

    rejected: sql<number>`count(*) filter (where ${creatorApplications.status} = 'rejected')::int`,

  }).from(creatorApplications);

  return counts;

}

