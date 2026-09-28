import { beforeEach, describe, expect, it } from 'vitest';
import { checkRateLimit, resetRateLimits, sweepRateLimits } from '@/lib/rate-limit';

// THREAT (credential stuffing / OTP brute force) → CONTROL (token bucket per
// key) → TEST: budget enforced, independent keys, window reset, sweep bounded.
describe('rate limiter', () => {
  beforeEach(() => resetRateLimits());

  it('allows N requests then blocks with retry-after', () => {
    const spec = { limit: 3, windowMs: 60_000 };
    expect(checkRateLimit('k', spec, 0).allowed).toBe(true);
    expect(checkRateLimit('k', spec, 1).allowed).toBe(true);
    expect(checkRateLimit('k', spec, 2).allowed).toBe(true);
    const blocked = checkRateLimit('k', spec, 3);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it('resets after the window and isolates keys', () => {
    const spec = { limit: 1, windowMs: 1_000 };
    expect(checkRateLimit('a', spec, 0).allowed).toBe(true);
    expect(checkRateLimit('b', spec, 0).allowed).toBe(true); // different key unaffected
    expect(checkRateLimit('a', spec, 500).allowed).toBe(false);
    expect(checkRateLimit('a', spec, 1_001).allowed).toBe(true);
  });

  it('sweep evicts only expired buckets', () => {
    checkRateLimit('old', { limit: 1, windowMs: 100 }, 0);
    checkRateLimit('fresh', { limit: 1, windowMs: 10_000 }, 0);
    expect(sweepRateLimits(200)).toBe(1);
    expect(checkRateLimit('fresh', { limit: 1, windowMs: 10_000 }, 200).allowed).toBe(false);
  });
});
