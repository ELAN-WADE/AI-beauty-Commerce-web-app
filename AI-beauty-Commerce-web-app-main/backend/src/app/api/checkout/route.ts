import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { shopper } from '@/lib/shopper';
import { checkout } from '@/modules/orders/service';
import { checkoutSchema } from '@/modules/cart/validation';

export const POST = api(async ({ req }) => {
  const rl = checkRateLimit(`checkout:${clientIp(req)}`, Limits.checkoutInit);
  if (!rl.allowed) throw Errors.rateLimited(60);

  // Idempotency-Key is REQUIRED: safe retries, no duplicate orders (§12).
  const key = req.headers.get('Idempotency-Key')?.trim();
  if (!key || key.length < 8 || key.length > 128) {
    throw Errors.badRequest('Idempotency-Key header (8–128 chars, unique per checkout) is required.');
  }

  const db = getDb();
  const who = await shopper(db, req);
  const input = checkoutSchema.parse(await readJson(req));
  // NOTE: totals/prices/discounts in the body are rejected by strict() —
  // the server prices everything from variant rows (§6).
  const result = await checkout(db, {
    userId: who.userId,
    sessionId: who.sessionId ?? input.sessionId,
    input,
    idempotencyKey: key,
    ip: clientIp(req),
  });
  return NextResponse.json(result, { status: result.replay ? 200 : 201 });
});
