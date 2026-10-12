import type { AppDb } from '@/db/client';
import { optionalAuth } from '@/modules/auth/require-auth';

export interface Shopper {
  userId?: string;
  sessionId?: string;
}

/**
 * Validate a client-generated guest session id (UUID v4). Shared by REST
 * (`X-Session-Id` header) and Server Actions (explicit argument) so both
 * transports resolve the identical shopper.
 */
export function parseSessionId(raw: string | null | undefined): string | undefined {
  return raw && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw.trim())
    ? raw.trim()
    : undefined;
}

/**
 * Resolve the caller for cart/checkout: logged-in user (cookie session),
 * guest session UUID (X-Session-Id, client-generated), or anonymous.
 */
export async function shopper(db: AppDb, req: Request): Promise<Shopper> {
  const auth = await optionalAuth(db);
  return { userId: auth?.userId, sessionId: parseSessionId(req.headers.get('x-session-id')) };
}
