import { and, eq, inArray, lt, sql } from 'drizzle-orm';
import type { AppDb, Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { HQ_LOCATION_ID, inventoryLocations, inventoryMovements, reservations, stockLevels, type StockPool } from './schema';
import { productVariants } from '../catalog/schema';

/** Pure: available = on_hand - reserved. Never stored, always computed. */
export function computeAvailable(onHand: number, reserved: number): number {
  return Math.max(0, onHand - reserved);
}

export async function getLevels(
  db: Db,
  variantIds: string[],
  locationId?: string,
): Promise<Map<string, { onHand: number; reserved: number; available: number }>> {
  if (variantIds.length === 0) return new Map();
  const rows = await db.select({ variantId: stockLevels.variantId, onHand: stockLevels.onHand, reserved: stockLevels.reserved })
    .from(stockLevels).innerJoin(inventoryLocations, eq(stockLevels.locationId, inventoryLocations.id))
    .where(and(eq(stockLevels.pool, 'PLATFORM'), inArray(stockLevels.variantId, variantIds), locationId ? eq(stockLevels.locationId, locationId) : eq(inventoryLocations.isActive, true)));
  const map = new Map<string, { onHand: number; reserved: number; available: number }>();
  for (const id of variantIds) map.set(id, { onHand: 0, reserved: 0, available: 0 });
  for (const r of rows) {
    const old = map.get(r.variantId)!;
    map.set(r.variantId, { onHand: old.onHand + r.onHand, reserved: old.reserved + r.reserved, available: old.available + computeAvailable(r.onHand, r.reserved) });
  }
  return map;
}

/**
 * Admin stock adjustment. Transactional: lock row → apply delta → movement log.
 * Negative results are rejected (CHECK is the backstop, this is the message).
 */
export async function adjustStock(
  db: Db,
   input: { variantId: string; locationId?: string; pool?: StockPool; delta: number; reason: string; refType?: string; refId?: string },
) {
  return db.transaction(async (tx) => {
    const locationId = input.locationId ?? HQ_LOCATION_ID;
    const pool = input.pool ?? 'PLATFORM';
    if (!Number.isSafeInteger(input.delta)) throw Errors.badRequest('Stock quantity must be an integer.');
    const key = and(eq(stockLevels.variantId, input.variantId), eq(stockLevels.locationId, locationId), eq(stockLevels.pool, pool));
    const variant = await tx.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.id, input.variantId)).limit(1);
    if (variant.length === 0) throw Errors.notFound('Variant not found.');

    await tx.insert(stockLevels).values({ locationId, pool, variantId: input.variantId }).onConflictDoNothing();
    let rows = await tx.select().from(stockLevels).where(key).for('update').limit(1);
    {
      const next = rows[0].onHand + input.delta;
      if (next < 0) throw Errors.badRequest('Insufficient stock for this adjustment.');
      if (rows[0].reserved > next) throw Errors.badRequest('Adjustment would strand reserved units.');
      await tx.update(stockLevels).set({ onHand: next, updatedAt: new Date() }).where(key);
      rows = [{ ...rows[0], onHand: next }];
    }
    await tx.insert(inventoryMovements).values({
      locationId,
      pool,
      variantId: input.variantId,
      delta: input.delta,
      reason: input.reason.slice(0, 200),
      refType: input.refType,
      refId: input.refId,
    });
    const r = rows[0];
    return { locationId, pool, variantId: r.variantId, onHand: r.onHand, reserved: r.reserved, available: computeAvailable(r.onHand, r.reserved) };
  });
}

/**
 * Reserve stock for a cart/order (checkout path, S3). Row lock + availability
 * check + increment happen atomically — concurrent checkouts cannot oversell.
 * SIMPLE MODE: omit locationId/pool to use HQ + PLATFORM. Only routing/partner
 * code passes explicit locationId; WHOLESALE pool never fulfils retail.
 */
