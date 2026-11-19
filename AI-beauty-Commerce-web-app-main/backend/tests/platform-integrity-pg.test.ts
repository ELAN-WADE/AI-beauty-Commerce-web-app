import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { createSession, getSessionUser, hashPassword, revokeAllSessions } from '@/modules/auth/service';
import { submitApplication as submitCreator, markApplicationUnderReview as markCreatorUnderReview, reviewApplication as reviewCreator } from '@/modules/creators/service';
import { submitApplication as submitDistributor, markApplicationUnderReview as markDistributorUnderReview } from '@/modules/distributors/service';
import { enqueueNotification } from '@/modules/notifications/service';
import { processOutbox } from '@/worker/tasks';
import { BrevoSender } from '@/lib/email';
import { transitionOrder } from '@/modules/orders/service';
import { deleteAnalysis } from '@/modules/skin/service';

let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;
const pg = () => db as never;

beforeAll(async () => {
  vi.stubEnv('FRONTEND_URL', 'https://shop.deslabeauty.com');
  vi.stubEnv('EMAIL_TRANSPORT', 'brevo');
  vi.stubEnv('BREVO_API_KEY', 'test-brevo-key');
  vi.stubEnv('EMAIL_FROM', 'Desla Beauty <hello@deslabeauty.com>');
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } });
  db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: './drizzle' });
}, 120000);

afterAll(async () => {
  vi.unstubAllEnvs();
  await client?.close();
});

