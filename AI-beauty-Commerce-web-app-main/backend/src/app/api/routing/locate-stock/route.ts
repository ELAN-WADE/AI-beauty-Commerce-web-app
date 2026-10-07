import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { locateStock, stockRequestSchema } from '@/modules/routing/service';
export const POST = api(async ({ req }) => {
  if (!checkRateLimit(`routing:${clientIp(req)}`, Limits.catalog).allowed) throw Errors.rateLimited(60);
  return NextResponse.json(await locateStock(getDb(), stockRequestSchema.parse(await readJson(req))));
});
