import { privateSearchSurface } from './storefront/lib/site-seo';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { isAllowedApiOrigin as isOriginAllowed, isDevLoopbackOrigin } from './lib/origins';
import { adminPageDecision } from './modules/auth/admin-policy';

/**
 * Attach a request id to every API call (used by logs + error envelope),
 * and answer CORS for the storefront. Exact-origin match only — never `*`
 * with credentials. `Access-Control-Allow-Credentials` lets the HttpOnly
 * session cookie ride along; SameSite=Lax still applies, so use
 * http://localhost:5173 (not 127.0.0.1) in dev to stay same-site.
 */
export function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.delete('x-desla-private-admin');
  const adminPage = adminPageDecision(req.nextUrl.pathname, req.nextUrl.searchParams.get('screen'));
  if (adminPage === 'deny') return new NextResponse('Not found', { status: 404 });
  if (adminPage === 'private') {
    requestHeaders.set('x-desla-private-admin', '1');
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  }
  const requestId = crypto.randomUUID();
  // Central check covers dynamic handlers which cannot use the api() wrapper.
  // Signed provider callbacks do not authenticate with cookies.
  if (req.method !== 'OPTIONS' && !req.nextUrl.pathname.startsWith('/api/webhooks/')) {
    const origin = req.headers.get('origin');
    const secFetchSite = req.headers.get('sec-fetch-site');
    const isDevLoopback = origin && isDevLoopbackOrigin(origin);
    const isCrossSite = secFetchSite === 'cross-site' && !isDevLoopback;
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) && (isCrossSite || (origin && !isOriginAllowed(origin)))) {
      return NextResponse.json({ error: { code: 'forbidden_origin', message: 'Cross-origin requests are not allowed.', request_id: requestId, retryable: false } }, { status: 403, headers: { 'x-request-id': requestId } });
    }
  }
  const forwarded = requestHeaders;
  forwarded.set('x-request-id', requestId); // never trust a caller-supplied correlation ID
  const res = req.method === 'OPTIONS' ? new NextResponse(null, { status: 204 }) : NextResponse.next({ request: { headers: forwarded } });
  res.headers.set('x-request-id', requestId);
  const origin = req.headers.get('origin');
  if (origin && isOriginAllowed(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Vary', 'Origin');
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, Idempotency-Key, X-Session-Id, X-Guest-Order-Token, X-Request-Id, X-Desla-Auth-Context',
    );
    res.headers.set('Access-Control-Max-Age', '600');
  }
  if (privateSearchSurface(req.nextUrl.pathname, req.nextUrl.searchParams.get('screen'))) res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
