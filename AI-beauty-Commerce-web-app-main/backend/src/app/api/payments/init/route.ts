import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { shopper } from '@/lib/shopper';
import { initPayment } from '@/modules/payments/service';
import { initPaymentSchema } from '@/modules/payments/validation';

export const POST = api(async ({ req }) => {
  const rl = checkRateLimit(`pay-init:${clientIp(req)}`, Limits.checkoutInit);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const who = await shopper(db, req);
  const input = initPaymentSchema.parse(await readJson(req));
  if (!who.userId && !input.guestEmail) {
    throw Errors.badRequest('Guest checkout requires guestEmail.');
  }
  const appUrl = process.env.APP_URL ?? new URL(req.url).origin;
  const result = await initPayment(db, {
    orderId: input.orderId,
    provider: input.provider,
    userId: who.userId,
    guestEmail: input.guestEmail,
    appUrl,
  });
  return NextResponse.json(result, { status: result.replay ? 200 : 201 });
});
