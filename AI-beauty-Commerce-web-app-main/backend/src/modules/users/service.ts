import { and, desc, eq, inArray } from 'drizzle-orm';
import { orders } from '../orders/schema';
import type { AppDb, Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { userRoles, users } from '../auth/schema';
import { addresses, profiles } from './schema';
import type { CreateAddressInput } from './validation';

/** Admin user directory (users:read:all): identity + roles + profile name. */
export async function listUsers(db: Db, limit = 50) {
  const lim = Math.min(100, Math.max(1, limit));
  const rows = await db
    .select({ user: users, profile: profiles })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .orderBy(desc(users.createdAt))
    .limit(lim);
  const roles = await db.select().from(userRoles);
  const byUser = new Map<string, string[]>();
  for (const r of roles) {
    const list = byUser.get(r.userId) ?? [];
    list.push(r.roleId);
    byUser.set(r.userId, list);
  }

  const userIds = rows.map((r) => r.user.id);
  const userOrders = userIds.length > 0
    ? await db
        .select({
          id: orders.id,
          userId: orders.userId,
          totalKobo: orders.totalKobo,
          paymentStatus: orders.paymentStatus,
          shippingAddress: orders.shippingAddress,
        })
        .from(orders)
        .where(inArray(orders.userId, userIds))
    : [];

  const userAddrs = userIds.length > 0
    ? await db.select().from(addresses).where(inArray(addresses.userId, userIds))
    : [];

  return rows.map((r) => {
    const uOrders = userOrders.filter((o) => o.userId === r.user.id);
    const paidOrders = uOrders.filter((o) => o.paymentStatus === 'PAID');
    const totalSpentNgn = Math.round(paidOrders.reduce((sum, o) => sum + o.totalKobo, 0) / 100);
    const defaultAddr = userAddrs.find((a) => a.userId === r.user.id && a.isDefault) ?? userAddrs.find((a) => a.userId === r.user.id);
    const shipping = uOrders[0]?.shippingAddress as { city?: string; phone?: string } | undefined;
    const city = defaultAddr?.city || shipping?.city || '';
    const phone = r.profile?.phone || defaultAddr?.phone || shipping?.phone || '';
    const tier = totalSpentNgn >= 500_000 ? 'Diamond' : totalSpentNgn >= 200_000 ? 'Platinum' : totalSpentNgn >= 50_000 ? 'Gold' : 'Member';
    const loyaltyPoints = Math.floor(totalSpentNgn / 100);

    return {
      id: r.user.id,
      email: r.user.email,
      emailVerified: r.user.emailVerifiedAt !== null,
      displayName: r.profile?.displayName ?? '',
      phone,
      city,
      totalSpentNgn,
      ordersCount: uOrders.length,
      tier,
      loyaltyPoints,
      roles: byUser.get(r.user.id) ?? ['CUSTOMER'],
      createdAt: r.user.createdAt,
    };
  });
}

export async function getProfile(db: AppDb, userId: string) {
  const rows = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function updateProfile(
  db: AppDb,
  userId: string,
  input: { displayName?: string; phone?: string; avatarUrl?: string },
) {
  const [row] = await db
    .insert(profiles)
    .values({ userId, ...input })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: { ...input, updatedAt: new Date() },
    })
    .returning();
  return row;
}

/** All address ops scope to (id, userId): cross-user access is impossible by construction. */
export async function listAddresses(db: AppDb, userId: string) {
  return db.select().from(addresses).where(eq(addresses.userId, userId));
}

export async function createAddress(db: AppDb, userId: string, input: CreateAddressInput) {
  return db.transaction(async (tx) => {
    if (input.isDefault) {
      await tx.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    }
    const [row] = await tx.insert(addresses).values({ ...input, userId }).returning();
    return row;
  });
}

export async function updateAddress(
  db: AppDb,
  userId: string,
  addressId: string,
  input: Partial<CreateAddressInput>,
) {
  return db.transaction(async (tx) => {
    if (input.isDefault) {
      await tx.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
    }
    const [row] = await tx
      .update(addresses)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
      .returning();
    if (!row) throw Errors.notFound('Address not found.');
    return row;
  });
}

export async function deleteAddress(db: AppDb, userId: string, addressId: string): Promise<void> {
  const deleted = await db
    .delete(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
    .returning({ id: addresses.id });
  if (deleted.length === 0) throw Errors.notFound('Address not found.');
}
