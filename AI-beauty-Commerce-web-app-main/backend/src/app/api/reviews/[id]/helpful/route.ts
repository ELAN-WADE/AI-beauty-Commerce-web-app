import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { toErrorResponse } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { toggleHelpful } from '@/modules/reviews/service';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const { id } = await params;
    const db = getDb();
    const ctx = await requireAuth(db);
    const res = NextResponse.json(await toggleHelpful(db, ctx.userId, id));
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
