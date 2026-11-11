import { and, eq } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { users, userRoles } from '../auth/schema';
import { workspaceRecords } from '../workspaces/schema';
import { programmeFor } from '../partners/programmes';
import { frontendOrigin } from '../auth/email';
import type { EmailMessage } from '../../lib/email';
export const PROGRAMME_REVIEW_TEMPLATE = 'partner.programme-reviewed';
export async function pendingProgrammeEmail(db: Db, row: {userId: string | null; payload: unknown}): Promise<EmailMessage | null> {
  if (!row.userId) return null;
  const payload = row.payload as {applicationId?: unknown; version?: unknown};
  if (typeof payload?.applicationId !== 'string' || !/^[a-f0-9-]{36}$/i.test(payload.applicationId)) return null;
  const [application] = await db.select().from(workspaceRecords).where(and(eq(workspaceRecords.id, payload.applicationId), eq(workspaceRecords.ownerId, row.userId), eq(workspaceRecords.kind, 'PROGRAMME_APPLICATION')));
  const [user] = await db.select().from(users).where(eq(users.id, row.userId));
  if (!application || application.version !== payload.version || !['APPROVED','REJECTED'].includes(application.status) || !user?.emailVerifiedAt) return null;
  const programme = programmeFor(String(application.data.details?.programme)); if (!programme) return null;
  if (application.status === 'APPROVED') {
    const [role] = await db.select().from(userRoles).where(and(eq(userRoles.userId, row.userId), eq(userRoles.roleId, programme.role)));
    if (!role) return null;
  }
  const link = new URL('/partners', frontendOrigin()); link.searchParams.set('programme', programme.id);
  return { to: user.email, subject: `DESLA ${programme.name}: application ${application.status === 'APPROVED' ? 'approved' : 'reviewed'}`,
    text: `Your ${programme.name} application has been ${application.status === 'APPROVED' ? 'approved' : 'declined'}.\n\n${application.reviewNote}\n\nOpen your programme using the same account:\n${link}\n\nReference: ${application.id}` };
}
