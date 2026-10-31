import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';
import { completeSocial, chooseSocial, disconnectSocial, socialStatus, startSocial } from '@/modules/social/service';
import { openSocial, sealSocial, socialConfig, type Candidate } from '@/modules/social/provider';
import type { AuthContext } from '@/modules/auth/require-auth';
let client: PGlite, db: ReturnType<typeof drizzle<typeof schema>>, owner: AuthContext, stranger: AuthContext;
const pg = () => db as never;
function config() {
  vi.stubEnv('SOCIAL_TOKEN_ENCRYPTION_KEY', '12'.repeat(32));
  vi.stubEnv('TIKTOK_CLIENT_KEY', 'test-client');
  vi.stubEnv('TIKTOK_CLIENT_SECRET', 'test-secret');
  vi.stubEnv('TIKTOK_REDIRECT_URI', 'https://shop.example/api/creator/social/tiktok/callback');
}
beforeAll(async () => {
  const { pgcrypto } = await import('@electric-sql/pglite/contrib/pgcrypto');
  const { uuid_ossp } = await import('@electric-sql/pglite/contrib/uuid_ossp');
  client = new PGlite({ extensions: { pgcrypto, uuid_ossp } }); db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: './drizzle' });
  await db.insert(schema.roles).values({ id: 'CREATOR' }).onConflictDoNothing();
  const contexts = [];
  for (const email of ['owner@social.example', 'stranger@social.example']) {
    const [user] = await db.insert(schema.users).values({ email, passwordHash: 'fixture', emailVerifiedAt: new Date() }).returning();
    const [session] = await db.insert(schema.userSessions).values({ userId: user.id, tokenHash: user.id, expiresAt: new Date(Date.now() + 3600000) }).returning();
    await db.insert(schema.userRoles).values({ userId: user.id, roleId: 'CREATOR' });
    await db.insert(schema.creators).values({ userId: user.id, name: 'Actual fixture creator', verified: true, promoCode: user.id.slice(0, 8) });
    contexts.push({ userId: user.id, email, emailVerified: true, roles: ['CREATOR'], sessionId: session.id });
  }
  [owner, stranger] = contexts;
}, 120000);
afterAll(async () => { await client?.close(); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe('creator social ownership and callback security', () => {
  it('reports missing setup and refuses insecure or wrong callback origins', async () => {
    vi.stubEnv('SOCIAL_TOKEN_ENCRYPTION_KEY', '');
    expect((await socialStatus(pg(), owner)).providers.every(item => !item.configured)).toBe(true);
    await expect(startSocial(pg(), owner, 'tiktok', 'https://shop.example')).rejects.toMatchObject({ status: 503 });
    config();
    await expect(startSocial(pg(), owner, 'tiktok', 'https://attacker.example')).rejects.toMatchObject({ status: 400 });
    vi.stubEnv('TIKTOK_REDIRECT_URI', 'http://localhost:3000/api/creator/social/tiktok/callback');
    expect(() => socialConfig('tiktok')).toThrow();
  });
  it('binds the flow to owner, session, browser proof and a single use; persists only encrypted tokens', async () => {
    config();
    const begin = await startSocial(pg(), owner, 'tiktok', 'https://shop.example');
    const state = new URL(begin.authorizationUrl).searchParams.get('state')!;
    expect(begin.authorizationUrl).not.toContain('test-secret');
    await expect(completeSocial(pg(), stranger, 'tiktok', state, begin.proof, 'code')).rejects.toMatchObject({ status: 410 });
    await expect(completeSocial(pg(), { ...owner, sessionId: stranger.sessionId }, 'tiktok', state, begin.proof, 'code')).rejects.toMatchObject({ status: 410 });
    await expect(completeSocial(pg(), owner, 'tiktok', state, 'wrong', 'code')).rejects.toMatchObject({ status: 410 });
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ access_token: 'private-access', refresh_token: 'private-refresh', expires_in: 3600, open_id: 'provider-owner', scope: 'user.info.basic' })).mockResolvedValueOnce(Response.json({ data: { user: { open_id: 'provider-owner', display_name: 'Provider name' } }, error: { code: 'ok' } }));
    vi.stubGlobal('fetch', fetcher);
    await completeSocial(pg(), owner, 'tiktok', state, begin.proof, 'code');
    await expect(completeSocial(pg(), owner, 'tiktok', state, begin.proof, 'code')).rejects.toMatchObject({ status: 410 });
    expect(fetcher).toHaveBeenCalledTimes(2);
    const [saved] = await db.select().from(schema.socialConnections).where(eq(schema.socialConnections.userId, owner.userId));
    expect(saved.tokenEncrypted).not.toContain('private-access');
    expect(openSocial(saved.tokenEncrypted, owner.userId + ':tiktok')).toMatchObject({ access: 'private-access' });
    expect(() => openSocial(saved.tokenEncrypted, stranger.userId + ':tiktok')).toThrow();
    const status = await socialStatus(pg(), owner);
    expect(JSON.stringify(status)).not.toMatch(/private-access|private-refresh|tokenEncrypted|browserHash/);
    expect(status.providers[0].connection).toMatchObject({ connected: true, handle: 'Provider name', followers: null });
    expect((await socialStatus(pg(), stranger)).providers[0].connection).toBeNull();
  });
  it('selects only an authorized Instagram account and leaves other owners connected', async () => {
    config();
    const grant = 'a'.repeat(64);
    const candidates: Candidate[] = ['123', '456'].map(accountId => ({ accountId, profile: { handle: '@account' + accountId, displayName: 'Instagram profile', followers: 8, profileUrl: 'https://www.instagram.com/account' + accountId + '/' }, tokens: { access: 'page-secret-' + accountId, scopes: ['instagram_basic'] }, expiresAt: new Date(Date.now() + 3600000).toISOString() }));
    await db.insert(schema.socialOAuthRequests).values({ stateHash: grant, userId: owner.userId, sessionId: owner.sessionId, provider: 'instagram', browserHash: 'bound', callbackUrl: 'https://shop.example/api/creator/social/instagram/callback', consumedAt: new Date(), expiresAt: new Date(Date.now() + 600000), choicesEncrypted: sealSocial(candidates, grant) });
    await expect(chooseSocial(pg(), stranger, 'instagram', grant, '123')).rejects.toMatchObject({ status: 410 });
    await expect(chooseSocial(pg(), owner, 'instagram', grant, 'not-authorized')).rejects.toMatchObject({ status: 400 });
    await chooseSocial(pg(), owner, 'instagram', grant, '456');
    const status = await socialStatus(pg(), owner);
    expect(status.providers.find(item => item.provider === 'instagram')?.connection?.handle).toBe('@account456');
    await disconnectSocial(pg(), stranger, 'instagram');
    expect((await db.select().from(schema.socialConnections).where(eq(schema.socialConnections.userId, owner.userId))).length).toBe(2);
    await disconnectSocial(pg(), owner, 'instagram');
    expect((await socialStatus(pg(), owner)).providers.find(item => item.provider === 'instagram')?.connection).toBeNull();
  });
  it('rejects creators without an approved linked profile', async () => {
    config();
    const [user] = await db.insert(schema.users).values({ email: 'not-approved@social.example', passwordHash: 'fixture' }).returning();
    await expect(socialStatus(pg(), { ...owner, userId: user.id })).rejects.toMatchObject({ status: 403 });
  });
  it('expires authorization requests and consumes a cancellation without exchanging credentials', async () => {
    config(); const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    const expired = await startSocial(pg(), owner, 'tiktok', 'https://shop.example');
    await db.update(schema.socialOAuthRequests).set({ expiresAt: new Date(Date.now() - 1) }).where(eq(schema.socialOAuthRequests.userId, owner.userId));
    await expect(completeSocial(pg(), owner, 'tiktok', new URL(expired.authorizationUrl).searchParams.get('state')!, expired.proof, 'code')).rejects.toMatchObject({ status: 410 });
    const cancelled = await startSocial(pg(), owner, 'tiktok', 'https://shop.example');
    const state = new URL(cancelled.authorizationUrl).searchParams.get('state')!;
    await expect(completeSocial(pg(), owner, 'tiktok', state, cancelled.proof)).rejects.toMatchObject({ status: 400 });
    await expect(completeSocial(pg(), owner, 'tiktok', state, cancelled.proof, 'code')).rejects.toMatchObject({ status: 410 });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('prevents a provider account from being taken over by another approved creator', async () => {
    config(); const grant = 'b'.repeat(64);
    const candidate: Candidate = { accountId: 'provider-owner', profile: { handle: 'Provider name', displayName: 'Provider name', followers: null, profileUrl: '' }, tokens: { access: 'other-token', scopes: ['user.info.basic'] }, expiresAt: new Date(Date.now() + 3600000).toISOString() };
    await db.insert(schema.socialOAuthRequests).values({ stateHash: grant, userId: stranger.userId, sessionId: stranger.sessionId, provider: 'tiktok', browserHash: 'bound', callbackUrl: 'https://shop.example/api/creator/social/tiktok/callback', consumedAt: new Date(), expiresAt: new Date(Date.now() + 600000), choicesEncrypted: sealSocial([candidate], grant) });
    await expect(chooseSocial(pg(), stranger, 'tiktok', grant, candidate.accountId)).rejects.toMatchObject({ status: 409 });
    expect((await socialStatus(pg(), owner)).providers[0].connection?.handle).toBe('Provider name');
  });
});
