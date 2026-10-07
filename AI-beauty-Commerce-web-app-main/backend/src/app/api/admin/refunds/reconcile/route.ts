import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { requirePerm } from '@/lib/admin';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { reconcileRefund } from '@/modules/payments/service';

const schema = z.object({ refundId: z.string().uuid(), status: z.enum(['success', 'failed']), evidence: z.string().trim().min(20).max(500) }).strict();

export const POST = api(async ({ req }) => {
  const db = getDb();
  if (!(await checkSharedRateLimit(db, `refund-reconcile:${clientIp(req)}`, Limits.admin)).allowed) throw Errors.rateLimited(60);
  const ctx = await requirePerm(db, 'refunds:write');
  const input = schema.parse(await readJson(req));
  return NextResponse.json(await reconcileRefund(db, { ...input, adminId: ctx.userId }));
});
