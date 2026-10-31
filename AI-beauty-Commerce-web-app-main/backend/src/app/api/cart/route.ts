import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { getCartView, resolveCart } from '@/modules/cart/service';

export const GET = api(async ({ req }) => {
  const db = getDb();
  const who = await requireAuth(db);
  const cart = await resolveCart(db, who);
  return NextResponse.json({ ...await getCartView(db, cart.id), ownerId: who.userId }, { headers: { 'Cache-Control': 'no-store' } });
});
