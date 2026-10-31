import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { shopper } from '@/lib/shopper';
import { addItem, clearCart } from '@/modules/cart/service';
import { cartItemSchema } from '@/modules/cart/validation';

export const POST = api(async ({ req }) => {
  const rl = checkRateLimit(`cart:${clientIp(req)}`, Limits.cartWrite);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const who = await shopper(db, req);
  if (!who.userId) throw Errors.unauthorized('Sign in to add products to your bag.');
  const input = cartItemSchema.parse(await readJson(req));
  return NextResponse.json(await addItem(db, who, input.variantId, input.qty), { status: 201 });
});

export const DELETE = api(async ({ req }) => {
  const rl = checkRateLimit(`cart:${clientIp(req)}`, Limits.cartWrite);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const who = await shopper(db, req);
  if (!who.userId) throw Errors.unauthorized('Sign in to change your bag.');
  return NextResponse.json(await clearCart(db, who));
});
