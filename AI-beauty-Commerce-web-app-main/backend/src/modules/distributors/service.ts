import { enqueuePartnerReviewEmail } from '../partners/email';
import { walletFor } from '../ledger/service';

import { getTableColumns, and, asc, desc, eq, ilike, inArray, sql } from 'drizzle-orm';

import type { AppDb, Db } from '../../db/client';

import { Errors } from '../../lib/errors';

import { products, productVariants } from '../catalog/schema';

import { userRoles, users } from '../auth/schema';

import { distributorApplications, distributors } from './schema';

import { inventoryLocations, stockLevels } from '../inventory/schema';

import { adjustStock } from '../inventory/service';

import type { distributorApplicationSchema } from './validation';

import type { z } from 'zod';



type ApplicationInput = z.infer<typeof distributorApplicationSchema>;



export async function listDistributors(db: Db, filter: { city?: string; verified?: 'true' | 'false'; limit: number }) {

  const conds = [];

  if (filter.city) conds.push(ilike(distributors.city, filter.city));

  conds.push(eq(distributors.verified, true));

  const rows = await db

    .select({ id: distributors.id, name: distributors.name, businessName: distributors.businessName, city: distributors.city, state: distributors.state,

      address: distributors.address, phone: distributors.phone, whatsapp: distributors.whatsapp, verified: distributors.verified, tier: distributors.tier,

      isOnlineOnly: distributors.isOnlineOnly, pickupAvailable: distributors.pickupAvailable, operatingHours: distributors.operatingHours, rating: distributors.rating, reviewsCount: distributors.reviewsCount,

      location: inventoryLocations })

    .from(distributors)

    .leftJoin(inventoryLocations, eq(inventoryLocations.distributorId, distributors.id))

    .where(and(...conds))

    .orderBy(desc(distributors.rating), asc(distributors.name))

    .limit(filter.limit);

  const ids = rows.filter(r => r.location?.isActive).map(r => r.location!.id);

  const stock = ids.length ? await db.select({ locationId: stockLevels.locationId, sku: productVariants.sku, productId: products.slug, name: products.name, size: productVariants.sizeLabel, available: sql<number>`${stockLevels.onHand} - ${stockLevels.reserved}` })

    .from(stockLevels).innerJoin(productVariants, eq(productVariants.id, stockLevels.variantId)).innerJoin(products, eq(products.id, productVariants.productId))

    .where(and(inArray(stockLevels.locationId, ids), eq(stockLevels.pool, 'PLATFORM'), eq(productVariants.isActive, true), eq(products.isActive, true), sql`${stockLevels.onHand} > ${stockLevels.reserved}`)) : [];

  return rows.map(({ location, ...partner }) => ({ ...partner, location: location?.isActive ? { id: location.id, name: location.name, city: location.city, state: location.state, address: location.address, pickupEnabled: location.pickupEnabled, deliveryEnabled: location.deliveryEnabled, etaText: location.etaText } : null,

    stockedSkus: stock.filter(s => s.locationId === location?.id).map(s => s.sku), stock: stock.filter(s => s.locationId === location?.id) }));

}



export async function getDistributor(db: Db, id: string) {

  const rows = await db.select().from(distributors).where(eq(distributors.id, id)).limit(1);

  if (!rows[0] || !rows[0].verified) throw Errors.notFound('Distributor not found.');

  const [location] = await db.select().from(inventoryLocations).where(eq(inventoryLocations.distributorId, id)).limit(1);

  const stock = location

    ? await db.select({ variantId: stockLevels.variantId, quantity: stockLevels.onHand, reserved: stockLevels.reserved }).from(stockLevels).where(and(eq(stockLevels.locationId, location.id), eq(stockLevels.pool, 'PLATFORM'))).limit(200)

    : [];

  return { ...rows[0], location, stock };

}



/**

 * "In stock near you": active locations in a city with available units.

 * Reads the authoritative location-scoped ledger (not the legacy orphan table).

 */

export async function stockNearCity(db: Db, variantId: string, city: string) {

  const rows = await db

    .select({

      distributorId: distributors.id,

      name: distributors.name,

      businessName: distributors.businessName,

      city: inventoryLocations.city,

      address: inventoryLocations.address,

      phone: inventoryLocations.phone,

      pickupAvailable: inventoryLocations.pickupEnabled,

      quantity: sql<number>`${stockLevels.onHand} - ${stockLevels.reserved}`,

    })

    .from(stockLevels)

    .innerJoin(inventoryLocations, eq(stockLevels.locationId, inventoryLocations.id))

    .leftJoin(distributors, eq(distributors.id, inventoryLocations.distributorId))

    .where(

      and(

        eq(stockLevels.variantId, variantId),

        eq(stockLevels.pool, 'PLATFORM'),

        ilike(inventoryLocations.city, city),

        eq(inventoryLocations.isActive, true),

      ),

    )

    .orderBy(desc(sql`${stockLevels.onHand} - ${stockLevels.reserved}`))

    .limit(20);

  return rows

    .filter((r) => r.quantity > 0)

    .map((r) => ({ ...r, name: r.name ?? 'Lagos Formulation Lab (HQ)', businessName: r.businessName ?? '' }));

}



