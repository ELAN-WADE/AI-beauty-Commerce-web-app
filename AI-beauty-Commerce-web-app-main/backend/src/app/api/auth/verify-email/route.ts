import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { verifyEmail } from '@/modules/auth/service';
import { createSession } from '@/modules/auth/service';
import { sessionCookieName, sessionCookieOptions } from '@/lib/cookies';
import { cookies } from 'next/headers';
import { verifyEmailSchema } from '@/modules/auth/validation';

export const POST = api(async ({ req }) => {
  const db = getDb();
  const rl = await checkSharedRateLimit(db, `verify:${clientIp(req)}`, Limits.otpVerify);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const input = verifyEmailSchema.parse(await readJson(req));
  const userId = await verifyEmail(db, input.token);
  const session = await createSession(db, userId, { ip: clientIp(req), userAgent: req.headers.get('user-agent') ?? undefined });
  (await cookies()).set(sessionCookieName(), session.token, sessionCookieOptions(Number(process.env.SESSION_TTL_DAYS ?? 30) * 86400));
  return NextResponse.json({ ok: true });
});
