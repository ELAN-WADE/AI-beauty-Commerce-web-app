import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { creators } from '@/modules/creators/schema';
import { distributors } from '@/modules/distributors/schema';
import { userRoles } from '@/modules/auth/schema';
import { Errors } from '@/lib/errors';
const fixture = vi.hoisted(() => ({ roles: ['CREATOR'], approved: true, diskFails: false, remoteFails: true, mfaFails: false }));
vi.mock('@/db/client', () => ({ getDb: () => ({ select: () => ({ from: (table: unknown) => {
  const rows = () => table === userRoles ? fixture.roles.map(roleId => ({ roleId })) : table === creators || table === distributors ? fixture.approved ? [{ id: 'owned-profile' }] : [] : [];
  const query = { where: () => query, limit: async () => rows(), then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(rows()).then(resolve, reject) };
  return query;
} }) }) }));
vi.mock('@/lib/rate-limit', () => ({ checkSharedRateLimit: async () => ({ allowed: true }), Limits: {} }));
vi.mock('@/modules/auth/require-auth', () => ({ requireAuth: async () => ({ userId: 'owned-user', roles: fixture.roles, emailVerified: true }) }));
vi.mock('@/lib/admin', () => ({ requirePerm: async () => { if (fixture.mfaFails) throw Errors.mfaRequired(); } }));
vi.mock('fs', () => ({ default: { existsSync: () => true, mkdirSync: vi.fn(), writeFileSync: () => { if (fixture.diskFails) throw new Error('Disk unavailable'); } } }));
vi.mock('@/lib/storage', async () => ({ ...await vi.importActual('@/lib/storage'), s3: () => ({ send: async () => { if (fixture.remoteFails) throw new Error('Remote unavailable'); } }), communityBucket: () => 'test-public-media', communityMediaUrl: (key: string) => `https://media.example.test/${key}` }));
import { POST } from '@/app/api/partner/media/upload/route';
beforeEach(() => { fixture.roles = ['CREATOR']; fixture.approved = true; fixture.diskFails = false; fixture.remoteFails = true; fixture.mfaFails = false; vi.stubEnv('NODE_ENV', 'development'); vi.stubEnv('APP_URL', 'http://localhost:3005'); });
afterEach(() => vi.unstubAllEnvs());
async function upload(mime = 'image/png', filename = 'actual.png', bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aHPsAAAAASUVORK5CYII=', 'base64')) {
  const body = new FormData(); body.append('file', new File([bytes], filename, { type: mime }));
  return POST(new NextRequest('http://localhost:3005/api/partner/media/upload', { method: 'POST', body }));
}
describe('partner media reaches usable storage only for approved identities', () => {
  it('rejects a dangling role without its approved linked profile', async () => { fixture.approved = false; expect((await upload()).status).toBe(403); });
  it('keeps staff uploads behind the MFA permission gate', async () => { fixture.roles = ['ADMIN']; fixture.mfaFails = true; expect((await upload()).status).toBe(403); });
  it('returns the actual development backend URL after local persistence rather than a missing frontend-relative path', async () => {
    const response = await upload(); expect(response.status).toBe(200); expect((await response.json()).url).toMatch(/^http:\/\/localhost:3005\/uploads\/partner\//);
  });
  it('returns a URL from the configured media service after remote persistence', async () => {
    fixture.remoteFails = false; const response = await upload(); expect((await response.json()).url).toMatch(/^https:\/\/media.example.test\/partner\//);
  });
  it('reports storage failure instead of claiming success when no durable destination accepted the file', async () => {
    fixture.diskFails = true; expect((await upload()).status).toBe(503);
    fixture.diskFails = false; vi.stubEnv('NODE_ENV', 'production'); expect((await upload()).status).toBe(503);
  });
  it('does not accept a renamed invalid file as a video', async () => { expect((await upload('video/mp4', 'renamed.mp4', Buffer.from('not a video'))).status).toBe(400); });
});
