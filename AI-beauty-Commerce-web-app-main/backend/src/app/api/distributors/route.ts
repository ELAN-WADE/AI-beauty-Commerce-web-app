import { requirePartnerPolicy } from '@/modules/partners/policy';
import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { requireAuth } from '@/modules/auth/require-auth';
import { listDistributors, submitApplication } from '@/modules/distributors/service';
import { distributorApplicationSchema, distributorQuerySchema } from '@/modules/distributors/validation';
import { getStorefrontCacheVersion } from '@/lib/storefront-revalidate';

const distributorsMem = globalThis as typeof globalThis & {
  __deslaDistributorsCache?: Map<string, { version: number; expiresAt: number; data: unknown }>;
};

export const GET = api(async ({ req }) => {
  const rl = checkRateLimit(`catalog:${clientIp(req)}`, Limits.catalog);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const q = distributorQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const key = JSON.stringify(q);
  const now = Date.now();
  const ver = getStorefrontCacheVersion();
  const cacheMap = (distributorsMem.__deslaDistributorsCache ??= new Map());
  const hit = cacheMap.get(key);
  if (hit && hit.version === ver && hit.expiresAt > now) {
    return NextResponse.json({ distributors: hit.data });
  }
  const distributors = await listDistributors(getDb(), q);
  cacheMap.set(key, { version: ver, expiresAt: now + 30_000, data: distributors });
  return NextResponse.json({ distributors });
});

export const POST = api(async ({ req }) => {
  if (!(await checkSharedRateLimit(getDb(), `distributor-write:${clientIp(req)}`, { limit: 5, windowMs: 3600_000 })).allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const auth = await requireAuth(db);
  const input = distributorApplicationSchema.parse(await readJson(req));
  await requirePartnerPolicy(db, auth.userId, 'DISTRIBUTOR');
  const application = await submitApplication(db, auth.userId, input);
  return NextResponse.json({ application }, { status: 201 });
});
