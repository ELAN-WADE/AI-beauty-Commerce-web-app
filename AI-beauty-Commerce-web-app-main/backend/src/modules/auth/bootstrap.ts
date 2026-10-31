import { and, eq, isNull, sql } from 'drizzle-orm';
import type { AppDb } from '../../db/client';
import { audit } from '../audit/service';
import { profiles } from '../users/schema';
import { adminEmail, hasStaffRole } from './admin-policy';
import { emailVerificationTokens, passwordResetTokens, roles, users, userRoles, userSessions } from './schema';
import { hashPassword, normalizeEmail, verifyPassword } from './service';

export function configuredAdminBootstrap() {
  const local = process.env.NODE_ENV !== 'production';
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL || (local ? process.env.LOCAL_ADMIN_EMAIL : '') || '';
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || (local ? process.env.LOCAL_ADMIN_PASSWORD : '') || '';
  if (!email && !password) return null;
  if (!email || !password) throw new Error('Set both ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD.');
  const sync = process.env.ADMIN_BOOTSTRAP_SYNC_PASSWORD;
  if (sync && !['true', 'false'].includes(sync)) throw new Error('ADMIN_BOOTSTRAP_SYNC_PASSWORD must be true or false.');
  return { email, password, syncPassword: sync === 'true' };
}

/** Operator-only provisioning/recovery; never called by a public login request. */
export async function bootstrapAdmin(db: AppDb, input: { email: string; password: string; syncPassword?: boolean }) {
  const email = normalizeEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email !== adminEmail()) throw new Error('ADMIN_BOOTSTRAP_EMAIL must match the configured ADMIN_GOOGLE_EMAIL administrator allowlist.');
  if (input.password.length < 8) throw new Error('ADMIN_BOOTSTRAP_PASSWORD must be at least 8 characters.');
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`auth-email:${email}`}, 0))`);
    const seeded = await tx.select().from(roles).where(eq(roles.id, 'SUPER_ADMIN'));
    if (!seeded.length) throw new Error('Run npm run db:seed before administrator bootstrap.');
    const [existing] = await tx.select().from(users).where(eq(users.email, email)).for('update');
    const grants = existing ? await tx.select().from(userRoles).where(eq(userRoles.userId, existing.id)) : [];
    if (existing && !hasStaffRole(grants.map(grant => grant.roleId)) && !input.syncPassword) {
      throw new Error('Existing non-staff account requires explicit ADMIN_BOOTSTRAP_SYNC_PASSWORD=true before administrator provisioning.');
    }
    const now = new Date();
    let userId = existing?.id;
    let passwordChanged = false;
    if (!existing) {
      const [created] = await tx.insert(users).values({ email, passwordHash: await hashPassword(input.password), emailVerifiedAt: now }).returning();
      userId = created.id;
    } else {
      const matches = await verifyPassword(input.password, existing.passwordHash);
      passwordChanged = Boolean(input.syncPassword && !matches);
      await tx.update(users).set({ emailVerifiedAt: existing.emailVerifiedAt || now,
        ...(passwordChanged ? { passwordHash: await hashPassword(input.password), updatedAt: now } : {}),
        ...(input.syncPassword ? { failedLoginAttempts: 0, lockedUntil: null } : {}),
      }).where(eq(users.id, existing.id));
      if (passwordChanged) {
        await tx.update(userSessions).set({ revokedAt: now }).where(and(eq(userSessions.userId, existing.id), isNull(userSessions.revokedAt)));
        await tx.update(passwordResetTokens).set({ consumedAt: now }).where(and(eq(passwordResetTokens.userId, existing.id), isNull(passwordResetTokens.consumedAt)));
      }
    }
    await tx.update(emailVerificationTokens).set({ consumedAt: now }).where(and(eq(emailVerificationTokens.userId, userId!), isNull(emailVerificationTokens.consumedAt)));
    await tx.insert(userRoles).values([{ userId: userId!, roleId: 'CUSTOMER' }, { userId: userId!, roleId: 'SUPER_ADMIN' }]).onConflictDoNothing();
    await tx.insert(profiles).values({ userId: userId!, displayName: 'Administrator' }).onConflictDoNothing();
    if (!existing || passwordChanged) await audit(tx, { actorId: userId!, action: passwordChanged ? 'operator.admin.password-sync' : 'operator.admin.bootstrap', entityType: 'user', entityId: userId!, after: { role: 'SUPER_ADMIN', passwordChanged } });
    return { created: !existing, passwordChanged, passwordPreserved: Boolean(existing && !input.syncPassword) };
  });
}
