import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { optionalAuth } from '@/modules/auth/require-auth';
import { listDistributors, submitApplication } from '@/modules/distributors/service';
import { distributorApplicationSchema, distributorQuerySchema } from '@/modules/distributors/validation';

export const GET = api(async ({ req }) => {
  const rl = checkRateLimit(`catalog:${clientIp(req)}`, Limits.catalog);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const q = distributorQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return NextResponse.json({ distributors: await listDistributors(getDb(), q) });
});

export const POST = api(async ({ req }) => {
  if (!(await checkSharedRateLimit(getDb(), `distributor-write:${clientIp(req)}`, { limit: 5, windowMs: 3600_000 })).allowed) throw Errors.rateLimited(60);
  const db = getDb();
  const auth = await optionalAuth(db);
  const input = distributorApplicationSchema.parse(await readJson(req));
  const application = await submitApplication(db, auth?.userId, input);
  return NextResponse.json({ application }, { status: 201 });
});
