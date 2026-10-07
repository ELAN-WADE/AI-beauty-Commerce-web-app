import { and, asc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { distributors } from '../distributors/schema';
import { HQ_LOCATION_ID, inventoryLocations, stockLevels } from '../inventory/schema';
import { productVariants, products } from '../catalog/schema';
import { feeFor } from '../shipping/service';

export const stockRequestSchema = z.object({
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  method: z.enum(['DELIVERY', 'PICKUP']).default('DELIVERY'),
  items: z.array(z.object({ variantId: z.string().uuid(), qty: z.number().int().min(1).max(99) }).strict()).min(1).max(100),
}).strict();
export type StockRequest = z.infer<typeof stockRequestSchema>;
export const normalisePlace = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/ state$/, '');

export function aggregateLines(items: StockRequest['items']) {
  const quantities = new Map<string, number>();
  for (const i of items) quantities.set(i.variantId, (quantities.get(i.variantId) ?? 0) + i.qty);
  return [...quantities].sort(([a], [b]) => a.localeCompare(b)).map(([variantId, qty]) => ({ variantId, qty }));
}

export async function locateStock(db: Db, input: StockRequest) {
  const items = aggregateLines(input.items);
  const variants = await db.select({ id: productVariants.id }).from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(and(inArray(productVariants.id, items.map(i => i.variantId)), eq(productVariants.isActive, true), eq(products.isActive, true)));
  if (variants.length !== items.length) throw Errors.badRequest('One or more products are unavailable.');
  const locations = await db.select({ location: inventoryLocations, verified: distributors.verified, owner: distributors.userId })
    .from(inventoryLocations).leftJoin(distributors, eq(distributors.id, inventoryLocations.distributorId))
    .where(eq(inventoryLocations.isActive, true)).orderBy(asc(inventoryLocations.code)).limit(200);
  const stock = await db.select().from(stockLevels).where(and(eq(stockLevels.pool, 'PLATFORM'), inArray(stockLevels.variantId, items.map(i => i.variantId))));
  const zone = await feeFor(db, input);
  const options = locations.filter(({ location: l, verified, owner }) => {
    if (l.distributorId && (!verified || !owner)) return false;
    const local = normalisePlace(l.city) === normalisePlace(input.city) && normalisePlace(l.state) === normalisePlace(input.state);
    if (!local && (input.method === 'PICKUP' || l.id !== HQ_LOCATION_ID)) return false;
    if (input.method === 'PICKUP' ? !l.pickupEnabled : !l.deliveryEnabled) return false;
    return items.every(i => stock.some(s => s.locationId === l.id && s.variantId === i.variantId && s.onHand - s.reserved >= i.qty));
  }).map(({ location: l }) => ({
    locationId: l.id, name: l.name, city: l.city, state: l.state, address: l.address,
    phone: l.phone, operatingHours: l.operatingHours, method: input.method,
    feeKobo: input.method === 'PICKUP' ? 0 : l.deliveryFeeKobo ?? zone.feeKobo,
    etaText: input.method === 'PICKUP' ? 'We will notify you when your order is ready to collect.' : l.etaText,
    isLocal: normalisePlace(l.city) === normalisePlace(input.city) && normalisePlace(l.state) === normalisePlace(input.state),
  })).sort((a, b) => Number(b.isLocal) - Number(a.isLocal) || a.feeKobo - b.feeKobo || a.locationId.localeCompare(b.locationId));
  return { options, recommendedLocationId: options[0]?.locationId ?? null, hasFullCart: options.length > 0 };
}
