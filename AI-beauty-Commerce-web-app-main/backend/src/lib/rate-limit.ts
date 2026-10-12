/**
 * Token-bucket rate limiter (single-instance, in-process).
 * Interface is deliberately Redis-shaped so the multi-instance swap (§9) only
 * changes this file's internals — call sites stay identical.
 */
import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import type { AppDb } from '../db/client';
interface Bucket {
  tokens: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let callsSinceSweep = 0;

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
  catalog: { limit: 120, windowMs: 60_000 },
  admin: { limit: 60, windowMs: 60_000 },
  // Batch-1 abuse limits (Part VII/VII): high-frequency user-content writes.
  // Money-adjacent loyalty redeem uses the shared DB quota at the call site.
  cartWrite: { limit: 240, windowMs: 60_000 },
  wishlist: { limit: 120, windowMs: 60_000 },
  reviews: { limit: 30, windowMs: 3600_000 },
  posts: { limit: 60, windowMs: 3600_000 },
  loyaltyRedeem: { limit: 20, windowMs: 3600_000 },
} satisfies Record<string, LimitSpec>;

export function checkRateLimit(
  key: string,
  spec: LimitSpec,
  now = Date.now(),
): { allowed: boolean; retryAfterMs: number } {
  // Opportunistic memory hygiene: sweep every ~1k checks (worker sweeps too).
  callsSinceSweep += 1;
  if (callsSinceSweep >= 1024) {
    callsSinceSweep = 0;
    sweepRateLimits(now);
  }
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

/** Batch-3 observability: in-process bucket census for /api/admin/metrics. */
export function rateLimitStats(now = Date.now()): { buckets: number; exhausted: number } {
  let exhausted = 0;
  for (const b of buckets.values()) {
    if (now < b.resetAt && b.tokens <= 0) exhausted += 1;
  }
  return { buckets: buckets.size, exhausted };
}

/** Atomic shared quota for security-critical endpoints across API replicas. */
export async function checkSharedRateLimit(db: AppDb, key: string, spec: LimitSpec): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const digest = createHash('sha256').update(key).digest('hex');
  const result = await db.execute(sql`
    INSERT INTO request_quotas (key_hash, hits, reset_at)
    VALUES (${digest}, 1, now() + ${spec.windowMs} * interval '1 millisecond')
    ON CONFLICT (key_hash) DO UPDATE SET
      hits = CASE WHEN request_quotas.reset_at <= now() THEN 1 ELSE request_quotas.hits + 1 END,
      reset_at = CASE WHEN request_quotas.reset_at <= now() THEN now() + ${spec.windowMs} * interval '1 millisecond' ELSE request_quotas.reset_at END
    RETURNING hits, reset_at
  `);
  const rows = Array.isArray(result) ? result : (result as unknown as { rows: { hits: number; reset_at: Date | string }[] }).rows;
  const row = rows[0] as { hits: number; reset_at: Date | string };
  return { allowed: Number(row.hits) <= spec.limit, retryAfterMs: Math.max(0, new Date(row.reset_at).getTime() - Date.now()) };
}
