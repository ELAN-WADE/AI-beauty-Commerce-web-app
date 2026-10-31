import { and, eq } from 'drizzle-orm';
import type { Db } from '../../db/client';
import type { EmailMessage } from '../../lib/email';
import { users, userRoles } from '../auth/schema';
import { frontendOrigin } from '../auth/email';
import { creatorApplications, creators } from '../creators/schema';
import { distributorApplications, distributors } from '../distributors/schema';
import { enqueueNotification } from '../notifications/service';

export const PARTNER_REVIEW_TEMPLATE = 'partner.application-reviewed';
export async function enqueuePartnerReviewEmail(db: Db, input: { userId: string | null; kind: 'CREATOR' | 'DISTRIBUTOR'; applicationId: string; approved: boolean }) {
  if (!input.userId) return;
  return enqueueNotification(db, { userId: input.userId, channel: 'email', template: PARTNER_REVIEW_TEMPLATE, payload: { kind: input.kind, applicationId: input.applicationId, status: input.approved ? 'approved' : 'rejected' } });
}

/** Build mail from the committed review and recipient, never a client-supplied email. */
export async function pendingPartnerReviewEmail(db: Db, row: { userId: string | null; template: string; payload: unknown }): Promise<EmailMessage | null> {
  if (row.template !== PARTNER_REVIEW_TEMPLATE || !row.userId) return null;
  const payload = row.payload as { kind?: unknown; applicationId?: unknown; status?: unknown };
  if (!['CREATOR', 'DISTRIBUTOR'].includes(String(payload?.kind)) || typeof payload.applicationId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.applicationId) || !['approved','rejected'].includes(String(payload.status))) return null;
  const [user] = await db.select().from(users).where(eq(users.id, row.userId));
  if (!user?.emailVerifiedAt) return null;
  const table = payload.kind === 'CREATOR' ? creatorApplications : distributorApplications;
  const [application] = await db.select({ id: table.id, name: table.name, status: table.status, reviewNote: table.reviewNote }).from(table).where(and(eq(table.id, payload.applicationId), eq(table.userId, user.id)));
  if (!application || application.status !== payload.status) return null;
  const creator = payload.kind === 'CREATOR';
  const role = creator ? 'creator' : 'distributor';
  const link = new URL(creator ? '/creators' : '/distributor', frontendOrigin());
  const approved = application.status === 'approved';
  let details = '';
  if (approved) {
    const [roleGrant] = await db.select().from(userRoles).where(and(eq(userRoles.userId, user.id), eq(userRoles.roleId, String(payload.kind))));
    if (!roleGrant) return null;
    if (creator) {
      const [profile] = await db.select().from(creators).where(and(eq(creators.userId, user.id), eq(creators.verified, true)));
      if (!profile) return null;
      details = `\nYour promo code: ${profile.promoCode}\nCustomer discount: ${profile.discountPercent}%\nCreator commission rate: ${profile.commissionRate}%\n`;
    } else {
      const [profile] = await db.select().from(distributors).where(and(eq(distributors.userId, user.id), eq(distributors.verified, true)));
      if (!profile) return null;
      details = '\nYour distributor workspace is available. Fulfilment requires stock assigned to your location by the operations team.\n';
    }
  }
  return {
    to: user.email,
    subject: `Desla! ${creator ? 'Creator' : 'Distributor'} application ${approved ? 'approved' : 'review update'}`,
    text: `Hello ${application.name},\n\nYour ${role} application has been ${approved ? 'approved' : 'declined'}.${details}\n${application.reviewNote ? `Review note: ${application.reviewNote}\n\n` : ''}${approved ? 'Open your workspace' : 'Review your application and update your details'}:\n${link}\n\nUse the same sign-in method and account you used to apply.\nApplication reference: ${application.id}\n\n— Desla!`,
  };
}
