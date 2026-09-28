import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, readJson } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { getLoyaltyView, redeemToVoucher } from '@/modules/loyalty/service';
import { redeemSchema } from '@/modules/loyalty/validation';

export const GET = api(async () => {
  const db = getDb();
  const ctx = await requireAuth(db);
  return NextResponse.json(await getLoyaltyView(db, ctx.userId));
});

export const POST = api(async ({ req }) => {
  const db = getDb();
  const ctx = await requireAuth(db);
  const input = redeemSchema.parse(await readJson(req));
  return NextResponse.json({ voucher: await redeemToVoucher(db, ctx.userId, input.points) }, { status: 201 });
});
