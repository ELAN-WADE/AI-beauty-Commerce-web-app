// Shared by both storefronts. This module contains no framework or backend imports.
export type AccountIntent = 'CUSTOMER' | 'CREATOR' | 'DISTRIBUTOR' | 'ADMIN';
type RequestApi = <T>(path: string, init?: RequestInit) => Promise<T>;
const intentKey = 'desla-auth-intent';
const verifierKey = 'desla-oauth-verifier';
export const asIntent = (value: unknown): AccountIntent => value === 'CREATOR' || value === 'DISTRIBUTOR' || value === 'ADMIN' ? value : 'CUSTOMER';
export const intentPath = (intent: AccountIntent) => intent === 'CREATOR' ? '/creators' : intent === 'DISTRIBUTOR' ? '/distributor' : '/catalogue';
export const isStaffAccount = (roles: string[]) => roles.some(role => ['ADMIN', 'STAFF', 'SUPER_ADMIN', 'INVENTORY_MANAGER', 'SUPPORT'].includes(role));
export function localReturnTo(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x20]/.test(value) || value.length > 1500) return null;
  const url = new URL(value, 'https://local.invalid');
  if (url.origin !== 'https://local.invalid' || url.pathname.startsWith('/api/') || ['/login', '/signup', '/verify-email', '/reset-password', '/forgot-password'].includes(url.pathname) || ['login', 'signup', 'verify-email', 'reset-password', 'forgot-password'].includes(url.searchParams.get('screen') ?? '')) return null;
  for (const key of ['auth', 'sid', 'token', 'code', 'state', 'user', 'message', 'preview']) url.searchParams.delete(key);
  return url.pathname + url.search;
}
export function rememberAuthIntent(intent: AccountIntent, returnTo?: string) {
  try { sessionStorage.setItem(intentKey, JSON.stringify({ intent, returnTo: localReturnTo(returnTo) })); } catch { /* URL intent still works. */ }
}
export function readAuthIntent(): { intent: AccountIntent; returnTo: string | null } {
  const params = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search);
  let stored: { intent?: string; returnTo?: string } = {};
  try { stored = JSON.parse(sessionStorage.getItem(intentKey) ?? '{}'); } catch { /* Optional storage. */ }
  const intent = asIntent(params.get('intent') ?? stored.intent);
  return { intent, returnTo: localReturnTo(params.get('returnTo') ?? stored.returnTo) };
}
export function rememberSignInFrom(screen: string, currentUrl: string) {
  if (['login', 'signup', 'verify-email', 'reset-password', 'forgot-password'].includes(screen)) return;
  const intent = ['creators', 'creator-dashboard'].includes(screen) ? 'CREATOR' : ['distributor-portal', 'distributor-dashboard'].includes(screen) ? 'DISTRIBUTOR' : 'CUSTOMER';
  const url = new URL(currentUrl);
  // The same screen IDs are understood by the root SPA and canonical Next paths.
  const paths: Record<string, string> = { creators: '/creators', 'creator-dashboard': '/creators', 'distributor-portal': '/distributor', 'distributor-dashboard': '/distributor', 'admin-console': url.pathname };
  rememberAuthIntent(intent, paths[screen] || (screen === 'home' ? '/catalogue' : url.pathname + url.search));
}
export function finishSignIn(user: { roles: string[]; signupIntent?: string; adminEntryPath?: string | null }, navigate?: (target: string) => void) {
  const { intent, returnTo } = readAuthIntent();
  const fallback = intent === 'ADMIN' ? user.adminEntryPath || '/account' : intent !== 'CUSTOMER' ? intentPath(intent) : isStaffAccount(user.roles) ? user.adminEntryPath || '/account' : '/catalogue';
  try { sessionStorage.removeItem(intentKey); } catch { /* Optional storage. */ }
  if (navigate) navigate(returnTo || fallback);
  else window.location.assign(returnTo || fallback);
}
export async function beginGoogleSignIn(api: RequestApi, redirect?: string, role?: string) {
  const saved = readAuthIntent();
  const intent = role ? asIntent(role) : saved.intent;
  const candidate = redirect ? new URL(redirect, window.location.origin) : null;
  const savedReturnTo = role && saved.intent !== intent ? null : saved.returnTo;
  const returnTo = candidate?.origin === window.location.origin ? localReturnTo(candidate.pathname + candidate.search) : savedReturnTo;
  rememberAuthIntent(intent, returnTo ?? intentPath(intent));
  const verifier = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
  // Only a short-lived proof key lives in JS, never the authenticated session.
  try { sessionStorage.setItem(verifierKey, verifier); } catch { throw new Error('Enable browser storage to use Google sign-in, or use email and password.'); }
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  const challenge = btoa(String.fromCharCode(...hash)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const query = new URLSearchParams({ prepare: '1', role: intent, challenge, redirect: new URL(returnTo || intentPath(intent), window.location.origin).toString() });
  const result = await api<{ startUrl: string }>(`/api/auth/oauth/google?${query}`);
  const target = new URL(result.startUrl, window.location.origin);
  const isSameOrigin = target.origin === window.location.origin;
  const isDevLoopback = process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  if (!isSameOrigin && !isDevLoopback) {
    throw new Error('Google sign-in is configured for a different storefront. Set FRONTEND_URL to this site before signing in.');
  }
  // The server selects the callback's cookie host. The proof stays in this tab
  // and the stored return URL brings it back to the originating storefront.
  window.location.assign(target.toString());
}

let restoring: Promise<void> | null = null;
export function restoreOAuthCallback(api: RequestApi): Promise<void> {
  if (restoring) return restoring;
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const code = fragment.get('oauth_code');
  const params = new URLSearchParams(window.location.search);
  const cancelled = params.get('auth') === 'cancelled';
  const message = params.get('message');
  try { localStorage.removeItem('glowly-auth-token'); } catch { /* Remove legacy credentials if possible. */ }
  if (!code && !cancelled && !fragment.has('session')) return Promise.resolve();
  for (const key of ['auth', 'message', 'user', 'role', 'sid']) params.delete(key);
  window.history.replaceState(window.history.state, '', window.location.pathname + (params.size ? `?${params}` : ''));
  restoring = (async () => {
    if (cancelled) throw new Error(message || 'Google sign-in was cancelled.');
    if (!code) throw new Error('This old sign-in link has expired. Please sign in again.');
    let verifier: string | null = null;
    try { verifier = sessionStorage.getItem(verifierKey); } catch { /* Report missing browser proof below. */ }
    if (!verifier) throw new Error('Sign-in must be completed in the browser tab where it started. Please try again.');
    await api('/api/auth/oauth/exchange', { method: 'POST', body: JSON.stringify({ code, verifier }) });
    try { sessionStorage.removeItem(verifierKey); sessionStorage.removeItem(intentKey); } catch { /* Optional cleanup. */ }
  })();
  return restoring;
}
