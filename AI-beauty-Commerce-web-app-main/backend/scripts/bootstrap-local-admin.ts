import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { getDb, closeDb } from '../src/db/client';
import { users, roles, userRoles } from '../src/modules/auth/schema';
import { profiles } from '../src/modules/users/schema';
import { hashPassword } from '../src/modules/auth/service';

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? '');
  if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1'].includes(url.hostname) || url.pathname !== '/glowly_dev') {
    throw new Error('This bootstrap is restricted to the local glowly_dev database.');
  }
  const email = process.env.LOCAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.LOCAL_ADMIN_PASSWORD;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 12) {
    throw new Error('Set LOCAL_ADMIN_EMAIL and LOCAL_ADMIN_PASSWORD (at least 12 characters).');
  }
  await getDb().transaction(async tx => {
    const [role] = await tx.select().from(roles).where(eq(roles.id, 'SUPER_ADMIN'));
    if (!role) throw new Error('Run npm run db:seed first.');
    const [existing] = await tx.select().from(users).where(eq(users.email, email));
    if (existing) throw new Error('Account already exists; use admin:grant for a verified account. No credentials were changed.');
    const [user] = await tx.insert(users).values({ email, passwordHash: await hashPassword(password), emailVerifiedAt: new Date() }).returning();
    await tx.insert(userRoles).values([{ userId: user.id, roleId: 'CUSTOMER' }, { userId: user.id, roleId: 'SUPER_ADMIN' }]);
    await tx.insert(profiles).values({ userId: user.id, displayName: 'Desla Administrator' });
  });
  console.log('Local administrator created. Sign in at /admin and complete authenticator setup.');
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Bootstrap failed.'); process.exitCode = 1; }).finally(closeDb);
