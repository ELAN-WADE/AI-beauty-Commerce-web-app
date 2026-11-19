import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { clientIp, enforceOrigin, Errors, toErrorResponse } from '@/lib/errors';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { requireAuth } from '@/modules/auth/require-auth';
import { deleteAnalysis, getAnalysis } from '@/modules/skin/service';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const { id } = await params;
    const db = getDb();
    const ctx = await requireAuth(db);
    const res = NextResponse.json(await getAnalysis(db, ctx.userId, id));
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}

/** User-initiated privacy deletion of stored scan photo and analysis record. */
export async function DELETE(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    enforceOrigin(req);
    const db = getDb();
    const rl = await checkSharedRateLimit(db, `ai-delete:${clientIp(req)}`, Limits.apiMutation);
    if (!rl.allowed) throw Errors.rateLimited(60);
    const { id } = await params;
    const ctx = await requireAuth(db);
    const res = NextResponse.json(await deleteAnalysis(db, ctx.userId, id, requestId));
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
