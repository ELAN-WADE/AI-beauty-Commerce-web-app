import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkSharedRateLimit } from '@/lib/rate-limit';
import { shopper } from '@/lib/shopper';
import { submitClaim } from '@/modules/payments/service';
import { transferClaimSchema } from '@/modules/payments/validation';

/** Customer submits proof of a direct bank transfer for a PENDING order. */
export const POST = api(async ({ req }) => {
  const db = getDb();
  if (!(await checkSharedRateLimit(db, `claim:${clientIp(req)}`, { limit: 5, windowMs: 3600_000 })).allowed) throw Errors.rateLimited(60);
  const who = await shopper(db, req);
  const input = transferClaimSchema.parse(await readJson(req));
  if (!(await checkSharedRateLimit(db, `claim:order:${input.orderId}`, { limit: 5, windowMs: 3600_000 })).allowed) throw Errors.rateLimited(60);
  if (!who.userId && !req.headers.get('x-guest-order-token')) {
    throw Errors.badRequest('Guest order token required.');
  }
  const claim = await submitClaim(db, {
    orderId: input.orderId,
    userId: who.userId,
    guestToken: req.headers.get('x-guest-order-token') ?? undefined,
    senderName: input.senderName,
    amountKobo: input.amountKobo,
    bankName: input.bankName,
    narration: input.narration,
    transferDate: input.transferDate,
  });
  return NextResponse.json({ claim }, { status: 201 });
});
