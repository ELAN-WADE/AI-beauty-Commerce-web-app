import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { api, Errors, readJson } from '@/lib/errors';
import { confirmNewsletter, unsubscribeNewsletter } from '@/modules/newsletter/service';

// Explicit POST protects confirmation from email-link preview scanners.
export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  return api(async ({ req }) => {
    const { action } = await params;
    if (!['confirm', 'unsubscribe'].includes(action)) throw Errors.notFound();
    const { token } = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }).strict().parse(await readJson(req, 1024));
    if (action === 'confirm') await confirmNewsletter(getDb(), token);
    else await unsubscribeNewsletter(getDb(), token);
    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  })(req);
}
