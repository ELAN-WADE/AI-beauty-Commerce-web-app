import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { listProducts } from '@/modules/catalog/service';
import { productQuerySchema } from '@/modules/catalog/validation';

export const GET = api(async ({ req }) => {
  const rl = checkRateLimit(`client:${clientIp(req)}`, Limits.catalog);
  if (!rl.allowed) throw Errors.rateLimited(60);
  const query = productQuerySchema.parse(Object.fromEntries(new URL(req.url).searchParams));
  const res = NextResponse.json(await listProducts(getDb(), query));
  // Phase 2 low-bandwidth: catalogue list is public and ISR-seeded, so edge
  // caching is safe here. 60s fresh + 5min stale-while-revalidate keeps repeat
  // browsing cheap on slow networks. Stock-critical accuracy is protected
  // downstream: checkout re-verifies against row-locked inventory, and admin
  // writes revalidate the ISR pages on demand. Detail/checkout routes stay
  // uncached (buy-box must never lag).
  res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return res;
});
