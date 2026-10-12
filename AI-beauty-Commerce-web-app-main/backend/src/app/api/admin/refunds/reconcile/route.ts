import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb, type AppDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { requirePerm } from '@/lib/admin';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { audit } from '@/modules/audit/service';
import { reconcileRefund } from '@/modules/payments/service';

const schema = z.object({ refundId: z.string().uuid(), status: z.enum(['success', 'failed']), evidence: z.string().trim().min(20).max(500) }).strict();

export const POST = api(async ({ req, requestId }) => {
  const db = getDb();
  if (!(await checkSharedRateLimit(db, `refund-reconcile:${clientIp(req)}`, Limits.admin)).allowed) throw Errors.rateLimited(60);
  const ctx = await requirePerm(db, 'refunds:write');
  const input = schema.parse(await readJson(req));
  // Atomic with the mutation: the trail can never describe a rollback, and a
  // failed audit can never report success for a committed reconciliation.
  const result = await db.transaction(async (tx) => {
    const t = tx as unknown as AppDb;
    const r = await reconcileRefund(t, { ...input, adminId: ctx.userId });
    // Finance confirmation: who declared what, with whose evidence reference.
    await audit(t, { actorId: ctx.userId, action: 'refund.reconcile', entityType: 'refund', entityId: input.refundId, after: { status: r.status, evidenceChars: input.evidence.length }, ip: clientIp(req), requestId });
    return r;
  });
  return NextResponse.json(result);
});
