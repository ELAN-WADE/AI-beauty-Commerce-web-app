import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { api, Errors, readJson } from '@/lib/errors';
import { requirePerm } from '@/lib/admin';
import { portalCatalogue, portalProductSchema, savePortalProduct } from '@/modules/catalog/portal';
import { revalidateStorefront } from '@/lib/storefront-revalidate';

export const GET = api(async () => {
  const db = getDb(); await requirePerm(db, 'products:write');
  return NextResponse.json(await portalCatalogue(db), { headers: { 'Cache-Control': 'no-store' } });
});
export const POST = api(async ({ req }) => {
  const db = getDb(); const actor = await requirePerm(db, 'products:write');
  const key = req.headers.get('Idempotency-Key');
  if (!key || key.length < 8 || key.length > 128) throw Errors.badRequest('Idempotency-Key is required.');
  const result = await savePortalProduct(db, actor.userId, portalProductSchema.parse(await readJson(req, 65536)), key);
  revalidateStorefront(result.slug);
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
});