export async function reserveStock(
  db: Db,
  input: { variantId: string; locationId?: string; pool?: StockPool; qty: number; refType: 'cart' | 'order'; refId: string; ttlMinutes: number },
) {
  return db.transaction(async (tx) => {
    const locationId = input.locationId ?? HQ_LOCATION_ID;
    const pool = input.pool ?? 'PLATFORM';
    if (!Number.isSafeInteger(input.qty) || input.qty < 1) throw Errors.badRequest('Quantity must be a positive integer.');
    const key = and(eq(stockLevels.variantId, input.variantId), eq(stockLevels.locationId, locationId), eq(stockLevels.pool, pool));
    const variant = await tx.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.id, input.variantId)).limit(1);
    if (variant.length === 0) throw Errors.notFound('Variant not found.');

    const rows = await tx.select().from(stockLevels).where(key).for('update').limit(1);
    const level = rows[0] ?? { onHand: 0, reserved: 0 };
    if (rows.length === 0) {
      await tx.insert(stockLevels).values({ locationId, pool, variantId: input.variantId }).onConflictDoNothing();
    }
    if (computeAvailable(level.onHand, level.reserved) < input.qty) {
      throw Errors.badRequest('Insufficient stock for this quantity.');
    }
    await tx
      .update(stockLevels)
      .set({ reserved: level.reserved + input.qty, updatedAt: new Date() })
      .where(key);
    const [reservation] = await tx
      .insert(reservations)
      .values({
        locationId,
        pool,
        variantId: input.variantId,
        refType: input.refType,
        refId: input.refId,
        qty: input.qty,
        expiresAt: new Date(Date.now() + input.ttlMinutes * 60_000),
      })
      .returning({ id: reservations.id, expiresAt: reservations.expiresAt });
    await tx.insert(inventoryMovements).values({
      locationId,
      pool,
      variantId: input.variantId,
      delta: 0,
      reason: 'reserve',
      refType: input.refType,
      refId: reservation.id,
    });
    return reservation;
  });
}

async function settleReservation(
  db: Db,
  reservationId: string,
  toStatus: 'committed' | 'released' | 'expired',
) {
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(reservations).where(eq(reservations.id, reservationId)).for('update').limit(1);
    const res = rows[0];
    if (!res || res.status !== 'active') throw Errors.gone('Reservation is no longer active.');
    await tx.update(reservations).set({ status: toStatus }).where(eq(reservations.id, reservationId));

    const key = and(eq(stockLevels.variantId, res.variantId), eq(stockLevels.locationId, res.locationId), eq(stockLevels.pool, res.pool));
    const levels = await tx.select().from(stockLevels).where(key).for('update').limit(1);
    const level = levels[0] ?? { onHand: 0, reserved: 0 };
    if (toStatus === 'committed') {
      // Paid: reserved converts to sold (on_hand drops, reserved drops equally).
      await tx
        .update(stockLevels)
        .set({ onHand: level.onHand - res.qty, reserved: level.reserved - res.qty, updatedAt: new Date() })
        .where(key);
      await tx.insert(inventoryMovements).values({ locationId: res.locationId, pool: res.pool, variantId: res.variantId, delta: -res.qty, reason: 'sale', refType: 'order', refId: res.refId });
    } else {
      // Released/expired: reserved units return to available pool.
      await tx
        .update(stockLevels)
        .set({ reserved: Math.max(0, level.reserved - res.qty), updatedAt: new Date() })
        .where(key);
      await tx.insert(inventoryMovements).values({ locationId: res.locationId, pool: res.pool, variantId: res.variantId, delta: 0, reason: toStatus === 'expired' ? 'expire' : 'release', refType: res.refType, refId: res.refId });
    }
    return { id: reservationId, status: toStatus };
  });
}

export const commitReservation = (db: Db, id: string) => settleReservation(db, id, 'committed');
export const releaseReservation = (db: Db, id: string) => settleReservation(db, id, 'released');

/**
 * Simple-mode facade: single-location shops call this instead of touching
 * locationId/pool directly. Keeps call sites free of multi-location complexity.
 */
export const reserveSimple = (
  db: Db,
  input: { variantId: string; qty: number; refType: 'cart' | 'order'; refId: string; ttlMinutes?: number },
) =>
  reserveStock(db, {
    variantId: input.variantId,
    qty: input.qty,
    refType: input.refType,
    refId: input.refId,
    ttlMinutes: input.ttlMinutes ?? 30,
  });

export const levelsSimple = (db: Db, variantIds: string[]) => getLevels(db, variantIds);

/** Sweeper (S5 worker): expire overdue active reservations, batched. */
export async function releaseExpired(db: AppDb, limit = 100): Promise<{ expired: number }> {
  const now = new Date();
  const rows = await db
    .select({ id: reservations.id })
    .from(reservations)
    .where(and(eq(reservations.status, 'active'), lt(reservations.expiresAt, now)))
    .limit(limit);
  let expired = 0;
  for (const r of rows) {
    try {
      await settleReservation(db, r.id, 'expired');
      expired += 1;
    } catch {
      // Already settled by a concurrent worker — idempotent by status guard.
    }
  }
  return { expired };
}
