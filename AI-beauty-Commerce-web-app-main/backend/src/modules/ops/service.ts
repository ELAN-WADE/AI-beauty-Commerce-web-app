import { eq } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { featureFlags } from './schema';

/** Short-TTL in-process cache: flag flips propagate within seconds, not deploys. */
const FLAG_TTL_MS = 30_000;
const cache = new Map<string, { v: boolean; at: number }>();

/**
 * Read a flag; missing row falls back to `defaultOn` (no seeding required).
 * Only explicit rows are cached — a default must never mask a row written
 * after the first read (kill-switches have to work on first flip).
 */
export async function isEnabled(db: Db, key: string, defaultOn = true): Promise<boolean> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < FLAG_TTL_MS) return hit.v;
  const rows = await db.select({ enabled: featureFlags.enabled }).from(featureFlags).where(eq(featureFlags.key, key)).limit(1);
  if (rows[0] === undefined) return defaultOn;
  cache.set(key, { v: rows[0].enabled, at: Date.now() });
  return rows[0].enabled;
}

/** Test-only reset. */
export function resetFlagCache(): void {
  cache.clear();
}
