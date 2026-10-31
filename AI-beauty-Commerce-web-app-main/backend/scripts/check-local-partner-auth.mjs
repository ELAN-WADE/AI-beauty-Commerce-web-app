import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
const origin = process.env.LOCAL_STOREFRONT_URL || 'http://localhost:3000';
for (const [role, path] of [['CUSTOMER', '/catalogue'], ['CREATOR', '/creators'], ['DISTRIBUTOR', '/distributor']]) {
  const start = new URL('/api/auth/oauth/google', origin);
  start.search = new URLSearchParams({ role, redirect: origin + path, challenge: createHash('sha256').update(randomBytes(32)).digest('base64url') }).toString();
  const response = await fetch(start, { redirect: 'manual' });
  assert.equal(response.status, 307);
  const provider = new URL(response.headers.get('location'));
  assert.equal(provider.hostname, 'accounts.google.com');
  assert.equal(provider.searchParams.get('code_challenge_method'), 'S256');
  const cookie = response.headers.getSetCookie().find(value => value.startsWith('desla_oauth_browser='));
  assert.ok(cookie && /HttpOnly/i.test(cookie));
  const callback = new URL(provider.searchParams.get('redirect_uri'));
  callback.searchParams.set('state', provider.searchParams.get('state'));
  callback.searchParams.set('error', 'access_denied');
  const cancelled = await fetch(callback, { redirect: 'manual', headers: { cookie: cookie.split(';')[0] } });
  assert.equal(cancelled.status, 307);
  const destination = new URL(cancelled.headers.get('location'));
  assert.equal(destination.origin, origin);
  assert.equal(destination.pathname, path);
  assert.equal(destination.searchParams.get('auth'), 'cancelled');
  const replay = await fetch(callback, { redirect: 'manual', headers: { cookie: cookie.split(';')[0] } });
  assert.equal(replay.status, 307);
  assert.equal(new URL(replay.headers.get('location')).searchParams.get('auth'), 'cancelled');
  console.log(JSON.stringify({ role, googleStart: response.status, provider: provider.hostname, cancelledReturn: path, stateReplay: 'rejected' }));
}
for (const path of ['/api/auth/me', '/api/partner?kind=CREATOR', '/api/partner?kind=DISTRIBUTOR', '/api/admin/orders']) {
  const response = await fetch(origin + path);
  assert.equal(response.status, 401);
  console.log(JSON.stringify({ path, unauthenticated: response.status }));
}
