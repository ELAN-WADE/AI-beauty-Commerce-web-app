import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const clients = [
  ['hosted', () => import('../src/storefront/lib/owned-api')],
  ['local storefront', () => import('../../src/lib/owned-api')],
] as const;
let browser: EventTarget & { location: URL };
let fetcher: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.resetModules();
  browser = Object.assign(new EventTarget(), { location: new URL('https://shop.example.com/ops-0123456789abcdef') });
  vi.stubGlobal('window', browser); fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe.each(clients)('%s authentication transport', (_name, load) => {
  it('selects the portal context and does not sign a customer out when an admin request is rejected', async () => {
    browser.location = new URL('https://shop.example.com/catalogue');
    const expired = vi.fn(); browser.addEventListener('desla:session-expired', expired);
    fetcher.mockResolvedValue(Response.json({ error: { code: 'unauthorized' } }, { status: 401 }));
    const { apiFetch } = await load();
    await expect(apiFetch('/api/admin/catalogue')).rejects.toMatchObject({ status: 401 });
    expect(fetcher.mock.calls[0][1].headers['X-Desla-Auth-Context']).toBe('ADMIN');
    expect(expired).not.toHaveBeenCalled();
    await expect(apiFetch('/api/auth/me')).rejects.toMatchObject({ status: 401 });
    expect(fetcher.mock.calls[1][1].headers['X-Desla-Auth-Context']).toBe('CUSTOMER');
    expect(expired).toHaveBeenCalledTimes(1);
  });
  it('keeps the primary session after an invalid authenticator code', async () => {
    const expired = vi.fn(); browser.addEventListener('desla:session-expired', expired);
    fetcher.mockResolvedValue(Response.json({ error: { code: 'mfa_invalid', message: 'The MFA code is invalid or expired.' } }, { status: 422 }));
    const { apiFetch } = await load();
    await expect(apiFetch('/api/auth/mfa/verify', { method: 'POST', body: '{}' })).rejects.toMatchObject({ code: 'mfa_invalid' });
    expect(expired).not.toHaveBeenCalled();
  });
  it('does not clear an established session for a failed admin password attempt', async () => {
    const expired = vi.fn(); browser.addEventListener('desla:session-expired', expired);
    fetcher.mockResolvedValue(Response.json({ error: { code: 'unauthorized', message: 'Invalid email or password.' } }, { status: 401 }));
    const { apiFetch } = await load();
    await expect(apiFetch('/api/auth/admin/login', { method: 'POST' })).rejects.toMatchObject({ status: 401 });
    expect(expired).not.toHaveBeenCalled();
  });
  it('ignores an older unauthorized response after successful MFA verification', async () => {
    const expired = vi.fn(); browser.addEventListener('desla:session-expired', expired);
    let resolveOld!: (response: Response) => void;
    fetcher.mockImplementationOnce(() => new Promise<Response>(resolve => { resolveOld = resolve; }));
    fetcher.mockResolvedValueOnce(Response.json({ verified: true }));
    const { apiFetch } = await load();
    const stale = apiFetch('/api/auth/me').catch(error => error);
    await apiFetch('/api/auth/mfa/verify', { method: 'POST' });
    resolveOld(Response.json({ error: { code: 'unauthorized' } }, { status: 401 }));
    await stale;
    expect(expired).not.toHaveBeenCalled();
  });
  it('still expires a genuinely missing primary session', async () => {
    const expired = vi.fn(); browser.addEventListener('desla:session-expired', expired);
    fetcher.mockResolvedValue(Response.json({ error: { code: 'unauthorized' } }, { status: 401 }));
    const { apiFetch } = await load();
    await expect(apiFetch('/api/auth/mfa/verify', { method: 'POST' })).rejects.toMatchObject({ status: 401 });
    expect(expired).toHaveBeenCalledTimes(1);
  });
});
