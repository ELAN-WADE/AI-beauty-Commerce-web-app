import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { clientIp, Errors, toErrorResponse } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { BulkheadLimits, tryAcquire } from '@/lib/bulkhead';
import { requireAuth } from '@/modules/auth/require-auth';
import { completeAnalysis } from '@/modules/skin/service';

/** Step 2 (no body): verify upload → provider → validated result + profile refresh. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const rl = checkRateLimit(`ai:${clientIp(req)}`, Limits.ai);
    if (!rl.allowed) throw Errors.rateLimited(60);
    const { id } = await params;
    const db = getDb();
    const ctx = await requireAuth(db);
    const slot = tryAcquire('skin-complete', BulkheadLimits.skin());
    if (!slot) throw Errors.rateLimited(30);
    try {
      const res = NextResponse.json(await completeAnalysis(db, ctx.userId, id));
      res.headers.set('x-request-id', requestId);
      return res;
    } finally {
      slot();
    }
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
