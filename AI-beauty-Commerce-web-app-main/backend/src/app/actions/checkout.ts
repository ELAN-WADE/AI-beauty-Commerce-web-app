'use server';

/**
 * Phase 4 — checkout Server Action.
 * One RPC instead of POST /api/checkout: same zod validation, same shared
 * rate limit family, same idempotent `checkout()` service. On success the
 * purchased product pages revalidate (reserved stock changes availability).
 */
import { getDb } from '@/db/client';
import { checkSharedRateLimit, Limits } from '@/lib/rate-limit';
import { revalidateStorefront } from '@/lib/storefront-revalidate';
import { inArray } from 'drizzle-orm';
import { orderItems } from '@/modules/orders/schema';
import { productVariants, products } from '@/modules/catalog/schema';
import { eq } from 'drizzle-orm';
import {
  actionClientIp,
  resolveActionShopper,
  runCheckout,
  toActionFailure,
  type ActionResult,
  type CheckoutActionInput,
} from './_shared';

export async function checkoutAction(
  args: CheckoutActionInput,
  idempotencyKey: string,
): Promise<ActionResult<Awaited<ReturnType<typeof runCheckout>>>> {
  try {
    const db = getDb();
    const ip = await actionClientIp();
    const owner = await resolveActionShopper(db, args.sessionId);
    // Shared namespace with POST /api/checkout: one budget per shopper
    // regardless of transport (REST or Server Action).
    const rl = await checkSharedRateLimit(db, `checkout:${owner.userId ?? ip}`, Limits.checkoutInit);
    if (!rl.allowed) return { ok: false, status: 429, code: 'rate_limited', message: 'Too many checkouts. Wait a minute and try again.' };
    const result = await runCheckout(db, owner, args, idempotencyKey, ip);
    // Stock just moved (reservations): refresh the affected product pages plus
    // catalogue/home on next hit. Best-effort — never fails the order.
    try {
      const lines = await db
        .select({ slug: products.slug })
        .from(orderItems)
        .innerJoin(productVariants, eq(orderItems.variantId, productVariants.id))
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(
          inArray(
            orderItems.orderId,
            [result.order.id],
          ),
        );
      const slugs = [...new Set(lines.map((l) => l.slug))];
      revalidateStorefront();
      for (const slug of slugs) revalidateStorefront(slug);
    } catch {
      // freshness safety net (time-based revalidate) still applies
    }
    return { ok: true, data: result };
  } catch (err) {
    const f = toActionFailure(err);
    return { ok: false, ...f };
  }
}
