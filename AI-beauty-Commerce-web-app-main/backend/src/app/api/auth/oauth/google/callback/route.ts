import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '@/db/client';
import { ApiError } from '@/lib/errors';
import { consumeOAuthRequest, completeGoogleOAuth } from '@/modules/auth/google-oauth';
import { safeReturnTo } from '@/modules/auth/redirects';

export async function GET(req: Request) {
  const jar = await cookies();
  let returnTo = safeReturnTo(undefined);
  const url = new URL(req.url);
  try {
    const db = getDb();
    const request = await consumeOAuthRequest(db, url.searchParams.get('state'), jar.get('desla_oauth_browser')?.value);
    let callerOrigin: string | null = null;
    try { callerOrigin = new URL(request.returnTo).origin; } catch {}
    returnTo = safeReturnTo(request.returnTo, request.intent, callerOrigin);
    if (url.searchParams.has('error')) throw new ApiError(400, 'oauth_cancelled', 'Google sign-in was cancelled.');
    const code = url.searchParams.get('code');
    if (!code || code.length > 4096) throw new ApiError(400, 'oauth_failed', 'Google did not return an authorization code.');
    const handoff = await completeGoogleOAuth(db, request, code);
    const target = new URL(returnTo); target.searchParams.set('auth', 'google_success'); target.hash = new URLSearchParams({ oauth_code: handoff }).toString();
    return NextResponse.redirect(target, { headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
  } catch (error) {
    const target = new URL(returnTo); target.searchParams.set('auth', 'cancelled');
    target.searchParams.set('message', error instanceof ApiError ? error.message : 'Sign-in could not be completed. Please try again.');
    if (!(error instanceof ApiError)) console.error(JSON.stringify({ scope: 'oauth-callback', code: 'internal_error' }));
    return NextResponse.redirect(target, { headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
  } finally {
    jar.set('desla_oauth_browser', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/auth/oauth/google', maxAge: 0 });
  }
}
