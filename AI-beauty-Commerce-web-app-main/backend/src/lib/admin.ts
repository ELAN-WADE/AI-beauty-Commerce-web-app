import type { AppDb } from '@/db/client';
import { requireAuth, requireRole, type AuthContext } from '@/modules/auth/require-auth';

/** Catalogue writes: ADMIN or STAFF (permission matrix arrives S7). */
export async function requireStaff(db: AppDb): Promise<AuthContext> {
  const ctx = await requireAuth(db);
  requireRole(ctx, 'ADMIN', 'STAFF');
  return ctx;
}

/** Stock ledger writes: ADMIN, STAFF, or INVENTORY_MANAGER. */
export async function requireInventoryRole(db: AppDb): Promise<AuthContext> {
  const ctx = await requireAuth(db);
  requireRole(ctx, 'ADMIN', 'STAFF', 'INVENTORY_MANAGER');
  return ctx;
}
