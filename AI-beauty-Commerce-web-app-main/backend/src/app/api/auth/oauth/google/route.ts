import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '@/db/client';
import { api, clientIp, Errors } from '@/lib/errors';
import { checkSharedRateLimit } from '@/lib/rate-limit';
import { startGoogleOAuth } from '@/modules/auth/google-oauth';
import { googleConfig, safeReturnTo, oauthIntent } from '@/modules/auth/redirects';
import { adminEntryPath } from '@/modules/auth/admin-policy';
import { oauthBrowserCookieName } from '@/lib/cookies';

export const GET = api(async ({ req }) => {
  const url = new URL(req.url);
  const redirectParam = url.searchParams.get('redirect');
  let callerOrigin: string | null = null;
  if (redirectParam) {
    try { callerOrigin = new URL(redirectParam).origin; } catch {}
  }
  if (!callerOrigin) {
    const raw = req.headers.get('origin') || req.headers.get('referer');
    if (raw) {
      try { callerOrigin = new URL(raw).origin; } catch { callerOrigin = null; }
    }
  }
  const config = googleConfig(callerOrigin);
  if (oauthIntent(url.searchParams.get('role')) === 'ADMIN') {
    let target: URL | null = null;
    try { target = redirectParam ? new URL(redirectParam, config.storefront) : null; } catch {}
    if (!adminEntryPath() || target?.pathname !== adminEntryPath() || safeReturnTo(redirectParam, 'ADMIN', callerOrigin) !== target.toString()) throw Errors.notFound();
  }
  if (url.searchParams.get('prepare') === '1') {
    const start = new URL('/api/auth/oauth/google', config.startOrigin);
    start.searchParams.set('redirect', safeReturnTo(redirectParam, url.searchParams.get('role'), callerOrigin));
    start.searchParams.set('role', oauthIntent(url.searchParams.get('role')));
    start.searchParams.set('challenge', url.searchParams.get('challenge') ?? '');
    return NextResponse.json({ startUrl: start.toString() }, { headers: { 'Cache-Control': 'no-store' } });
  }
  const db = getDb();
  if (!(await checkSharedRateLimit(db, `oauth-start:${clientIp(req)}`, { limit: 20, windowMs: 900000 })).allowed) throw Errors.rateLimited(60);
  const result = await startGoogleOAuth(db, { redirect: redirectParam ?? undefined, intent: url.searchParams.get('role') ?? undefined, challenge: url.searchParams.get('challenge') ?? '', callerOrigin: callerOrigin ?? undefined });
  (await cookies()).set(oauthBrowserCookieName(oauthIntent(url.searchParams.get('role')) === 'ADMIN' ? 'ADMIN' : 'CUSTOMER'), result.browser, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/auth/oauth/google', maxAge: 600 });
  return NextResponse.redirect(result.url, { headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
});
