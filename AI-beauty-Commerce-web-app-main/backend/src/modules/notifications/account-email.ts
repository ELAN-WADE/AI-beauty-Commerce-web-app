import { PROGRAMME_REVIEW_TEMPLATE, PROGRAMME_SUBMITTED_TEMPLATE } from '../partners/programme-memberships';
import { pendingProgrammeEmail } from '../partners/programme-email';
import type { Db } from '../../db/client';
import { ACCOUNT_ACCESS_TEMPLATE, CUSTOMER_WELCOME_TEMPLATE, pendingAuthEmail } from '../auth/email';
import {
  pendingPartnerReviewEmail,
  PARTNER_REVIEW_TEMPLATE,
  PARTNER_SUBMITTED_TEMPLATE,
  PARTNER_UNDER_REVIEW_TEMPLATE,
} from '../partners/email';

export const ACCOUNT_EMAIL_TEMPLATES = [
  'auth.verify-email',
  'auth.reset-password',
  CUSTOMER_WELCOME_TEMPLATE,
  ACCOUNT_ACCESS_TEMPLATE,
  PARTNER_REVIEW_TEMPLATE,
  PARTNER_SUBMITTED_TEMPLATE,
  PARTNER_UNDER_REVIEW_TEMPLATE,
  PROGRAMME_REVIEW_TEMPLATE,
  PROGRAMME_SUBMITTED_TEMPLATE,
];

export function pendingAccountEmail(db: Db, row: { userId: string | null; template: string; payload: unknown }) {
  return [PROGRAMME_REVIEW_TEMPLATE, PROGRAMME_SUBMITTED_TEMPLATE].includes(row.template)
    ? pendingProgrammeEmail(db, row)
    : [PARTNER_REVIEW_TEMPLATE, PARTNER_SUBMITTED_TEMPLATE, PARTNER_UNDER_REVIEW_TEMPLATE].includes(row.template)
      ? pendingPartnerReviewEmail(db, row)
      : pendingAuthEmail(db, row);
}
