import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const { getDb } = vi.hoisted(() => ({ getDb: vi.fn(() => { throw new Error('OAuth preparation must not initialize the database.'); }) }));
vi.mock('@/db/client', () => ({ getDb }));
import { GET } from '@/app/api/auth/oauth/google/route';
import { googleConfig } from '@/modules/auth/redirects';

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('RENDER', 'true'); vi.stubEnv('RENDER_EXTERNAL_URL', 'https://shop.onrender.com');
  vi.stubEnv('APP_URL', ''); vi.stubEnv('FRONTEND_URL', ''); vi.stubEnv('GOOGLE_REDIRECT_URI', '');
  vi.stubEnv('GOOGLE_CLIENT_ID', 'test-client'); vi.stubEnv('GOOGLE_CLIENT_SECRET', 'private-client-secret');
});
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe('hosted Google sign-in preparation', () => {
  it('derives the fixed HTTPS callback despite an old malformed Render override', async () => {
    vi.stubEnv('GOOGLE_REDIRECT_URI', 'http://shop.onrender.com/apai/auth/outh/google/callback');
    expect(googleConfig().redirectUri).toBe('https://shop.onrender.com/api/auth/oauth/google/callback');
    const response = await GET(new Request('https://shop.onrender.com/api/auth/oauth/google?prepare=1&role=CREATOR'));
    expect(response.status).toBe(200);
    expect(getDb).not.toHaveBeenCalled();
  });
  it.each([['CUSTOMER', '/catalogue'], ['CREATOR', '/creators'], ['DISTRIBUTOR', '/distributor']])('prepares the Render URL for %s before database initialization', async (role, path) => {
    const response = await GET(new Request(`https://shop.onrender.com/api/auth/oauth/google?prepare=1&role=${role}&challenge=${'A'.repeat(43)}`));
    expect(response.status).toBe(200);
    const body = await response.json(); const url = new URL(body.startUrl);
    expect(url.origin).toBe('https://shop.onrender.com');
    expect(url.searchParams.get('redirect')).toBe(`https://shop.onrender.com${path}`);
    expect(url.searchParams.get('role')).toBe(role);
    expect(JSON.stringify(body)).not.toContain('private-client-secret');
    expect(getDb).not.toHaveBeenCalled();
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});
