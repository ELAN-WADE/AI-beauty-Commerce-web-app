import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { clientIp, Errors, readJson, toErrorResponse } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireStaff } from '@/lib/admin';
import { moderateReview } from '@/modules/reviews/service';
import { moderateReviewSchema } from '@/modules/reviews/validation';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
    if (!rl.allowed) throw Errors.rateLimited(60);
    const { id } = await params;
    const db = getDb();
    await requireStaff(db);
    const input = moderateReviewSchema.parse(await readJson(req));
    const res = NextResponse.json({ review: await moderateReview(db, id, input.status) });
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
