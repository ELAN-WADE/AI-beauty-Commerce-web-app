import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, Errors, readJson } from '@/lib/errors';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
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
  // Money-adjacent: shared DB quota, one budget per user across transports.
  const rl = await checkSharedRateLimit(db, `loyalty:${ctx.userId}`, Limits.loyaltyRedeem);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const input = redeemSchema.parse(await readJson(req));
  return NextResponse.json({ voucher: await redeemToVoucher(db, ctx.userId, input.points) }, { status: 201 });
});
