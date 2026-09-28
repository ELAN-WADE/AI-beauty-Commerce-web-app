import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { listProducts } from '@/modules/catalog/service';
import { productQuerySchema } from '@/modules/catalog/validation';

export const GET = api(async ({ req }) => {
  const rl = checkRateLimit(`catalog:${clientIp(req)}`, Limits.catalog);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const query = productQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return NextResponse.json(await listProducts(getDb(), query));
});
