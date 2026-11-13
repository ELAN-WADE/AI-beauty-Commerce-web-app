import { and, desc, eq } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { userRoles } from '@/modules/auth/schema';
import { creators, creatorApplications } from '@/modules/creators/schema';
import { distributors, distributorApplications } from '@/modules/distributors/schema';

/** Discovery only: workspace writes still enforce ownedPartner and resource ownership. */
export async function partnerProgrammes(db: Db, userId: string) {
  const [creator, distributor, creatorApplication, distributorApplication] = await Promise.all([
    db.select({ id: creators.id }).from(creators).innerJoin(userRoles,
      and(eq(userRoles.userId, creators.userId), eq(userRoles.roleId, 'CREATOR')))
      .where(and(eq(creators.userId, userId), eq(creators.verified, true))).limit(1),
    db.select({ id: distributors.id }).from(distributors).innerJoin(userRoles,
      and(eq(userRoles.userId, distributors.userId), eq(userRoles.roleId, 'DISTRIBUTOR')))
      .where(and(eq(distributors.userId, userId), eq(distributors.verified, true))).limit(1),
    db.select({ status: creatorApplications.status }).from(creatorApplications)
      .where(eq(creatorApplications.userId, userId)).orderBy(desc(creatorApplications.createdAt), desc(creatorApplications.id)).limit(1),
    db.select({ status: distributorApplications.status }).from(distributorApplications)
      .where(eq(distributorApplications.userId, userId)).orderBy(desc(distributorApplications.createdAt), desc(distributorApplications.id)).limit(1),
  ]);
  const status = (approved: boolean, application?: { status: string }) => approved ? 'approved' as const
    : application?.status === 'pending' ? 'pending' as const
    : application?.status === 'rejected' ? 'rejected' as const
    : application?.status === 'approved' ? 'unavailable' as const : 'not_applied' as const;
  return [
    { kind: 'CREATOR' as const, label: 'Creator Studio', status: status(creator.length > 0, creatorApplication[0]) },
    { kind: 'DISTRIBUTOR' as const, label: 'Distributor Hub', status: status(distributor.length > 0, distributorApplication[0]) },
  ];
}
