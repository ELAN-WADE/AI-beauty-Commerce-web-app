import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '@/db/client';
import { api } from '@/lib/errors';
import { sessionCookieName } from '@/lib/cookies';
import { revokeSession } from '@/modules/auth/service';

export const POST = api(async ({ req }) => {
  const jar = await cookies();
  const authorization = req.headers.get('authorization');
  const raw = authorization?.toLowerCase().startsWith('bearer ') ? authorization.slice(7).trim() : jar.get(sessionCookieName())?.value;
  if (raw) await revokeSession(getDb(), raw); // server-side revocation (§7)
  jar.delete(sessionCookieName());
  return NextResponse.json({ ok: true });
});
