import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { readJson, toErrorResponse } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { deleteAddress, updateAddress } from '@/modules/users/service';
import { updateAddressSchema } from '@/modules/users/validation';

// Hand-rolled (not api()-wrapped): Next 15's generated route-type checks reject
// generic-wrapped 2-arg handlers. Error mapping is identical via toErrorResponse.
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const { id } = await params;
    const db = getDb();
    const ctx = await requireAuth(db);
    const input = updateAddressSchema.parse(await readJson(req));
    // Ownership enforced inside the service (id + userId scope, §8 BOLA).
    const res = NextResponse.json({ address: await updateAddress(db, ctx.userId, id, input) });
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const { id } = await params;
    const db = getDb();
    const ctx = await requireAuth(db);
    await deleteAddress(db, ctx.userId, id);
    const res = NextResponse.json({ ok: true });
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
