import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { clientIp, enforceOrigin, Errors, readJson, toErrorResponse } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requirePerm } from '@/lib/admin';
import { audit } from '@/modules/audit/service';
import { getOrderById, transitionOrder } from '@/modules/orders/service';
import { orderStatusSchema } from '@/modules/cart/validation';

type Ctx = { params: Promise<{ id: string }> };

async function gate(req: Request, perm: string) {
  const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const ctx = await requirePerm(db, perm);
  return { db, ctx };
}

export async function GET(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const { id } = await params;
    const { db } = await gate(req, 'orders:read:all');
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
    enforceOrigin(req);
    const { id } = await params;
    const { db, ctx } = await gate(req, 'orders:update:status');
    const input = orderStatusSchema.parse(await readJson(req));
    if (input.status === 'REFUNDED') throw Errors.badRequest('Use the refund workflow to reconcile payment and earnings.');
    // PAID via this route is rejected by the machine (system-only, §11).
    const order = await transitionOrder(db, id, input.status, { actor: 'admin', actorId: ctx.userId });
    await audit(db, { actorId: ctx.userId, action: 'order.status', entityType: 'order', entityId: id, after: { status: input.status }, ip: clientIp(req), requestId });
    const res = NextResponse.json(order);
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
