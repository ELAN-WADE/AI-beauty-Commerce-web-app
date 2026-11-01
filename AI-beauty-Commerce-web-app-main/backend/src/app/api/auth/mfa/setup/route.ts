import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, Errors, readJson } from '@/lib/errors';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { requireAuth } from '@/modules/auth/require-auth';
import { beginMfaEnrollment } from '@/modules/auth/mfa';
import { mfaSetupSchema } from '@/modules/auth/validation';

export const POST = api(async ({ req, requestId }) => {
  const db = getDb();
  const ctx = await requireAuth(db, 'ADMIN');
  const rl = await checkSharedRateLimit(db, `mfa:setup:${ctx.userId}`, Limits.mfa);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const input = mfaSetupSchema.parse(await readJson(req));
  return NextResponse.json(await beginMfaEnrollment(db, ctx.userId, ctx.email, input.password, requestId, { restart: input.restart }), {
    status: 201,
    headers: { 'Cache-Control': 'no-store' },
  });
});
