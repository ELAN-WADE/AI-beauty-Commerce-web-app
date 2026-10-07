import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { toErrorResponse } from '@/lib/errors';
import { optionalAuth } from '@/modules/auth/require-auth';
import { getShipmentForOrder } from '@/modules/shipping/service';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const { id } = await params;
    const db = getDb();
    const auth = await optionalAuth(db);
    const res = NextResponse.json(await getShipmentForOrder(db, id, { userId: auth?.userId, guestToken: req.headers.get('x-guest-order-token') ?? undefined }));
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
