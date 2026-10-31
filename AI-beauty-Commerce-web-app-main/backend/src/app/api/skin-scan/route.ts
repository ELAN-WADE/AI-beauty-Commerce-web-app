import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { BulkheadLimits, tryAcquire } from '@/lib/bulkhead';
import { faceInputSchema, observeFace, visionConfigured } from '@/modules/skin/vision';
import { recommendForConcerns } from '@/modules/skin/service';

export async function GET() {
  return NextResponse.json({ available: visionConfigured(), provider: 'gemini' }, { headers: { 'Cache-Control': 'no-store' } });
}
// A visitor can assess their photo without an account. The photo is normalized
// in memory, sent to Gemini with consent, and never persisted or logged here.
export const POST = api(async ({ req }) => {
  const db = getDb();
  if (!(await checkSharedRateLimit(db, 'guest-face:' + clientIp(req), Limits.ai)).allowed) throw Errors.rateLimited(60);
  const input = faceInputSchema.parse(await readJson(req, 3_100_000));
  const release = tryAcquire('guest-face', BulkheadLimits.skin());
  if (!release) throw Errors.rateLimited(30);
  try {
    const result = await observeFace(input, req.signal);
    const recommendations = result.facePresent && result.suitableForAnalysis
      ? await recommendForConcerns(db, [result.skinType, ...result.observations]) : [];
    return NextResponse.json({ provider: 'gemini', result, recommendations }, { headers: { 'Cache-Control': 'private, no-store' } });
  } finally { release(); }
});

