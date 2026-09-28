import 'dotenv/config';
import { getDb } from './client';
import { roles, permissions, rolePermissions } from '../modules/auth/schema';

/**
 * Idempotent RBAC seed (safe to re-run). Application data seeds arrive per
 * module (catalog seed in S2). Admin user creation is interactive (S1 README).
 */
async function main() {
  const db = getDb();

  const roleRows = [
    { id: 'CUSTOMER', description: 'Registered shopper; owner-scoped access only.' },
    { id: 'SUPPORT', description: 'Read orders/users for customer care; no mutations.' },
    { id: 'INVENTORY_MANAGER', description: 'Manages stock levels and movements.' },
    { id: 'STAFF', description: 'Order fulfilment and content moderation.' },
    { id: 'ADMIN', description: 'Full operational access except role grants.' },
    { id: 'SUPER_ADMIN', description: 'Role grants and break-glass access.' },
  ];
  for (const r of roleRows) {
    await db.insert(roles).values(r).onConflictDoNothing();
  }

  const permRows = [
    'orders:read:own',
    'orders:read:all',
    'orders:update:status',
    'users:read:all',
    'products:write',
    'inventory:write',
    'reviews:moderate',
    'refunds:write',
    'payments:confirm',
    'loyalty:adjust',
    'roles:grant',
    'audit:read',
  ].map((id) => ({ id, description: id }));
  for (const p of permRows) {
    await db.insert(permissions).values(p).onConflictDoNothing();
  }

  const adminPerms = permRows.filter((p) => p.id !== 'roles:grant');
  for (const p of adminPerms) {
    await db
      .insert(rolePermissions)
      .values({ roleId: 'ADMIN', permissionId: p.id })
      .onConflictDoNothing();
  }
  for (const p of permRows) {
    await db
      .insert(rolePermissions)
      .values({ roleId: 'SUPER_ADMIN', permissionId: p.id })
      .onConflictDoNothing();
  }

  console.log('rbac seed applied');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