describe('Phase 5/6/7 platform integrity (emails, outbox tracking, admin session TTL/idle, scan deletion)', () => {
  it('enforces shorter ADMIN session TTL, idle timeout auto-revocation, and revoke-all', async () => {
    const hash = await hashPassword('StrongPass123!');
    const [admin] = await db.insert(schema.users).values({ email: 'ops-ttl@example.test', passwordHash: hash, emailVerifiedAt: new Date() }).returning();
    await db.insert(schema.roles).values([{ id: 'ADMIN' }, { id: 'CUSTOMER' }]).onConflictDoNothing();
    await db.insert(schema.userRoles).values({ userId: admin.id, roleId: 'ADMIN' });

    const custSession = await createSession(pg(), admin.id, { authScope: 'CUSTOMER' });
    const adminSession = await createSession(pg(), admin.id, { authScope: 'ADMIN' });

    // Admin TTL defaults to 8h (well below customer 30d)
    const adminHours = (adminSession.expiresAt.getTime() - Date.now()) / 3600_000;
    const custDays = (custSession.expiresAt.getTime() - Date.now()) / 86400_000;
    expect(adminHours).toBeGreaterThan(7.5);
    expect(adminHours).toBeLessThanOrEqual(8.1);
    expect(custDays).toBeGreaterThan(29);

    // Active admin session resolves cleanly
    expect(await getSessionUser(pg(), adminSession.token)).not.toBeNull();

    // Idle > 30 minutes auto-revokes the admin session
    await db
      .update(schema.userSessions)
      .set({ lastActiveAt: new Date(Date.now() - 45 * 60_000) })
      .where(eq(schema.userSessions.userId, admin.id));
    expect(await getSessionUser(pg(), adminSession.token)).toBeNull();

    // Fresh admin session revoked by revokeAllSessions
    const freshAdmin = await createSession(pg(), admin.id, { authScope: 'ADMIN' });
    expect(await getSessionUser(pg(), freshAdmin.token)).not.toBeNull();
    await revokeAllSessions(pg(), admin.id);
    expect(await getSessionUser(pg(), freshAdmin.token)).toBeNull();
  });

  it('delivers Creator & Distributor received, under_review, and approved Desla HTML emails with Brevo tracking & idempotency dedupe', async () => {
    const hash = await hashPassword('PartnerPass123!');
    const [admin] = await db.insert(schema.users).values({ email: 'reviewer@example.test', passwordHash: hash, emailVerifiedAt: new Date() }).returning();
    const [creatorUser] = await db.insert(schema.users).values({ email: 'creator-life@example.test', passwordHash: hash, emailVerifiedAt: new Date() }).returning();
    const [distUser] = await db.insert(schema.users).values({ email: 'dist-life@example.test', passwordHash: hash, emailVerifiedAt: new Date() }).returning();
    await db.insert(schema.roles).values([{ id: 'CREATOR' }, { id: 'DISTRIBUTOR' }]).onConflictDoNothing();

    // Dedupe outbox by idempotencyKey
    const first = await enqueueNotification(pg(), {
      userId: creatorUser.id,
      channel: 'email',
      template: 'auth.welcome',
      payload: {},
      idempotencyKey: `dedupe-key-${creatorUser.id}`,
    });
    const second = await enqueueNotification(pg(), {
      userId: creatorUser.id,
      channel: 'email',
      template: 'auth.welcome',
      payload: {},
      idempotencyKey: `dedupe-key-${creatorUser.id}`,
    });
    expect(second.id).toBe(first.id);

    // Creator lifecycle: received -> under_review -> approved
    const cApp = await submitCreator(pg(), creatorUser.id, { name: 'Zara Okafor', handle: '@zara', platform: 'Instagram', niche: 'Skincare' });
    const dApp = await submitDistributor(pg(), distUser.id, { name: 'Abuja Atelier', businessName: 'Abuja Atelier Ltd', city: 'Abuja', state: 'FCT', address: '12 Wuse', phone: '+2348011112222', whatsapp: '2348011112222' });

    const sentPayloads: Record<string, unknown>[] = [];
    const brevo = new BrevoSender(
      vi.fn(async (_url, init) => {
        sentPayloads.push(JSON.parse(String(init?.body)));
        return Response.json({ messageId: `<brevo-msg-${sentPayloads.length}@deslabeauty.com>` }, { status: 201 });
      }),
    );

    // Dispatch received + welcome emails
    await processOutbox(pg(), brevo);
    expect(sentPayloads.some((p) => String(p.subject).includes('Welcome to Desla Beauty'))).toBe(true);
    expect(sentPayloads.some((p) => String(p.subject).includes('Creator application received') && String(p.htmlContent).includes('DESLA BEAUTY'))).toBe(true);
    expect(sentPayloads.some((p) => String(p.subject).includes('Distributor application received'))).toBe(true);

    // Transition both to under_review
    await markCreatorUnderReview(pg(), { applicationId: cApp.id, adminId: admin.id, note: 'Verifying portfolio links' });
    await markDistributorUnderReview(pg(), { applicationId: dApp.id, adminId: admin.id, note: 'Checking storage premises' });
    await processOutbox(pg(), brevo);
    expect(sentPayloads.some((p) => String(p.subject).includes('Creator application under review'))).toBe(true);
    expect(sentPayloads.some((p) => String(p.subject).includes('Distributor application under review'))).toBe(true);

    // Approve creator from under_review state
    await reviewCreator(pg(), { applicationId: cApp.id, adminId: admin.id, approve: true, promoCode: 'ZARA10', discountPercent: 10, commissionRate: 12, note: 'Welcome aboard' });
    await processOutbox(pg(), brevo);
    const approvalEmail = sentPayloads.find((p) => String(p.subject).includes('Creator application approved'));
    expect(approvalEmail).toBeDefined();
    expect(String(approvalEmail?.htmlContent)).toContain('ZARA10');
    expect(String(approvalEmail?.textContent)).not.toMatch(/glowly|gloli/i);

    // Verify Brevo delivery tracking persisted on notification_outbox
    const trackedRows = await db.select().from(schema.notificationOutbox).where(eq(schema.notificationOutbox.status, 'sent'));
    expect(trackedRows.length).toBeGreaterThanOrEqual(5);
    expect(trackedRows.every((r) => r.provider === 'brevo' && Boolean(r.providerMessageId) && r.sentAt !== null)).toBe(true);
  });

  it('enqueues shipment.update on admin order SHIPPED/DELIVERED transitions and supports user skin analysis deletion', async () => {
    const hash = await hashPassword('OrderUser123!');
    const [buyer] = await db.insert(schema.users).values({ email: 'dispatch-buyer@example.test', passwordHash: hash, emailVerifiedAt: new Date() }).returning();
    const [order] = await db.insert(schema.orders).values({
      userId: buyer.id,
      orderNumber: 'DES-SHIP-9001',
      status: 'PAID',
      paymentStatus: 'PAID',
      fulfilmentMethod: 'DELIVERY',
      subtotalKobo: 1500000,
      deliveryFeeKobo: 150000,
      discountKobo: 0,
      totalKobo: 1650000,
      shippingAddress: { fullName: 'Adaeze', phone: '+2348000000001', street: 'Ikoyi', city: 'Lagos', state: 'Lagos' },
      idempotencyKey: 'order-ship-key-9001',
    }).returning();

    await transitionOrder(pg(), order.id, 'FULFILLING', { actor: 'admin', actorId: 'admin-1' });
    await transitionOrder(pg(), order.id, 'SHIPPED', { actor: 'admin', actorId: 'admin-1' });
    await transitionOrder(pg(), order.id, 'DELIVERED', { actor: 'admin', actorId: 'admin-1' });

    const shipmentEmails = await db.select().from(schema.notificationOutbox).where(eq(schema.notificationOutbox.template, 'shipment.update'));
    expect(shipmentEmails.some((r) => r.idempotencyKey === `order.status-email:${order.id}:SHIPPED`)).toBe(true);
    expect(shipmentEmails.some((r) => r.idempotencyKey === `order.status-email:${order.id}:DELIVERED`)).toBe(true);

    // Privacy deletion of skin analysis record
    const [scan] = await db.insert(schema.skinAnalyses).values({
      userId: buyer.id,
      status: 'complete',
      consentAccepted: true,
      consentVersion: '2026-09-v1',
      imageMime: 'image/jpeg',
      imageBytes: 2048,
    }).returning();

    const deleted = await deleteAnalysis(pg(), buyer.id, scan.id, 'req-del-1');
    expect(deleted).toMatchObject({ deleted: true, analysisId: scan.id });
    const remaining = await db.select().from(schema.skinAnalyses).where(eq(schema.skinAnalyses.id, scan.id));
    expect(remaining).toHaveLength(0);
  });
});

