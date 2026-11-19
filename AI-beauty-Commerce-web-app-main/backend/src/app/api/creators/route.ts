import { requirePartnerPolicy } from '@/modules/partners/policy';
import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { requireAuth } from '@/modules/auth/require-auth';
import { listCreators, submitApplication, trackClick, validateCode } from '@/modules/creators/service';
import { clickSchema, creatorApplicationSchema, creatorCodeQuery } from '@/modules/creators/validation';
import { getStorefrontCacheVersion } from '@/lib/storefront-revalidate';

const creatorsMem = globalThis as typeof globalThis & {
  __deslaCreatorsCache?: { version: number; expiresAt: number; data: unknown };
};

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
  const now = Date.now();
  const ver = getStorefrontCacheVersion();
  const hit = creatorsMem.__deslaCreatorsCache;
  if (hit && hit.version === ver && hit.expiresAt > now) {
    return NextResponse.json({ creators: hit.data });
  }
  const creators = await listCreators(getDb());
  creatorsMem.__deslaCreatorsCache = { version: ver, expiresAt: now + 30_000, data: creators };
  return NextResponse.json({ creators });
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
  const auth = await requireAuth(db);
  const input = creatorApplicationSchema.parse(body);
  await requirePartnerPolicy(db, auth.userId, 'CREATOR');
  const application = await submitApplication(db, auth.userId, input);
  return NextResponse.json({ application }, { status: 201 });
});
