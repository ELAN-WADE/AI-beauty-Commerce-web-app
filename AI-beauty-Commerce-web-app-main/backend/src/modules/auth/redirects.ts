import { ApiError } from '../../lib/errors';
import { frontendOrigin } from './email';

export const accountIntent = (value: unknown): 'CUSTOMER' | 'CREATOR' | 'DISTRIBUTOR' => value === 'CREATOR' || value === 'DISTRIBUTOR' ? value : 'CUSTOMER';
export const oauthIntent = (value: unknown) => value === 'ADMIN' ? 'ADMIN' : accountIntent(value);

export function safeReturnTo(value: unknown, intent: unknown = 'CUSTOMER', callerOrigin?: string | null): string {
  const base = frontendOrigin(callerOrigin);
  const fallback = new URL(accountIntent(intent) === 'CREATOR' ? '/creators' : accountIntent(intent) === 'DISTRIBUTOR' ? '/distributor' : '/catalogue', base);
  if (typeof value !== 'string' || value.length > 1500 || /[\\\x00-\x20]/.test(value)) return fallback.toString();
  try {
    const url = new URL(value, base);
    const isAllowedOrigin = url.origin === base.origin || (
      process.env.NODE_ENV !== 'production' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
      ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)
    );
    if (!isAllowedOrigin || url.username || url.password || /^\/api(?:\/|$)/.test(url.pathname) || ['login', 'signup', 'verify-email', 'reset-password'].includes(url.pathname.slice(1)) || ['login', 'signup', 'verify-email', 'reset-password'].includes(url.searchParams.get('screen') ?? '')) return fallback.toString();
    url.hash = '';
    for (const key of ['auth', 'user', 'sid', 'token', 'role', 'code', 'state', 'preview']) url.searchParams.delete(key);
    return url.toString();
  } catch { return fallback.toString(); }
}

export function googleConfig(callerOrigin?: string | null) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const secret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  try {
    if (!clientId || !secret || /placeholder/i.test(clientId + secret)) throw new Error();
    const app = new URL(process.env.APP_URL || 'http://localhost:3005');
    const frontend = frontendOrigin(callerOrigin);
    // Allow the redirect URI to be on either the frontend origin OR the backend (APP_URL) origin.
    // In dev, the backend hosts the OAuth callback at APP_URL while the frontend SPA is on a
    // different port (FRONTEND_URL). In production both should be the same origin.
    const redirectRaw = process.env.GOOGLE_REDIRECT_URI || '/api/auth/oauth/google/callback';
    const redirect = new URL(redirectRaw, app); // default to APP_URL origin
    const allowedOrigins = new Set([frontend.origin, app.origin]);
    if (process.env.NODE_ENV !== 'production') {
      try {
        const configured = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
        allowedOrigins.add(configured.origin);
      } catch {}
    }
    if (
      app.username || app.password || app.pathname !== '/' || app.search || app.hash ||
      !['http:', 'https:'].includes(app.protocol) ||
      !allowedOrigins.has(redirect.origin) ||
      redirect.pathname !== '/api/auth/oauth/google/callback' ||
      redirect.search || redirect.hash
    ) throw new Error();
    if (process.env.NODE_ENV === 'production' && (app.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(app.hostname) || redirect.protocol !== 'https:' || redirect.hostname !== frontend.hostname)) throw new Error();
    // Cookies are host-scoped, not port-scoped. Begin on the callback host so
    // localhost/127.0.0.1 aliases cannot lose the browser-binding cookie.
    const startOrigin = redirect.hostname === frontend.hostname ? frontend : new URL(redirect.origin);
    return { clientId, secret, app, redirectUri: redirect.toString(), storefront: frontend, startOrigin };
  } catch { throw new ApiError(503, 'oauth_configuration', 'Google sign-in is temporarily unavailable. Use email and password or contact support.'); }
}
