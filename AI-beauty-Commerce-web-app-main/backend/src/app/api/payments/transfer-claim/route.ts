import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, Errors, readJson } from '@/lib/errors';
import { shopper } from '@/lib/shopper';
import { submitClaim } from '@/modules/payments/service';
import { transferClaimSchema } from '@/modules/payments/validation';

/** Customer submits proof of a direct bank transfer for a PENDING order. */
export const POST = api(async ({ req }) => {
  const db = getDb();
  const who = await shopper(db, req);
  const input = transferClaimSchema.parse(await readJson(req));
  if (!who.userId && !input.guestEmail) {
    throw Errors.badRequest('Guest claims require guestEmail.');
  }
  const claim = await submitClaim(db, {
    orderId: input.orderId,
    userId: who.userId,
    guestEmail: input.guestEmail,
    senderName: input.senderName,
    amountKobo: input.amountKobo,
    bankName: input.bankName,
    narration: input.narration,
    transferDate: input.transferDate,
  });
  return NextResponse.json({ claim }, { status: 201 });
});
