import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, readJson } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { createAddress, listAddresses } from '@/modules/users/service';
import { createAddressSchema } from '@/modules/users/validation';

export const GET = api(async () => {
  const db = getDb();
  const ctx = await requireAuth(db);
  return NextResponse.json({ addresses: await listAddresses(db, ctx.userId) });
});

export const POST = api(async ({ req }) => {
  const db = getDb();
  const ctx = await requireAuth(db);
  const input = createAddressSchema.parse(await readJson(req));
  const address = await createAddress(db, ctx.userId, input);
  return NextResponse.json({ address }, { status: 201 });
});
