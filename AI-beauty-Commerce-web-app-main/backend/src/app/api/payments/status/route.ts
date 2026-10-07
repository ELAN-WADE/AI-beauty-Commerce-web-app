import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api } from '@/lib/errors';
import { shopper } from '@/lib/shopper';
import { attemptStatus } from '@/modules/payments/service';
import { paymentStatusQuery } from '@/modules/payments/validation';

export const GET = api(async ({ req }) => {
  const db = getDb();
  const who = await shopper(db, req);
  const url = new URL(req.url);
  const { reference } = paymentStatusQuery.parse({ reference: url.searchParams.get('reference') });
  return NextResponse.json(await attemptStatus(db, reference, { userId: who.userId, guestToken: req.headers.get('x-guest-order-token') ?? undefined }));
});
