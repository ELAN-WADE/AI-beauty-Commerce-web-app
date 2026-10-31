import { afterEach, describe, expect, it, vi } from 'vitest';
import { authorizationUrl, exchangeSocial } from '@/modules/social/provider';
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
function config() {
  vi.stubEnv('SOCIAL_TOKEN_ENCRYPTION_KEY', '12'.repeat(32));
  vi.stubEnv('META_APP_ID', 'fixture-id'); vi.stubEnv('META_APP_SECRET', 'private-app-secret');
  vi.stubEnv('META_GRAPH_VERSION', 'v24.0');
  vi.stubEnv('INSTAGRAM_REDIRECT_URI', 'https://shop.example/api/creator/social/instagram/callback');
}
describe('Instagram through Facebook Login', () => {
  it('uses the pinned Facebook dialog and keeps the app secret out of the authorization URL', () => {
    config(); const url = new URL(authorizationUrl('instagram', 'browser-bound-state'));
    expect(url.origin).toBe('https://www.facebook.com');
    expect(url.pathname).toBe('/v24.0/dialog/oauth');
    expect(url.searchParams.get('state')).toBe('browser-bound-state');
    expect(url.searchParams.get('scope')).toContain('pages_show_list');
    expect(url.toString()).not.toContain('private-app-secret');
  });
  it('exchanges the code on the server and returns every authorized professional account for explicit selection', async () => {
    config();
    const fetcher = vi.fn()
      .mockResolvedValueOnce(Response.json({ access_token: 'short-token' }))
      .mockResolvedValueOnce(Response.json({ access_token: 'long-token', expires_in: 3600 }))
      .mockResolvedValueOnce(Response.json({ data: [{ id: '11', access_token: 'page-one-token', instagram_business_account: { id: '101' } }, { id: '22', access_token: 'page-two-token', instagram_business_account: { id: '202' } }] }))
      .mockResolvedValueOnce(Response.json({ id: '101', username: 'actual.one', name: 'Actual one', followers_count: 17 }))
      .mockResolvedValueOnce(Response.json({ id: '202', username: 'actual.two', name: 'Actual two' }));
    vi.stubGlobal('fetch', fetcher);
    const accounts = await exchangeSocial('instagram', 'provider-code');
    expect(accounts.map(item => item.profile.handle)).toEqual(['@actual.one', '@actual.two']);
    expect(accounts[0].profile.followers).toBe(17); expect(accounts[1].profile.followers).toBeNull();
    expect(accounts[1].tokens.access).toBe('page-two-token');
    for (const [url] of fetcher.mock.calls) expect(url).not.toMatch(/private-app-secret|short-token|long-token|page-one-token/);
    expect(fetcher.mock.calls[0][1].body.get('client_secret')).toBe('private-app-secret');
    expect(fetcher.mock.calls[2][1].headers.Authorization).toBe('Bearer long-token');
  });
  it('fails clearly without a linked professional account and hides provider error bodies', async () => {
    config();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(Response.json({ access_token: 'short' })).mockResolvedValueOnce(Response.json({ access_token: 'long', expires_in: 3600 })).mockResolvedValueOnce(Response.json({ data: [{ id: '11', name: 'Page without Instagram' }] })).mockResolvedValueOnce(Response.json({ error: { message: 'private-provider-detail' } }, { status: 400 })));
    await expect(exchangeSocial('instagram', 'code')).rejects.toMatchObject({ status: 400, message: expect.stringContaining('professional account') });
    await expect(exchangeSocial('instagram', 'code')).rejects.toMatchObject({ status: 502, code: 'social_provider_failed' });
  });
});
