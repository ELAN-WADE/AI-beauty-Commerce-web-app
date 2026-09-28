import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { api } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { recommendForAnalysis } from '@/modules/skin/service';

/** DB-grounded recommendations for a completed analysis (in-stock only). */
export const GET = api(async ({ req }) => {
  const db = getDb();
  const ctx = await requireAuth(db);
  const analysisId = z.string().uuid().parse(new URL(req.url).searchParams.get('analysisId'));
  return NextResponse.json(await recommendForAnalysis(db, ctx.userId, analysisId));
});
