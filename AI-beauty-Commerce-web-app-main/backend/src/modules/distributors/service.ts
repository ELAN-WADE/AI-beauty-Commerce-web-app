import { and, asc, desc, eq, ilike } from 'drizzle-orm';
import type { AppDb, Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { productVariants } from '../catalog/schema';
import { distributorApplications, distributorStock, distributors } from './schema';
import type { distributorApplicationSchema } from './validation';
import type { z } from 'zod';

type ApplicationInput = z.infer<typeof distributorApplicationSchema>;

export async function listDistributors(db: Db, filter: { city?: string; verified?: 'true' | 'false'; limit: number }) {
  const conds = [];
  if (filter.city) conds.push(ilike(distributors.city, filter.city));
  if (filter.verified !== undefined) conds.push(eq(distributors.verified, filter.verified === 'true'));
  else conds.push(eq(distributors.verified, true)); // public directory lists verified only
  return db
    .select()
    .from(distributors)
    .where(and(...conds))
    .orderBy(desc(distributors.rating), asc(distributors.name))
    .limit(filter.limit);
}

export async function getDistributor(db: Db, id: string) {
  const rows = await db.select().from(distributors).where(eq(distributors.id, id)).limit(1);
  if (!rows[0] || !rows[0].verified) throw Errors.notFound('Distributor not found.');
  const stock = await db.select().from(distributorStock).where(eq(distributorStock.distributorId, id)).limit(200);
  return { ...rows[0], stock };
}

/** "In stock near you": verified distributors in a city holding a variant. */
export async function stockNearCity(db: Db, variantId: string, city: string) {
  const rows = await db
    .select({
      distributorId: distributors.id,
      name: distributors.name,
      businessName: distributors.businessName,
      city: distributors.city,
      address: distributors.address,
      phone: distributors.phone,
      pickupAvailable: distributors.pickupAvailable,
      quantity: distributorStock.quantity,
    })
    .from(distributorStock)
    .innerJoin(distributors, eq(distributorStock.distributorId, distributors.id))
    .where(
      and(
        eq(distributorStock.variantId, variantId),
        ilike(distributors.city, city),
        eq(distributorStock.available, true),
        eq(distributors.verified, true),
      ),
    )
    .orderBy(desc(distributorStock.quantity))
    .limit(20);
  return rows.filter((r) => r.quantity > 0);
}

export async function submitApplication(db: AppDb, userId: string | undefined, input: ApplicationInput) {
  const [row] = await db.insert(distributorApplications).values({ ...input, userId: userId ?? null }).returning();
  return row;
}

export async function listApplications(db: AppDb, status?: string) {
  return db
    .select()
    .from(distributorApplications)
    .where(status ? eq(distributorApplications.status, status) : undefined)
    .orderBy(desc(distributorApplications.createdAt))
    .limit(100);
}

export async function reviewApplication(db: AppDb, input: { applicationId: string; adminId: string; approve: boolean; note: string }) {
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(distributorApplications).where(eq(distributorApplications.id, input.applicationId)).for('update').limit(1);
    const app = rows[0];
    if (!app) throw Errors.notFound('Application not found.');
    if (app.status !== 'pending') throw Errors.conflict('Application already reviewed.');
    let distributorId: string | null = null;
    if (input.approve) {
      const [d] = await tx
        .insert(distributors)
        .values({
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
    }
    await tx
      .update(distributorApplications)
      .set({ status: input.approve ? 'approved' : 'rejected', reviewedBy: input.adminId, reviewNote: input.note, updatedAt: new Date() })
      .where(eq(distributorApplications.id, app.id));
    return { applicationId: app.id, status: input.approve ? 'approved' : 'rejected', distributorId };
  });
}

export async function setStock(db: AppDb, input: { distributorId: string; variantId: string; quantity: number; available: boolean }) {
  const d = await db.select({ id: distributors.id }).from(distributors).where(eq(distributors.id, input.distributorId)).limit(1);
  if (!d[0]) throw Errors.notFound('Distributor not found.');
  const v = await db.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.id, input.variantId)).limit(1);
  if (!v[0]) throw Errors.notFound('Variant not found.');
  const [row] = await db
    .insert(distributorStock)
    .values(input)
    .onConflictDoUpdate({ target: [distributorStock.distributorId, distributorStock.variantId], set: { quantity: input.quantity, available: input.available, updatedAt: new Date() } })
    .returning();
  return row;
}
