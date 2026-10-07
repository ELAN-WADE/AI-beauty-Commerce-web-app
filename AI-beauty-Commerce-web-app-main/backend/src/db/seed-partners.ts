import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { getDb } from './client';
import { distributors, distributorStock } from '../modules/distributors/schema';
import { inventoryLocations, stockLevels } from '../modules/inventory/schema';
import { creators } from '../modules/creators/schema';
import { products, productVariants } from '../modules/catalog/schema';
// @ts-ignore - frontend mock modules (relative to backend/src/db/)
// eslint-disable-next-line
import { distributors as mockDistributors } from '../../../src/data/distributors';
// @ts-ignore
import { creators as mockCreators } from '../../../src/data/creators';
// @ts-ignore
import { products as mockProducts } from '../../../src/data/products';

interface MockDistributor {
  name: string;
  businessName: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  whatsapp: string;
  verified: boolean;
  tier: 'Bronze' | 'Silver' | 'Gold';
  isOnlineOnly: boolean;
  pickupAvailable: boolean;
  operatingHours: string;
  rating: number;
}

interface MockCreator {
  name: string;
  handle: string;
  platform: 'Instagram' | 'TikTok' | 'YouTube';
  niche: string;
  avatar: string;
  promoCode: string;
  discountPercent: number;
  commissionRate: number;
  totalSalesNgn: number;
  commissionEarnedNgn: number;
  clicks: number;
  ordersCount: number;
  verified: boolean;
}

async function main() {
  const db = getDb();
  let newDistributors = 0;
  const distIdByCity = new Map<string, string[]>();

  for (const d of mockDistributors as MockDistributor[]) {
    const existing = await db
      .select({ id: distributors.id })
      .from(distributors)
      .where(eq(distributors.name, d.name))
      .limit(1);
    let id = existing[0]?.id;
    if (!id) {
      const [row] = await db
        .insert(distributors)
        .values({
          name: d.name,
          businessName: d.businessName,
          city: d.city,
          state: d.state,
          address: d.address,
          phone: d.phone,
          whatsapp: d.whatsapp,
          verified: d.verified,
          tier: d.tier,
          isOnlineOnly: d.isOnlineOnly,
          pickupAvailable: d.pickupAvailable,
          operatingHours: d.operatingHours,
          rating: String(d.rating),
        })
        .returning({ id: distributors.id });
      id = row.id;
      newDistributors += 1;
    }
    const list = distIdByCity.get(d.city.toLowerCase()) ?? [];
    list.push(id);
    distIdByCity.set(d.city.toLowerCase(), list);
  }

  // City stock: frontend product.distributorStock → location-scoped ledger rows
  // (plus the legacy distributor_stock table, retained as migration history).
  let stockRows = 0;
  for (const p of mockProducts as { id: string; distributorStock?: { city: string; available: boolean; quantity: number }[] }[]) {
    const prod = await db.select({ id: products.id }).from(products).where(eq(products.slug, p.id.toLowerCase())).limit(1);
    if (!prod[0]) continue;
    const variants = await db.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.productId, prod[0].id));
    if (variants.length === 0) continue;
    for (const s of p.distributorStock ?? []) {
      if (!s.available || s.quantity <= 0) continue;
      const distIds = distIdByCity.get(s.city.toLowerCase()) ?? [];
      const perVariant = Math.floor(s.quantity / variants.length);
      for (const distId of distIds) {
        const [dist] = await db.select().from(distributors).where(eq(distributors.id, distId)).limit(1);
        const existing = await db.select().from(inventoryLocations).where(eq(inventoryLocations.distributorId, distId)).limit(1);
        let location = existing[0];
        if (!location && dist) {
          const inserted = await db.insert(inventoryLocations).values({
            code: `DIST-${distId.slice(0, 8).toUpperCase()}`,
            name: dist.businessName || dist.name,
            type: 'DISTRIBUTOR',
            distributorId: distId,
            city: dist.city,
            state: dist.state,
            address: dist.address,
            phone: dist.phone,
            operatingHours: dist.operatingHours,
            deliveryEnabled: true,
            pickupEnabled: dist.pickupAvailable,
            etaText: 'Delivery estimate confirmed with your order.',
            isActive: false,
          }).onConflictDoNothing().returning();
          location = inserted[0] ?? (await db.select().from(inventoryLocations).where(eq(inventoryLocations.distributorId, distId)).limit(1))[0];
        }
        for (const [i, v] of variants.entries()) {
          const qty = perVariant + (i === 0 ? s.quantity - perVariant * variants.length : 0);
          if (qty <= 0 || !location) continue;
          await db.insert(distributorStock).values({ distributorId: distId, variantId: v.id, quantity: qty }).onConflictDoNothing();
          await db.insert(stockLevels).values({ locationId: location.id, variantId: v.id, onHand: qty }).onConflictDoNothing();
          stockRows += 1;
        }
      }
    }
  }

  let newCreators = 0;
  for (const c of mockCreators as MockCreator[]) {
    const [row] = await db
      .insert(creators)
      .values({
        name: c.name,
        handle: c.handle,
        platform: c.platform,
        niche: c.niche,
        avatarUrl: c.avatar,
        promoCode: c.promoCode.toUpperCase(),
        discountPercent: c.discountPercent,
        commissionRate: c.commissionRate,
        totalSalesKobo: Math.round(c.totalSalesNgn * 100),
        commissionEarnedKobo: Math.round(c.commissionEarnedNgn * 100),
        clicks: c.clicks,
        ordersCount: c.ordersCount,
        verified: c.verified,
      })
      .onConflictDoNothing()
      .returning({ id: creators.id });
    if (row) newCreators += 1;
  }

  console.log(`partners seed: ${newDistributors} new distributors, ~${stockRows} stock rows, ${newCreators} new creators (idempotent)`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
