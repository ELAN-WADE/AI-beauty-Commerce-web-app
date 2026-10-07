import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DEV_LOOPBACKS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function configuredOrigins(): string[] {
  const norm = (u: string) => {
    try {
      return new URL(u).origin;
    } catch {
      return '';
    }
  };
  const raw = [process.env.FRONTEND_URL, ...(process.env.ALLOWED_ORIGINS ?? '').split(',')]
    .map((s) => norm((s ?? '').trim()))
    .filter((s) => s !== '');
  // Local dev: the Vite storefront (:5173) and the API (:3001) are different
  // origins in the browser, so allow the loopback dev servers explicitly.
  if (process.env.NODE_ENV !== 'production') {
    for (const o of DEV_LOOPBACKS) if (!raw.includes(o)) raw.push(o);
  }
  return [...new Set(raw)];
}

/**
 * Attach a request id to every API call (used by logs + error envelope),
 * and answer CORS for the storefront. Exact-origin match only — never `*`
 * with credentials. `Access-Control-Allow-Credentials` lets the HttpOnly
 * session cookie ride along; SameSite=Lax still applies, so use
 * http://localhost:5173 (not 127.0.0.1) in dev to stay same-site.
 */
export function middleware(req: NextRequest) {
  const requestId = crypto.randomUUID();
  // Central check covers dynamic handlers which cannot use the api() wrapper.
  // Signed provider callbacks do not authenticate with cookies.
  if (req.method !== 'OPTIONS' && !req.nextUrl.pathname.startsWith('/api/webhooks/')) {
    const origin = req.headers.get('origin');
    const allowed = [...configuredOrigins(), ...(process.env.APP_URL ? [new URL(process.env.APP_URL).origin] : [])];
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) && origin && !allowed.includes(origin)) {
      return NextResponse.json({ error: { code: 'forbidden_origin', message: 'Cross-origin requests are not allowed.', request_id: requestId, retryable: false } }, { status: 403, headers: { 'x-request-id': requestId } });
    }
  }
  const forwarded = new Headers(req.headers);
  forwarded.set('x-request-id', requestId); // never trust a caller-supplied correlation ID
  const res = req.method === 'OPTIONS' ? new NextResponse(null, { status: 204 }) : NextResponse.next({ request: { headers: forwarded } });
  res.headers.set('x-request-id', requestId);
  const origin = req.headers.get('origin');
  if (origin && configuredOrigins().includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Vary', 'Origin');
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, Idempotency-Key, X-Session-Id, X-Guest-Order-Token, X-Request-Id',
    );
    res.headers.set('Access-Control-Max-Age', '600');
  }
  return res;
}

export const config = { matcher: '/api/:path*' };
