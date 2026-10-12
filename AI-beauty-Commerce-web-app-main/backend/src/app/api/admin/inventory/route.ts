import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireInventoryRole } from '@/lib/admin';
import { audit } from '@/modules/audit/service';
import { adjustStock, getLevels } from '@/modules/inventory/service';
import { adjustStockSchema } from '@/modules/inventory/validation';
import { revalidateStorefront, slugForVariant } from '@/lib/storefront-revalidate';
import { z } from 'zod';

export const GET = api(async ({ req }) => {
  const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  await requireInventoryRole(db);
  const variantId = z.string().uuid().parse(new URL(req.url).searchParams.get('variantId'));
  const levels = await getLevels(db, [variantId]);
  return NextResponse.json({ variantId, ...levels.get(variantId) });
});

export const POST = api(async ({ req, requestId }) => {
  const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const ctx = await requireInventoryRole(db);
  const input = adjustStockSchema.parse(await readJson(req));
  // refId carries the acting admin for the movement log (audit_logs proper in S7).
  const result = await adjustStock(db, { ...input, refType: 'admin', refId: ctx.userId });
  await audit(db, { actorId: ctx.userId, action: 'inventory.adjust', entityType: 'variant', entityId: input.variantId, after: { delta: input.delta, reason: input.reason }, ip: clientIp(req), requestId });
  // Phase 2: stock changed → ISR catalogue/home/product pages refresh on next
  // hit (best-effort; never fails the admin response).
  revalidateStorefront(await slugForVariant(db, input.variantId));
  return NextResponse.json(result, { status: 201 });
});
