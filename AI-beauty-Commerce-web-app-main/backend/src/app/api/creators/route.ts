import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { optionalAuth } from '@/modules/auth/require-auth';
import { listCreators, submitApplication, trackClick, validateCode } from '@/modules/creators/service';
import { clickSchema, creatorApplicationSchema, creatorCodeQuery } from '@/modules/creators/validation';

export const GET = api(async ({ req }) => {
  const url = new URL(req.url);
  // ?code= validates a promo code (public, discount info only).
  if (url.searchParams.has('code')) {
    const rl = checkRateLimit(`creator:${clientIp(req)}`, { limit: 60, windowMs: 60_000 });
    if (!rl.allowed) throw Errors.rateLimited(60);
    const q = creatorCodeQuery.parse({ code: url.searchParams.get('code') });
    const { name, handle, promoCode, discountPercent } = await validateCode(getDb(), q.code);
    return NextResponse.json({ name, handle, promoCode, discountPercent });
  }
  return NextResponse.json({ creators: await listCreators(getDb()) });
});

export const POST = api(async ({ req }) => {
  const db = getDb();
  if (!(await checkSharedRateLimit(db, `creator-write:${clientIp(req)}`, { limit: 10, windowMs: 3600_000 })).allowed) throw Errors.rateLimited(60);
  const body = (await readJson(req)) as Record<string, unknown>;
  // {code} → click tracking (attribution funnel, best-effort, always 200).
  if (typeof body.code === 'string' && !body.name) {
    const input = clickSchema.parse(body);
    await trackClick(db, input.code).catch(() => {});
    return NextResponse.json({ ok: true });
  }
  // …otherwise a partnership application (authenticated or guest).
  const auth = await optionalAuth(db);
  const input = creatorApplicationSchema.parse(body);
  const application = await submitApplication(db, auth?.userId, input);
  return NextResponse.json({ application }, { status: 201 });
});
