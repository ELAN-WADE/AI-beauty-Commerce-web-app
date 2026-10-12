import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { shopper } from '@/lib/shopper';
import { initPayment } from '@/modules/payments/service';
import { initPaymentSchema } from '@/modules/payments/validation';

export const POST = api(async ({ req }) => {
  const db = getDb();
  const idempotencyKey = req.headers.get('Idempotency-Key')?.trim();
  if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 128) {
    throw Errors.badRequest('Idempotency-Key header (8–128 chars, stable across retries) is required.');
  }
  const who = await shopper(db, req);
  // Shared namespace with initPaymentAction: one budget per shopper.
  const rl = await checkSharedRateLimit(db, `pay-init:${who.userId ?? clientIp(req)}`, Limits.checkoutInit);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const input = initPaymentSchema.parse(await readJson(req));
  if (!who.userId && !req.headers.get('x-guest-order-token')) {
    throw Errors.badRequest('Guest order token required.');
  }
  const appUrl = process.env.APP_URL ?? new URL(req.url).origin;
  const result = await initPayment(db, {
    orderId: input.orderId,
    provider: input.provider,
    userId: who.userId,
    guestToken: req.headers.get('x-guest-order-token') ?? undefined,
    appUrl,
    idempotencyKey,
  });
  return NextResponse.json(result, { status: result.replay ? 200 : 201 });
});
