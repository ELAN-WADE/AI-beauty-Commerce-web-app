import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { toErrorResponse } from '@/lib/errors';
import { optionalAuth } from '@/modules/auth/require-auth';
import { getGuestOrder, getOwnOrder } from '@/modules/orders/service';

type Ctx = { params: Promise<{ id: string }> };

/**
  * Owner lookup (cookie session) or guest capability lookup.
 */
export async function GET(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const { id } = await params;
    const db = getDb();
    const auth = await optionalAuth(db);
    const token = req.headers.get('x-guest-order-token');
    if (auth && !token) {
      const res = NextResponse.json(await getOwnOrder(db, auth.userId, id));
      res.headers.set('x-request-id', requestId);
      return res;
    }
    const res = NextResponse.json(await getGuestOrder(db, id, token ?? ''));
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
