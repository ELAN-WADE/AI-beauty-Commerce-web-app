import { beginGoogleSignIn, finishSignIn, rememberAuthIntent } from '../src/storefront/lib/auth-flow';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { NextRequest as StorefrontRequest } from '../../node_modules/next/server';
import { POST as authPost, GET as storefrontGet } from '../../src/app/api/[...path]/route';
import { GET as adminGet } from '../../src/app/api/admin/[...path]/route';
import { GET as partnerGet } from '../../src/app/api/partner/route';
import { POST as workspacePost } from '../../src/app/api/partner/[...path]/route';
import { middleware } from '../src/middleware';
import { enforceOrigin } from '../src/lib/errors';

afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('storefront authentication boundary', () => {
  it('forwards the selected administrator context and its independent HttpOnly cookie', async () => {
    vi.stubEnv('API_UPSTREAM_URL', 'http://localhost:3005');
    const fetcher = vi.fn().mockResolvedValue(Response.json({ ok: true }, { headers: { 'set-cookie': 'desla_admin_sid=admin-fixture; Path=/; HttpOnly; SameSite=Lax' } }));
    vi.stubGlobal('fetch', fetcher);
    const result = await authPost(new StorefrontRequest('http://localhost:3000/api/auth/admin/login', { method: 'POST', headers: { origin: 'http://localhost:3000', 'x-desla-auth-context': 'ADMIN' }, body: '{}' }));
    expect(fetcher.mock.calls[0][1].headers.get('x-desla-auth-context')).toBe('ADMIN');
    expect(result.headers.get('set-cookie')).toContain('desla_admin_sid=admin-fixture');
  });
  it('keeps an established catalogue sync stream alive beyond the ordinary deadline and cancels with its client', async () => {
    vi.useFakeTimers();
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('API_UPSTREAM_URL', 'http://localhost:3005');
    const client = new AbortController();
    const encoder = new TextEncoder();
    let writer: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({ start(controller) { writer = controller; controller.enqueue(encoder.encode('event: connected\ndata: {}\n\n')); } });
    const fetcher = vi.fn().mockResolvedValue(new Response(stream, { headers: { 'content-type': 'text/event-stream' } }));
    vi.stubGlobal('fetch', fetcher);
    const response = await storefrontGet(new StorefrontRequest('http://localhost:3000/api/storefront/sync', { signal: client.signal }));
    expect(response.headers.get('cache-control')).toBe('no-cache, no-transform');
    expect(response.headers.get('x-accel-buffering')).toBe('no');
    const reader = response.body!.getReader();
    expect(new TextDecoder().decode((await reader.read()).value)).toContain('connected');
    await vi.advanceTimersByTimeAsync(125000);
    expect(fetcher.mock.calls[0][1].signal.aborted).toBe(false);
    writer!.enqueue(encoder.encode('event: sync\ndata: {}\n\n'));
    expect(new TextDecoder().decode((await reader.read()).value)).toContain('event: sync');
    client.abort();
    expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);
    await reader.cancel();
  });
  it('forwards login to the persistent backend and preserves the HttpOnly cookie', async () => {
    vi.stubEnv('API_UPSTREAM_URL', 'http://localhost:3005');
    const fetcher = vi.fn().mockResolvedValue(new Response('{"ok":true}', { headers: { 'set-cookie': 'desla_sid=opaque; Path=/; HttpOnly; SameSite=Lax', 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetcher);
    const result = await authPost(new StorefrontRequest('http://localhost:3000/api/auth/login', { method: 'POST', headers: { origin: 'http://localhost:3000', 'content-type': 'application/json' }, body: JSON.stringify({ email: 'admin@example.test', password: 'test-password' }) }));
    expect(result.status).toBe(200);
    expect(fetcher.mock.calls[0][0].toString()).toBe('http://localhost:3005/api/auth/login');
    expect(result.headers.get('set-cookie')).toContain('HttpOnly');
  });
  it('preserves backend denial for admin requests instead of serving mock data', async () => {
    vi.stubEnv('API_UPSTREAM_URL', 'http://localhost:3005');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: { code: 'unauthorized' } }, { status: 401 })));
    expect((await adminGet(new StorefrontRequest('http://localhost:3000/api/admin/metrics'))).status).toBe(401);
  });
  it('rejects cross-site credential submission without contacting the backend', async () => {
    vi.stubEnv('API_UPSTREAM_URL', 'http://localhost:3005');
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    expect((await authPost(new StorefrontRequest('http://localhost:3000/api/auth/login', { method: 'POST', headers: { origin: 'https://untrusted.test' } }))).status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('partner endpoints preserve authentication failures instead of fabricated success', async () => {
    vi.stubEnv('API_UPSTREAM_URL', 'http://localhost:3005');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: { code: 'unauthorized' } }, { status: 401 })));
    expect((await partnerGet(new StorefrontRequest('http://localhost:3000/api/partner?kind=CREATOR'))).status).toBe(401);
    expect((await workspacePost(new StorefrontRequest('http://localhost:3000/api/partner/workspace', { method: 'POST', body: '{}' }))).status).toBe(401);
  });
  it('middleware rejects cross-site writes even with a missing Origin header', () => {
    expect(middleware(new NextRequest('http://localhost:3005/api/auth/login', { method: 'POST', headers: { 'sec-fetch-site': 'cross-site' } })).status).toBe(403);
  });
  it('middleware permits local loopback writes on dev ports (:3001, :3002)', () => {
    const res = middleware(new NextRequest('http://localhost:3005/api/auth/login', { method: 'POST', headers: { origin: 'http://localhost:3001', 'sec-fetch-site': 'same-site' } }));
    expect(res.status).not.toBe(403);
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3001');
  });
  it('storefront proxy permits dev loopback requests from alternate ports', async () => {
    vi.stubEnv('API_UPSTREAM_URL', 'http://localhost:3005');
    const fetcher = vi.fn().mockResolvedValue(new Response('{"ok":true}', { headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetcher);
    const result = await authPost(new StorefrontRequest('http://localhost:3001/api/auth/login', { method: 'POST', headers: { origin: 'http://localhost:3001', 'content-type': 'application/json' }, body: JSON.stringify({ email: 'test@example.test', password: 'test-password' }) }));
    expect(result.status).toBe(200);
    expect(fetcher).toHaveBeenCalled();
  });
});

