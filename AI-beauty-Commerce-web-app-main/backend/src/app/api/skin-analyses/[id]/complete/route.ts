import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { clientIp, enforceOrigin, Errors, toErrorResponse } from '@/lib/errors';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { BulkheadLimits, tryAcquire } from '@/lib/bulkhead';
import { requireAuth } from '@/modules/auth/require-auth';
import { completeAnalysis } from '@/modules/skin/service';

type Ctx = { params: Promise<{ id: string }> };

/** Step 2 (no body): verify upload → send image to Gemini → validated result + catalog match. */
export async function POST(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    enforceOrigin(req);
    const db = getDb();
    const rl = await checkSharedRateLimit(db, `ai:${clientIp(req)}`, Limits.ai);
    if (!rl.allowed) throw Errors.rateLimited(60);
    const { id } = await params;
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
