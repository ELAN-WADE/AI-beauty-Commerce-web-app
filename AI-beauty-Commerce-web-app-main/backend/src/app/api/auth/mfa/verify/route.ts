import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, Errors, readJson } from '@/lib/errors';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { requireAuth } from '@/modules/auth/require-auth';
import { verifyMfaForSession } from '@/modules/auth/mfa';
import { mfaCodeSchema } from '@/modules/auth/validation';

export const POST = api(async ({ req, requestId }) => {
  const db = getDb();
  const ctx = await requireAuth(db);
  const input = mfaCodeSchema.parse(await readJson(req));
  const rl = await checkSharedRateLimit(db, `mfa:proof:${ctx.userId}`, Limits.mfa);
  if (!rl.allowed) throw Errors.rateLimited(60);
  await verifyMfaForSession(db, ctx.userId, ctx.sessionId, input.code, requestId);
  return NextResponse.json({ verified: true });
});
