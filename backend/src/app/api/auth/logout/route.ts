import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '@/db/client';
import { api } from '@/lib/errors';
import { SESSION_COOKIE } from '@/lib/cookies';
import { revokeSession } from '@/modules/auth/service';

export const POST = api(async () => {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw) await revokeSession(getDb(), raw); // server-side revocation (§7)
  jar.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
});
