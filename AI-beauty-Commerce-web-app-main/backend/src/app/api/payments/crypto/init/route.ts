import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, Errors, readJson } from '@/lib/errors';
import { optionalAuth } from '@/modules/auth/require-auth';
import { initCryptoPayment } from '@/modules/crypto/service';
import { initCryptoPaymentSchema } from '@/modules/crypto/validation';

export const dynamic = 'force-dynamic';

export const POST = api(async ({ req }) => {
  const db = getDb();
  const session = await optionalAuth(db);
  const guestToken = req.headers.get('x-guest-order-token') ?? undefined;
  const key = req.headers.get('Idempotency-Key');

  if (!key || key.length < 8 || key.length > 128) {
    throw Errors.badRequest('Idempotency-Key header is required (8-128 chars).');
  }

  const body = initCryptoPaymentSchema.parse(await readJson(req, 16384));
  const result = await initCryptoPayment(db, {
    orderId: body.orderId,
    asset: body.asset,
    network: body.network,
    idempotencyKey: key,
    userId: session?.userId,
    guestToken,
  });

  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
});
