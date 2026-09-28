import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { clientIp, Errors, toErrorResponse } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { getDistributor } from '@/modules/distributors/service';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const rl = checkRateLimit(`catalog:${clientIp(req)}`, Limits.catalog);
    if (!rl.allowed) throw Errors.rateLimited(60);
    const { id } = await params;
    const res = NextResponse.json(await getDistributor(getDb(), id));
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
