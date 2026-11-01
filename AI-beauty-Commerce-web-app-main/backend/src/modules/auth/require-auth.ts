import { cookies, headers } from 'next/headers';
import type { AppDb } from '../../db/client';
import { Errors } from '../../lib/errors';
import { hasAnyRole } from '../../lib/authz';
import { sessionCookieName, sessionScopeFromHeaders, type SessionScope } from '../../lib/cookies';
import { hasStaffRole } from './admin-policy';
import { getSessionUser } from './service';

export interface AuthContext {
  userId: string;
  email: string;
  emailVerified: boolean;
  roles: string[];
  sessionId: string;
  authScope: SessionScope;
}

/** Resolve the caller from the session cookie. Throws 401 when absent/invalid. */
export async function requireAuth(db: AppDb, scope?: SessionScope): Promise<AuthContext> {
  const jar = await cookies();
  let headerList = new Headers();
  try { headerList = await headers(); } catch { /* Non-request/mock scope. */ }
  const authScope = scope ?? sessionScopeFromHeaders(headerList);
  let raw = jar.get(sessionCookieName(authScope))?.value;
  {
    try {
      const authHeader = headerList.get('authorization');
      if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        raw = authHeader.slice(7).trim();
      }
    } catch {
      // In non-request or mock scopes
    }
  }
  const session = await getSessionUser(db, raw);
  if (!session || session.authScope !== authScope) throw Errors.unauthorized();
  if (authScope === 'ADMIN' && !hasStaffRole(session.roles)) throw Errors.forbidden();
  if (authScope === 'CUSTOMER' && hasStaffRole(session.roles)) throw Errors.forbidden('Use the private administrator sign-in page for this account.');
  // An unverified address is not an identity proof. Verification must precede
  // all cookie-authenticated customer, partner, and admin operations.
  if (!session.user.emailVerifiedAt) throw Errors.forbidden('Verify your email address before accessing your account.');
  return {
    userId: session.user.id,
    email: session.user.email,
    emailVerified: session.user.emailVerifiedAt !== null,
    roles: authScope === 'ADMIN' ? session.roles : session.roles.filter(role => !hasStaffRole([role])),
    sessionId: session.sessionId,
    authScope,
  };
}

/** Role gate for admin/staff routes (BFLA defence, §8 API5). */
export function requireRole(ctx: AuthContext, ...roles: string[]): void {
  if (!hasAnyRole(ctx.roles, ...roles)) throw Errors.forbidden();
}

/** Read-only variant for routes that behave differently when logged in. */
export async function optionalAuth(db: AppDb, scope?: SessionScope): Promise<AuthContext | null> {
  try {
    return await requireAuth(db, scope);
  } catch {
    return null;
  }
}
