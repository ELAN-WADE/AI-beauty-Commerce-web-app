import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { toErrorResponse } from '@/lib/errors';
import { listApprovedBySlug } from '@/modules/reviews/service';

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const { slug } = await params;
    const limit = z.coerce.number().int().min(1).default(20).transform((v) => Math.min(v, 50)).parse(new URL(req.url).searchParams.get('limit'));
    const res = NextResponse.json({ reviews: await listApprovedBySlug(getDb(), slug, limit) });
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
