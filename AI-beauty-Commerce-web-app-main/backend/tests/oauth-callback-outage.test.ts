import { afterEach, describe, expect, it, vi } from 'vitest';
const { consume, complete, setCookie } = vi.hoisted(() => ({ consume: vi.fn(), complete: vi.fn(), setCookie: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => ({ value: 'test-browser' }), set: setCookie }) }));
vi.mock('@/db/client', () => ({ getDb: () => ({}) }));
vi.mock('@/modules/auth/google-oauth', () => ({ consumeOAuthRequest: consume, completeGoogleOAuth: complete }));
import { GET } from '@/app/api/auth/oauth/google/callback/route';
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.clearAllMocks(); });

describe('Google callback during a database outage', () => {
  it('reports the account-service failure without replaying codes or exposing details', async () => {
    vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('FRONTEND_URL', 'https://shop.example.com');
    consume.mockRejectedValue(new Error('private database connection details', { cause: { code: 'CONNECT_TIMEOUT' } }));
    const logger = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await GET(new Request('https://shop.example.com/api/auth/oauth/google/callback?code=private-code&state=private-state'));
    const target = new URL(response.headers.get('location')!);
    expect(target.origin).toBe('https://shop.example.com');
    expect(target.searchParams.get('message')).toContain('account service is temporarily unavailable');
    expect(consume).toHaveBeenCalledTimes(1); expect(complete).not.toHaveBeenCalled();
    expect(JSON.stringify(logger.mock.calls)).toContain('CONNECT_TIMEOUT');
    expect(JSON.stringify(logger.mock.calls)).not.toMatch(/private-code|private-state|private database/);
    expect(setCookie).not.toHaveBeenCalled(); // An unrecognized callback must not clear another portal's browser proof.
  });
});
