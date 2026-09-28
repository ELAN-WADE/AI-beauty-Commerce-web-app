import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, readJson } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { getSkinProfile, upsertSkinProfile } from '@/modules/skin/service';
import { skinProfileSchema } from '@/modules/skin/validation';

export const GET = api(async () => {
  const db = getDb();
  const ctx = await requireAuth(db);
  return NextResponse.json({ profile: await getSkinProfile(db, ctx.userId) });
});

export const PUT = api(async ({ req }) => {
  const db = getDb();
  const ctx = await requireAuth(db);
  const input = skinProfileSchema.parse(await readJson(req));
  return NextResponse.json({ profile: await upsertSkinProfile(db, ctx.userId, input) });
});
