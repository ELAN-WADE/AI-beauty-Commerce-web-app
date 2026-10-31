import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exchangeGoogleCode } from '@/modules/auth/google-oauth';
import { googleConfig, googleConfigurationStatus } from '@/modules/auth/redirects';
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
beforeEach(() => vi.stubEnv('RENDER', 'false'));
describe('Google server-side exchange failures', () => {
  it('uses the same derived Render callback during the server-side code exchange', async () => {
    vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('RENDER', 'true');
    vi.stubEnv('APP_URL', 'https://shop.onrender.com'); vi.stubEnv('FRONTEND_URL', 'https://shop.onrender.com');
    vi.stubEnv('GOOGLE_CLIENT_ID', 'test-client'); vi.stubEnv('GOOGLE_CLIENT_SECRET', 'private-secret');
    vi.stubEnv('GOOGLE_REDIRECT_URI', 'http://shop.onrender.com/apai/auth/outh/google/callback');
    const provider = vi.fn().mockResolvedValueOnce(Response.json({ access_token: 'private-access-token' })).mockResolvedValueOnce(Response.json({ sub: '123', email: 'buyer@example.com', email_verified: true, name: 'Buyer' }));
    await expect(exchangeGoogleCode('private-code', 'private-verifier', provider)).resolves.toMatchObject({ email: 'buyer@example.com' });
    const body = new URLSearchParams(provider.mock.calls[0][1].body);
    expect(body.get('redirect_uri')).toBe('https://shop.onrender.com/api/auth/oauth/google/callback');
  });
  it.each([
    ['invalid_client', 503, 'oauth_configuration'],
    ['invalid_grant', 410, 'gone'],
    ['unknown_failure', 502, 'oauth_provider'],
  ] as const)('reports %s without exposing credentials or response details', async (code, status, expected) => {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'test-client'); vi.stubEnv('GOOGLE_CLIENT_SECRET', 'secret-should-stay-server-side');
    vi.stubEnv('APP_URL', 'http://localhost:3005'); vi.stubEnv('FRONTEND_URL', 'http://localhost:3000');
    vi.stubEnv('GOOGLE_REDIRECT_URI', 'http://localhost:3005/api/auth/oauth/google/callback');
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const provider = vi.fn().mockResolvedValue(Response.json({ error: code, error_description: 'private-provider-details' }, { status: 400 }));
    await expect(exchangeGoogleCode('one-use-authorization-code', 'browser-verifier', provider)).rejects.toMatchObject({ status, code: expected });
    expect(provider).toHaveBeenCalledTimes(1);
    const logs = JSON.stringify(warning.mock.calls);
    for (const privateValue of ['private-provider-details', 'one-use-authorization-code', 'browser-verifier', 'secret-should-stay-server-side']) expect(logs).not.toContain(privateValue);
  });
  it('reports a network failure without logging the request or credentials', async () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'test-client'); vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test-secret');
    vi.stubEnv('APP_URL', 'http://localhost:3005'); vi.stubEnv('FRONTEND_URL', 'http://localhost:3000');
    vi.stubEnv('GOOGLE_REDIRECT_URI', 'http://localhost:3005/api/auth/oauth/google/callback');
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(exchangeGoogleCode('private-code', 'private-verifier', vi.fn().mockRejectedValue(new TypeError('private-network-error')))).rejects.toMatchObject({ status: 502, retryable: true });
    expect(JSON.stringify(warning.mock.calls)).not.toContain('private-');
  });
});


describe('Google callback cookie host', () => {
  it('uses the public Render origin before database initialization when URL overrides are absent', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('GOOGLE_CLIENT_ID', 'test-client'); vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test-secret');
    vi.stubEnv('APP_URL', ''); vi.stubEnv('FRONTEND_URL', ''); vi.stubEnv('GOOGLE_REDIRECT_URI', '');
    vi.stubEnv('RENDER_EXTERNAL_URL', 'https://shop.onrender.com');
    const config = googleConfig();
    expect(config.redirectUri).toBe('https://shop.onrender.com/api/auth/oauth/google/callback');
    expect(config.startOrigin.origin).toBe('https://shop.onrender.com');
    expect(config.storefront.origin).toBe('https://shop.onrender.com');
  });
  it('identifies missing or invalid environment names without credential values', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('GOOGLE_CLIENT_ID', ''); vi.stubEnv('GOOGLE_CLIENT_SECRET', '');
    expect(googleConfigurationStatus()).toEqual({ configured: false, settings: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] });
    vi.stubEnv('GOOGLE_CLIENT_ID', 'test-client'); vi.stubEnv('GOOGLE_CLIENT_SECRET', 'private-secret');
    vi.stubEnv('APP_URL', 'https://shop.onrender.com'); vi.stubEnv('FRONTEND_URL', 'https://shop.onrender.com');
    vi.stubEnv('GOOGLE_REDIRECT_URI', 'http://localhost:3005/api/auth/oauth/google/callback');
    expect(googleConfigurationStatus()).toEqual({ configured: false, settings: ['GOOGLE_REDIRECT_URI'] });
    expect(JSON.stringify(googleConfigurationStatus())).not.toContain('private-secret');
  });
  it('starts on the callback host while preserving the alternate local storefront', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('GOOGLE_CLIENT_ID', 'test-client'); vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test-secret');
    vi.stubEnv('APP_URL', 'http://localhost:3005'); vi.stubEnv('FRONTEND_URL', 'http://localhost:3000');
    vi.stubEnv('GOOGLE_REDIRECT_URI', 'http://localhost:3005/api/auth/oauth/google/callback');
    const config = googleConfig('http://127.0.0.1:3000');
    expect(config.startOrigin.origin).toBe('http://localhost:3005');
    expect(config.storefront.origin).toBe('http://127.0.0.1:3000');
  });
  it('requires a first-party HTTPS callback host in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('GOOGLE_CLIENT_ID', 'test-client'); vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test-secret');
    vi.stubEnv('APP_URL', 'https://api.example.test'); vi.stubEnv('FRONTEND_URL', 'https://shop.example.test');
    vi.stubEnv('GOOGLE_REDIRECT_URI', 'https://api.example.test/api/auth/oauth/google/callback');
    expect(() => googleConfig()).toThrow();
    vi.stubEnv('GOOGLE_REDIRECT_URI', 'https://shop.example.test/api/auth/oauth/google/callback');
    expect(googleConfig().startOrigin.origin).toBe('https://shop.example.test');
  });
});
