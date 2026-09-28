import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { clientIp, Errors, readJson, toErrorResponse } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireStaff } from '@/lib/admin';
import { getOrderById, transitionOrder } from '@/modules/orders/service';
import { orderStatusSchema } from '@/modules/cart/validation';

type Ctx = { params: Promise<{ id: string }> };

async function gate(req: Request) {
  const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const ctx = await requireStaff(db);
  return { db, ctx };
}

export async function GET(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const { id } = await params;
    const { db } = await gate(req);
    const res = NextResponse.json(await getOrderById(db, id));
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const { id } = await params;
    const { db, ctx } = await gate(req);
    const input = orderStatusSchema.parse(await readJson(req));
    // PAID via this route is rejected by the machine (system-only, §11).
    const res = NextResponse.json(
      await transitionOrder(db, id, input.status, { actor: 'admin', actorId: ctx.userId }),
    );
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
