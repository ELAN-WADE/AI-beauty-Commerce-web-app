import { and, eq } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { renderDeslaEmailHtml, type EmailMessage } from '../../lib/email';
import { users, userRoles } from '../auth/schema';
import { frontendOrigin } from '../auth/email';
import { creatorApplications, creators } from '../creators/schema';
import { distributorApplications, distributors } from '../distributors/schema';
import { enqueueNotification } from '../notifications/service';

export const PARTNER_REVIEW_TEMPLATE = 'partner.application-reviewed';
export const PARTNER_SUBMITTED_TEMPLATE = 'partner.application-submitted';
export const PARTNER_UNDER_REVIEW_TEMPLATE = 'partner.application-under-review';

export async function enqueuePartnerSubmittedEmail(db: Db, input: { userId: string; kind: 'CREATOR' | 'DISTRIBUTOR'; applicationId: string }) {
  return enqueueNotification(db, {
    userId: input.userId,
    channel: 'email',
    template: PARTNER_SUBMITTED_TEMPLATE,
    payload: { kind: input.kind, applicationId: input.applicationId, status: 'pending' },
    idempotencyKey: `partner.submitted:${input.kind}:${input.applicationId}`,
  });
}

export async function enqueuePartnerUnderReviewEmail(db: Db, input: { userId: string | null; kind: 'CREATOR' | 'DISTRIBUTOR'; applicationId: string }) {
  if (!input.userId) return;
  return enqueueNotification(db, {
    userId: input.userId,
    channel: 'email',
    template: PARTNER_UNDER_REVIEW_TEMPLATE,
    payload: { kind: input.kind, applicationId: input.applicationId, status: 'under_review' },
    idempotencyKey: `partner.under-review:${input.kind}:${input.applicationId}`,
  });
}

export async function enqueuePartnerReviewEmail(
  db: Db,
  input: { userId: string | null; kind: 'CREATOR' | 'DISTRIBUTOR'; applicationId: string; approved: boolean },
) {
  if (!input.userId) return;
  const status = input.approved ? 'approved' : 'rejected';
  return enqueueNotification(db, {
    userId: input.userId,
    channel: 'email',
    template: PARTNER_REVIEW_TEMPLATE,
    payload: { kind: input.kind, applicationId: input.applicationId, status },
    idempotencyKey: `partner.reviewed:${input.kind}:${input.applicationId}:${status}`,
  });
}

