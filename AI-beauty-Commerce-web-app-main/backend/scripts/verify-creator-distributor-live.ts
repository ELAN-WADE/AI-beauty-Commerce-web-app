import '../src/lib/load-env';

import { getDb } from '../src/db/client';
import { sql, eq, and } from 'drizzle-orm';
import { users, userRoles } from '../src/modules/auth/schema';
import { creators, creatorApplications } from '../src/modules/creators/schema';
import { distributors, distributorApplications } from '../src/modules/distributors/schema';
import { inventoryLocations, stockLevels } from '../src/modules/inventory/schema';
import { walletAccounts, ledgerEntries, partnerBankAccounts } from '../src/modules/ledger/schema';
import { walletFor } from '../src/modules/ledger/service';
import { workspaceRecords } from '../src/modules/workspaces/schema';
import { workspaceView, workspaceWrite } from '../src/modules/workspaces/service';
import { partnerDashboard, issuePickupCode, partnerOrderAction } from '../src/modules/partners/service';
import { orders, orderItems } from '../src/modules/orders/schema';
import { productVariants, products } from '../src/modules/catalog/schema';

async function main() {
  const testUrl = process.env.TEST_DATABASE_URL;
  const liveUrl = process.env.DATABASE_URL;
  if (!testUrl || (liveUrl && new URL(testUrl).host === new URL(liveUrl).host && new URL(testUrl).pathname === new URL(liveUrl).pathname)) throw new Error('A separate TEST_DATABASE_URL is required. This fixture script must not modify the live database.');
  process.env.DATABASE_URL = testUrl;
  console.log('--- Starting isolated Creator & Distributor fixture verification ---');
  const db = getDb();
  const timestamp = Date.now();

  // 1. Create a clean verified test user for Creator
  const creatorEmail = `test.creator.${timestamp}@desla.com`;
  const [testCreatorUser] = await db.insert(users).values({
    email: creatorEmail,
    emailVerifiedAt: new Date(),
    passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdef',
  }).returning();
  console.log('✓ Created test creator user:', testCreatorUser.id, testCreatorUser.email);

  // 2. Submit Creator Application
  const promoCode = `TEST${timestamp.toString().slice(-6)}`;
  const [app] = await db.insert(creatorApplications).values({
    userId: testCreatorUser.id,
    name: 'Zara Naturalist',
    handle: `@zara_natural_${timestamp}`,
    platform: 'Instagram',
    niche: 'Natural Skincare & Barrier Repair',
    status: 'pending',
  }).returning();
  console.log('✓ Creator application submitted with status:', app.status);

  // 3. Admin Approves Creator Application
  await db.transaction(async tx => {
    await tx.update(creatorApplications).set({
      status: 'approved',
      reviewNote: 'Approved verified partner.',
      updatedAt: new Date(),
    }).where(eq(creatorApplications.id, app.id));

    await tx.insert(userRoles).values({
      userId: testCreatorUser.id,
      roleId: 'CREATOR',
    }).onConflictDoNothing();

    const [cr] = await tx.insert(creators).values({
      userId: testCreatorUser.id,
      name: 'Zara Naturalist',
      handle: `@zara_natural_${timestamp}`,
      promoCode,
      platform: 'Instagram',
      niche: 'Natural Skincare & Barrier Repair',
      discountPercent: 10,
      commissionRate: 15,
      verified: true,
    }).returning();

    await walletFor(tx, 'CREATOR', cr.id, testCreatorUser.id);
  });
  console.log('✓ Admin approved creator application and created wallet with promo code:', promoCode);

  // 4. Fetch Creator Partner Dashboard
  const creatorDash = await partnerDashboard(db, testCreatorUser.id, 'CREATOR');
  if (!creatorDash.profile || !('promoCode' in creatorDash.profile) || creatorDash.profile.promoCode !== promoCode) {
    throw new Error('Creator dashboard failed to retrieve newly approved profile.');
  }
  console.log('✓ Creator dashboard verified: promo code =', creatorDash.profile.promoCode, 'balance =', creatorDash.wallet.availableKobo);

  // 5. Creator Authors Routine Content in Workspace
  const testRecord = await workspaceWrite(db, testCreatorUser.id, {
    action: 'save',
    kind: 'CREATOR',
    type: 'CONTENT',
    status: 'DRAFT',
    title: 'Natural Barrier Shield 3-Step Morning Routine',
    body: 'Cleanse with Botanical Gel, mist with Aloe Toner, press 3 drops Shea Extrait.',
    url: '/uploads/partner/routine-preview.jpg',
    productIds: [],
  }, `key-content-${timestamp}`);
  if (!('id' in testRecord) || !testRecord.id || testRecord.title !== 'Natural Barrier Shield 3-Step Morning Routine') {
    throw new Error('Creator content creation failed.');
  }
  console.log('✓ Creator saved content draft in workspace:', testRecord.id, testRecord.title);

  // 6. Creator Registers Verified Bank Account
  const [bankRow] = await db.insert(partnerBankAccounts).values({
    walletId: creatorDash.wallet.id,
    bankCode: '058',
    bankName: 'Guaranty Trust Bank (GTBank)',
    accountNumber: '0987654321',
    accountName: 'ZARA NATURALIST',
  }).returning();
  console.log('✓ Creator linked verified bank account:', bankRow.id, bankRow.bankName);

  // 7. Creator Workspace Records View
  const creatorWorkspace = await workspaceView(db, testCreatorUser.id, 'CREATOR');
  const foundDraft = creatorWorkspace.records.find(r => r.id === testRecord.id);
  if (!foundDraft) throw new Error('Workspace view did not return creator draft.');
  console.log('✓ Workspace view verified: retrieved', creatorWorkspace.records.length, 'records.');

  // 8. Test Distributor Journey
  const distEmail = `test.distributor.${timestamp}@desla.com`;
  const [testDistUser] = await db.insert(users).values({
    email: distEmail,
    emailVerifiedAt: new Date(),
    passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdef',
  }).returning();

  // Admin approves distributor & creates location
  let distProfileId = '';
  let distLocationId = '';
  await db.transaction(async tx => {
    await tx.insert(userRoles).values({
      userId: testDistUser.id,
      roleId: 'DISTRIBUTOR',
    }).onConflictDoNothing();

    const [d] = await tx.insert(distributors).values({
      userId: testDistUser.id,
      name: 'Abuja Capital Hub Express',
      businessName: 'Luxe Botanicals Nigeria',
      city: 'Abuja',
      state: 'FCT',
      address: 'Suite 101, Adetokunbo Ademola Crescent, Wuse 2',
      phone: '08012345678',
      whatsapp: '2348012345678',
      verified: true,
      tier: 'Gold',
      operatingHours: 'Mon - Sat (9:00 AM - 6:00 PM)',
      pickupAvailable: true,
    }).returning();
    distProfileId = d.id;

    const [loc] = await tx.insert(inventoryLocations).values({
      code: `LOC-${timestamp.toString().slice(-6)}`,
      name: 'Abuja Capital Hub Store',
      city: 'Abuja',
      state: 'FCT',
      address: 'Suite 101, Adetokunbo Ademola Crescent, Wuse 2',
      distributorId: d.id,
      pickupEnabled: true,
      deliveryEnabled: true,
    }).returning();
    distLocationId = loc.id;

    await walletFor(tx, 'DISTRIBUTOR', d.id, testDistUser.id);
  });
  console.log('✓ Created verified distributor and inventory location:', distProfileId, distLocationId);

  // 9. Distributor Dashboard Fetch
  const distDash = await partnerDashboard(db, testDistUser.id, 'DISTRIBUTOR');
  if (!distDash.location || distDash.location.id !== distLocationId) {
    throw new Error('Distributor dashboard location mismatch.');
  }
  console.log('✓ Distributor dashboard verified: city =', distDash.profile.city, 'pickupEnabled =', distDash.location.pickupEnabled);

  // 10. Customer Order & Pickup Verification
  const orderNumber = `ORD-TEST-${timestamp.toString().slice(-6)}`;
  const [custOrder] = await db.insert(orders).values({
    orderNumber,
    userId: testCreatorUser.id,
    status: 'READY_PICKUP',
    paymentStatus: 'PAID',
    fulfilmentMethod: 'PICKUP',
    fulfilmentLocationId: distLocationId,
    distributorId: distProfileId,
    subtotalKobo: 2500000,
    deliveryFeeKobo: 0,
    totalKobo: 2500000,
    idempotencyKey: `idem-ord-${timestamp}`,
    checkoutFingerprint: `fp-${timestamp}`,
    shippingAddress: { fullName: 'Amara Customer', street: 'Adetokunbo Ademola Crescent', city: 'Abuja', state: 'FCT', phone: '08012345678' },
  }).returning();

  // Customer issues pickup PIN
  const { code: pin } = await issuePickupCode(db, custOrder.id, { userId: testCreatorUser.id });
  console.log('✓ Customer issued a pickup verification code.');

  // Distributor verifies pickup PIN and transitions order to DELIVERED
  const orderResult = await partnerOrderAction(db, testDistUser.id, custOrder.id, 'CONFIRM_PICKUP', pin);
  if (!orderResult || orderResult.status !== 'DELIVERED') {
    throw new Error('Order transition to DELIVERED with PIN failed.');
  }
  console.log('✓ Distributor verified customer pickup code and delivered order:', orderResult.orderNumber, orderResult.status);

  console.log('\n======================================================');
  console.log('ISOLATED FIXTURE CHECKS COMPLETED');
  console.log('======================================================\n');
  process.exit(0);
}

main().catch(e => {
  console.error('VERIFICATION ERROR:', e);
  process.exit(1);
});
