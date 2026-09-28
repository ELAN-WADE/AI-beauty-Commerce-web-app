import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { clientIp, Errors, readJson, toErrorResponse } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireStaff } from '@/lib/admin';
import { addShipmentEvent } from '@/modules/shipping/service';
import { shipmentEventSchema } from '@/modules/shipping/validation';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
    if (!rl.allowed) throw Errors.rateLimited(60);
    const { id } = await params;
    const db = getDb();
    await requireStaff(db);
    const input = shipmentEventSchema.parse(await readJson(req));
    const res = NextResponse.json(await addShipmentEvent(db, { shipmentId: id, ...input }), { status: 201 });
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
