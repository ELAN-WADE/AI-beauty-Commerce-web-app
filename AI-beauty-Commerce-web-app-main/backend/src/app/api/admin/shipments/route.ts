import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requirePerm } from '@/lib/admin';
import { audit } from '@/modules/audit/service';
import { createShipment } from '@/modules/shipping/service';
import { createShipmentSchema } from '@/modules/shipping/validation';

export const POST = api(async ({ req, requestId }) => {
  const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const ctx = await requirePerm(db, 'orders:update:status');
  const input = createShipmentSchema.parse(await readJson(req));
  const shipment = await createShipment(db, input);
  await audit(db, { actorId: ctx.userId, action: 'shipment.create', entityType: 'order', entityId: input.orderId, after: { provider: input.provider, trackingRef: input.trackingRef }, ip: clientIp(req), requestId });
  return NextResponse.json({ shipment }, { status: 201 });
});
