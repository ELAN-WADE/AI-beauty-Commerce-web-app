import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { ApiError, Errors } from '../../lib/errors';
export const providerSchema = z.enum(['tiktok', 'instagram']);
export type SocialProvider = z.infer<typeof providerSchema>;
export interface Candidate {
  accountId: string;
  profile: { handle: string; displayName: string; followers: number | null; profileUrl: string };
  tokens: { access: string; refresh?: string; scopes: string[] };
  expiresAt: string;
}
const unavailable = () => new ApiError(503, 'social_not_configured', 'This social connection needs developer app setup. Please try again after setup is complete.');
export const providerFailure = () => new ApiError(502, 'social_provider_failed', 'The social provider could not complete authorization. Please reconnect and grant the requested account access.', true);
function key() {
  const value = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY;
  if (!value || !/^[a-f0-9]{64}$/i.test(value)) throw unavailable();
  return Buffer.from(value, 'hex');
}
export function sealSocial(value: unknown, owner: string): string {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key(), iv);
  cipher.setAAD(Buffer.from(owner));
  const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map(item => item.toString('base64url')).join('.');
}
export function openSocial<T>(value: string, owner: string): T {
  try {
    const [iv, tag, data] = value.split('.').map(item => Buffer.from(item, 'base64url'));
    const decipher = createDecipheriv('aes-256-gcm', key(), iv);
    decipher.setAAD(Buffer.from(owner)); decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')) as T;
  } catch { throw providerFailure(); }
}
export function socialConfig(provider: SocialProvider) {
  key();
  const prefix = provider === 'tiktok' ? 'TIKTOK' : 'META';
  const client = process.env[prefix + (provider === 'tiktok' ? '_CLIENT_KEY' : '_APP_ID')];
  const secret = process.env[prefix + (provider === 'tiktok' ? '_CLIENT_SECRET' : '_APP_SECRET')];
  const callback = process.env[provider === 'tiktok' ? 'TIKTOK_REDIRECT_URI' : 'INSTAGRAM_REDIRECT_URI'];
  const version = process.env.META_GRAPH_VERSION || '';
  if (!client || !secret || !callback || (provider === 'instagram' && !/^v[1-9]\d*\.0$/.test(version))) throw unavailable();
  try {
    const url = new URL(callback);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/api/creator/social/' + provider + '/callback') throw unavailable();
  } catch { throw unavailable(); }
  return { client, secret, callback, version };
}
export function socialReady(provider: SocialProvider) { try { socialConfig(provider); return true; } catch { return false; } }
export function authorizationUrl(provider: SocialProvider, state: string) {
  const config = socialConfig(provider);
  const url = new URL(provider === 'tiktok' ? 'https://www.tiktok.com/v2/auth/authorize/' : 'https://www.facebook.com/' + config.version + '/dialog/oauth');
  url.search = new URLSearchParams({
    [provider === 'tiktok' ? 'client_key' : 'client_id']: config.client,
    redirect_uri: config.callback, response_type: 'code', state,
    scope: provider === 'tiktok' ? 'user.info.basic,user.info.profile,user.info.stats' : 'public_profile,pages_show_list,pages_read_engagement,instagram_basic',
  }).toString();
  return url.toString();
}
// Provider errors and response bodies never reach logs or the public error envelope.
async function json(url: string, init: RequestInit = {}) {
  try {
    const response = await fetch(url, { ...init, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw providerFailure();
    const value = await response.json();
    if (value.error && value.error.code !== 'ok') throw providerFailure();
    return value;
  } catch { throw providerFailure(); }
}
const token = z.object({ access_token: z.string().min(1), expires_in: z.number().int().positive().max(366 * 86400) });
const followers = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
export async function exchangeSocial(provider: SocialProvider, code: string): Promise<Candidate[]> {
  const config = socialConfig(provider);
  if (provider === 'tiktok') {
    const data = await json('https://open.tiktokapis.com/v2/oauth/token/', { method: 'POST', body: new URLSearchParams({ client_key: config.client, client_secret: config.secret, code, grant_type: 'authorization_code', redirect_uri: config.callback }) });
    const parsed = token.extend({ open_id: z.string().min(1), refresh_token: z.string().optional(), scope: z.string() }).safeParse(data);
    if (!parsed.success) throw providerFailure();
    const granted = parsed.data.scope.split(',');
    if (!granted.includes('user.info.basic')) throw providerFailure();
    const fields = ['open_id', 'display_name'];
    if (granted.includes('user.info.profile')) fields.push('username', 'profile_deep_link');
    if (granted.includes('user.info.stats')) fields.push('follower_count');
    const info = await json('https://open.tiktokapis.com/v2/user/info/?fields=' + fields.join(','), { headers: { Authorization: 'Bearer ' + parsed.data.access_token } });
    const user = info.data?.user;
    if (!user || user.open_id !== parsed.data.open_id || typeof user.display_name !== 'string') throw providerFailure();
    const username = typeof user.username === 'string' && /^[\w.]{1,64}$/.test(user.username) ? user.username : '';
    return [{ accountId: user.open_id, profile: { handle: username ? '@' + username : user.display_name.slice(0, 120), displayName: user.display_name.slice(0, 120), followers: followers(user.follower_count), profileUrl: username ? 'https://www.tiktok.com/@' + username : '' }, tokens: { access: parsed.data.access_token, refresh: parsed.data.refresh_token, scopes: granted }, expiresAt: new Date(Date.now() + parsed.data.expires_in * 1000).toISOString() }];
  }
  const base = 'https://graph.facebook.com/' + config.version;
  const short = await json(base + '/oauth/access_token', { method: 'POST', body: new URLSearchParams({ client_id: config.client, client_secret: config.secret, redirect_uri: config.callback, code }) });
  if (typeof short.access_token !== 'string') throw providerFailure();
  const long = token.safeParse(await json(base + '/oauth/access_token', { method: 'POST', body: new URLSearchParams({ grant_type: 'fb_exchange_token', client_id: config.client, client_secret: config.secret, fb_exchange_token: short.access_token }) }));
  if (!long.success) throw providerFailure();
  const authorization = { Authorization: 'Bearer ' + long.data.access_token };
  const pages = await json(base + '/me/accounts?fields=id,name,access_token,instagram_business_account&limit=100', { headers: authorization });
  if (!Array.isArray(pages.data)) throw providerFailure();
  // Bound discovery. Never silently choose the first Page or follow arbitrary paging URLs.
  if (pages.paging?.next) throw Errors.badRequest('Too many Pages were granted. Reconnect and grant only the Pages you want to use.');
  const candidates: Candidate[] = [];
  for (const page of pages.data) {
    const id = page.instagram_business_account?.id;
    if (typeof id !== 'string' || !/^\d{1,40}$/.test(id) || typeof page.access_token !== 'string') continue;
    if (candidates.length >= 20) throw Errors.badRequest('Reconnect and grant fewer Instagram accounts.');
    const user = await json(base + '/' + id + '?fields=id,username,name,followers_count', { headers: { Authorization: 'Bearer ' + page.access_token } });
    if (user.id !== id || typeof user.username !== 'string' || !/^[\w.]{1,64}$/.test(user.username)) throw providerFailure();
    candidates.push({ accountId: id, profile: { handle: '@' + user.username, displayName: typeof user.name === 'string' ? user.name.slice(0, 120) : user.username, followers: followers(user.followers_count), profileUrl: 'https://www.instagram.com/' + user.username + '/' }, tokens: { access: page.access_token, scopes: ['instagram_basic', 'pages_show_list', 'pages_read_engagement'] }, expiresAt: new Date(Date.now() + long.data.expires_in * 1000).toISOString() });
  }
  if (!candidates.length) throw Errors.badRequest('Connect an Instagram professional account linked to a Facebook Page and grant Page access.');
  return candidates;
}
