import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, readJson } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { getProfile, updateProfile } from '@/modules/users/service';
import { updateProfileSchema } from '@/modules/users/validation';

export const GET = api(async () => {
  const db = getDb();
  const ctx = await requireAuth(db);
  return NextResponse.json({ profile: await getProfile(db, ctx.userId) });
});

export const PATCH = api(async ({ req }) => {
  const db = getDb();
  const ctx = await requireAuth(db);
  const input = updateProfileSchema.parse(await readJson(req));
  return NextResponse.json({ profile: await updateProfile(db, ctx.userId, input) });
});
