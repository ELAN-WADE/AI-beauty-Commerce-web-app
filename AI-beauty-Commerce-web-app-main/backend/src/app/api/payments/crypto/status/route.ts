import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, Errors } from '@/lib/errors';
import { optionalAuth } from '@/modules/auth/require-auth';
import { hasStaffRole } from '@/modules/auth/admin-policy';
import { getCryptoPaymentStatus } from '@/modules/crypto/service';
import { cryptoPaymentStatusQuerySchema } from '@/modules/crypto/validation';

export const dynamic = 'force-dynamic';

export const GET = api(async ({ req }) => {
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get('paymentId');
  if (!paymentId) throw Errors.badRequest('paymentId query parameter is required.');

  const validated = cryptoPaymentStatusQuerySchema.parse({ paymentId });
  const db = getDb();
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
