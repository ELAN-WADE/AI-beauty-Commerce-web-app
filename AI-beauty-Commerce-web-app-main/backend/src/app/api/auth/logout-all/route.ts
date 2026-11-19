import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '@/db/client';
import { api, clientIp } from '@/lib/errors';
import { sessionCookieName, sessionCookieOptions, sessionScopeFromHeaders } from '@/lib/cookies';
import { requireAuth } from '@/modules/auth/require-auth';
import { revokeAllSessions } from '@/modules/auth/service';
import { audit } from '@/modules/audit/service';

/** Server-side revocation of all active sessions for the signed-in user. */
export const POST = api(async ({ req, requestId }) => {
  const db = getDb();
  const scope = sessionScopeFromHeaders(req.headers);
  const ctx = await requireAuth(db, scope);
  await revokeAllSessions(db, ctx.userId);
  await audit(db, {
    actorId: ctx.userId,
    action: 'auth.sessions.revoked_all',
    entityType: 'user',
    entityId: ctx.userId,
    after: { scope },
    ip: clientIp(req),
    requestId,
  });
  const jar = await cookies();
  jar.set(sessionCookieName(scope), '', sessionCookieOptions(0));
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
});

