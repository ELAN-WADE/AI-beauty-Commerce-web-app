import { eq } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { orders } from '../orders/schema';
import { paymentAttempts } from './schema';

/**
 * Lookup-only recovery handle for the provider return: the order behind a
 * payment reference. The reference is a per-transaction secret already
 * exposed to this shopper's browser (?pay=), so echoing the order number
 * back grants nothing new — it just survives token/storage loss.
 */
export async function lookupReturnOrder(
  db: Db,
  reference: string,
): Promise<{ orderId: string; orderNumber: string } | null> {
  const rows = await db
    .select({ orderId: paymentAttempts.orderId, orderNumber: orders.orderNumber })
    .from(paymentAttempts)
    .innerJoin(orders, eq(orders.id, paymentAttempts.orderId))
    .where(eq(paymentAttempts.reference, reference))
    .limit(1);
  return rows[0] ?? null;
}

export interface ReturnTarget {
  reference: string;
  provider: string;
  settled: boolean;
  orderNumber?: string | null;
}

/** Browser landing: ?pay= is lookup-only, ?pending=1 means verify-later. */
export function returnRedirectUrl(base: URL, target: ReturnTarget): string {
  const url = new URL(base);
  url.searchParams.set('pay', target.reference);
  url.searchParams.set('provider', target.provider);
  if (target.orderNumber) url.searchParams.set('order', target.orderNumber);
  if (!target.settled) url.searchParams.set('pending', '1');
  return url.toString();
}

export function returnErrorUrl(base: URL, code: 'missing-reference' | 'invalid-return'): string {
  const url = new URL(base);
  url.searchParams.set('pay_error', code);
  return url.toString();
}
