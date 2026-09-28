import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/cookies';
import { createSession, register } from '@/modules/auth/service';
import { registerSchema } from '@/modules/auth/validation';

const SESSION_TTL_SEC = Number(process.env.SESSION_TTL_DAYS ?? 30) * 24 * 60 * 60;

export const POST = api(async ({ req }) => {
  const rl = checkRateLimit(`register:${clientIp(req)}`, Limits.register);
  if (!rl.allowed) throw Errors.rateLimited(60);

  const input = registerSchema.parse(await readJson(req));
  const db = getDb();
  const result = await register(db, input);

  const body: Record<string, unknown> = { ok: true, email: result.email };
  if (result.created) {
    // Auto-login (session flagged unverified via /me). Rotation on verify later.
    const session = await createSession(db, result.userId, {
      ip: clientIp(req),
      userAgent: req.headers.get('user-agent') ?? undefined,
    });
    const jar = await cookies();
    jar.set(SESSION_COOKIE, session.token, sessionCookieOptions(SESSION_TTL_SEC));
    // Dev-only escape hatch: MailHog flow arrives in S5; until then the token is
    // echoed so the developer can verify without email. NEVER in staging/prod.
    if (process.env.NODE_ENV === 'development' && result.verificationToken) {
      body._devVerificationToken = result.verificationToken;
    }
  }
  // Existing email → identical 201 shape, no cookie (anti-enumeration, §12.8).
  return NextResponse.json(body, { status: 201 });
});
