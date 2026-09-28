import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { stockNearCity } from '@/modules/distributors/service';
import { stockLookupSchema } from '@/modules/distributors/validation';

/** "In stock near you": verified distributors in a city holding a variant. */
export const GET = api(async ({ req }) => {
  const rl = checkRateLimit(`catalog:${clientIp(req)}`, Limits.catalog);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const q = stockLookupSchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  return NextResponse.json({ stock: await stockNearCity(getDb(), q.variantId, q.city) });
});
