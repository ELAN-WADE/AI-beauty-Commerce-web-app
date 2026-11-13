import { and, eq, gt, isNull } from 'drizzle-orm';
import type { AppDb } from '@/db/client';
import { Errors } from '@/lib/errors';
import { hasPermission } from '@/lib/permissions';
import { requireAuth, type AuthContext } from '@/modules/auth/require-auth';
import { userSessions, users } from '@/modules/auth/schema';
import { meetsAdminMfaRequirement } from '@/modules/auth/mfa';

/**
 * Permission-gated admin access (§8 BFLA). Roles remain as bundles in the DB;
 * every sensitive route names the permission it needs. Legacy role helper
 * kept for the few routes where role identity (not capability) matters.
 */
export async function requirePerm(db: AppDb, ...perms: string[]): Promise<AuthContext> {
  const ctx = await requireAuth(db, 'ADMIN');
  if (!(await hasPermission(db, ctx.userId, ...perms))) throw Errors.forbidden();
  const [mfa] = await db.select({ enabledAt: users.mfaEnabledAt, verifiedAt: userSessions.mfaVerifiedAt })
    .from(users)
    .innerJoin(userSessions, eq(userSessions.userId, users.id))
    .where(and(eq(users.id, ctx.userId), eq(userSessions.id, ctx.sessionId), isNull(userSessions.revokedAt), gt(userSessions.expiresAt, new Date())))
    .limit(1);
  if (!mfa || !meetsAdminMfaRequirement(mfa.enabledAt, mfa.verifiedAt)) throw Errors.mfaRequired();
  return ctx;
}

/** Catalogue writes. */
export async function requireStaff(db: AppDb): Promise<AuthContext> {
  return requirePerm(db, 'products:write');
}

/** Stock ledger writes. */
export async function requireInventoryRole(db: AppDb): Promise<AuthContext> {
  return requirePerm(db, 'inventory:write');
}
