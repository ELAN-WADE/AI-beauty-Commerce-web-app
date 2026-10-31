import 'dotenv/config';
import assert from 'node:assert/strict';
import { eq } from 'drizzle-orm';
import { getDb } from '../src/db/client';
import * as schema from '../src/db/schema';
import { googleConfig, safeReturnTo } from '../src/modules/auth/redirects';
import {
  authenticateGoogleUser,
  completeGoogleOAuth,
  consumeOAuthRequest,
  exchangeOAuthGrant,
  pkceChallenge,
  startGoogleOAuth,
} from '../src/modules/auth/google-oauth';
import { submitApplication as submitCreatorApp, reviewApplication as reviewCreatorApp } from '../src/modules/creators/service';
import { submitApplication as submitDistributorApp, reviewApplication as reviewDistributorApp } from '../src/modules/distributors/service';
import { partnerDashboard } from '../src/modules/partners/service';
import { middleware } from '../src/middleware';
import { NextRequest } from 'next/server';

async function run() {
  console.log('--- Starting Complete Google OAuth & Partner (Creator + Distributor) E2E Verification ---');
  const db = getDb();

  // 1. Verify Origin and Google Config on Dev Ports (3000, 3001, etc.)
  console.log('1. Testing Google Config with dynamic storefront origin...');
  const cfg3001 = googleConfig('http://localhost:3001');
  assert.equal(cfg3001.storefront.origin, 'http://localhost:3001', 'Storefront origin should match caller on port 3001');

  const safe3001 = safeReturnTo('http://localhost:3001/creators', 'CREATOR', 'http://localhost:3001');
  assert.equal(safe3001, 'http://localhost:3001/creators', 'safeReturnTo must preserve dev loopback port 3001');

  const safeDist3001 = safeReturnTo('http://localhost:3001/distributor', 'DISTRIBUTOR', 'http://localhost:3001');
  assert.equal(safeDist3001, 'http://localhost:3001/distributor', 'safeReturnTo must preserve dev loopback port 3001 for distributor');

  console.log('   Passed: Storefront origin and returnTo correctly preserved for port 3001.');

  // 2. Test Middleware Origin Boundary
  console.log('2. Testing Middleware Cross-Origin & Dev Loopback handling...');
  const req3001 = new NextRequest('http://localhost:3005/api/auth/login', {
    method: 'POST',
    headers: { origin: 'http://localhost:3001', 'sec-fetch-site': 'same-site' },
  });
  const res3001 = middleware(req3001);
  assert.notEqual(res3001.status, 403, 'Port 3001 loopback must NOT be rejected with 403');
  assert.equal(res3001.headers.get('access-control-allow-origin'), 'http://localhost:3001');

  const req127 = new NextRequest('http://localhost:3005/api/auth/login', {
    method: 'POST',
    headers: { origin: 'http://127.0.0.1:3001', 'sec-fetch-site': 'same-site' },
  });
  const res127 = middleware(req127);
  assert.notEqual(res127.status, 403, '127.0.0.1 loopback must NOT be rejected with 403');

  const reqEvil = new NextRequest('http://localhost:3005/api/auth/login', {
    method: 'POST',
    headers: { origin: 'https://evil-untrusted-site.com', 'sec-fetch-site': 'cross-site' },
  });
  const resEvil = middleware(reqEvil);
  assert.equal(resEvil.status, 403, 'Untrusted origin must be rejected with 403');
  console.log('   Passed: Dev loopbacks permitted on all ports; untrusted origins blocked.');

  // 3. E2E Creator Flow: Google OAuth -> Intent -> Application -> Approval -> Role Grant
  console.log('3. Testing Creator Onboarding & OAuth Flow...');
  const creatorVerifier = 'a'.repeat(64);
  const creatorChallenge = pkceChallenge(creatorVerifier);
  const creatorStart = await startGoogleOAuth(db, {
    redirect: 'http://localhost:3001/creators',
    intent: 'CREATOR',
    challenge: creatorChallenge,
    callerOrigin: 'http://localhost:3001',
  });
  assert.ok(creatorStart.url.includes('accounts.google.com'), 'Must generate Google accounts URL');

  const creatorUrl = new URL(creatorStart.url);
  const creatorState = creatorUrl.searchParams.get('state');
  const creatorReq = await consumeOAuthRequest(db, creatorState, creatorStart.browser);
  assert.equal(creatorReq.intent, 'CREATOR');
  assert.equal(creatorReq.returnTo, 'http://localhost:3001/creators');

  // Complete OAuth
  const creatorGoogleSub = `creator-test-${Date.now()}`;
  const creatorEmail = `creator.${Date.now()}@deslabeauty.test`;
  const creatorMockProvider = async () =>
    new Response(JSON.stringify({
      access_token: 'mock-google-token',
      sub: creatorGoogleSub,
      email: creatorEmail,
      email_verified: true,
      name: 'Zara Creator',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    }));

  const creatorHandoff = await completeGoogleOAuth(db, creatorReq, 'mock-code', creatorMockProvider as any);
  const creatorExchange = await exchangeOAuthGrant(db, creatorHandoff, creatorVerifier);
  assert.equal(creatorExchange.returnTo, 'http://localhost:3001/creators');

  // Verify created user
  const [creatorUser] = await db.select().from(schema.users).where(eq(schema.users.email, creatorEmail));
  assert.ok(creatorUser, 'Creator user must be created in PostgreSQL');
  assert.equal(creatorUser.signupIntent, 'CREATOR', 'signupIntent must be CREATOR');

  // Submit Creator Application
  const creatorApp = await submitCreatorApp(db, creatorUser.id, {
    name: 'Zara Creator',
    handle: `@zara_glow_${Date.now()}`,
    platform: 'Instagram',
    niche: 'Melanin Skincare',
  });
  assert.equal(creatorApp.status, 'pending');

  // Find or create admin user to approve applications
  let [adminUser] = await db.select().from(schema.users).where(eq(schema.users.email, 'admin@desla.test'));
  if (!adminUser) {
    [adminUser] = await db.insert(schema.users).values({ email: 'admin@desla.test', passwordHash: 'dummy', emailVerifiedAt: new Date() }).returning();
    await db.insert(schema.userRoles).values([{ userId: adminUser.id, roleId: 'CUSTOMER' }, { userId: adminUser.id, roleId: 'SUPER_ADMIN' }]).onConflictDoNothing();
  }

  // Admin approves Creator Application
  const creatorPromoCode = `ZARA${Date.now().toString().slice(-4)}`;
  const approvalRes = await reviewCreatorApp(db, {
    applicationId: creatorApp.id,
    adminId: adminUser.id,
    approve: true,
    promoCode: creatorPromoCode,
    discountPercent: 10,
    commissionRate: 15,
    note: 'Approved for Creator Affiliate Studio',
  });
  assert.equal(approvalRes.status, 'approved');

  // Verify CREATOR role was granted in PostgreSQL
  const creatorRoles = (await db.select().from(schema.userRoles).where(eq(schema.userRoles.userId, creatorUser.id))).map(r => r.roleId);
  assert.ok(creatorRoles.includes('CREATOR'), 'User must have role CREATOR after admin approval');

  // Verify Creator Partner Dashboard
  const creatorDash = await partnerDashboard(db, creatorUser.id, 'CREATOR');
  assert.equal(creatorDash.profile.name, 'Zara Creator');
  assert.ok('promoCode' in creatorDash.profile, 'Creator dashboard must return a creator profile');
  assert.equal(creatorDash.profile.promoCode, creatorPromoCode);
  console.log(`   Passed: Creator OAuth -> Intent -> Application -> Approval -> CREATOR role granted (${creatorPromoCode}).`);

  // 4. E2E Distributor Flow: Google OAuth -> Intent -> Application -> Approval -> Role Grant -> Location Setup
  console.log('4. Testing Distributor Onboarding & OAuth Flow...');
  const distVerifier = 'b'.repeat(64);
  const distChallenge = pkceChallenge(distVerifier);
  const distStart = await startGoogleOAuth(db, {
    redirect: 'http://localhost:3001/distributor',
    intent: 'DISTRIBUTOR',
    challenge: distChallenge,
    callerOrigin: 'http://localhost:3001',
  });

  const distUrl = new URL(distStart.url);
  const distState = distUrl.searchParams.get('state');
  const distReq = await consumeOAuthRequest(db, distState, distStart.browser);
  assert.equal(distReq.intent, 'DISTRIBUTOR');
  assert.equal(distReq.returnTo, 'http://localhost:3001/distributor');

  const distGoogleSub = `dist-test-${Date.now()}`;
  const distEmail = `distributor.${Date.now()}@deslabeauty.test`;
  const distMockProvider = async () =>
    new Response(JSON.stringify({
      access_token: 'mock-google-token',
      sub: distGoogleSub,
      email: distEmail,
      email_verified: true,
      name: 'Lagos Island Luxury Hub',
    }));

  const distHandoff = await completeGoogleOAuth(db, distReq, 'mock-code', distMockProvider as any);
  const distExchange = await exchangeOAuthGrant(db, distHandoff, distVerifier);
  assert.equal(distExchange.returnTo, 'http://localhost:3001/distributor');

  const [distUser] = await db.select().from(schema.users).where(eq(schema.users.email, distEmail));
  assert.ok(distUser, 'Distributor user must be created in PostgreSQL');
  assert.equal(distUser.signupIntent, 'DISTRIBUTOR');

  // Submit Distributor Application
  const distApp = await submitDistributorApp(db, distUser.id, {
    name: 'Chief Adebayo',
    businessName: 'Victoria Island Glow Depots',
    city: 'Lagos',
    state: 'Lagos',
    address: '14 Marina Road, Victoria Island, Lagos',
    phone: '+2348012345678',
    whatsapp: '2348012345678',
  });
  assert.equal(distApp.status, 'pending');

  // Admin approves Distributor Application
  const distApproval = await reviewDistributorApp(db, {
    applicationId: distApp.id,
    adminId: adminUser.id,
    approve: true,
    note: 'Approved for Victoria Island City Hub',
  });
  assert.equal(distApproval.status, 'approved');

  // Verify DISTRIBUTOR role was granted in PostgreSQL
  const distRoles = (await db.select().from(schema.userRoles).where(eq(schema.userRoles.userId, distUser.id))).map(r => r.roleId);
  assert.ok(distRoles.includes('DISTRIBUTOR'), 'User must have role DISTRIBUTOR after admin approval');

  // Verify Distributor Partner Dashboard
  const distDash = await partnerDashboard(db, distUser.id, 'DISTRIBUTOR');
  assert.equal(distDash.profile.name, 'Chief Adebayo');
  assert.equal(distDash.location?.city, 'Lagos');
  assert.equal(distDash.location?.type, 'DISTRIBUTOR');
  console.log(`   Passed: Distributor OAuth -> Intent -> Application -> Approval -> DISTRIBUTOR role granted (Location: ${distDash.location?.name}).`);

  console.log('\n--- ALL GOOGLE OAUTH, CREATOR & DISTRIBUTOR VERIFICATION TESTS PASSED 100% ---');
  process.exit(0);
}

run().catch((err) => {
  console.error('FAILED:', err);
  process.exit(1);
});
