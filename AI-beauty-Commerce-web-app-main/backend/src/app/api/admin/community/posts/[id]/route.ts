import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { clientIp, Errors, readJson, toErrorResponse } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requirePerm } from '@/lib/admin';
import { audit } from '@/modules/audit/service';
import { setPostVisibility } from '@/modules/community/service';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
    if (!rl.allowed) throw Errors.rateLimited(60);
    const { id } = await params;
    const db = getDb();
    const ctx = await requirePerm(db, 'reviews:moderate');
    const input = z.object({ visible: z.boolean() }).strict().parse(await readJson(req));
    const result = await setPostVisibility(db, id, input.visible);
    await audit(db, { actorId: ctx.userId, action: 'community.moderate', entityType: 'community_post', entityId: id, after: { visible: input.visible }, ip: clientIp(req), requestId });
    const res = NextResponse.json(result);
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
