import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq, sql } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { createSession, enforceSessionCap, getSessionUser, hashPassword, sha256Hex } from '@/modules/auth/service';
import { authenticateGoogleUser } from '@/modules/auth/google-oauth';
import { sessionCookieName } from '@/lib/cookies';
import { POST as adminLogin } from '@/app/api/auth/admin/login/route';
import { POST as customerLogin } from '@/app/api/auth/login/route';
import { GET as me } from '@/app/api/auth/me/route';
import { POST as logout } from '@/app/api/auth/logout/route';
import { POST as mfaSetup } from '@/app/api/auth/mfa/setup/route';
import { GET as catalogue } from '@/app/api/admin/catalogue/route';
import { GET as cart } from '@/app/api/cart/route';
import { POST as checkout } from '@/app/api/checkout/route';
import { POST as exchange } from '@/app/api/auth/oauth/exchange/route';
import { pkceChallenge } from '@/modules/auth/google-oauth';

const state = vi.hoisted(() => ({ db: null as unknown, cookies: new Map<string, string>(), headers: new Headers() }));
vi.mock('@/db/client', () => ({ getDb: () => state.db }));
vi.mock('@/lib/rate-limit', () => ({ checkSharedRateLimit: async () => ({ allowed: true }), Limits: {} }));
vi.mock('next/headers', () => ({
  headers: async () => state.headers,
  cookies: async () => ({
    get: (name: string) => state.cookies.has(name) ? { value: state.cookies.get(name) } : undefined,
    set: (name: string, value: string, options: { maxAge?: number }) => { if (options.maxAge === 0) state.cookies.delete(name); else state.cookies.set(name, value); },
  }),
}));
let client: PGlite, db: ReturnType<typeof drizzle<typeof schema>>;
let staffId: string, shopperId: string;
const password = 'Session-fixture-password';
const pg = () => db as never;
beforeAll(async () => {
  vi.stubEnv('ADMIN_MFA_REQUIRED', 'true');
  vi.stubEnv('NODE_ENV', 'test'); vi.stubEnv('ADMIN_GOOGLE_EMAIL', 'owner@sessions.test');
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } }); db = drizzle(client, { schema }); state.db = db;
  await migrate(db, { migrationsFolder: './drizzle' });
  await db.insert(schema.roles).values([{ id: 'SUPER_ADMIN' }, { id: 'CUSTOMER' }]).onConflictDoNothing();
  const passwordHash = await hashPassword(password);
  const [staff, shopper] = await db.insert(schema.users).values([
    { email: 'owner@sessions.test', passwordHash, emailVerifiedAt: new Date() },
    { email: 'shopper@sessions.test', passwordHash, emailVerifiedAt: new Date() },
  ]).returning();
  staffId = staff.id; shopperId = shopper.id;
  await db.insert(schema.userRoles).values([{ userId: staffId, roleId: 'SUPER_ADMIN' }, { userId: shopperId, roleId: 'CUSTOMER' }]);
}, 120000);
beforeEach(() => { state.cookies.clear(); state.headers = new Headers(); });
afterAll(async () => { vi.unstubAllEnvs(); vi.unstubAllEnvs(); await client?.close(); });

async function call(handler: (req: Request) => Promise<Response>, path: string, body?: unknown, scope = 'CUSTOMER') {
  state.headers = new Headers({ 'content-type': 'application/json', 'x-desla-auth-context': scope });
  return handler(new Request('http://localhost:3005/api/' + path, { method: body === undefined ? 'GET' : 'POST', headers: state.headers, body: body === undefined ? undefined : JSON.stringify(body) }));
}
const signInAdmin = () => call(adminLogin, 'auth/admin/login', { email: 'owner@sessions.test', password }, 'ADMIN');
const signInShopper = () => call(customerLogin, 'auth/login', { email: 'shopper@sessions.test', password });

