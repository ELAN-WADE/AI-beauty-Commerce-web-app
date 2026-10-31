import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getDb, checkSharedRateLimit } = vi.hoisted(() => ({
  getDb: vi.fn(() => ({ db: true })),
  checkSharedRateLimit: vi.fn(),
}));

vi.mock('@/db/client', () => ({ getDb }));
vi.mock('@/lib/rate-limit', () => ({
  checkSharedRateLimit,
  Limits: {
    apiMutation: { limit: 120, windowMs: 60_000 },
    adminMutation: { limit: 60, windowMs: 60_000 },
  },
}));

import { NextResponse } from 'next/server';
import { api } from '@/lib/errors';

describe('api() shared mutation quota', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkSharedRateLimit.mockResolvedValue({ allowed: true, retryAfterMs: 0 });
  });

  it('uses a shared per-IP quota before dispatching customer writes', async () => {
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const res = await api(handler)(new Request('https://api.test/api/cart/items', {
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.7' },
    }));
    expect(res.status).toBe(200);
    expect(checkSharedRateLimit).toHaveBeenCalledWith(getDb(), 'http-write:api:198.51.100.7', { limit: 120, windowMs: 60_000 });
    expect(handler).toHaveBeenCalledOnce();
  });

  it('uses the stricter admin quota and refuses to invoke the handler when exhausted', async () => {
    checkSharedRateLimit.mockResolvedValue({ allowed: false, retryAfterMs: 35_000 });
    const handler = vi.fn(async () => NextResponse.json({ ok: true }));
    const res = await api(handler)(new Request('https://api.test/api/admin/inventory', {
      method: 'PATCH',
      headers: { 'x-forwarded-for': '198.51.100.8' },
    }));
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('35');
    expect(checkSharedRateLimit).toHaveBeenCalledWith(getDb(), 'http-write:admin:198.51.100.8', { limit: 60, windowMs: 60_000 });
    expect(handler).not.toHaveBeenCalled();
  });
});
