import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { toErrorResponse } from '@/lib/errors';
import { optionalAuth } from '@/modules/auth/require-auth';
import { getGuestOrder, getOwnOrder } from '@/modules/orders/service';

type Ctx = { params: Promise<{ id: string }> };

/**
 * Owner lookup (cookie session) or guest lookup (?email= must match the
 * order's guest email — identical 404 otherwise, no enumeration).
 */
export async function GET(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const { id } = await params;
    const db = getDb();
    const auth = await optionalAuth(db);
    if (auth) {
      const res = NextResponse.json(await getOwnOrder(db, auth.userId, id));
      res.headers.set('x-request-id', requestId);
      return res;
    }
    const email = z.string().email().parse(new URL(req.url).searchParams.get('email'));
    const res = NextResponse.json(await getGuestOrder(db, id, email));
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
