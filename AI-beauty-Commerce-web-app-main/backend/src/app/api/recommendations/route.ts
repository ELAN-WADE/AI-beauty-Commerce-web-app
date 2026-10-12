import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { api, Errors } from '@/lib/errors';
import { BulkheadLimits, tryAcquire } from '@/lib/bulkhead';
import { requireAuth } from '@/modules/auth/require-auth';
import { recommendForAnalysis } from '@/modules/skin/service';

/** DB-grounded recommendations for a completed analysis (in-stock only). */
export const GET = api(async ({ req }) => {
  const db = getDb();
  const ctx = await requireAuth(db);
  const analysisId = z.string().uuid().parse(new URL(req.url).searchParams.get('analysisId'));
  const slot = tryAcquire('recommendations', BulkheadLimits.recommendations());
  if (!slot) throw Errors.rateLimited(30);
  try {
    return NextResponse.json(await recommendForAnalysis(db, ctx.userId, analysisId));
  } finally {
    slot();
  }
});
