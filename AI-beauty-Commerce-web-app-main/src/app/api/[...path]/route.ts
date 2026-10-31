import { NextRequest, NextResponse } from 'next/server';

function isAllowedProxyOrigin(origin: string | null, targetOrigin: string): boolean {
  if (!origin || origin === targetOrigin) return true;
  if (process.env.NODE_ENV !== 'production') {
    try {
      const u1 = new URL(origin);
      const u2 = new URL(targetOrigin);
      const loopbacks = ['localhost', '127.0.0.1', '[::1]'];
      if (loopbacks.includes(u1.hostname) && loopbacks.includes(u2.hostname)) return true;
    } catch {}
  }
  return false;
}

// First-party transport for the existing backend. Auth cookies stay HttpOnly on
// the storefront origin, including when the API is hosted on another site.
async function proxy(req: NextRequest) {
  const configured = process.env.API_UPSTREAM_URL || process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL;
  const fail = (status: number, code: string, message: string) => NextResponse.json({ error: { code, message, retryable: status === 503 } }, { status, headers: { 'Cache-Control': 'no-store' } });
  if (!configured) return fail(503, 'api_not_configured', 'The account service is not configured. Please contact support.');
  let upstream: URL;
  try {
    upstream = new URL(configured);
    if (!['https:', 'http:'].includes(upstream.protocol) || upstream.username || upstream.password || upstream.pathname !== '/' || upstream.search || upstream.hash || upstream.origin === req.nextUrl.origin) throw new Error();
    if (process.env.NODE_ENV === 'production' && (upstream.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(upstream.hostname))) throw new Error();
  } catch { return fail(503, 'api_not_configured', 'The account service address is invalid. Please contact support.'); }
  const origin = req.headers.get('origin');
  const secFetchSite = req.headers.get('sec-fetch-site');
  const isDevLoopback = process.env.NODE_ENV !== 'production' && origin && isAllowedProxyOrigin(origin, req.nextUrl.origin);
  const isCrossSite = secFetchSite === 'cross-site' && !isDevLoopback;
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && (isCrossSite || (origin && !isAllowedProxyOrigin(origin, req.nextUrl.origin)))) return fail(403, 'forbidden_origin', 'Cross-origin requests are not allowed.');
  const target = new URL(req.nextUrl.pathname + req.nextUrl.search, upstream);
  const headers = new Headers();
  for (const name of ['content-type', 'cookie', 'idempotency-key', 'x-session-id', 'x-guest-order-token']) {
    const value = req.headers.get(name); if (value) headers.set(name, value);
  }
  if (origin) headers.set('origin', origin);
  // The API's edge remains responsible for CLIENT_IP_HEADER. Never forward a
  // caller-supplied trusted-IP or authorization header through this proxy.
  let body: ArrayBuffer | undefined;
  if (!['GET', 'HEAD'].includes(req.method)) {
    const reader = req.body?.getReader(); const chunks: Uint8Array[] = []; let bytes = 0;
    // The authenticated media endpoint accepts video plus multipart overhead.
    const maxBody = target.pathname === '/api/admin/media/upload' ? 52 * 1024 * 1024 : 10_485_760;
    if (reader) for (;;) { const part = await reader.read(); if (part.done) break; bytes += part.value.byteLength; if (bytes > maxBody) { await reader.cancel(); return fail(413, 'payload_too_large', 'Request body too large.'); } chunks.push(part.value); }
    const value = new Uint8Array(bytes); let offset = 0; for (const chunk of chunks) { value.set(chunk, offset); offset += chunk.length; } body = value.buffer;
  }
  const timeoutMs = process.env.NODE_ENV === 'development' ? 120000 : 20000;
  const isSyncStream = req.method === 'GET' && target.pathname === '/api/storefront/sync';
  // Bound the SSE handshake, not the lifetime of an established stream. The
  // ordinary request deadline was killing healthy sync connections repeatedly.
  const handshake = new AbortController();
  const handshakeTimer = isSyncStream ? setTimeout(() => handshake.abort(), timeoutMs) : undefined;
  try {
    const signal = isSyncStream ? AbortSignal.any([req.signal, handshake.signal]) : AbortSignal.timeout(timeoutMs);
    const response = await fetch(target, { method: req.method, headers, body, redirect: 'manual', cache: 'no-store', signal });
    const outgoing = new Headers({ 'Cache-Control': 'no-store' });
    for (const name of ['content-type', 'retry-after', 'x-request-id', 'location']) { const value = response.headers.get(name); if (value) outgoing.set(name, value); }
    for (const cookie of response.headers.getSetCookie()) outgoing.append('set-cookie', cookie);
    if (isSyncStream && response.headers.get('content-type')?.includes('text/event-stream')) {
      outgoing.set('Cache-Control', 'no-cache, no-transform');
      outgoing.set('X-Accel-Buffering', 'no');
    }
    return new NextResponse(response.body, { status: response.status, headers: outgoing });
  } catch { return fail(503, 'backend_unavailable', 'The account service cannot be reached. Please try again shortly.'); }
  finally { if (handshakeTimer !== undefined) clearTimeout(handshakeTimer); }
}
export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
