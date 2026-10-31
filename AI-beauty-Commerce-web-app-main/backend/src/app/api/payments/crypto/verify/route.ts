import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, Errors, readJson } from '@/lib/errors';
import { optionalAuth } from '@/modules/auth/require-auth';
import { getCryptoPaymentStatus, verifyCryptoPayment } from '@/modules/crypto/service';
import { cryptoPaymentStatusQuerySchema, verifyCryptoPaymentSchema } from '@/modules/crypto/validation';

export const dynamic = 'force-dynamic';

export const POST = api(async ({ req }) => {
  const db = getDb();
  const session = await optionalAuth(db);
  const body = verifyCryptoPaymentSchema.parse(await readJson(req, 16384));

  const result = await verifyCryptoPayment(db, {
    paymentId: body.paymentId,
    txHash: body.txHash,
    actorId: session?.userId,
  });

  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
});

export const GET = api(async ({ req }) => {
  const db = getDb();
  const url = new URL(req.url);
  const paymentId = url.searchParams.get('paymentId');
  if (!paymentId) throw Errors.badRequest('paymentId query parameter is required.');

  const validated = cryptoPaymentStatusQuerySchema.parse({ paymentId });
  const status = await getCryptoPaymentStatus(db, validated.paymentId);

  return NextResponse.json(status, { headers: { 'Cache-Control': 'no-store' } });
});
