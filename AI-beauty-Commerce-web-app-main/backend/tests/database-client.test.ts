import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const { postgres, drizzle } = vi.hoisted(() => ({
  postgres: vi.fn(() => ({ end: vi.fn(async () => {}) })),
  drizzle: vi.fn((client: unknown) => ({ client })),
}));
vi.mock('postgres', () => ({ default: postgres }));
vi.mock('drizzle-orm/postgres-js', () => ({ drizzle }));
vi.mock('@/lib/env', () => ({ assertProductionEnv: vi.fn() }));
vi.mock('@/db/schema', () => ({}));
beforeEach(async () => {
  await (await import('@/db/client')).closeDb(); vi.clearAllMocks();
  vi.stubEnv('DATABASE_URL', 'postgres://test:dummy@localhost/test');
  vi.stubEnv('DATABASE_SSL_MODE', 'disable'); vi.stubEnv('RENDER', 'true');
});
afterEach(async () => { await (await import('@/db/client')).closeDb(); vi.unstubAllEnvs(); });

describe('process-wide database pool', () => {
  it('reuses one pool after Next reloads the client module', async () => {
    const first = await import('@/db/client'); const db = first.getDb();
    vi.resetModules(); const second = await import('@/db/client');
    expect(second.getDb()).toBe(db); expect(postgres).toHaveBeenCalledTimes(1);
    expect(postgres.mock.calls[0][1]).toMatchObject({ max: 5, idle_timeout: 60 });
  });
  it('closes the shared pool and permits a clean reconnect', async () => {
    const module = await import('@/db/client'); const first = module.getDb();
    const client = postgres.mock.results[0].value;
    await module.closeDb(); expect(client.end).toHaveBeenCalledTimes(1);
    expect(module.getDb()).not.toBe(first); expect(postgres).toHaveBeenCalledTimes(2);
  });
});
