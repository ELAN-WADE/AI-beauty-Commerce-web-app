import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { clientIp, Errors, toErrorResponse } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { getProduct } from '@/modules/catalog/service';

// Hand-rolled dynamic handler (see me/addresses/[id] for why).
type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const rl = checkRateLimit(`catalog:${clientIp(req)}`, Limits.catalog);
    if (!rl.allowed) throw Errors.rateLimited(60);
    const { slug } = await params;
    const res = NextResponse.json(await getProduct(getDb(), slug));
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
