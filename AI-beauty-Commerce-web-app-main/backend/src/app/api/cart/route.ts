import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api } from '@/lib/errors';
import { shopper } from '@/lib/shopper';
import { getCartView, resolveCart } from '@/modules/cart/service';

export const GET = api(async ({ req }) => {
  const db = getDb();
  const who = await shopper(db, req);
  if (!who.userId && !who.sessionId) {
    return NextResponse.json({ cartId: null as string | null, lines: [], subtotalKobo: 0 });
  }
  const cart = await resolveCart(db, who);
  return NextResponse.json(await getCartView(db, cart.id));
});
