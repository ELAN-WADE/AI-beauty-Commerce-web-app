import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireAuth } from '@/modules/auth/require-auth';
import { initAnalysis, listAnalyses } from '@/modules/skin/service';
import { initAnalysisSchema } from '@/modules/skin/validation';

export const GET = api(async () => {
  const db = getDb();
  const ctx = await requireAuth(db);
  return NextResponse.json({ analyses: await listAnalyses(db, ctx.userId) });
});

/** Step 1: consent + upload reservation → presigned PUT URL (private bucket). */
export const POST = api(async ({ req }) => {
  const rl = checkRateLimit(`ai:${clientIp(req)}`, Limits.ai);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const ctx = await requireAuth(db);
  const input = initAnalysisSchema.parse(await readJson(req));
  return NextResponse.json(await initAnalysis(db, ctx.userId, input), { status: 201 });
});
