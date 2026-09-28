import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requirePerm } from '@/lib/admin';
import { audit } from '@/modules/audit/service';
import { setStock } from '@/modules/distributors/service';
import { distributorStockSchema } from '@/modules/distributors/validation';

export const POST = api(async ({ req, requestId }) => {
  const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const ctx = await requirePerm(db, 'inventory:write');
  const input = distributorStockSchema.parse(await readJson(req));
  const result = await setStock(db, input);
  await audit(db, { actorId: ctx.userId, action: 'distributor.stock', entityType: 'distributor', entityId: input.distributorId, after: { variantId: input.variantId, quantity: input.quantity }, ip: clientIp(req), requestId });
  return NextResponse.json(result, { status: 201 });
});
