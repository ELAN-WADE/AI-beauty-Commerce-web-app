import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ fail: false, writes: vi.fn(), puts: vi.fn(), permission: true }));
vi.mock('@/db/client', () => ({ getDb: () => ({}) }));
vi.mock('@/lib/rate-limit', () => ({ checkSharedRateLimit: async () => ({ allowed: true }), Limits: {} }));
vi.mock('@/lib/admin', () => ({ requirePerm: async () => { if (!state.permission) throw new Error('Permission required'); } }));
vi.mock('fs', () => ({ default: { existsSync: () => true, mkdirSync: vi.fn(), writeFileSync: state.writes } }));
vi.mock('@/lib/storage', async () => ({ ...await vi.importActual('@/lib/storage'), s3: () => ({ send: async (command: unknown) => { state.puts(command); if (state.fail) throw new Error('Storage unavailable'); } }), communityBucket: () => 'public', communityMediaUrl: (key: string) => 'https://media.example.test/' + key }));
import { POST } from '@/app/api/admin/media/upload/route';
beforeEach(() => {
  state.fail = false; state.permission = true; state.writes.mockClear(); state.puts.mockClear();
  vi.stubEnv('S3_ACCESS_KEY', 'test-access'); vi.stubEnv('S3_SECRET_KEY', 'test-secret'); vi.stubEnv('COMMUNITY_BUCKET', 'public'); vi.stubEnv('S3_ENDPOINT', ''); vi.stubEnv('COMMUNITY_MEDIA_BASE_URL', 'https://media.example.test');
});
afterEach(() => vi.unstubAllEnvs());
async function upload() {
  const body = new FormData(); body.append('file', new File([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aHPsAAAAASUVORK5CYII=', 'base64')], 'entered.png', { type: 'image/png' }));
  return POST(new NextRequest('https://store.example/api/admin/media/upload', { method: 'POST', body }));
}
describe('admin hero media durability', () => {
  it('publishes a remote URL without writing production uploads to temporary disk', async () => {
    vi.stubEnv('NODE_ENV', 'production'); const result = await upload(); expect(result.status).toBe(201);
    expect((await result.json()).url).toMatch(/^https:\/\/media.example.test\/products\//); expect(state.writes).not.toHaveBeenCalled();
  });
  it('fails visibly when production storage fails', async () => {
    vi.stubEnv('NODE_ENV', 'production'); state.fail = true; expect((await upload()).status).toBe(503); expect(state.writes).not.toHaveBeenCalled();
  });
  it('identifies missing production storage without writing a file or claiming a successful upload', async () => {
    vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('S3_ACCESS_KEY', ''); vi.stubEnv('S3_SECRET_KEY', '');
    const result = await upload(); const body = await result.json();
    expect(result.status).toBe(503); expect(body.error.code).toBe('media_storage_configuration'); expect(body.error.retryable).toBe(false);
    expect(state.writes).not.toHaveBeenCalled(); expect(state.puts).not.toHaveBeenCalled();
  });
  it('retains local upload support in development', async () => {
    vi.stubEnv('NODE_ENV', 'development'); vi.stubEnv('APP_URL', 'http://localhost:3005'); state.fail = true;
    const result = await upload(); expect(result.status).toBe(201); expect(state.writes).toHaveBeenCalled(); expect((await result.json()).url).toContain('http://localhost:3005/uploads/products/');
  });
});
