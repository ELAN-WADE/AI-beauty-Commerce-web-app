import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { NextRequest as FrontendRequest } from '../../node_modules/next/server';
import { middleware as backend } from '@/middleware';
import { middleware as frontend } from '../../src/middleware';
import { adminEntryPath, adminPageDecision } from '@/modules/auth/admin-policy';
const entry = '/ops-0123456789abcdef01234567';
afterEach(() => vi.unstubAllEnvs());
describe('private admin page routing', () => {
  it('fails closed on absent or invalid route settings', () => {
    vi.stubEnv('ADMIN_ENTRY_PATH', ''); expect(adminEntryPath()).toBeNull();
    vi.stubEnv('ADMIN_ENTRY_PATH', '/admin'); expect(adminEntryPath()).toBeNull();
    expect(adminPageDecision('/admin', null)).toBe('deny');
  });
  it.each(['/admin', '/admin-console', '/admin/settings', '/?screen=admin-console'])('blocks %s in both storefronts', path => {
    vi.stubEnv('ADMIN_ENTRY_PATH', entry);
    expect(frontend(new FrontendRequest(`http://localhost:3000${path}`)).status).toBe(404);
    expect(backend(new NextRequest(`http://localhost:3005${path}`)).status).toBe(404);
  });
  it('rewrites only the configured URL and prevents indexing and referrer disclosure', () => {
    vi.stubEnv('ADMIN_ENTRY_PATH', entry);
    const root = frontend(new FrontendRequest(`http://localhost:3000${entry}`));
    const api = backend(new NextRequest(`http://localhost:3005${entry}`));
    expect(root.headers.get('x-middleware-rewrite')).toBe('http://localhost:3000/');
    expect(api.headers.get('x-middleware-next')).toBe('1');
    for (const response of [root, api]) {
      expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
      expect(response.headers.get('referrer-policy')).toBe('no-referrer');
      expect(response.headers.get('cache-control')).toContain('no-store');
    }
  });
  it('strips a forged private-entry header on public pages and preserves API authorization', () => {
    vi.stubEnv('ADMIN_ENTRY_PATH', entry);
    const response = frontend(new FrontendRequest('http://localhost:3000/', { headers: { 'x-desla-private-admin': '1' } }));
    expect(response.headers.get('x-middleware-request-x-desla-private-admin')).toBeNull();
    expect(adminPageDecision('/api/admin/products', null)).toBe('pass');
  });
});
