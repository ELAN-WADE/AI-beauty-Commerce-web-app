import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { verifyEmail } from '@/modules/auth/service';
import { verifyEmailSchema } from '@/modules/auth/validation';

export const POST = api(async ({ req }) => {
  const rl = checkRateLimit(`verify:${clientIp(req)}`, Limits.otpVerify);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const input = verifyEmailSchema.parse(await readJson(req));
  await verifyEmail(getDb(), input.token);
  return NextResponse.json({ ok: true });
});
