import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Attach a request id to every API call (used by logs + error envelope). */
export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  if (!req.headers.get('x-request-id')) {
    res.headers.set('x-request-id', crypto.randomUUID());
  }
  return res;
}

export const config = { matcher: '/api/:path*' };
