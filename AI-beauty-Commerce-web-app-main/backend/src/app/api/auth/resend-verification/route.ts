import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { resendVerification } from '@/modules/auth/service';
import { requestPasswordResetSchema } from '@/modules/auth/validation';

export const POST = api(async ({ req }) => {
  const { email } = requestPasswordResetSchema.parse(await readJson(req));
  const db = getDb();
  if (!(await checkSharedRateLimit(db, `resend-verify:${clientIp(req)}:${email}`, Limits.passwordResetRequest)).allowed) throw Errors.rateLimited(60);
  await resendVerification(db, email);
  return NextResponse.json({ ok: true });
});
