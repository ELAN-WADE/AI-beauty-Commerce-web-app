import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/cookies';
import { login } from '@/modules/auth/service';
import { loginSchema } from '@/modules/auth/validation';

const SESSION_TTL_SEC = Number(process.env.SESSION_TTL_DAYS ?? 30) * 24 * 60 * 60;

export const POST = api(async ({ req }) => {
  const raw = await readJson(req);
  // Rate-limit key includes normalized email only after parse; pre-parse guard on IP.
  const pre = checkRateLimit(`login:ip:${clientIp(req)}`, { limit: 20, windowMs: 15 * 60_000 });
  if (!pre.allowed) throw Errors.rateLimited(60);

  const input = loginSchema.parse(raw);
  const rl = checkRateLimit(`login:${clientIp(req)}:${input.email}`, Limits.login);
  if (!rl.allowed) throw Errors.rateLimited(60);

  const session = await login(getDb(), input, {
    ip: clientIp(req),
    userAgent: req.headers.get('user-agent') ?? undefined,
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, session.token, sessionCookieOptions(SESSION_TTL_SEC));
  return NextResponse.json({ ok: true });
});
