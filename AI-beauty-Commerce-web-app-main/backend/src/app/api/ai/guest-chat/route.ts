import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { api, ApiError, clientIp, Errors, readJson } from '@/lib/errors';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { BulkheadLimits, tryAcquire } from '@/lib/bulkhead';
import { getAiProvider } from '@/lib/ai-provider';
import { groundProducts } from '@/modules/ai/service';

export async function GET() {
  let available = false;
  try { available = getAiProvider().name === 'gemini'; } catch { /* No configured provider. */ }
  return NextResponse.json({ available }, { headers: { 'Cache-Control': 'no-store' } });
}

const inputSchema = z.object({ content: z.string().trim().min(1).max(2000) }).strict();
export const POST = api(async ({ req }) => {
  const db = getDb();
  if (!(await checkSharedRateLimit(db, 'guest-concierge:' + clientIp(req), Limits.ai)).allowed) throw Errors.rateLimited(60);
  const input = inputSchema.parse(await readJson(req, 10000));
  const provider = getAiProvider();
  if (provider.name !== 'gemini') throw new ApiError(503, 'assistant_unavailable', 'The assistant is temporarily unavailable. You can still explore the catalogue.', true);
  const release = tryAcquire('guest-concierge', BulkheadLimits.ai());
  if (!release) throw Errors.rateLimited(30);
  try {
    const catalogue = await groundProducts(db, input.content);
    const text = await provider.chat({ history: [{ role: 'user', content: input.content }], catalog: catalogue });
    const recommendedProductIds = catalogue.filter(product => text.toLowerCase().includes(product.name.toLowerCase())).map(product => product.slug);
    return NextResponse.json({ text, recommendedProductIds, provider: 'gemini' }, { headers: { 'Cache-Control': 'private, no-store' } });
  } finally { release(); }
});
