import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { getProfile } from '@/modules/users/service';

export const GET = api(async () => {
  const db = getDb();
  const ctx = await requireAuth(db);
  const profile = await getProfile(db, ctx.userId);
  return NextResponse.json({
    id: ctx.userId,
    email: ctx.email,
    emailVerified: ctx.emailVerified,
    roles: ctx.roles,
    profile: profile
      ? { displayName: profile.displayName, phone: profile.phone, avatarUrl: profile.avatarUrl }
      : null,
  });
});
