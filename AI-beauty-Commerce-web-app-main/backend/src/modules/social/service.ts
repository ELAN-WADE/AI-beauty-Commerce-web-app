import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt, isNull, isNotNull, lt } from 'drizzle-orm';
import type { Db } from '../../db/client';
import type { AuthContext } from '../auth/require-auth';
import { ownedPartner } from '../partners/service';
import { Errors } from '../../lib/errors';
import { socialConnections, socialOAuthRequests } from './schema';
import { authorizationUrl, exchangeSocial, openSocial, sealSocial, socialConfig, socialReady, type Candidate, type SocialProvider } from './provider';
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export const socialCookie = (provider: SocialProvider) => 'desla_social_' + provider;
export async function socialStatus(db: Db, auth: AuthContext) {
  await ownedPartner(db, auth.userId, 'CREATOR');
  const providers = (['tiktok', 'instagram'] as const).map(provider => ({ provider, configured: socialReady(provider) }));
  // Setup should remain usable before the optional migration/credentials are deployed.
  if (!providers.some(item => item.configured)) return { providers: providers.map(item => ({ ...item, connection: null })), pending: [] };
  const rows = await db.select().from(socialConnections).where(eq(socialConnections.userId, auth.userId));
  const pending = await db.select().from(socialOAuthRequests).where(and(eq(socialOAuthRequests.userId, auth.userId), eq(socialOAuthRequests.sessionId, auth.sessionId), gt(socialOAuthRequests.expiresAt, new Date()), isNotNull(socialOAuthRequests.choicesEncrypted)));
  return {
    providers: providers.map(item => {
      const row = rows.find(row => row.provider === item.provider);
      return { ...item, connection: row ? { ...row.profile, connected: row.expiresAt > new Date(), expiresAt: row.expiresAt.toISOString(), updatedAt: row.updatedAt.toISOString() } : null };
    }),
    pending: pending.map(row => ({ provider: row.provider, grant: row.stateHash, accounts: openSocial<Candidate[]>(row.choicesEncrypted!, row.stateHash).map(item => ({ accountId: item.accountId, ...item.profile })) })),
  };
}
export async function startSocial(db: Db, auth: AuthContext, provider: SocialProvider, origin: string) {
  await ownedPartner(db, auth.userId, 'CREATOR');
  const config = socialConfig(provider);
  if (new URL(config.callback).origin !== origin) throw Errors.badRequest('Start this connection on the site registered in the social callback URL.');
  const state = randomBytes(32).toString('base64url'), proof = randomBytes(32).toString('base64url');
  await db.transaction(async tx => {
    await tx.delete(socialOAuthRequests).where(lt(socialOAuthRequests.expiresAt, new Date()));
    await tx.delete(socialOAuthRequests).where(and(eq(socialOAuthRequests.userId, auth.userId), eq(socialOAuthRequests.provider, provider), eq(socialOAuthRequests.sessionId, auth.sessionId)));
    await tx.insert(socialOAuthRequests).values({ stateHash: hash(state), userId: auth.userId, sessionId: auth.sessionId, provider, browserHash: hash(proof), callbackUrl: config.callback, expiresAt: new Date(Date.now() + 600000) });
  });
  return { authorizationUrl: authorizationUrl(provider, state), proof };
}
export async function completeSocial(db: Db, auth: AuthContext, provider: SocialProvider, state: string, proof: string, code?: string) {
  await ownedPartner(db, auth.userId, 'CREATOR');
  if (!state || state.length > 128 || !proof || proof.length > 128) throw Errors.gone('This connection request is invalid or expired. Please reconnect.');
  const [request] = await db.update(socialOAuthRequests).set({ consumedAt: new Date() }).where(and(eq(socialOAuthRequests.stateHash, hash(state)), eq(socialOAuthRequests.browserHash, hash(proof)), eq(socialOAuthRequests.userId, auth.userId), eq(socialOAuthRequests.sessionId, auth.sessionId), eq(socialOAuthRequests.provider, provider), gt(socialOAuthRequests.expiresAt, new Date()), isNull(socialOAuthRequests.consumedAt))).returning();
  if (!request) throw Errors.gone('This connection request is invalid or expired. Please reconnect.');
  if (!code || code.length > 4096) throw Errors.badRequest('Social account authorization was cancelled. You can try again.');
  if (request.callbackUrl !== socialConfig(provider).callback) throw Errors.gone('Connection settings changed. Please reconnect.');
  const candidates = await exchangeSocial(provider, code);
  const [saved] = await db.update(socialOAuthRequests).set({ choicesEncrypted: sealSocial(candidates, request.stateHash) }).where(and(eq(socialOAuthRequests.stateHash, request.stateHash), gt(socialOAuthRequests.expiresAt, new Date()))).returning();
  if (!saved) throw Errors.gone();
  if (candidates.length === 1) await chooseSocial(db, auth, provider, request.stateHash, candidates[0].accountId);
  return { selectionRequired: candidates.length > 1 };
}
export async function chooseSocial(db: Db, auth: AuthContext, provider: SocialProvider, grant: string, accountId: string) {
  await ownedPartner(db, auth.userId, 'CREATOR');
  try {
    await db.transaction(async tx => {
      const [request] = await tx.select().from(socialOAuthRequests).where(and(eq(socialOAuthRequests.stateHash, grant), eq(socialOAuthRequests.userId, auth.userId), eq(socialOAuthRequests.sessionId, auth.sessionId), eq(socialOAuthRequests.provider, provider), gt(socialOAuthRequests.expiresAt, new Date()), isNotNull(socialOAuthRequests.choicesEncrypted))).for('update');
      if (!request) throw Errors.gone();
      const candidate = openSocial<Candidate[]>(request.choicesEncrypted!, grant).find(item => item.accountId === accountId);
      if (!candidate || new Date(candidate.expiresAt) <= new Date()) throw Errors.badRequest('Choose one of the authorized accounts.');
      const values = { accountId, profile: candidate.profile, tokenEncrypted: sealSocial(candidate.tokens, auth.userId + ':' + provider), expiresAt: new Date(candidate.expiresAt), updatedAt: new Date() };
      await tx.insert(socialConnections).values({ userId: auth.userId, provider, ...values }).onConflictDoUpdate({ target: [socialConnections.userId, socialConnections.provider], set: values });
      await tx.delete(socialOAuthRequests).where(eq(socialOAuthRequests.stateHash, grant));
    });
  } catch (error) {
    if ((error as { code?: string }).code === '23505' || (error as { cause?: { code?: string } }).cause?.code === '23505') throw Errors.conflict('This social account is already connected to another creator.');
    throw error;
  }
}
export async function disconnectSocial(db: Db, auth: AuthContext, provider: SocialProvider) {
  await ownedPartner(db, auth.userId, 'CREATOR');
  // Local disconnection is explicit; no claim that provider-side consent was revoked.
  await db.transaction(async tx => {
    await tx.delete(socialOAuthRequests).where(and(eq(socialOAuthRequests.userId, auth.userId), eq(socialOAuthRequests.provider, provider)));
    await tx.delete(socialConnections).where(and(eq(socialConnections.userId, auth.userId), eq(socialConnections.provider, provider)));
  });
}