describe('independent administrator and storefront identities', () => {
  it('issues only the admin cookie and leaves a fresh storefront anonymous, with staff MFA still required', async () => {
    expect((await signInAdmin()).status).toBe(200);
    expect([...state.cookies.keys()]).toEqual([sessionCookieName('ADMIN')]);
    expect((await call(me, 'auth/me')).status).toBe(401);
    const admin = await call(me, 'auth/me', undefined, 'ADMIN');
    expect(await admin.json()).toMatchObject({ email: 'owner@sessions.test', sessionScope: 'ADMIN', roles: ['SUPER_ADMIN'], mfaVerified: false });
    expect((await call(catalogue, 'admin/catalogue', undefined, 'ADMIN')).status).toBe(403);
    expect((await call(cart, 'cart', undefined, 'ADMIN')).status).toBe(401);
    expect((await call(checkout, 'checkout', {}, 'ADMIN')).status).toBe(401);
  });
  it('keeps a different customer signed in beside the admin and lets admin logout affect only the admin', async () => {
    await signInAdmin(); const adminToken = state.cookies.get(sessionCookieName('ADMIN'));
    await signInShopper();
    expect(state.cookies.get(sessionCookieName('ADMIN'))).toBe(adminToken);
    expect(await (await call(me, 'auth/me')).json()).toMatchObject({ id: shopperId, sessionScope: 'CUSTOMER', roles: ['CUSTOMER'], permissions: [] });
    expect(await (await call(me, 'auth/me', undefined, 'ADMIN')).json()).toMatchObject({ id: staffId });
    await call(logout, 'auth/logout', {}, 'ADMIN');
    expect((await call(me, 'auth/me', undefined, 'ADMIN')).status).toBe(401);
    expect(await (await call(me, 'auth/me')).json()).toMatchObject({ id: shopperId });
  });
  it('keeps the administrator signed in when the customer logs out', async () => {
    await signInAdmin(); await signInShopper();
    await call(logout, 'auth/logout', {});
    expect((await call(me, 'auth/me')).status).toBe(401);
    expect(await (await call(me, 'auth/me', undefined, 'ADMIN')).json()).toMatchObject({ id: staffId });
  });
  it('chooses the Google session cookie from the persisted grant scope, preserving an existing customer cookie', async () => {
    await signInShopper(); const customerToken = state.cookies.get(sessionCookieName());
    const code = 'a'.repeat(64), verifier = 'b'.repeat(64);
    await db.insert(schema.oauthGrants).values({ codeHash: sha256Hex(code), userId: staffId, authScope: 'ADMIN', challenge: pkceChallenge(verifier), returnTo: 'http://localhost:3005/ops-0123456789abcdef', expiresAt: new Date(Date.now() + 60000) });
    expect((await call(exchange, 'auth/oauth/exchange', { code, verifier })).status).toBe(200);
    expect(state.cookies.get(sessionCookieName())).toBe(customerToken);
    expect(await (await call(me, 'auth/me')).json()).toMatchObject({ id: shopperId });
    expect(await (await call(me, 'auth/me', undefined, 'ADMIN')).json()).toMatchObject({ id: staffId, sessionScope: 'ADMIN' });
  });
  it('binds tokens to their server-side scope even if cookie names or context headers are changed', async () => {
    await signInAdmin(); const adminToken = state.cookies.get(sessionCookieName('ADMIN'))!;
    await signInShopper(); const customerToken = state.cookies.get(sessionCookieName())!;
    state.cookies.set(sessionCookieName(), adminToken); state.cookies.set(sessionCookieName('ADMIN'), customerToken);
    expect((await call(me, 'auth/me')).status).toBe(401);
    expect((await call(me, 'auth/me', undefined, 'ADMIN')).status).toBe(401);
    expect((await call(mfaSetup, 'auth/mfa/setup', { password }, 'ADMIN')).status).toBe(401);
  });
  it('does not allow a staff-only identity to become a storefront login through password or Google', async () => {
    const response = await call(customerLogin, 'auth/login', { email: 'owner@sessions.test', password });
    expect(response.status).toBe(403); expect(state.cookies.has(sessionCookieName())).toBe(false);
    await expect(authenticateGoogleUser(pg(), { sub: 'staff-google-test', email: 'owner@sessions.test', name: 'Owner', emailVerified: true }, {}, 'CUSTOMER')).rejects.toMatchObject({ status: 403 });
    await authenticateGoogleUser(pg(), { sub: 'staff-google-test', email: 'owner@sessions.test', name: 'Owner', emailVerified: true }, {}, 'ADMIN');
    expect((await db.select().from(schema.userRoles).where(eq(schema.userRoles.userId, staffId))).map(row => row.roleId)).toEqual(['SUPER_ADMIN']);
  });
  it('does not expire the customer session when the administrator session expires', async () => {
    await signInAdmin(); await signInShopper();
    await db.update(schema.userSessions).set({ expiresAt: new Date(0) }).where(eq(schema.userSessions.tokenHash, sha256Hex(state.cookies.get(sessionCookieName('ADMIN'))!)));
    expect((await call(me, 'auth/me', undefined, 'ADMIN')).status).toBe(401);
    expect(await (await call(me, 'auth/me')).json()).toMatchObject({ id: shopperId });
  });
  it('keeps 20,000 independent stored sessions and applies the session cap to only the selected account and scope', async () => {
    await db.execute(sql`INSERT INTO users (email, password_hash, email_verified_at) SELECT 'load-' || n || '@sessions.test', 'isolated-load-fixture', now() FROM generate_series(1, 20000) n`);
    await db.execute(sql`INSERT INTO user_roles (user_id, role_id) SELECT id, 'CUSTOMER' FROM users WHERE email LIKE 'load-%@sessions.test'`);
    await db.execute(sql`INSERT INTO user_sessions (user_id, token_hash, auth_scope, expires_at) SELECT id, encode(digest(email, 'sha256'), 'hex'), 'CUSTOMER', now() + interval '1 day' FROM users WHERE email LIKE 'load-%@sessions.test'`);
    for (const n of [1, 9999, 20000]) expect((await getSessionUser(pg(), `load-${n}@sessions.test`))?.user.email).toBe(`load-${n}@sessions.test`);
    const target = (await getSessionUser(pg(), 'load-1@sessions.test'))!.user.id;
    const otherScope = await createSession(pg(), target, { authScope: 'ADMIN' });
    await enforceSessionCap(pg(), target, 1, 'CUSTOMER');
    await createSession(pg(), target);
    expect((await getSessionUser(pg(), otherScope.token))?.authScope).toBe('ADMIN');
    const count = await db.execute(sql`SELECT count(*) AS total FROM user_sessions JOIN users ON users.id = user_sessions.user_id WHERE users.email LIKE 'load-%@sessions.test' AND user_sessions.auth_scope = 'CUSTOMER' AND user_sessions.revoked_at IS NULL`);
    expect(Number(count.rows[0].total)).toBe(20000);
    expect((await getSessionUser(pg(), 'load-20000@sessions.test'))?.authScope).toBe('CUSTOMER');
  }, 60000);
});
