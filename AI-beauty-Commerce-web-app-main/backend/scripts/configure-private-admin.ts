import '../src/lib/load-env';
import { and, eq, isNull } from 'drizzle-orm';
import { getDb, closeDb } from '../src/db/client';
import { roles, users, userRoles, userSessions } from '../src/modules/auth/schema';
import { hashPassword, verifyPassword } from '../src/modules/auth/service';
import { adminEmail, adminEntryPath } from '../src/modules/auth/admin-policy';

async function main() {
  const database = new URL(process.env.DATABASE_URL || '');
  if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1'].includes(database.hostname) || database.pathname !== '/glowly_dev') throw new Error('Local administrator configuration requires the local development database.');
  const password = process.env.LOCAL_ADMIN_PASSWORD;
  if (!password || password.length < 12 || !adminEntryPath()) throw new Error('Set the private route and administrator password in ignored backend environment settings.');
  await getDb().transaction(async tx => {
    await tx.insert(roles).values([{ id: 'CUSTOMER' }, { id: 'SUPER_ADMIN' }]).onConflictDoNothing();
    const [existing] = await tx.select().from(users).where(eq(users.email, adminEmail())).for('update');
    const changed = !existing || !(await verifyPassword(password, existing.passwordHash));
    const passwordHash = changed ? await hashPassword(password) : existing!.passwordHash;
    const [user] = await tx.insert(users).values({ email: adminEmail(), passwordHash, emailVerifiedAt: new Date() }).onConflictDoUpdate({ target: users.email, set: { passwordHash, emailVerifiedAt: existing?.emailVerifiedAt || new Date() } }).returning();
    await tx.insert(userRoles).values([{ userId: user.id, roleId: 'CUSTOMER' }, { userId: user.id, roleId: 'SUPER_ADMIN' }]).onConflictDoNothing();
    if (changed) await tx.update(userSessions).set({ revokedAt: new Date() }).where(and(eq(userSessions.userId, user.id), isNull(userSessions.revokedAt)));
    console.log(JSON.stringify({ administratorConfigured: true, passwordMatchesRequestedConfiguration: true, existingMfaPreserved: Boolean(existing?.mfaEnabledAt) }));
  });
}
main().catch(() => { console.error('Local administrator configuration failed.'); process.exitCode = 1; }).finally(closeDb);
