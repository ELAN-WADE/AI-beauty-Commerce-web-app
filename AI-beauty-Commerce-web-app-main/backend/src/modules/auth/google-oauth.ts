import { createHash } from 'node:crypto';
import { and, eq, gt, inArray, isNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { AppDb, Db } from '../../db/client';
import { users, userRoles, googleIdentities, oauthRequests, oauthGrants } from './schema';
import { profiles } from '../users/schema';
import { hashPassword, normalizeEmail, newRawToken, createSession, sha256Hex, enforceSessionCap, type SessionMeta } from './service';
import { ApiError, Errors } from '../../lib/errors';
import { openAuthUrl, sealAuthUrl } from '../../lib/outbox-crypto';
import { accountIntent, oauthIntent, googleConfig, safeReturnTo } from './redirects';
import { adminEmail, adminEntryPath, hasStaffRole } from './admin-policy';
import { googleRequest, googleNetworkCode } from './google-http';

export interface GoogleUserProfile { sub: string; email: string; name: string; picture?: string; emailVerified?: boolean }
export const pkceChallenge = (verifier: string) => createHash('sha256').update(verifier).digest('base64url');
export const isGoogleOAuthConfigured = () => { try { googleConfig(); return true; } catch { return false; } };

export async function startGoogleOAuth(db: Db, input: { redirect?: string; intent?: string; challenge: string; callerOrigin?: string }) {
  const config = googleConfig(input.callerOrigin);
  if (oauthIntent(input.intent) === 'ADMIN' && (!adminEntryPath() || new URL(input.redirect || '/', config.storefront).pathname !== adminEntryPath())) throw Errors.notFound();
  const challenge = z.string().regex(/^[A-Za-z0-9_-]{43}$/).parse(input.challenge);
  const state = newRawToken(); const browser = newRawToken(); const verifier = newRawToken();
  await db.insert(oauthRequests).values({ stateHash: sha256Hex(state), browserHash: sha256Hex(browser), verifierEncrypted: sealAuthUrl(verifier), returnChallenge: challenge, returnTo: safeReturnTo(input.redirect, input.intent, input.callerOrigin), intent: oauthIntent(input.intent), expiresAt: new Date(Date.now() + 600000) });
  const params = new URLSearchParams({ client_id: config.clientId, redirect_uri: config.redirectUri, response_type: 'code', scope: 'openid email profile', state, code_challenge: pkceChallenge(verifier), code_challenge_method: 'S256', access_type: 'online', prompt: 'select_account' });
  if (input.intent === 'ADMIN') params.set('login_hint', adminEmail());
  return { browser, url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` };
}

export async function consumeOAuthRequest(db: Db, state: string | null, browser: string | (string | undefined)[] | undefined) {
  const proofs = (Array.isArray(browser) ? browser : [browser]).filter((value): value is string => Boolean(value));
  if (!state || !proofs.length || !/^[a-f0-9]{64}$/.test(state)) throw Errors.gone('Google sign-in expired. Start again from the sign-in page.');
  const [request] = await db.update(oauthRequests).set({ consumedAt: new Date() }).where(and(eq(oauthRequests.stateHash, sha256Hex(state)), inArray(oauthRequests.browserHash, proofs.map(sha256Hex)), isNull(oauthRequests.consumedAt), gt(oauthRequests.expiresAt, new Date()))).returning();
  if (!request) throw Errors.gone('Google sign-in expired. Start again from the sign-in page.');
  return request;
}

// The code is exchanged server-to-server with PKCE. Identity comes from Google's
// authenticated userinfo endpoint; no unvalidated ID token is used (no OIDC nonce flow).
export async function exchangeGoogleCode(code: string, verifier: string, fetchFn = fetch): Promise<GoogleUserProfile> {
  const config = googleConfig();
  let stage: 'token' | 'identity' = 'token';
  try {
    const response = await googleRequest(fetchFn, 'https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: config.clientId, client_secret: config.secret, redirect_uri: config.redirectUri, grant_type: 'authorization_code', code_verifier: verifier }).toString() }, stage);
    if (!response.ok) {
      const failure = await response.json().catch(() => ({})) as { error?: unknown };
      const providerCode = typeof failure.error === 'string' && ['invalid_client', 'unauthorized_client', 'invalid_grant', 'redirect_uri_mismatch'].includes(failure.error) ? failure.error : 'provider_error';
      // Never log the authorization code, secret, verifier, tokens or provider response body.
      console.warn(JSON.stringify({ scope: 'google-oauth', stage: 'token', status: response.status, code: providerCode }));
      if (['invalid_client', 'unauthorized_client', 'redirect_uri_mismatch'].includes(providerCode)) throw new ApiError(503, 'oauth_configuration', 'Google sign-in configuration needs attention. Use email and password for now.');
      if (providerCode === 'invalid_grant') throw Errors.gone('Google sign-in expired. Start again in the same browser tab.');
      throw new ApiError(502, 'oauth_provider', 'Google could not complete sign-in. Please try again.', true);
    }
    const token = z.object({ access_token: z.string().min(1) }).parse(await response.json());
    stage = 'identity';
    const result = await googleRequest(fetchFn, 'https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${token.access_token}` } }, stage);
    if (!result.ok) {
      console.warn(JSON.stringify({ scope: 'google-oauth', stage, status: result.status, code: 'userinfo_denied' }));
      throw new ApiError(502, 'oauth_provider', 'Google could not confirm your account profile. Please start sign-in again.', true);
    }
    const user = z.object({ sub: z.string().min(1).max(255), email: z.string().email().max(254), email_verified: z.literal(true), name: z.string().max(120).optional(), picture: z.string().url().optional() }).parse(await result.json());
    return { sub: user.sub, email: user.email, emailVerified: true, name: user.name ?? user.email.split('@')[0], picture: user.picture };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const detail = error instanceof TypeError && error.message === 'fetch failed' ? 'fetch failed' : '';
    console.warn(JSON.stringify({ scope: 'google-oauth', stage, code: error instanceof TypeError || (error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name)) ? 'network_error' : 'invalid_provider_response', cause: googleNetworkCode(error), detail }));
    throw new ApiError(502, 'oauth_provider', 'Google could not be reached or returned an invalid response. Please start sign-in again.', true);
  }
}

