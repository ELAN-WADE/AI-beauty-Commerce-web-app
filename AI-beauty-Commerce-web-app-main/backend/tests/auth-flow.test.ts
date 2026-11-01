import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let location: URL;
let assign: ReturnType<typeof vi.fn>;
let storage: Map<string, string>;
beforeEach(() => {
  vi.resetModules();
  location = new URL('https://shop.example.test/catalogue'); assign = vi.fn(); storage = new Map();
  vi.stubGlobal('window', { location: { get search() { return location.search; }, get hash() { return location.hash; }, get pathname() { return location.pathname; }, assign }, history: { state: null, replaceState: vi.fn((_state, _unused, target) => { location = new URL(target, location); }) } });
  vi.stubGlobal('sessionStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) });
  vi.stubGlobal('localStorage', { removeItem: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());

const admin = { roles: ['SUPER_ADMIN'], sessionScope: 'ADMIN' as const, adminEntryPath: '/ops-0123456789abcdef01234567' };

describe('role-based sign-in destinations', () => {
  it.each(['CUSTOMER', 'ADMIN'] as const)('prioritizes the authenticated admin path over a saved storefront return for %s', async intent => {
    const { rememberAuthIntent, finishSignIn } = await import('../src/storefront/lib/auth-flow');
    rememberAuthIntent(intent, '/catalogue?product=example');
    finishSignIn(admin);
    expect(assign).toHaveBeenCalledWith(admin.adminEntryPath);
    expect(storage.has('desla-auth-intent')).toBe(false);
  });
  it('preserves a customer cart destination even if an untrusted URL requests admin intent', async () => {
    const { rememberAuthIntent, finishSignIn } = await import('../src/storefront/lib/auth-flow');
    rememberAuthIntent('CUSTOMER', '/cart');
    finishSignIn({ roles: ['CUSTOMER'] });
    expect(assign).toHaveBeenCalledWith('/cart');
  });
  it.each(['CREATOR', 'DISTRIBUTOR'] as const)('preserves an explicit %s journey for a user with that role', async intent => {
    const { rememberAuthIntent, finishSignIn } = await import('../src/storefront/lib/auth-flow');
    const target = intent === 'CREATOR' ? '/creators?workspace=content' : '/distributor';
    rememberAuthIntent(intent, target);
    finishSignIn({ roles: ['CUSTOMER', intent], sessionScope: 'CUSTOMER' });
    expect(assign).toHaveBeenCalledWith(target);
  });
  it('does not derive administrator access from an email, role alone, or return URL', async () => {
    const { administratorSignInPath } = await import('../src/storefront/lib/auth-flow');
    expect(administratorSignInPath({ roles: ['CUSTOMER'], adminEntryPath: admin.adminEntryPath })).toBeNull();
    expect(administratorSignInPath({ ...admin, sessionScope: 'CUSTOMER' })).toBeNull();
    expect(administratorSignInPath({ ...admin, adminEntryPath: '//untrusted.example' })).toBeNull();
    expect(administratorSignInPath({ ...admin, adminEntryPath: null })).toBeNull();
  });
});

describe('Google browser handoff', () => {
  it.each(['CUSTOMER', 'CREATOR', 'DISTRIBUTOR', 'ADMIN'] as const)('retains %s intent across the one-time exchange and repeated effect initialization', async intent => {
    const { rememberAuthIntent, restoreOAuthCallback } = await import('../src/storefront/lib/auth-flow');
    rememberAuthIntent(intent, '/catalogue');
    storage.set('desla-oauth-verifier', 'browser-private-proof');
    location.hash = '#oauth_code=one-use-grant'; location.search = '?auth=google_success';
    const api = vi.fn().mockResolvedValue({ ok: true });
    const first = restoreOAuthCallback(api); const second = restoreOAuthCallback(api);
    expect(first).toBe(second);
    await expect(first).resolves.toEqual({ intent });
    expect(api).toHaveBeenCalledTimes(1);
    expect(api).toHaveBeenCalledWith('/api/auth/oauth/exchange', { method: 'POST', body: JSON.stringify({ code: 'one-use-grant', verifier: 'browser-private-proof' }) });
    expect(location.hash).toBe(''); expect(location.search).toBe('');
    expect(storage.size).toBe(0);
  });
  it('does not treat a normal storefront visit as a fresh sign-in', async () => {
    const { restoreOAuthCallback } = await import('../src/storefront/lib/auth-flow');
    const api = vi.fn();
    await expect(restoreOAuthCallback(api)).resolves.toBeNull();
    expect(api).not.toHaveBeenCalled(); expect(assign).not.toHaveBeenCalled();
  });
  it('does not restore or redirect after a rejected exchange', async () => {
    const { restoreOAuthCallback } = await import('../src/storefront/lib/auth-flow');
    location.hash = '#oauth_code=expired-grant'; storage.set('desla-oauth-verifier', 'browser-private-proof');
    await expect(restoreOAuthCallback(vi.fn().mockRejectedValue(new Error('Sign-in expired.')))).rejects.toThrow('Sign-in expired.');
    expect(assign).not.toHaveBeenCalled();
  });
});
