'use server';

/**
 * Phase 4 — cart Server Actions.
 * Replaces up to 2N+2 sequential HTTP calls (variant lookups, clear, N adds,
 * verify) with one RPC that runs the identical service calls server-side.
 * Same validation, same errors (as `ActionResult`), same idempotent services.
 */
import { getDb } from '@/db/client';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import {
  actionClientIp,
  resolveActionShopper,
  runMergeCart,
  runSyncCart,
  toActionFailure,
  type ActionResult,
  type SyncCartItem,
} from './_shared';

export async function syncCartAction(
  sessionId: string | undefined,
  items: SyncCartItem[],
): Promise<ActionResult<Awaited<ReturnType<typeof runSyncCart>>>> {
  try {
    const db = getDb();
    const owner = await resolveActionShopper(db, sessionId);
    // Identity-keyed: authenticated shoppers get personal budgets (shared
    // mobile NATs must not throttle innocent neighbors); guests fall back to IP.
    const rl = await checkSharedRateLimit(db, `action:cart:${owner.userId ?? (await actionClientIp())}`, Limits.catalog);
    if (!rl.allowed) return { ok: false, status: 429, code: 'rate_limited', message: 'Too many requests. Slow down and try again.' };
    return { ok: true, data: await runSyncCart(db, owner, items) };
  } catch (err) {
    const f = toActionFailure(err);
    return { ok: false, ...f };
  }
}

export async function mergeCartAction(
  sessionId: string,
): Promise<ActionResult<Awaited<ReturnType<typeof runMergeCart>>>> {
  try {
    const db = getDb();
    const { optionalAuth } = await import('@/modules/auth/require-auth');
    const auth = await optionalAuth(db);
    if (!auth) return { ok: false, status: 401, code: 'unauthorized', message: 'Login required.' };
    return { ok: true, data: await runMergeCart(db, auth.userId, sessionId) };
  } catch (err) {
    const f = toActionFailure(err);
    return { ok: false, ...f };
  }
}
