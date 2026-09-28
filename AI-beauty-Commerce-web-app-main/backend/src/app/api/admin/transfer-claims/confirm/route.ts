import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireStaff } from '@/lib/admin';
import { confirmClaim } from '@/modules/payments/service';
import { confirmClaimSchema } from '@/modules/payments/validation';

/**
 * Admin confirms a transfer claim ONLY with evidence on record. Approval
 * settles through the same system-only PAID path (never a direct status write).
 */
export const POST = api(async ({ req }) => {
  const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const ctx = await requireStaff(db);
  const input = confirmClaimSchema.parse(await readJson(req));
  return NextResponse.json(await confirmClaim(db, { ...input, adminId: ctx.userId }));
});
