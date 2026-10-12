import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireAuth } from '@/modules/auth/require-auth';
import { addWishlist, listWishlist, removeWishlist } from '@/modules/cart/service';
import { wishlistAddSchema } from '@/modules/cart/validation';
import { z } from 'zod';

export const GET = api(async () => {
  const db = getDb();
  const ctx = await requireAuth(db);
  return NextResponse.json({ wishlist: await listWishlist(db, ctx.userId) });
});

export const POST = api(async ({ req }) => {
  const rl = checkRateLimit(`wishlist:${clientIp(req)}`, Limits.wishlist);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const ctx = await requireAuth(db);
  const input = wishlistAddSchema.parse(await readJson(req));
  return NextResponse.json({ wishlist: await addWishlist(db, ctx.userId, input.variantId) }, { status: 201 });
});

export const DELETE = api(async ({ req }) => {
  const rl = checkRateLimit(`wishlist:${clientIp(req)}`, Limits.wishlist);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const ctx = await requireAuth(db);
  const variantId = z.string().uuid().parse(new URL(req.url).searchParams.get('variantId'));
  return NextResponse.json({ wishlist: await removeWishlist(db, ctx.userId, variantId) });
});
