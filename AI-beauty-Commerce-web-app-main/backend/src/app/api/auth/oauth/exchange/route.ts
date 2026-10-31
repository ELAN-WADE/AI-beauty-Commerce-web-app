import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { api, clientIp, readJson } from '@/lib/errors';
import { sessionCookieName, sessionCookieOptions } from '@/lib/cookies';
import { exchangeOAuthGrant } from '@/modules/auth/google-oauth';

export const POST = api(async ({ req }) => {
  const input = z.object({ code: z.string().regex(/^[a-f0-9]{64}$/), verifier: z.string().regex(/^[A-Za-z0-9_-]{43,128}$/) }).strict().parse(await readJson(req, 2048));
  const result = await exchangeOAuthGrant(getDb(), input.code, input.verifier, { ip: clientIp(req), userAgent: req.headers.get('user-agent') ?? undefined });
  (await cookies()).set(sessionCookieName(), result.session.token, sessionCookieOptions(Math.floor((result.session.expiresAt.getTime() - Date.now()) / 1000)));
  return NextResponse.json({ ok: true, returnTo: result.returnTo }, { headers: { 'Cache-Control': 'no-store' } });
});
