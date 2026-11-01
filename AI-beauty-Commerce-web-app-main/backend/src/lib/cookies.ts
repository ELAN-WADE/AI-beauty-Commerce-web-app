/**
 * Session cookie contract (§7/§18). First-party via same-origin /api proxy.
 * Production uses the __Host- prefix (cookie-tossing defence: requires Secure
 * + Path=/ + no Domain — all true here); dev keeps a plain name so plain-HTTP
 * localhost keeps working.
 */
export type SessionScope = 'CUSTOMER' | 'ADMIN';
export function sessionScopeFromHeaders(headers: Pick<Headers, 'get'>): SessionScope {
  return headers.get('x-desla-auth-context') === 'ADMIN' ? 'ADMIN' : 'CUSTOMER';
}
export function sessionCookieName(scope: SessionScope = 'CUSTOMER'): string {
  const name = scope === 'ADMIN' ? 'desla_admin_sid' : 'desla_sid';
  return process.env.NODE_ENV === 'production' ? `__Host-${name}` : name;
}
export const oauthBrowserCookieName = (scope: SessionScope) => scope === 'ADMIN' ? 'desla_admin_oauth_browser' : 'desla_oauth_browser';

// Back-compat export for call sites that only read the dev name in tests.
export const SESSION_COOKIE = 'desla_sid';

export function sessionCookieOptions(maxAgeSec: number) {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    // Secure only in production so plain-HTTP localhost dev keeps working.
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSec,
  };
}
