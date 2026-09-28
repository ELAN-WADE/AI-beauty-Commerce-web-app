import { cookies } from 'next/headers';
import type { AppDb } from '../../db/client';
import { Errors } from '../../lib/errors';
import { SESSION_COOKIE } from '../../lib/cookies';
import { getSessionUser } from './service';

export interface AuthContext {
  userId: string;
  email: string;
  emailVerified: boolean;
  roles: string[];
  sessionId: string;
}

/** Resolve the caller from the session cookie. Throws 401 when absent/invalid. */
export async function requireAuth(db: AppDb): Promise<AuthContext> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  const session = await getSessionUser(db, raw);
  if (!session) throw Errors.unauthorized();
  return {
    userId: session.user.id,
    email: session.user.email,
    emailVerified: session.user.emailVerifiedAt !== null,
    roles: session.roles,
    sessionId: session.sessionId,
  };
}

/** Role gate for admin/staff routes (BFLA defence, §8 API5). */
export function requireRole(ctx: AuthContext, ...roles: string[]): void {
  if (!roles.some((r) => ctx.roles.includes(r))) throw Errors.forbidden();
}

/** Read-only variant for routes that behave differently when logged in. */
export async function optionalAuth(db: AppDb): Promise<AuthContext | null> {
  try {
    return await requireAuth(db);
  } catch {
    return null;
  }
}
