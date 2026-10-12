/**
 * Phase 4 — action-first client bridge (Next.js app only).
 *
 * `callAction(action, fallback)` runs a Server Action (one RPC, direct DB —
 * no HTTP waterfall) and converts its `{ ok: false }` envelope back into
 * `ApiError`, so every existing `catch` block behaves byte-identically.
 * Only TRANSPORT-level failures (action RPC itself unreachable/unserializable)
 * fall back to the same-origin REST endpoint — domain answers from the server
 * always stand (no double-submit risk: both paths are idempotent).
 */
import { ApiError } from './owned-api';
import type { ActionResult } from '@/app/actions/_shared';

/** Collapse an action result to void (for fire-and-forget mutations). */
export function asVoid<T>(p: Promise<ActionResult<T>>): Promise<ActionResult<void>> {
  return p.then((r) => (r.ok ? { ok: true as const, data: undefined } : r));
}

export async function callAction<T>(
  action: Promise<ActionResult<T>>,
  fallback: () => Promise<T>,
): Promise<T> {
  let res: ActionResult<T>;
  try {
    res = await action;
  } catch {
    return fallback();
  }
  if (!res.ok) throw new ApiError(res.status, res.code, res.message);
  return res.data;
}
