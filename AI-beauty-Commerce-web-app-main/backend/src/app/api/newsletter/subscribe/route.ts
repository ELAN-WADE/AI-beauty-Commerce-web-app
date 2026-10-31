import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { api, clientIp, Errors, readJson } from '@/lib/errors';
import { checkSharedRateLimit } from '@/lib/rate-limit';
import { newsletterHash, subscribeNewsletter } from '@/modules/newsletter/service';

export const POST = api(async ({ req }) => {
  const input = z.object({ email: z.string().trim().email().max(254), consent: z.literal(true), source: z.enum(['website', 'home']).default('website'), company: z.string().max(200).optional() }).strict().parse(await readJson(req, 2048));
  const db = getDb();
  const limit = await checkSharedRateLimit(db, `newsletter:${clientIp(req)}`, { limit: 10, windowMs: 900000 });
  if (!limit.allowed) throw Errors.rateLimited(Math.ceil(limit.retryAfterMs / 1000));
  if (!input.company) {
    const recipient = await checkSharedRateLimit(db, `newsletter-email:${newsletterHash(input.email.toLowerCase())}`, { limit: 3, windowMs: 3600000 });
    if (recipient.allowed) await subscribeNewsletter(db, input);
  }
  return NextResponse.json({ accepted: true, message: 'If your address needs confirmation, an invitation will arrive shortly. Please check your inbox.' }, { status: 202, headers: { 'Cache-Control': 'no-store' } });
});
