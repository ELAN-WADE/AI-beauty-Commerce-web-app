import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { closeDb, getDb } from '../src/db/client';
import { users, userRoles, roles } from '../src/modules/auth/schema';
import { audit } from '../src/modules/audit/service';

// Trusted operator CLI only. Never exposed as a self-service HTTP endpoint.
async function main() {
  const emailIndex = process.argv.indexOf('--email');
  const email = process.argv[emailIndex + 1]?.trim().toLowerCase();
  if (emailIndex === -1 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Usage: npm run admin:grant -- --email verified-account@example.com');
  const db = getDb();
  await db.transaction(async tx => {
    const [role] = await tx.select().from(roles).where(eq(roles.id, 'SUPER_ADMIN'));
    if (!role) throw new Error('Apply the RBAC seed first: npm run db:seed.');
    const [user] = await tx.select().from(users).where(eq(users.email, email)).for('update');
    if (!user?.emailVerifiedAt) throw new Error('Register and verify this account before assigning administrator access.');
    const [grant] = await tx.insert(userRoles).values({ userId: user.id, roleId: 'SUPER_ADMIN' }).onConflictDoNothing().returning();
    if (grant) await audit(tx, { actorId: user.id, action: 'operator.admin.bootstrap', entityType: 'user', entityId: user.id, after: { role: 'SUPER_ADMIN' } });
  });
  console.log('Administrator role is assigned. Sign in and enroll MFA to access operations.');
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Administrator assignment failed.'); process.exitCode = 1; }).finally(closeDb);
