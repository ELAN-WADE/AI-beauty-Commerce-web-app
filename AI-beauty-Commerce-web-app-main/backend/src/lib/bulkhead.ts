/**
 * Bulkheads + backpressure (Part V): named in-process semaphores that cap
 * concurrent expensive work per instance — AI provider calls, recommendation
 * matching, scan completion. When saturated, callers shed load with 429 +
 * Retry-After instead of queueing unboundedly and starving checkout of DB
 * pool connections (pool max 20/instance; budgets below reserve ~half).
 *
 * Single-instance only by design; the shared-DB rate limiter remains the
 * multi-instance abuse control. Limits are env-overridable for staging.
 */

const inFlight = new Map<string, number>();

function maxFor(key: string, def: number): number {
  const v = Number(process.env[`BULKHEAD_${key.toUpperCase()}_MAX`]);
  return Number.isSafeInteger(v) && v > 0 ? v : def;
}

/** Try to take a slot. Returns a releaser, or null when saturated. */
export function tryAcquire(key: string, max: number): (() => void) | null {
  const cur = inFlight.get(key) ?? 0;
  if (cur >= max) return null;
  inFlight.set(key, cur + 1);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const n = (inFlight.get(key) ?? 1) - 1;
    if (n <= 0) inFlight.delete(key);
    else inFlight.set(key, n);
  };
}

/** Depth gauge for /api/admin/metrics. */
export function bulkheadDepth(key?: string): Record<string, number> {
  if (key) return { [key]: inFlight.get(key) ?? 0 };
  return Object.fromEntries(inFlight.entries());
}

/** Test-only reset. */
export function resetBulkheads(): void {
  inFlight.clear();
}

export const BulkheadLimits = {
  /** AI chat turns + analyses (slow provider calls). */
  ai: () => maxFor('ai', 6),
  /** Recommendation matching (heavy DB scans). */
  recommendations: () => maxFor('recommendations', 8),
  /** Scan completion pipeline. */
  skin: () => maxFor('skin', 4),
} as const;
