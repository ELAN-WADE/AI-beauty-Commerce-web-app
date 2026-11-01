import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { authenticateGoogleUser, consumeOAuthRequest, completeGoogleOAuth, exchangeOAuthGrant, pkceChallenge, startGoogleOAuth } from '@/modules/auth/google-oauth';
import { safeReturnTo } from '@/modules/auth/redirects';
let client: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;
const pg = () => db as never;
beforeAll(async () => {
  vi.stubEnv('GOOGLE_CLIENT_ID', 'test-client'); vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test-secret');
  vi.stubEnv('APP_URL', 'http://localhost:3005'); vi.stubEnv('FRONTEND_URL', 'http://localhost:3002');
  vi.stubEnv('GOOGLE_REDIRECT_URI', 'http://localhost:3002/api/auth/oauth/google/callback');
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } }); db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: './drizzle' });
  await db.insert(schema.roles).values({ id: 'CUSTOMER' }).onConflictDoNothing();
}, 120000);
afterAll(async () => { vi.unstubAllEnvs(); await client?.close(); });

describe('Google identity, PKCE and one-use handoff', () => {
  it('restricts admin Google identity on the server and never grants admin from intent', async () => {
    vi.stubEnv('ADMIN_GOOGLE_EMAIL', 'owner@oauth.test');
    vi.stubEnv('ADMIN_ENTRY_PATH', '/ops-0123456789abcdef01234567');
    await db.insert(schema.roles).values({ id: 'SUPER_ADMIN' }).onConflictDoNothing();
    await expect(authenticateGoogleUser(pg(), { sub: 'intruder', email: 'other@oauth.test', emailVerified: true, name: 'Other' }, {}, 'ADMIN')).rejects.toMatchObject({ status: 403 });
    await expect(authenticateGoogleUser(pg(), { sub: 'ungranted-owner', email: 'owner@oauth.test', emailVerified: true, name: 'Owner' }, {}, 'ADMIN')).rejects.toMatchObject({ status: 403 });
    expect(await db.select().from(schema.users).where(eq(schema.users.email, 'owner@oauth.test'))).toHaveLength(0);
    const [owner] = await db.insert(schema.users).values({ email: 'owner@oauth.test', passwordHash: 'existing', emailVerifiedAt: new Date() }).returning();
    await db.insert(schema.userRoles).values({ userId: owner.id, roleId: 'SUPER_ADMIN' });
    expect((await authenticateGoogleUser(pg(), { sub: 'owner-google', email: owner.email, emailVerified: true, name: 'Owner' }, {}, 'ADMIN')).userId).toBe(owner.id);
    const [staff] = await db.insert(schema.users).values({ email: 'staff@oauth.test', passwordHash: 'existing', emailVerifiedAt: new Date() }).returning();
    await db.insert(schema.userRoles).values({ userId: staff.id, roleId: 'SUPER_ADMIN' });
    await expect(authenticateGoogleUser(pg(), { sub: 'staff-google', email: staff.email, emailVerified: true, name: 'Staff' }, {}, 'CUSTOMER')).rejects.toMatchObject({ status: 403 });
  });
  it('requires the private return URL for admin intent and preserves that intent in state', async () => {
    const entry = '/ops-0123456789abcdef01234567'; vi.stubEnv('ADMIN_ENTRY_PATH', entry);
    await expect(startGoogleOAuth(pg(), { intent: 'ADMIN', challenge: pkceChallenge('d'.repeat(64)) })).rejects.toMatchObject({ status: 404 });
    const start = await startGoogleOAuth(pg(), { intent: 'ADMIN', redirect: `http://localhost:3002${entry}`, challenge: pkceChallenge('d'.repeat(64)) });
    const url = new URL(start.url);
    expect(url.searchParams.get('login_hint')).toBe('owner@oauth.test');
    const request = await consumeOAuthRequest(pg(), url.searchParams.get('state'), start.browser);
    expect(request.intent).toBe('ADMIN'); expect(new URL(request.returnTo).pathname).toBe(entry);
    const provider = vi.fn().mockResolvedValueOnce(Response.json({ access_token: 'test-token' })).mockResolvedValueOnce(Response.json({ sub: 'owner-google', email: 'owner@oauth.test', email_verified: true, name: 'Owner' }));
    const code = await completeGoogleOAuth(pg(), request, 'test-code', provider);
    expect((await exchangeOAuthGrant(pg(), code, 'd'.repeat(64))).session.authScope).toBe('ADMIN');
  });
  it.each(['CUSTOMER', 'CREATOR', 'DISTRIBUTOR'])('preserves %s intent without granting a partner role', async intent => {
    const verifier = 'b'.repeat(64);
    const start = await startGoogleOAuth(pg(), { intent, challenge: pkceChallenge(verifier) });
    const url = new URL(start.url);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    await expect(consumeOAuthRequest(pg(), url.searchParams.get('state'), 'wrong-browser')).rejects.toMatchObject({ status: 410 });
    const request = await consumeOAuthRequest(pg(), url.searchParams.get('state'), start.browser);
    await expect(consumeOAuthRequest(pg(), url.searchParams.get('state'), start.browser)).rejects.toMatchObject({ status: 410 });
    const provider = vi.fn().mockResolvedValueOnce(Response.json({ access_token: 'provider-token' })).mockResolvedValueOnce(Response.json({ sub: intent, email: `${intent.toLowerCase()}@oauth.test`, email_verified: true, name: intent }));
    const code = await completeGoogleOAuth(pg(), request, 'google-code', provider);
    expect(new URLSearchParams(provider.mock.calls[0][1].body).get('code_verifier')).toHaveLength(64);
    await expect(exchangeOAuthGrant(pg(), code, 'c'.repeat(64))).rejects.toMatchObject({ status: 410 });
    const result = await exchangeOAuthGrant(pg(), code, verifier);
    expect(new URL(result.returnTo).pathname).toBe(intent === 'CREATOR' ? '/creators' : intent === 'DISTRIBUTOR' ? '/distributor' : '/catalogue');
    expect(result.session.token).toHaveLength(64);
    expect(result.session.authScope).toBe('CUSTOMER');
    await expect(exchangeOAuthGrant(pg(), code, verifier)).rejects.toMatchObject({ status: 410 });
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, `${intent.toLowerCase()}@oauth.test`));
    expect(user.signupIntent).toBe(intent);
    expect((await db.select().from(schema.userRoles).where(eq(schema.userRoles.userId, user.id))).map(r => r.roleId)).toEqual(['CUSTOMER']);
  });
  it('does not link an unverified local account or an unverified Google identity', async () => {
    await db.insert(schema.users).values({ email: 'unverified@oauth.test', passwordHash: 'x' });
    await expect(authenticateGoogleUser(pg(), { sub: 'collision', email: 'unverified@oauth.test', name: 'Unverified', emailVerified: true })).rejects.toMatchObject({ status: 409 });
    await expect(authenticateGoogleUser(pg(), { sub: 'unverified', email: 'other@oauth.test', name: 'Unverified', emailVerified: false })).rejects.toMatchObject({ status: 403 });
  });
  it('rejects external returns and strips preview access from authenticated returns', () => {
    expect(safeReturnTo('https://evil.example/steal', 'CREATOR')).toBe('http://localhost:3002/creators');
    expect(safeReturnTo('/creators?preview=design', 'CREATOR')).toBe('http://localhost:3002/creators');
  });
  it('accepts dev loopback returns on alternate ports without resetting to default origin', () => {
    expect(safeReturnTo('http://localhost:3001/creators', 'CREATOR', 'http://localhost:3001')).toBe('http://localhost:3001/creators');
    expect(safeReturnTo('http://127.0.0.1:3001/distributor', 'DISTRIBUTOR', 'http://127.0.0.1:3001')).toBe('http://127.0.0.1:3001/distributor');
  });
});
