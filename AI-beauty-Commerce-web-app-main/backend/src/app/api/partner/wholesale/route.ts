import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireAuth } from '@/modules/auth/require-auth';
import { wholesaleCommand } from '@/modules/wholesale/validation';
import { checkoutWholesale, quoteWholesale, recordDirectSale, wholesaleCatalogue, wholesaleOrderAction } from '@/modules/wholesale/service';
import { audit } from '@/modules/audit/service';

function limit(req: Request) {
  if (!checkRateLimit(`wholesale:${clientIp(req)}`, Limits.admin).allowed) throw Errors.rateLimited(60);
}
export const GET = api(async ({ req }) => {
  limit(req);
  const db = getDb();
  const auth = await requireAuth(db);
  return NextResponse.json(await wholesaleCatalogue(db, auth.userId));
});
export const POST = api(async ({ req, requestId }) => {
  limit(req);
  const db = getDb();
  const auth = await requireAuth(db);
  const input = wholesaleCommand.parse(await readJson(req));
  if (input.action === 'quote') return NextResponse.json(await quoteWholesale(db, auth.userId, input.items));
  const key = req.headers.get('Idempotency-Key');
  if (['checkout', 'directSale'].includes(input.action) && (!key || key.length < 8 || key.length > 128)) throw Errors.badRequest('Idempotency-Key is required.');
  const result = await db.transaction(async tx => {
    const result = input.action === 'checkout' ? await checkoutWholesale(tx, auth.userId, key!, { items: input.items, quoteFingerprint: input.quoteFingerprint })
      : input.action === 'directSale' ? await recordDirectSale(tx, auth.userId, key!, { variantId: input.variantId, qty: input.qty, note: input.note })
      : await wholesaleOrderAction(tx, auth.userId, input.orderId, input.action);
    await audit(tx, { actorId: auth.userId, action: `wholesale.${input.action}`, entityType: 'wholesale', requestId });
    return result;
  });
  return NextResponse.json(result, { status: input.action === 'checkout' ? 201 : 200 });
});
