/**
 * Batch-3 (Part V): Server Action cores are deadline-bounded — a hung
 * provider socket surfaces a retryable 504 instead of piling up invocations.
 * Pure + fast: no DB, no request scope.
 */
import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/errors';
import { rateLimitStats, resetRateLimits, checkRateLimit } from '@/lib/rate-limit';
import { ACTION_TIMEOUT_MS, withTimeout } from '@/app/actions/_shared';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('withTimeout', () => {
  it('passes fast work through untouched', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 1000)).resolves.toBe('ok');
    expect(ACTION_TIMEOUT_MS).toBe(25_000);
  });

  it('rejects retryable 504 when the work hangs', async () => {
    const err: unknown = await withTimeout(sleep(5000), 20).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    const apiErr = err as ApiError;
    expect(apiErr.status).toBe(504);
    expect(apiErr.code).toBe('upstream_timeout');
    expect(apiErr.retryable).toBe(true); // idempotent-by-key: safe to retry same key
  });
});

describe('rateLimitStats (metrics census)', () => {
  it('counts buckets and exhausted budgets', () => {
    resetRateLimits();
    expect(rateLimitStats()).toEqual({ buckets: 0, exhausted: 0 });
    checkRateLimit('m', { limit: 1, windowMs: 60_000 }, 0);
    checkRateLimit('m', { limit: 1, windowMs: 60_000 }, 1);
    const stats = rateLimitStats(2);
    expect(stats.buckets).toBe(1);
    expect(stats.exhausted).toBe(1);
    resetRateLimits();
  });
});
