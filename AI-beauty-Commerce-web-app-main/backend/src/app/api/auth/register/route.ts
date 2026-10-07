import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { register } from '@/modules/auth/service';
import { registerSchema } from '@/modules/auth/validation';


export const POST = api(async ({ req }) => {
  const db = getDb();
  const rl = await checkSharedRateLimit(db, `register:${clientIp(req)}`, Limits.register);
  if (!rl.allowed) throw Errors.rateLimited(60);

  const input = registerSchema.parse(await readJson(req));
  const result = await register(db, input);

  const body: Record<string, unknown> = { ok: true, email: result.email };
  if (result.created && result.verificationToken) {
    // Token and outbox are committed atomically by register().
    // No authenticated session until proof of email ownership and real login.
    // Dev-only escape hatch: echoed so the developer can verify without email. NEVER in staging/prod.
    if (process.env.NODE_ENV === 'development') {
      body._devVerificationToken = result.verificationToken;
    }
  }
  // Existing email → identical 201 shape, no cookie (anti-enumeration, §12.8).
  return NextResponse.json(body, { status: 201 });
});
