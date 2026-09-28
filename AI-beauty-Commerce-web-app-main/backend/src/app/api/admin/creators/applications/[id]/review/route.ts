import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { clientIp, Errors, readJson, toErrorResponse } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requirePerm } from '@/lib/admin';
import { audit } from '@/modules/audit/service';
import { reviewApplication } from '@/modules/creators/service';
import { reviewCreatorApplicationSchema } from '@/modules/creators/validation';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
    if (!rl.allowed) throw Errors.rateLimited(60);
    const { id } = await params;
    const db = getDb();
    const ctx = await requirePerm(db, 'products:write');
    const input = reviewCreatorApplicationSchema.parse(await readJson(req));
    const result = await reviewApplication(db, { applicationId: id, adminId: ctx.userId, ...input });
    await audit(db, { actorId: ctx.userId, action: 'creator.approve', entityType: 'creator_application', entityId: id, after: { approve: input.approve }, ip: clientIp(req), requestId });
    const res = NextResponse.json(result);
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
