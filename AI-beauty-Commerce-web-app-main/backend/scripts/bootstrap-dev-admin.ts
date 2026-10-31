import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { getDb, closeDb } from '../src/db/client';
import { users, roles, userRoles } from '../src/modules/auth/schema';
import { profiles } from '../src/modules/users/schema';
import { hashPassword } from '../src/modules/auth/service';

async function main() {
  const email = (
    process.env.ADMIN_BOOTSTRAP_EMAIL ||
    process.env.LOCAL_ADMIN_EMAIL ||
    ''
  ).trim().toLowerCase();

  const password =
    process.env.ADMIN_BOOTSTRAP_PASSWORD ||
    process.env.LOCAL_ADMIN_PASSWORD ||
    '';

  if (!email || !password) {
    console.log(
      '[admin:bootstrap] Optional admin bootstrap skipped. Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD to auto-provision an admin account.'
    );
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('[admin:bootstrap] Invalid ADMIN_BOOTSTRAP_EMAIL format.');
  }

  if (password.length < 8) {
    throw new Error('[admin:bootstrap] ADMIN_BOOTSTRAP_PASSWORD must be at least 8 characters.');
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    // Ensure SUPER_ADMIN role exists
    const [superAdminRole] = await tx
      .select()
      .from(roles)
      .where(eq(roles.id, 'SUPER_ADMIN'));

    if (!superAdminRole) {
      console.warn('[admin:bootstrap] Roles not seeded yet. Run db:seed first.');
      return;
    }

    const [existing] = await tx
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      // Ensure existing user has verified email & SUPER_ADMIN role
      if (!existing.emailVerifiedAt) {
        await tx
          .update(users)
          .set({ emailVerifiedAt: new Date() })
          .where(eq(users.id, existing.id));
      }
      await tx
        .insert(userRoles)
        .values({ userId: existing.id, roleId: 'SUPER_ADMIN' })
        .onConflictDoNothing();

      console.log(`[admin:bootstrap] Existing account updated with SUPER_ADMIN privileges: ${email}`);
    } else {
      const [user] = await tx
        .insert(users)
        .values({
          email,
          passwordHash: await hashPassword(password),
          emailVerifiedAt: new Date(),
        })
        .returning();

      await tx.insert(userRoles).values([
        { userId: user.id, roleId: 'CUSTOMER' },
        { userId: user.id, roleId: 'SUPER_ADMIN' },
      ]);

      await tx.insert(profiles).values({
        userId: user.id,
        displayName: 'Administrator',
      }).onConflictDoNothing();

      console.log(`[admin:bootstrap] Admin account provisioned: ${email}`);
    }
  });
}

main()
  .catch((err) => {
    console.error('[admin:bootstrap] Error:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(closeDb);

