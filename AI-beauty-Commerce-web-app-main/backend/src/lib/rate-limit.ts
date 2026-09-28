/**
 * Token-bucket rate limiter (single-instance, in-process).
 * Interface is deliberately Redis-shaped so the multi-instance swap (§9) only
 * changes this file's internals — call sites stay identical.
 */
interface Bucket {
  tokens: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface LimitSpec {
  limit: number;
  windowMs: number;
}

export const Limits = {
  register: { limit: 5, windowMs: 60 * 60_000 },
  login: { limit: 5, windowMs: 15 * 60_000 },
  otpVerify: { limit: 10, windowMs: 60 * 60_000 },
  passwordResetRequest: { limit: 3, windowMs: 60 * 60_000 },
  checkoutInit: { limit: 10, windowMs: 60_000 },
  webhook: { limit: 60, windowMs: 60_000 },
  ai: { limit: 20, windowMs: 24 * 60 * 60_000 },
} satisfies Record<string, LimitSpec>;

export function checkRateLimit(
  key: string,
  spec: LimitSpec,
  now = Date.now(),
): { allowed: boolean; retryAfterMs: number } {
  const b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    buckets.set(key, { tokens: spec.limit - 1, resetAt: now + spec.windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }
  if (b.tokens > 0) {
    b.tokens -= 1;
    return { allowed: true, retryAfterMs: 0 };
  }
  return { allowed: false, retryAfterMs: b.resetAt - now };
}

/** Evict expired buckets (call from a periodic sweep; keeps memory bounded). */
export function sweepRateLimits(now = Date.now()): number {
  let removed = 0;
  for (const [k, b] of buckets) {
    if (now >= b.resetAt) {
      buckets.delete(k);
      removed += 1;
    }
  }
  return removed;
}

/** Test-only reset. */
export function resetRateLimits(): void {
  buckets.clear();
}
