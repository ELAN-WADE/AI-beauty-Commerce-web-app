import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { requestPasswordReset } from '@/modules/auth/service';
import { requestPasswordResetSchema } from '@/modules/auth/validation';

export const POST = api(async ({ req }) => {
  const input = requestPasswordResetSchema.parse(await readJson(req));
  const db = getDb();
  const rl = await checkSharedRateLimit(db, `reset:${clientIp(req)}:${input.email}`, Limits.passwordResetRequest);
  if (!rl.allowed) throw Errors.rateLimited(60);

  // Always 200: no account enumeration (§12.8).
  await requestPasswordReset(db, input.email);
  return NextResponse.json({ ok: true });
});
