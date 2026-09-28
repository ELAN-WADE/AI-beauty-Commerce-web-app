/** Session cookie contract (§7/§18). First-party via same-origin /api proxy. */
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
