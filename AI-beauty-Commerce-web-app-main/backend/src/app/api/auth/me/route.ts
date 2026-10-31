import { userPermissions } from '@/lib/permissions';
import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { getProfile } from '@/modules/users/service';
import { and, eq, isNull } from 'drizzle-orm';
import { userSessions, users } from '@/modules/auth/schema';
import { isMfaVerificationFresh } from '@/modules/auth/mfa';
import { adminEntryPath, hasStaffRole } from '@/modules/auth/admin-policy';

export const GET = api(async () => {
  const db = getDb();
  const ctx = await requireAuth(db);
  const access = await userPermissions(db, ctx.userId);
  const profile = await getProfile(db, ctx.userId);
  const [mfa] = await db.select({ enabledAt: users.mfaEnabledAt, verifiedAt: userSessions.mfaVerifiedAt, signupIntent: users.signupIntent })
    .from(users)
    .innerJoin(userSessions, eq(userSessions.userId, users.id))
    .where(and(eq(users.id, ctx.userId), eq(userSessions.id, ctx.sessionId), isNull(userSessions.revokedAt)))
    .limit(1);
  return NextResponse.json({
    id: ctx.userId,
    email: ctx.email,
    emailVerified: ctx.emailVerified,
    roles: ctx.roles,
    ...(hasStaffRole(ctx.roles) ? { adminEntryPath: adminEntryPath() } : {}),
    permissions: [...access.permissions],
    signupIntent: mfa?.signupIntent ?? 'CUSTOMER',
    mfaEnabled: Boolean(mfa?.enabledAt),
    mfaVerified: Boolean(mfa && isMfaVerificationFresh(mfa.enabledAt, mfa.verifiedAt)),
    profile: profile
      ? { displayName: profile.displayName, phone: profile.phone, avatarUrl: profile.avatarUrl }
      : null,
  }, { headers: { 'Cache-Control': 'no-store' } });
});
