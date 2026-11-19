import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { clientIp, enforceOrigin, Errors, readJson, toErrorResponse } from '@/lib/errors';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { requirePerm } from '@/lib/admin';
import { audit } from '@/modules/audit/service';
import { markApplicationUnderReview, reviewApplication } from '@/modules/creators/service';
import { reviewCreatorApplicationSchema } from '@/modules/creators/validation';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    enforceOrigin(req);
    const db = getDb();
    const rl = await checkSharedRateLimit(db, `admin:${clientIp(req)}`, Limits.admin);
    if (!rl.allowed) throw Errors.rateLimited(60);
    const { id } = await params;
    const ctx = await requirePerm(db, 'partners:review');
    const input = reviewCreatorApplicationSchema.parse(await readJson(req));
    const result = await db.transaction(async (tx) => {
      if (input.action === 'under_review') {
        const res = await markApplicationUnderReview(tx, { applicationId: id, adminId: ctx.userId, note: input.note });
        await audit(tx, { actorId: ctx.userId, action: 'creator.under_review', entityType: 'creator_application', entityId: id, after: { status: 'under_review' }, ip: clientIp(req), requestId });
        return res;
      }
      const res = await reviewApplication(tx, {
        applicationId: id,
        adminId: ctx.userId,
        approve: Boolean(input.approve),
        promoCode: input.promoCode,
        discountPercent: input.discountPercent,
        commissionRate: input.commissionRate,
        note: input.note,
      });
      await audit(tx, { actorId: ctx.userId, action: input.approve ? 'creator.approve' : 'creator.reject', entityType: 'creator_application', entityId: id, after: { approve: input.approve }, ip: clientIp(req), requestId });
      return res;
    });
    const res = NextResponse.json(result);
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
