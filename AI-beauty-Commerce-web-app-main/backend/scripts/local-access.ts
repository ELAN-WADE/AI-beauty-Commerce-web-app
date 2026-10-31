import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { closeDb, getDb } from '../src/db/client';
import { users, userRoles, roles } from '../src/modules/auth/schema';
import { profiles } from '../src/modules/users/schema';
import { creators } from '../src/modules/creators/schema';
import { distributors } from '../src/modules/distributors/schema';
import { inventoryLocations } from '../src/modules/inventory/schema';
import { hashPassword } from '../src/modules/auth/service';

type LocalRole = 'CUSTOMER' | 'CREATOR' | 'DISTRIBUTOR' | 'SUPER_ADMIN';

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Local access bootstrap is disabled in production.');
  const url = new URL(process.env.DATABASE_URL ?? '');
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.port !== '5433' || url.pathname !== '/glowly_dev') {
    throw new Error('Local access bootstrap only runs against localhost:5433/glowly_dev.');
  }
  const db = getDb();
  const rolesToCreate: LocalRole[] = ['CUSTOMER', 'CREATOR', 'DISTRIBUTOR', 'SUPER_ADMIN'];
  const prefix = `local-${Date.now()}`;
  const credentials: { role: LocalRole; email: string; password: string }[] = [];

  await db.transaction(async tx => {
    for (const roleId of rolesToCreate) {
      const [role] = await tx.select({ id: roles.id }).from(roles).where(eq(roles.id, roleId)).limit(1);
      if (!role) throw new Error(`RBAC role ${roleId} is missing. Run npm run db:seed first.`);
      const email = `${prefix}-${roleId.toLowerCase()}@example.test`;
      const password = randomBytes(24).toString('base64url');
      const [user] = await tx.insert(users).values({ email, passwordHash: await hashPassword(password), emailVerifiedAt: new Date(), signupIntent: roleId === 'CREATOR' || roleId === 'DISTRIBUTOR' ? roleId : 'CUSTOMER' }).returning({ id: users.id });
      await tx.insert(userRoles).values({ userId: user.id, roleId: 'CUSTOMER' }).onConflictDoNothing();
      if (roleId !== 'CUSTOMER') await tx.insert(userRoles).values({ userId: user.id, roleId }).onConflictDoNothing();
      const displayName = roleId === 'CREATOR' ? 'Local Creator' : roleId === 'DISTRIBUTOR' ? 'Local Distributor' : roleId === 'SUPER_ADMIN' ? 'Local Administrator' : 'Local Customer';
      await tx.insert(profiles).values({ userId: user.id, displayName });

      if (roleId === 'CREATOR') {
        await tx.insert(creators).values({ userId: user.id, name: displayName, handle: '@local_creator', platform: 'TikTok', niche: 'Local development', promoCode: `${prefix.slice(-8).toUpperCase()}C`, verified: true });
      } else if (roleId === 'DISTRIBUTOR') {
        const [distributor] = await tx.insert(distributors).values({ userId: user.id, name: displayName, businessName: displayName, city: 'Lagos', state: 'Lagos State', address: 'Local development hub', phone: '+2348000000000', whatsapp: '+2348000000000', verified: true, tier: 'Silver', pickupAvailable: true, operatingHours: 'Local development' }).returning({ id: distributors.id });
        await tx.insert(inventoryLocations).values({ code: `${prefix}-DIST`.toUpperCase(), name: displayName, type: 'DISTRIBUTOR', distributorId: distributor.id, city: 'Lagos', state: 'Lagos State', address: 'Local development hub', phone: '+2348000000000', operatingHours: 'Local development', deliveryEnabled: true, pickupEnabled: true, isActive: true });
      }
      credentials.push({ role: roleId, email, password });
    }
  });

  console.log('LOCAL DEVELOPMENT ACCOUNTS — use only against localhost:5433/glowly_dev');
  for (const account of credentials) console.log(`${account.role}\nEmail: ${account.email}\nPassword: ${account.password}`);
  console.log('Super Admin must enroll and verify MFA before staff API operations are enabled.');
}

main().catch(error => { console.error(error instanceof Error ? error.message : 'Could not create local access accounts.'); process.exitCode = 1; }).finally(closeDb);
