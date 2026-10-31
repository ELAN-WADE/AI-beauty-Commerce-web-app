import type { Db } from '../../db/client';
import { ACCOUNT_ACCESS_TEMPLATE, pendingAuthEmail } from '../auth/email';
import { pendingPartnerReviewEmail, PARTNER_REVIEW_TEMPLATE } from '../partners/email';

export const ACCOUNT_EMAIL_TEMPLATES = ['auth.verify-email', 'auth.reset-password', ACCOUNT_ACCESS_TEMPLATE, PARTNER_REVIEW_TEMPLATE];
export function pendingAccountEmail(db: Db, row: { userId: string | null; template: string; payload: unknown }) {
  return row.template === PARTNER_REVIEW_TEMPLATE ? pendingPartnerReviewEmail(db, row) : pendingAuthEmail(db, row);
}
