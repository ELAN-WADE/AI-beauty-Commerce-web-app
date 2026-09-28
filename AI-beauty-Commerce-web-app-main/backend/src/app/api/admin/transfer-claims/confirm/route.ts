import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requirePerm } from '@/lib/admin';
import { audit } from '@/modules/audit/service';
import { confirmClaim } from '@/modules/payments/service';
import { confirmClaimSchema } from '@/modules/payments/validation';

/**
 * Admin confirms a transfer claim ONLY with evidence on record. Approval
 * settles through the same system-only PAID path (never a direct status write).
 */
export const POST = api(async ({ req, requestId }) => {
  const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const ctx = await requirePerm(db, 'payments:confirm');
  const input = confirmClaimSchema.parse(await readJson(req));
  const result = await confirmClaim(db, { ...input, adminId: ctx.userId });
  await audit(db, { actorId: ctx.userId, action: 'transfer.confirm', entityType: 'transfer_claim', entityId: input.claimId, after: { approve: input.approve, note: input.note }, ip: clientIp(req), requestId });
  return NextResponse.json(result);
});
