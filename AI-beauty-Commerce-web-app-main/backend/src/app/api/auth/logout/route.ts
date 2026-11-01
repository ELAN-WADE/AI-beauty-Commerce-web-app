import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '@/db/client';
import { api } from '@/lib/errors';
import { sessionCookieName, sessionCookieOptions, sessionScopeFromHeaders } from '@/lib/cookies';
import { getSessionUser, revokeSession } from '@/modules/auth/service';

export const POST = api(async ({ req }) => {
  const jar = await cookies();
  const scope = sessionScopeFromHeaders(req.headers);
  const authorization = req.headers.get('authorization');
  const raw = authorization?.toLowerCase().startsWith('bearer ') ? authorization.slice(7).trim() : jar.get(sessionCookieName(scope))?.value;
  if (raw) {
    const db = getDb(); const session = await getSessionUser(db, raw);
    if (session?.authScope === scope) await revokeSession(db, raw);
  }
  jar.set(sessionCookieName(scope), '', sessionCookieOptions(0));
  return NextResponse.json({ ok: true });
});
