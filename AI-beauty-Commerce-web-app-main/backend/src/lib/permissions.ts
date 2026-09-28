import { eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import { rolePermissions, userRoles } from '../modules/auth/schema';

/**
 * Permission checks (service layer, §8). Roles are bundles; SUPER_ADMIN
 * bypasses every check. Denials are generic 403s (no permission enumeration).
 */
export async function userPermissions(db: Db, userId: string): Promise<{ permissions: Set<string>; isSuperAdmin: boolean }> {
  const rows = await db
    .select({ roleId: userRoles.roleId, permissionId: rolePermissions.permissionId })
    .from(userRoles)
    .leftJoin(rolePermissions, eq(rolePermissions.roleId, userRoles.roleId))
    .where(eq(userRoles.userId, userId));
  const permissions = new Set<string>();
  let isSuperAdmin = false;
  for (const r of rows) {
    if (r.roleId === 'SUPER_ADMIN') isSuperAdmin = true;
    if (r.permissionId) permissions.add(r.permissionId);
  }
  return { permissions, isSuperAdmin };
}

export async function hasPermission(db: Db, userId: string, ...perms: string[]): Promise<boolean> {
  const { permissions, isSuperAdmin } = await userPermissions(db, userId);
  if (isSuperAdmin) return true;
  return perms.some((p) => permissions.has(p));
}
