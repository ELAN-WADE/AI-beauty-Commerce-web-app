import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { reviewApplication, submitApplication } from '@/modules/distributors/service';
import { issuePickupCode, partnerOrderAction } from '@/modules/partners/service';
let client: PGlite; let db: ReturnType<typeof drizzle<typeof schema>>;
let distributor: string; let other: string; let customer: string; let partnerId: string; let locationId: string;
beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto'); const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } }); db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: './drizzle' });
  await db.insert(schema.roles).values({ id: 'DISTRIBUTOR' }).onConflictDoNothing();
  const accounts = await db.insert(schema.users).values(['partner', 'other', 'customer', 'reviewer'].map(name => ({ email: `${name}@journey.example`, passwordHash: 'test-fixture-only', emailVerifiedAt: new Date() }))).returning();
  distributor = accounts[0].id; other = accounts[1].id; customer = accounts[2].id;
  for (const id of [distributor, other]) {
    const app = await submitApplication(db as never, id, { name: 'Submitted applicant', businessName: 'Submitted business', city: 'Lagos', state: 'Lagos', address: 'Submitted address', phone: '+2348000000000', whatsapp: '' });
    const approved = await reviewApplication(db as never, { applicationId: app.id, adminId: accounts[3].id, approve: true, note: 'Reviewed application.' });
    if (id === distributor) partnerId = approved.distributorId!;
  }
  const [location] = await db.select().from(schema.inventoryLocations).where(eq(schema.inventoryLocations.distributorId, partnerId)); locationId = location.id;
}, 120000);
afterAll(async () => { await client?.close(); });
async function paidOrder(method: 'PICKUP' | 'DELIVERY') {
  const [order] = await db.insert(schema.orders).values({ orderNumber: `DES-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, idempotencyKey: crypto.randomUUID(), userId: customer, distributorId: partnerId, fulfilmentLocationId: locationId, fulfilmentMethod: method, status: 'PAID', paymentStatus: 'PAID', shippingAddress: { fullName: 'Saved recipient', city: 'Lagos' } }).returning();
  return order;
}
describe('approved distributor through customer handoff', () => {
  it('requires acceptance and readiness, issues six digits to the owner, and completes pickup only with that code', async () => {
    const order = await paidOrder('PICKUP');
    await expect(issuePickupCode(db as never, order.id, { userId: customer })).rejects.toMatchObject({ status: 409 });
    await expect(partnerOrderAction(db as never, other, order.id, 'ACCEPT')).rejects.toMatchObject({ status: 404 });
    await partnerOrderAction(db as never, distributor, order.id, 'ACCEPT');
    await expect(partnerOrderAction(db as never, distributor, order.id, 'DISPATCH')).rejects.toMatchObject({ status: 400 });
    await partnerOrderAction(db as never, distributor, order.id, 'READY_PICKUP');
    await expect(issuePickupCode(db as never, order.id, { userId: other })).rejects.toMatchObject({ status: 404 });
    const code = await issuePickupCode(db as never, order.id, { userId: customer }); expect(code.code).toMatch(/^\d{6}$/);
    await expect(partnerOrderAction(db as never, distributor, order.id, 'CONFIRM_PICKUP', code.code === '000000' ? '111111' : '000000')).rejects.toMatchObject({ status: 400 });
    expect((await db.select().from(schema.orders).where(eq(schema.orders.id, order.id)))[0].pickupCodeAttempts).toBe(1);
    expect((await partnerOrderAction(db as never, distributor, order.id, 'CONFIRM_PICKUP', code.code))?.status).toBe('DELIVERED');
    expect((await partnerOrderAction(db as never, distributor, order.id, 'CONFIRM_PICKUP', code.code))?.status).toBe('DELIVERED');
  });
  it('keeps delivery separate from pickup and requires entered handoff evidence', async () => {
    const order = await paidOrder('DELIVERY');
    await partnerOrderAction(db as never, distributor, order.id, 'ACCEPT');
    await expect(partnerOrderAction(db as never, distributor, order.id, 'READY_PICKUP')).rejects.toMatchObject({ status: 400 });
    await partnerOrderAction(db as never, distributor, order.id, 'DISPATCH');
    await expect(partnerOrderAction(db as never, distributor, order.id, 'COMPLETE_DELIVERY', undefined, '')).rejects.toMatchObject({ status: 400 });
    expect((await partnerOrderAction(db as never, distributor, order.id, 'COMPLETE_DELIVERY', undefined, 'Handed to the named recipient with delivery receipt.'))?.status).toBe('DELIVERED');
  });
  it('never permits fulfilment of an unpaid order', async () => {
    const order = await paidOrder('DELIVERY');
    await db.update(schema.orders).set({ status: 'PENDING', paymentStatus: 'UNPAID' }).where(eq(schema.orders.id, order.id));
    await expect(partnerOrderAction(db as never, distributor, order.id, 'ACCEPT')).rejects.toMatchObject({ status: 409 });
  });
});
