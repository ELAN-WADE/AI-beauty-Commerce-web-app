import { NextResponse } from 'next/server';
import { getDb, type AppDb } from '@/db/client';
import { api, readJson } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { audit } from '@/modules/audit/service';
import { createAddress, listAddresses } from '@/modules/users/service';
import { createAddressSchema } from '@/modules/users/validation';

export const GET = api(async () => {
  const db = getDb();
  const ctx = await requireAuth(db);
  return NextResponse.json({ addresses: await listAddresses(db, ctx.userId) });
});

export const POST = api(async ({ req, requestId }) => {
  const db = getDb();
  const ctx = await requireAuth(db);
  const input = createAddressSchema.parse(await readJson(req));
  const address = await db.transaction(async (tx) => {
    const t = tx as unknown as AppDb;
    const a = await createAddress(t, ctx.userId, input);
    await audit(t, { actorId: ctx.userId, action: 'address.create', entityType: 'address', entityId: a.id, after: { city: input.city, state: input.state }, requestId });
    return a;
  });
  return NextResponse.json({ address }, { status: 201 });
});
