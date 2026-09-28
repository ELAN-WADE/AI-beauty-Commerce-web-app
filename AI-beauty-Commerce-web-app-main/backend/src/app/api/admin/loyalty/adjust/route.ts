import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requirePerm } from '@/lib/admin';
import { audit } from '@/modules/audit/service';
import { adjustPoints } from '@/modules/loyalty/service';
import { adjustPointsSchema } from '@/modules/loyalty/validation';

export const POST = api(async ({ req, requestId }) => {
  const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const ctx = await requirePerm(db, 'loyalty:adjust');
  const input = adjustPointsSchema.parse(await readJson(req));
  const result = await adjustPoints(db, ctx.userId, input);
  await audit(db, { actorId: ctx.userId, action: 'loyalty.adjust', entityType: 'user', entityId: input.userId, after: { points: input.points, note: input.note }, ip: clientIp(req), requestId });
  return NextResponse.json(result);
});