/** Build mail from the committed review and recipient, never a client-supplied email. */
export async function pendingPartnerReviewEmail(
  db: Db,
  row: { userId: string | null; template: string; payload: unknown },
): Promise<EmailMessage | null> {
  if (![PARTNER_REVIEW_TEMPLATE, PARTNER_SUBMITTED_TEMPLATE, PARTNER_UNDER_REVIEW_TEMPLATE].includes(row.template) || !row.userId) {
    return null;
  }
  const payload = row.payload as { kind?: unknown; applicationId?: unknown; status?: unknown };
  const submitted = row.template === PARTNER_SUBMITTED_TEMPLATE;
  const underReview = row.template === PARTNER_UNDER_REVIEW_TEMPLATE;
  const allowedStatuses = submitted ? ['pending'] : underReview ? ['under_review'] : ['approved', 'rejected'];
  if (
    !['CREATOR', 'DISTRIBUTOR'].includes(String(payload?.kind)) ||
    typeof payload.applicationId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.applicationId) ||
    !allowedStatuses.includes(String(payload.status))
  ) {
    return null;
  }
  const [user] = await db.select().from(users).where(eq(users.id, row.userId));
  if (!user?.emailVerifiedAt) return null;
  const table = payload.kind === 'CREATOR' ? creatorApplications : distributorApplications;
  const [application] = await db
    .select({ id: table.id, name: table.name, status: table.status, reviewNote: table.reviewNote })
    .from(table)
    .where(and(eq(table.id, payload.applicationId), eq(table.userId, user.id)));
  if (!application || application.status !== payload.status) return null;
  const creator = payload.kind === 'CREATOR';
  const roleTitle = creator ? 'Creator' : 'Distributor';
  const role = creator ? 'creator' : 'distributor';
  const link = new URL(creator ? '/creators' : '/distributor', frontendOrigin());

  if (submitted) {
    const preheader = `We received your Desla Beauty ${role} application.`;
    return {
      to: user.email,
      subject: `Desla Beauty ${roleTitle} application received`,
      preheader,
      text: `Hello ${application.name},\n\nWe received your ${role} application. Your request is under review. This is an application reference, not an approved partner ID: ${application.id}.\n\nWe will email you when a decision is recorded. No approval or earnings are guaranteed.\nTrack your application using the same account:\n${link}\n\n— Desla Beauty`,
      html: renderDeslaEmailHtml({
        preheader,
        eyebrow: `${roleTitle} Programme`,
        heading: `${roleTitle} application received`,
        greeting: `Hello ${application.name},`,
        paragraphs: [
          `We received your Desla Beauty ${role} application. Our partnerships team will review your submission and email you as your status updates.`,
          'No approval or earnings are guaranteed until an official decision is recorded.',
        ],
        rows: [
          { label: 'Application Reference (not a partner ID)', value: application.id },
          { label: 'Current Status', value: 'Received — Pending Review' },
        ],
        ctaLabel: 'Track Application Status',
        ctaUrl: link.toString(),
      }),
    };
  }

  if (underReview) {
    const preheader = `Your Desla Beauty ${role} application is now actively under review.`;
    return {
      to: user.email,
      subject: `Desla Beauty ${roleTitle} application under review`,
      preheader,
      text: `Hello ${application.name},\n\nYour Desla Beauty ${role} application (${application.id}) is now under review by our operations team.${application.reviewNote ? `\n\nReviewer note: ${application.reviewNote}` : ''}\n\nWe will send another email as soon as a final decision is recorded.\nTrack your application:\n${link}\n\n— Desla Beauty`,
      html: renderDeslaEmailHtml({
        preheader,
        eyebrow: `${roleTitle} Review`,
        heading: `Your ${role} application is under review`,
        greeting: `Hello ${application.name},`,
        paragraphs: [
          `Our team has begun reviewing your Desla Beauty ${role} application.`,
          ...(application.reviewNote ? [`Reviewer note: ${application.reviewNote}`] : []),
          'You will receive a confirmation email once a final decision has been committed.',
        ],
        rows: [
          { label: 'Application Reference', value: application.id },
          { label: 'Current Status', value: 'Under Review' },
        ],
        ctaLabel: 'View Application Status',
        ctaUrl: link.toString(),
      }),
    };
  }

  const approved = application.status === 'approved';
  let details = '';
  const extraRows: { label: string; value: string }[] = [];
  if (approved) {
    const [roleGrant] = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, user.id), eq(userRoles.roleId, String(payload.kind))));
    if (!roleGrant) return null;
    if (creator) {
      const [profile] = await db
        .select()
        .from(creators)
        .where(and(eq(creators.userId, user.id), eq(creators.verified, true)));
      if (!profile) return null;
      details = `\nApproved creator ID: ${profile.id}\nYour promo code: ${profile.promoCode}\nCustomer discount: ${profile.discountPercent}%\nCreator commission rate: ${profile.commissionRate}%\n`;
      extraRows.push(
        { label: 'Approved Creator ID', value: profile.id },
        { label: 'Referral Code', value: profile.promoCode },
        { label: 'Customer Discount', value: `${profile.discountPercent}%` },
        { label: 'Commission Rate', value: `${profile.commissionRate}%` },
      );
    } else {
      const [profile] = await db
        .select()
        .from(distributors)
        .where(and(eq(distributors.userId, user.id), eq(distributors.verified, true)));
      if (!profile) return null;
      details = `\nApproved distributor ID: ${profile.id}\nYour distributor workspace is available. Fulfilment requires stock assigned to your location by the operations team.\n`;
      extraRows.push({ label: 'Approved Distributor ID', value: profile.id });
    }
  }

  const preheader = approved
    ? `Your Desla Beauty ${role} application has been approved.`
    : `An update on your Desla Beauty ${role} application.`;
  return {
    to: user.email,
    subject: `Desla Beauty ${roleTitle} application ${approved ? 'approved' : 'review update'}`,
    preheader,
    text: `Hello ${application.name},\n\nYour ${role} application has been ${approved ? 'approved' : 'declined'}.${details}\n${application.reviewNote ? `Review note: ${application.reviewNote}\n\n` : ''}${approved ? 'Open your workspace' : 'Review your application and update your details'}:\n${link}\n\nUse the same sign-in method and account you used to apply.\nApplication reference: ${application.id}\n\n— Desla Beauty`,
    html: renderDeslaEmailHtml({
      preheader,
      eyebrow: `${roleTitle} Decision`,
      heading: approved ? `${roleTitle} application approved` : `${roleTitle} application update`,
      greeting: `Hello ${application.name},`,
      paragraphs: [
        approved
          ? `Congratulations — your Desla Beauty ${role} application has been approved and your workspace access is now active.`
          : `After reviewing your Desla Beauty ${role} application, we were unable to approve it at this time.`,
        ...(application.reviewNote ? [`Review note: ${application.reviewNote}`] : []),
      ],
      rows: [{ label: 'Application Reference', value: application.id }, ...extraRows],
      ctaLabel: approved ? `Open ${roleTitle} Workspace` : 'Review Application',
      ctaUrl: link.toString(),
      note: 'Use the same verified account and sign-in method you used to apply.',
    }),
  };
}
