import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { listBrands } from '@/modules/catalog/service';

export const GET = api(async ({ req }) => {
  const rl = checkRateLimit(`catalog:${clientIp(req)}`, Limits.catalog);
  if (!rl.allowed) throw Errors.rateLimited(60);
  return NextResponse.json({ brands: await listBrands(getDb()) });
});
