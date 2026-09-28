import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requirePerm } from '@/lib/admin';
import { audit } from '@/modules/audit/service';
import { createRefund } from '@/modules/payments/service';
import { refundSchema } from '@/modules/payments/validation';

export const POST = api(async ({ req, requestId }) => {
  const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const ctx = await requirePerm(db, 'refunds:write');
  const input = refundSchema.parse(await readJson(req));
  const result = await createRefund(db, { ...input, adminId: ctx.userId });
  await audit(db, { actorId: ctx.userId, action: 'refund.create', entityType: 'payment', entityId: input.paymentId, after: { amountKobo: input.amountKobo, reason: input.reason }, ip: clientIp(req), requestId });
  return NextResponse.json(result, { status: 201 });
});
