import { NextResponse } from 'next/server';
import { getDb, type AppDb } from '@/db/client';
import { api, readJson } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { audit } from '@/modules/audit/service';
import { getProfile, updateProfile } from '@/modules/users/service';
import { updateProfileSchema } from '@/modules/users/validation';

export const GET = api(async () => {
  const db = getDb();
  const ctx = await requireAuth(db);
  return NextResponse.json({ profile: await getProfile(db, ctx.userId) });
});

export const PATCH = api(async ({ req, requestId }) => {
  const db = getDb();
  const ctx = await requireAuth(db);
  const input = updateProfileSchema.parse(await readJson(req));
  const profile = await db.transaction(async (tx) => {
    const t = tx as unknown as AppDb;
    const p = await updateProfile(t, ctx.userId, input);
    // Account change trail: field names only, never values (PII stays out of logs).
    await audit(t, { actorId: ctx.userId, action: 'profile.update', entityType: 'user', entityId: ctx.userId, after: { fields: Object.keys(input) }, requestId });
    return p;
  });
  return NextResponse.json({ profile });
});
