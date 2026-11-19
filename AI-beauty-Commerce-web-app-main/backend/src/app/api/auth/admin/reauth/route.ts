import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { requireAuth } from '@/modules/auth/require-auth';
import { verifyMfaForSession } from '@/modules/auth/mfa';
import { verifyPassword } from '@/modules/auth/service';
import { userSessions, users } from '@/modules/auth/schema';
import { audit } from '@/modules/audit/service';

const reauthSchema = z
  .object({
    password: z.string().min(1).max(200).optional(),
    code: z.string().trim().min(6).max(24).optional(),
  })
  .strict()
  .refine((v) => Boolean(v.password || v.code), 'Provide your password or authenticator code to reauthenticate.');

/** Sensitive-action step-up reauthentication for active ADMIN sessions. */
export const POST = api(async ({ req, requestId }) => {
  const db = getDb();
  const ctx = await requireAuth(db, 'ADMIN');
  const rl = await checkSharedRateLimit(db, `admin-reauth:${ctx.userId}:${clientIp(req)}`, Limits.login);
  if (!rl.allowed) throw Errors.rateLimited(60);

  const input = reauthSchema.parse(await readJson(req, 4096));
  const [user] = await db.select().from(users).where(eq(users.id, ctx.userId)).limit(1);
  if (!user) throw Errors.unauthorized();

  if (input.code) {
    await verifyMfaForSession(db, ctx.userId, ctx.sessionId, input.code, requestId);
  } else if (input.password) {
    if (!(await verifyPassword(input.password, user.passwordHash))) {
      throw Errors.passwordConfirmationFailed();
    }
    const now = new Date();
    await db
      .update(userSessions)
      .set({ mfaVerifiedAt: now, lastActiveAt: now })
      .where(and(eq(userSessions.id, ctx.sessionId), eq(userSessions.userId, ctx.userId), isNull(userSessions.revokedAt), gt(userSessions.expiresAt, now)));
    await audit(db, {
      actorId: ctx.userId,
      action: 'auth.admin.reauthenticated',
      entityType: 'user_session',
      entityId: ctx.sessionId,
      after: { method: 'password' },
      ip: clientIp(req),
      requestId,
    });
  }

  return NextResponse.json({ ok: true, reauthenticatedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
});

