import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { shopper } from '@/lib/shopper';
import { checkout } from '@/modules/orders/service';
import { checkoutSchema } from '@/modules/cart/validation';

export const POST = api(async ({ req }) => {
  const db = getDb();

  // Idempotency-Key is REQUIRED: safe retries, no duplicate orders (§12).
  const key = req.headers.get('Idempotency-Key')?.trim();
  if (!key || key.length < 8 || key.length > 128) {
    throw Errors.badRequest('Idempotency-Key header (8–128 chars, unique per checkout) is required.');
  }

  const who = await shopper(db, req);
  // Identity-first quota: one budget per shopper across REST and actions,
  // so shared mobile NATs don't throttle innocent neighbors. Guests fall
  // back to IP (same namespace the Server Action uses).
  const rl = await checkSharedRateLimit(db, `checkout:${who.userId ?? clientIp(req)}`, Limits.checkoutInit);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const input = checkoutSchema.parse(await readJson(req));
  if (!who.userId && !input.guestAccessToken) throw Errors.badRequest('Guest access token is required.');
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
