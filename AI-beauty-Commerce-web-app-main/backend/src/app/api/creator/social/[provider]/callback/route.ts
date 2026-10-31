import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { ApiError } from '@/lib/errors';
import { requireAuth } from '@/modules/auth/require-auth';
import { providerSchema } from '@/modules/social/provider';
import { completeSocial, socialCookie } from '@/modules/social/service';
export const runtime = 'nodejs';
const escape = (value: string) => value.replace(/[<>&"']/g, character => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[character]!));
export async function GET(req: Request, context: { params: Promise<{ provider: string }> }) {
  let success = false, message = 'The connection could not be completed. Return to your editor and try again.';
  const provider = providerSchema.safeParse((await context.params).provider);
  if (provider.success) {
    try {
      const db = getDb(), auth = await requireAuth(db), params = new URL(req.url).searchParams;
      const proof = (await cookies()).get(socialCookie(provider.data))?.value || '';
      const result = await completeSocial(db, auth, provider.data, params.get('state') || '', proof, params.get('error') ? undefined : params.get('code') || undefined);
      success = true;
      message = result.selectionRequired ? 'Authorization received. Return to your editor to choose an Instagram account.' : 'Your social account is connected. You can return to your editor.';
    } catch (error) { if (error instanceof ApiError) message = error.message; }
  }
  // Static HTML only: no tokens, codes, state, provider errors or remote scripts.
  const response = new NextResponse('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Desla creator connection</title><body><main><h1>Creator connection</h1><p>' + escape(message) + '</p><p>You can close this window.</p></main></body></html>', { status: success ? 200 : 400, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'", 'X-Robots-Tag': 'noindex' } });
  if (provider.success) response.cookies.set(socialCookie(provider.data), '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}