describe('sign-in destination handoff', () => {
  function browser() {
    const memory = new Map<string, string>();
    const assign = vi.fn();
    vi.stubGlobal('window', { location: { search: '', assign } });
    vi.stubGlobal('sessionStorage', { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value), removeItem: (key: string) => memory.delete(key) });
    return { assign, memory };
  }
  it('keeps the chosen partner destination for an approved partner without a document reload', () => {
    const { assign, memory } = browser();
    rememberAuthIntent('CREATOR', '/creators?workspace=content');
    const navigate = vi.fn();
    finishSignIn({ roles: ['CUSTOMER', 'CREATOR'], sessionScope: 'CUSTOMER' }, navigate);
    expect(navigate).toHaveBeenCalledWith('/creators?workspace=content');
    expect(assign).not.toHaveBeenCalled();
    expect(memory.has('desla-auth-intent')).toBe(false);
  });
  it('rejects an external return destination before handing off navigation', () => {
    const { memory } = browser();
    memory.set('desla-auth-intent', JSON.stringify({ intent: 'CUSTOMER', returnTo: '//untrusted.example' }));
    const navigate = vi.fn();
    finishSignIn({ roles: ['SUPPORT'], sessionScope: 'ADMIN', adminEntryPath: '/ops-0123456789abcdef01234567' }, navigate);
    expect(navigate).toHaveBeenCalledWith('/ops-0123456789abcdef01234567');
  });
});

describe('Google start URL boundary', () => {
  it.each([
    ['development', 'http://localhost:3001', 'http://localhost:3000/api/auth/oauth/google?role=DISTRIBUTOR', true],
    ['production', 'http://localhost:3001', 'http://localhost:3000/api/auth/oauth/google?role=DISTRIBUTOR', false],
    ['production', 'https://shop.example.test', '/api/auth/oauth/google?role=DISTRIBUTOR', true],
    ['development', 'http://localhost:3001', 'https://untrusted.example/api/auth/oauth/google', false],
  ] as const)('checks %s origin %s against %s', async (mode, origin, startUrl, allowed) => {
    vi.stubEnv('NODE_ENV', mode);
    const memory = new Map<string, string>(); const assign = vi.fn();
    vi.stubGlobal('window', { location: { origin, hostname: new URL(origin).hostname, search: '', assign } });
    vi.stubGlobal('sessionStorage', { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value), removeItem: (key: string) => memory.delete(key) });
    const request = vi.fn().mockResolvedValue({ startUrl });
    if (allowed) {
      await beginGoogleSignIn(request, undefined, 'DISTRIBUTOR');
      expect(new URL(assign.mock.calls[0][0]).origin).toBe(new URL(startUrl, origin).origin);
      expect(new URL(request.mock.calls[0][0], origin).searchParams.get('role')).toBe('DISTRIBUTOR');
      expect(memory.get('desla-oauth-verifier')).toHaveLength(64);
    } else {
      await expect(beginGoogleSignIn(request, undefined, 'DISTRIBUTOR')).rejects.toThrow('different storefront');
      expect(assign).not.toHaveBeenCalled();
    }
  });
});


describe('consistent browser and API origin checks', () => {
  it.each(['http://localhost:3001', 'http://127.0.0.1:3000', 'http://localhost:3220'])('accepts %s through both checks in development', origin => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('APP_URL', 'http://localhost:3005');
    vi.stubEnv('FRONTEND_URL', 'http://localhost:3000');
    const request = new NextRequest('http://localhost:3005/api/auth/register', { method: 'POST', headers: { origin, 'sec-fetch-site': 'same-site' } });
    expect(middleware(request).status).toBe(200);
    expect(() => enforceOrigin(request)).not.toThrow();
  });
  it.each(['http://127.0.0.1:3000', 'https://untrusted.test', 'null'])('rejects unconfigured %s in production', origin => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_URL', 'https://api.example.test');
    vi.stubEnv('FRONTEND_URL', 'https://shop.example.test');
    vi.stubEnv('ALLOWED_ORIGINS', '');
    const request = new NextRequest('https://api.example.test/api/auth/register', { method: 'POST', headers: { origin } });
    expect(middleware(request).status).toBe(403);
    expect(() => enforceOrigin(request)).toThrow();
  });
});
