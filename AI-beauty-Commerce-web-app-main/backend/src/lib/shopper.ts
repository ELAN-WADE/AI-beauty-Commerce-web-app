import type { AppDb } from '@/db/client';
import { optionalAuth } from '@/modules/auth/require-auth';

export interface Shopper {
  userId?: string;
  sessionId?: string;
}

/**
 * Resolve the caller for cart/checkout: logged-in user (cookie session),
 * guest session UUID (X-Session-Id, client-generated), or anonymous.
 */
export async function shopper(db: AppDb, req: Request): Promise<Shopper> {
  const auth = await optionalAuth(db);
  const raw = req.headers.get('x-session-id');
  const sessionId = raw && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw.trim())
    ? raw.trim()
    : undefined;
  return { userId: auth?.userId, sessionId };
}
