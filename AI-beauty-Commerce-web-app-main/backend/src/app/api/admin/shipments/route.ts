import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireStaff } from '@/lib/admin';
import { createShipment } from '@/modules/shipping/service';
import { createShipmentSchema } from '@/modules/shipping/validation';

export const POST = api(async ({ req }) => {
  const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  await requireStaff(db);
  const input = createShipmentSchema.parse(await readJson(req));
  return NextResponse.json({ shipment: await createShipment(db, input) }, { status: 201 });
});