export async function submitApplication(db: AppDb, userId: string | undefined, input: ApplicationInput) {

  if (!userId) throw Errors.unauthorized('Sign in before submitting a partner application.');

  return db.transaction(async tx => {

    const [account] = await tx.select().from(users).where(eq(users.id, userId)).for('update');

    if (!account?.emailVerifiedAt) throw Errors.forbidden('Verify your email before applying.');

    const [approved] = await tx.select({ id: distributors.id }).from(distributors).where(and(eq(distributors.userId, userId), eq(distributors.verified, true))).limit(1);

    if (approved) throw Errors.conflict('Your partner account is already approved. Refresh your session.');

    const [pending] = await tx.select().from(distributorApplications).where(and(eq(distributorApplications.userId, userId), eq(distributorApplications.status, 'pending'))).limit(1);

    if (pending) return pending;

    const [row] = await tx.insert(distributorApplications).values({ ...input, userId }).returning();

    return row;

  });

}



export async function listApplications(db: AppDb, status?: string) {

  return db

    .select({ ...getTableColumns(distributorApplications), email: users.email, emailVerifiedAt: users.emailVerifiedAt })

    .from(distributorApplications)

    .leftJoin(users, eq(users.id, distributorApplications.userId))

    .where(status ? eq(distributorApplications.status, status) : undefined)

    .orderBy(desc(distributorApplications.createdAt))

    .limit(100);

}



export async function reviewApplication(db: Db, input: { applicationId: string; adminId: string; approve: boolean; note: string }) {

  return db.transaction(async (tx) => {

    const rows = await tx.select().from(distributorApplications).where(eq(distributorApplications.id, input.applicationId)).for('update').limit(1);

    const app = rows[0];

    if (!app) throw Errors.notFound('Application not found.');

    if (app.userId && app.userId === input.adminId) throw Errors.forbidden('You cannot review your own application.');

    if (app.status !== 'pending') throw Errors.conflict('Application already reviewed.');

    let distributorId: string | null = null;

    if (input.approve) {

      if (!app.userId) throw Errors.conflict('This request has no linked account. The applicant must sign in and submit a new application.');

      const [account] = await tx.select().from(users).where(eq(users.id, app.userId)).for('update');

      if (!account?.emailVerifiedAt) throw Errors.conflict('The applicant must verify their email before approval.');

      const [existing] = await tx.select({ id: distributors.id }).from(distributors).where(eq(distributors.userId, app.userId)).limit(1);

      if (existing) throw Errors.conflict('A partner profile already exists for this account.');

      const [d] = await tx

        .insert(distributors)

        .values({

          userId: app.userId,

          name: app.name,

          businessName: app.businessName,

          city: app.city,

          state: app.state,

          address: app.address,

          phone: app.phone,

          whatsapp: app.whatsapp,

          verified: true,

          tier: 'Bronze',

        })

        .returning({ id: distributors.id });

      distributorId = d.id;

      if (app.userId) {

        await tx.insert(userRoles).values({ userId: app.userId, roleId: 'DISTRIBUTOR', grantedBy: input.adminId }).onConflictDoNothing();

        await walletFor(tx, 'DISTRIBUTOR', d.id, app.userId);

      }

      await tx.insert(inventoryLocations).values({

        code: `DIST-${d.id.slice(0, 8)}`,

        name: app.businessName || app.name,

        type: 'DISTRIBUTOR',

        distributorId: d.id,

        city: app.city,

        state: app.state || app.city,

        address: app.address,

        phone: app.phone,

        isActive: true,

        pickupEnabled: true,

        deliveryEnabled: true,

      });

    }

    await tx

      .update(distributorApplications)

      .set({ status: input.approve ? 'approved' : 'rejected', reviewedBy: input.adminId, reviewNote: input.note, updatedAt: new Date() })

      .where(eq(distributorApplications.id, app.id));

    await enqueuePartnerReviewEmail(tx, { userId: app.userId, kind: 'DISTRIBUTOR', applicationId: app.id, approved: input.approve });
    return { applicationId: app.id, status: input.approve ? 'approved' : 'rejected', distributorId };

  });

}



export async function setStock(db: AppDb, input: { distributorId: string; variantId: string; quantity: number; available: boolean }) {

  const [location] = await db.select().from(inventoryLocations).where(eq(inventoryLocations.distributorId, input.distributorId)).limit(1);

  if (!location) throw Errors.notFound('Distributor location not configured yet.');

  const v = await db.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.id, input.variantId)).limit(1);

  if (!v[0]) throw Errors.notFound('Variant not found.');

  const target = input.available ? input.quantity : 0;

  const [current] = await db.select().from(stockLevels).where(and(eq(stockLevels.locationId, location.id), eq(stockLevels.variantId, input.variantId), eq(stockLevels.pool, 'PLATFORM'))).limit(1);

  const delta = target - (current?.onHand ?? 0);

  if (delta !== 0) await adjustStock(db, { locationId: location.id, variantId: input.variantId, delta, reason: 'admin.set', refType: 'admin' });

  return { locationId: location.id, variantId: input.variantId, quantity: target };

}





export async function applicationCounts(db: Db) {

  const [counts] = await db.select({

    pending: sql<number>`count(*) filter (where ${distributorApplications.status} = 'pending')::int`,

    approved: sql<number>`count(*) filter (where ${distributorApplications.status} = 'approved')::int`,

    rejected: sql<number>`count(*) filter (where ${distributorApplications.status} = 'rejected')::int`,

  }).from(distributorApplications);

  return counts;

}

