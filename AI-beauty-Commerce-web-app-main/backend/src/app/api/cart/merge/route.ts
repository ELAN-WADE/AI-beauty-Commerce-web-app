import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, readJson } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { mergeGuestCart } from '@/modules/cart/service';
import { mergeCartSchema } from '@/modules/cart/validation';

/** Login merge: fold the pre-login guest cart into the user cart. */
export const POST = api(async ({ req }) => {
  const db = getDb();
  const ctx = await requireAuth(db);
  const input = mergeCartSchema.parse(await readJson(req));
  return NextResponse.json(await mergeGuestCart(db, ctx.userId, input.sessionId));
});
