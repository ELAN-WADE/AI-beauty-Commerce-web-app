import { and, eq } from 'drizzle-orm';
import type { AppDb } from '../../db/client';
import { Errors } from '../../lib/errors';
import { addresses, profiles } from './schema';
import type { CreateAddressInput } from './validation';

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
