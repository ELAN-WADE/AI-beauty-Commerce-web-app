/**
 * Session cookie contract (§7/§18). First-party via same-origin /api proxy.
 * Production uses the __Host- prefix (cookie-tossing defence: requires Secure
 * + Path=/ + no Domain — all true here); dev keeps a plain name so plain-HTTP
 * localhost keeps working.
 */
export function sessionCookieName(): string {
  return process.env.NODE_ENV === 'production' ? '__Host-desla_sid' : 'desla_sid';
}

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
