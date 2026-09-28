import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { Errors, readJson, toErrorResponse } from '@/lib/errors';
import { shopper } from '@/lib/shopper';
import { removeItem, setItemQty } from '@/modules/cart/service';
import { cartQtySchema } from '@/modules/cart/validation';

type Ctx = { params: Promise<{ id: string }> };

async function ownerCheck(req: Request) {
  const db = getDb();
  const who = await shopper(db, req);
  if (!who.userId && !who.sessionId) throw Errors.badRequest('Guest carts require X-Session-Id (UUID v4).');
  return { db, who };
}

export async function PATCH(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const { id } = await params;
    const { db, who } = await ownerCheck(req);
    const input = cartQtySchema.parse(await readJson(req));
    const res = NextResponse.json(await setItemQty(db, who, id, input.qty));
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const { id } = await params;
    const { db, who } = await ownerCheck(req);
    const res = NextResponse.json(await removeItem(db, who, id));
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
