import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { clientIp, Errors, readJson, toErrorResponse } from '@/lib/errors';
import { checkRateLimit, Limits } from '@/lib/rate-limit';
import { requireStaff } from '@/lib/admin';
import { audit } from '@/modules/audit/service';
import { getProduct, updateProduct } from '@/modules/catalog/service';
import { productUpdateSchema } from '@/modules/catalog/validation';
import { revalidateStorefront } from '@/lib/storefront-revalidate';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const rl = checkRateLimit(`admin:${clientIp(req)}`, Limits.admin);
    if (!rl.allowed) throw Errors.rateLimited(60);
    const { id } = await params;
    const db = getDb();
    const ctx = await requireStaff(db);
    const input = productUpdateSchema.parse(await readJson(req));
    const before = await getProduct(db, id).catch(() => null);
    const updated = await updateProduct(db, id, input);
    const after = await getProduct(db, id).catch(() => null);
    // Price changes get their own audit action (incident forensics, §24).
    const beforePrices = Object.fromEntries((before?.variants ?? []).map((v) => [v.sku, v.priceKobo]));
    const afterPrices = Object.fromEntries((after?.variants ?? []).map((v) => [v.sku, v.priceKobo]));
    const priceChanged = Object.keys(afterPrices).some((sku) => beforePrices[sku] !== afterPrices[sku]);
    await audit(db, {
      actorId: ctx.userId,
      action: priceChanged ? 'product.price_change' : 'product.update',
      entityType: 'product',
      entityId: id,
      before: priceChanged ? { prices: beforePrices } : { name: before?.name },
      after: priceChanged ? { prices: afterPrices } : { slug: updated.slug },
      ip: clientIp(req),
      requestId,
    });
    // Phase 2: product (possibly price) changed → refresh ISR pages on next hit.
    revalidateStorefront(updated.slug ?? after?.slug ?? before?.slug);
    const res = NextResponse.json(updated);
    res.headers.set('x-request-id', requestId);
    return res;
  } catch (err) {
    return toErrorResponse(err, requestId);
  }
}
