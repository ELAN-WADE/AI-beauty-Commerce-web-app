import { and, eq } from 'drizzle-orm';
import type { Db } from '@/db/client';
import type { EmailMessage } from '@/lib/email';
import { users } from '@/modules/auth/schema';
import { frontendOrigin } from '@/modules/auth/email';
import { workspaceRecords } from '@/modules/workspaces/schema';
import { isAdditionalProgramme, programmeDefinitions, programmePath } from '@/storefront/lib/partner-programmes';
import { PROGRAMME_REVIEW_TEMPLATE } from './programme-memberships';
export async function pendingProgrammeEmail(db: Db, row: { userId: string | null; template: string; payload: unknown }): Promise<EmailMessage | null> {
  if (row.template !== PROGRAMME_REVIEW_TEMPLATE || !row.userId) return null;
  const payload = row.payload as { membershipId?: unknown; status?: unknown; version?: unknown };
  if (typeof payload?.membershipId !== 'string' || !/^[0-9a-f-]{36}$/i.test(payload.membershipId)) return null;
  const [member] = await db.select().from(workspaceRecords).where(and(eq(workspaceRecords.id, payload.membershipId), eq(workspaceRecords.ownerId, row.userId), eq(workspaceRecords.kind, 'PARTNER_PROGRAMME')));
  if (!member || !isAdditionalProgramme(member.audience) || member.status !== payload.status || (member.status === 'APPROVED' ? member.data.details?.agreementVersion !== payload.version : member.version !== payload.version)) return null;
  const [user] = await db.select().from(users).where(eq(users.id, row.userId));
  if (!user?.emailVerifiedAt) return null;
  const label = programmeDefinitions[member.audience].label;
  const link = new URL(programmePath(member.audience), frontendOrigin()).toString();
  return { to: user.email, subject: `Desla! ${label} application update`, text: `Hello ${member.title},\n\nYour ${label} application status is ${member.status.toLowerCase()}.\n${member.reviewNote}\n\n${member.status === 'APPROVED' ? 'Sign in with the same account and accept your programme agreement to open the workspace.' : 'Sign in with the same account to review the application update.'}\n${link}\n\nDesla!` };
}
