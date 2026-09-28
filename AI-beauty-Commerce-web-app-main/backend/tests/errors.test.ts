import { describe, expect, it } from 'vitest';
import { NextResponse } from 'next/server';
import { api, ApiError, Errors } from '@/lib/errors';

// THREAT (info disclosure via stack traces / SQL errors) → CONTROL (envelope +
// 500 masking) → TEST: clients see stable codes, never internals.
describe('api() error envelope', () => {
  it('maps ApiError to status + stable envelope with request_id', async () => {
    const handler = api(async () => {
      throw Errors.forbidden();
    });
    const res = await handler(new Request('http://x/api/thing'));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('forbidden');
    expect(body.error.request_id).toBeTruthy();
    expect(body.error.retryable).toBe(false);
    expect(JSON.stringify(body)).not.toMatch(/stack|postgres|relation/i);
  });

  it('masks unexpected errors as generic 500 (logs internally)', async () => {
    const handler = api(async () => {
      throw new Error('Postgres error: relation users_internal_secret does not exist');
    });
    const res = await handler(new Request('http://x/api/thing'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.message).toBe('Unable to complete the request.');
    expect(JSON.stringify(body)).not.toMatch(/Postgres|relation|secret/i);
  });

  it('echoes x-request-id from the caller when provided', async () => {
    const handler = api(async () => NextResponse.json({ ok: true }));
    const res = await handler(new Request('http://x/api/thing', { headers: { 'x-request-id': 'req_123' } }));
    expect(res.headers.get('x-request-id')).toBe('req_123');
    expect((await res.json()).ok).toBe(true);
  });

  it('rejects oversized bodies (413) before parsing', async () => {
    const { readJson } = await import('@/lib/errors');
    await expect(readJson(new Request('http://x', { method: 'POST', body: 'x'.repeat(100) }), 10)).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