export async function authenticateGoogleUser(db: Db, google: GoogleUserProfile, _meta: SessionMeta = {}, intent = 'CUSTOMER') {
  if (!google.emailVerified || !google.sub || !z.string().email().safeParse(google.email).success) throw Errors.forbidden('A verified Google email address is required.');
  const email = normalizeEmail(google.email);
  if (intent === 'ADMIN' && email !== adminEmail()) throw Errors.forbidden('This Google account is not permitted for administrator sign-in.');
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`google:${google.sub}`}, 0))`);
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`auth-email:${email}`}, 0))`);
    const [identity] = await tx.select().from(googleIdentities).where(eq(googleIdentities.subject, google.sub));
    let [user] = await tx.select().from(users).where(identity ? eq(users.id, identity.userId) : eq(users.email, email)).for('update');
    const grants = user ? await tx.select().from(userRoles).where(eq(userRoles.userId, user.id)) : [];
    const privileged = hasStaffRole(grants.map(grant => grant.roleId));
    if (privileged && intent !== 'ADMIN') throw Errors.forbidden('Use the private administrator sign-in page for this Google account.');
    if ((privileged && (email !== adminEmail() || user?.email !== adminEmail())) || (intent === 'ADMIN' && (!privileged || user?.email !== adminEmail()))) throw Errors.forbidden('This Google account is not permitted for administrator sign-in.');
    if (!identity && user && !user.emailVerifiedAt) throw new ApiError(409, 'verify_before_link', 'Verify your existing account email before using Google sign-in. Request a new verification link from sign-in.');
    if (!user) {
      [user] = await tx.insert(users).values({ email, passwordHash: await hashPassword(newRawToken()), emailVerifiedAt: new Date(), signupIntent: accountIntent(intent) }).onConflictDoNothing({ target: users.email }).returning();
      if (!user) throw Errors.conflict('Please retry sign-in.');
    }
    if (!user.emailVerifiedAt) throw Errors.forbidden('Verify your account email before signing in.');
    if (!identity) {
      const [linked] = await tx.insert(googleIdentities).values({ subject: google.sub, userId: user.id }).onConflictDoNothing().returning();
      if (!linked) throw Errors.conflict('Use the Google account already linked to this account.');
    }
    await tx.insert(profiles).values({ userId: user.id, displayName: google.name, avatarUrl: google.picture ?? null }).onConflictDoNothing();
    if (intent !== 'ADMIN') await tx.insert(userRoles).values({ userId: user.id, roleId: 'CUSTOMER' }).onConflictDoNothing();
    // Intent selects onboarding only. Partner approval/role grants stay in their existing services.
    return { userId: user.id, email: user.email };
  });
}

export async function completeGoogleOAuth(db: Db, request: typeof oauthRequests.$inferSelect, code: string, fetchFn = fetch) {
  const google = await exchangeGoogleCode(code, openAuthUrl(request.verifierEncrypted), fetchFn);
  const user = await authenticateGoogleUser(db, google, {}, request.intent);
  const grant = newRawToken();
  await db.insert(oauthGrants).values({ codeHash: sha256Hex(grant), userId: user.userId, authScope: request.intent === 'ADMIN' ? 'ADMIN' : 'CUSTOMER', challenge: request.returnChallenge, returnTo: request.returnTo, expiresAt: new Date(Date.now() + 60000) });
  return grant;
}

export async function exchangeOAuthGrant(db: AppDb, code: string, verifier: string, meta: SessionMeta = {}) {
  return db.transaction(async tx => {
    const [grant] = await tx.update(oauthGrants).set({ consumedAt: new Date() }).where(and(eq(oauthGrants.codeHash, sha256Hex(code)), eq(oauthGrants.challenge, pkceChallenge(verifier)), isNull(oauthGrants.consumedAt), gt(oauthGrants.expiresAt, new Date()))).returning();
    if (!grant) throw Errors.gone('Sign-in expired or was already completed. Please sign in again.');
    await enforceSessionCap(tx as unknown as AppDb, grant.userId, 10, grant.authScope);
    const session = await createSession(tx as unknown as AppDb, grant.userId, { ...meta, authScope: grant.authScope });
    return { session, returnTo: grant.returnTo };
  });
}
