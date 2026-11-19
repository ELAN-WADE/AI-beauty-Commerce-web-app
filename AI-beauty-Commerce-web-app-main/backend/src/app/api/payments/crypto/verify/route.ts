import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, Errors, readJson } from '@/lib/errors';
import { requirePerm } from '@/lib/admin';
import { optionalAuth } from '@/modules/auth/require-auth';
import { hasStaffRole } from '@/modules/auth/admin-policy';
import { getCryptoPaymentStatus, verifyCryptoPayment } from '@/modules/crypto/service';
import { cryptoPaymentStatusQuerySchema, verifyCryptoPaymentSchema } from '@/modules/crypto/validation';

export const dynamic = 'force-dynamic';

/** Privileged manual settlement by authorized staff only (requires valid blockchain txHash). */
export const POST = api(async ({ req }) => {
  const db = getDb();
  const ctx = await requirePerm(db, 'orders:write');
  const body = verifyCryptoPaymentSchema.parse(await readJson(req, 16384));
  if (!body.txHash?.trim()) {
    throw Errors.badRequest('A valid blockchain transaction hash is required.');
  }

  const result = await verifyCryptoPayment(db, {
    paymentId: body.paymentId,
    txHash: body.txHash,
    actorId: ctx.userId,
  });

  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
});

export const GET = api(async ({ req }) => {
  const db = getDb();
  const url = new URL(req.url);
  const paymentId = url.searchParams.get('paymentId');
  if (!paymentId) throw Errors.badRequest('paymentId query parameter is required.');

  const validated = cryptoPaymentStatusQuerySchema.parse({ paymentId });
  const customer = await optionalAuth(db, 'CUSTOMER');
  const admin = customer ? null : await optionalAuth(db, 'ADMIN');
  const guestToken = req.headers.get('x-guest-order-token') ?? undefined;
  const status = await getCryptoPaymentStatus(db, validated.paymentId, {
    userId: customer?.userId ?? admin?.userId,
    guestToken,
    isAdmin: Boolean(admin && hasStaffRole(admin.roles)),
  });

  return NextResponse.json(status, { headers: { 'Cache-Control': 'no-store' } });
});
