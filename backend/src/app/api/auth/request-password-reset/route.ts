import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requestPasswordReset } from '@/modules/auth/service';
import { requestPasswordResetSchema } from '@/modules/auth/validation';

export const POST = api(async ({ req }) => {
  const input = requestPasswordResetSchema.parse(await readJson(req));
  const rl = checkRateLimit(`reset:${clientIp(req)}:${input.email}`, Limits.passwordResetRequest);
  if (!rl.allowed) throw Errors.rateLimited(60);

  // Always 200: no account enumeration (§12.8).
  const result = await requestPasswordReset(getDb(), input.email);
  const body: Record<string, unknown> = { ok: true };
  if (process.env.NODE_ENV === 'development' && result.resetToken) {
    body._devResetToken = result.resetToken; // dev-only, see register route
  }
  return NextResponse.json(body);
});
