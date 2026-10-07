import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { resetPassword } from '@/modules/auth/service';
import { resetPasswordSchema } from '@/modules/auth/validation';

export const POST = api(async ({ req }) => {
  const db = getDb();
  const rl = await checkSharedRateLimit(db, `reset-confirm:${clientIp(req)}`, Limits.otpVerify);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const input = resetPasswordSchema.parse(await readJson(req));
  await resetPassword(db, input.token, input.newPassword);
  return NextResponse.json({ ok: true });
});
