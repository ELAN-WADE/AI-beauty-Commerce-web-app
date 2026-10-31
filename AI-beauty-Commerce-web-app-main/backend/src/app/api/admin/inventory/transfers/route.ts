import { revalidateStorefront } from '@/lib/storefront-revalidate';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { api, Errors, readJson } from '@/lib/errors';
import { requirePerm } from '@/lib/admin';
import { dispatchTransfer, receiveTransfer } from '@/modules/inventory/transfers';
import { audit } from '@/modules/audit/service';
const command = z.discriminatedUnion('action', [
  z.object({ action: z.literal('transfer'), sourceLocationId: z.string().uuid(), destinationLocationId: z.string().uuid(), items: z.array(z.object({ variantId: z.string().uuid(), qty: z.number().int().positive().max(10000) }).strict()).min(1).max(100), note: z.string().max(300) }).strict(),
  z.object({ action: z.literal('receive'), transferId: z.string().uuid() }).strict(),
]);
export const POST = api(async ({ req }) => {
  const db = getDb(); const actor = await requirePerm(db, 'inventory:write');
  const input = command.parse(await readJson(req));
  const key = req.headers.get('Idempotency-Key');
  if (!key || key.length < 8 || key.length > 128) throw Errors.badRequest('Idempotency-Key is required.');
  const result = await db.transaction(async tx => {
    const result = input.action === 'transfer' ? await dispatchTransfer(tx, actor.userId, key, input) : await receiveTransfer(tx, input.transferId, actor.userId);
    await audit(tx, { actorId: actor.userId, action: `inventory.${input.action}`, entityType: 'stock_transfer', entityId: result.id });
    return result;
  });
  revalidateStorefront();
  return NextResponse.json({ result });
});
