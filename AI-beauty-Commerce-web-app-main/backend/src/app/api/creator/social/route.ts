import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { api, readJson, Errors } from '@/lib/errors';
import { sessionCookieOptions } from '@/lib/cookies';
import { checkSharedRateLimit } from '@/lib/rate-limit';
import { requireAuth } from '@/modules/auth/require-auth';
import { providerSchema } from '@/modules/social/provider';
import { chooseSocial, disconnectSocial, socialCookie, socialStatus, startSocial } from '@/modules/social/service';
export const runtime = 'nodejs';
export const GET = api(async () => {
  const db = getDb(), auth = await requireAuth(db);
  return NextResponse.json(await socialStatus(db, auth), { headers: { 'Cache-Control': 'private, no-store' } });
});
const command = z.discriminatedUnion('action', [
  z.object({ action: z.literal('connect'), provider: providerSchema }).strict(),
  z.object({ action: z.literal('select'), provider: providerSchema, grant: z.string().regex(/^[a-f0-9]{64}$/), accountId: z.string().min(1).max(100) }).strict(),
  z.object({ action: z.literal('disconnect'), provider: providerSchema }).strict(),
]);
export const POST = api(async ({ req }) => {
  const db = getDb(), auth = await requireAuth(db);
  const input = command.parse(await readJson(req, 2048));
  const quota = await checkSharedRateLimit(db, 'creator-social:' + auth.userId, { limit: 20, windowMs: 600000 });
  if (!quota.allowed) throw Errors.rateLimited(Math.ceil(quota.retryAfterMs / 1000));
  if (input.action === 'connect') {
    const result = await startSocial(db, auth, input.provider, req.headers.get('origin') || new URL(req.url).origin);
    const response = NextResponse.json({ authorizationUrl: result.authorizationUrl }, { headers: { 'Cache-Control': 'no-store' } });
    response.cookies.set(socialCookie(input.provider), result.proof, { ...sessionCookieOptions(600), secure: true });
    return response;
  }
  if (input.action === 'select') await chooseSocial(db, auth, input.provider, input.grant, input.accountId);
  else await disconnectSocial(db, auth, input.provider);
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'private, no-store' } });
});
