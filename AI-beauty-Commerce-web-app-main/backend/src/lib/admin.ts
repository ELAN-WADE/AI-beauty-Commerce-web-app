import type { AppDb } from '@/db/client';
import { Errors } from '@/lib/errors';
import { hasPermission } from '@/lib/permissions';
import { requireAuth, type AuthContext } from '@/modules/auth/require-auth';

/**
 * Permission-gated admin access (§8 BFLA). Roles remain as bundles in the DB;
 * every sensitive route names the permission it needs. Legacy role helper
 * kept for the few routes where role identity (not capability) matters.
 */
export async function requirePerm(db: AppDb, ...perms: string[]): Promise<AuthContext> {
  const ctx = await requireAuth(db);
  if (!(await hasPermission(db, ctx.userId, ...perms))) throw Errors.forbidden();
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
