import { createHash } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { inventoryLocations, stockTransfers, transferItems } from './schema';
import { adjustStock } from './service';
import { aggregateLines } from '../routing/service';

export async function dispatchTransfer(db: Db, actorId: string, key: string, input: {
  sourceLocationId: string; destinationLocationId: string; items: { variantId: string; qty: number }[]; note: string;
}) {
  if (input.sourceLocationId === input.destinationLocationId) throw Errors.badRequest('Choose two different locations.');
  const items = aggregateLines(input.items);
  const fingerprint = createHash('sha256').update(JSON.stringify({ ...input, items })).digest('hex');
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`transfer:${key}`}, 0))`);
    const [prior] = await tx.select().from(stockTransfers).where(eq(stockTransfers.idempotencyKey, key));
    if (prior) {
      if (prior.fingerprint !== fingerprint || prior.dispatchedBy !== actorId) throw Errors.conflict('Idempotency key reused with different input.');
      return prior;
    }
    for (const id of [input.sourceLocationId, input.destinationLocationId].sort()) {
      const [location] = await tx.select().from(inventoryLocations).where(eq(inventoryLocations.id, id));
      if (!location) throw Errors.notFound('Location not found.');
    }
    const [transfer] = await tx.insert(stockTransfers).values({ ...input, idempotencyKey: key, fingerprint, dispatchedBy: actorId }).returning();
    for (const item of items) {
      await adjustStock(tx, { locationId: input.sourceLocationId, variantId: item.variantId, delta: -item.qty, reason: 'transfer.dispatch', refType: 'transfer', refId: transfer.id });
      await tx.insert(transferItems).values({ transferId: transfer.id, ...item });
    }
    return transfer;
  });
}

export async function receiveTransfer(db: Db, transferId: string, actorId: string, allowedLocationId?: string) {
  return db.transaction(async tx => {
    const [transfer] = await tx.select().from(stockTransfers).where(and(eq(stockTransfers.id, transferId), allowedLocationId ? eq(stockTransfers.destinationLocationId, allowedLocationId) : undefined)).for('update');
    if (!transfer) throw Errors.notFound('Transfer not found.');
    if (transfer.status === 'RECEIVED') return transfer;
    const items = await tx.select().from(transferItems).where(eq(transferItems.transferId, transferId)).orderBy(transferItems.variantId);
    for (const item of items) await adjustStock(tx, { locationId: transfer.destinationLocationId, variantId: item.variantId, delta: item.qty, reason: 'transfer.receive', refType: 'transfer', refId: transferId });
    const [updated] = await tx.update(stockTransfers).set({ status: 'RECEIVED', receivedBy: actorId, receivedAt: new Date() }).where(eq(stockTransfers.id, transferId)).returning();
    return updated;
  });
}
