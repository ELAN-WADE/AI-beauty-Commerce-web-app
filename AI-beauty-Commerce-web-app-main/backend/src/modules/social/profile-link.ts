export class ProfileLinkError extends Error {}
export type LinkProvider = 'tiktok' | 'instagram';
export function normalizeProfileLink(provider: LinkProvider, value: string) {
  let url: URL; try { url = new URL(value.trim()); } catch { throw new ProfileLinkError('Enter a complete HTTPS profile URL.'); }
  const host = provider === 'tiktok' ? 'tiktok.com' : 'instagram.com';
  if (url.protocol !== 'https:' || ![host, 'www.' + host].includes(url.hostname) || url.username || url.password || url.port) throw new ProfileLinkError('Use the official ' + host + ' HTTPS profile address.');
  const match = provider === 'tiktok' ? /^\/@([a-zA-Z0-9._]{1,30})\/?$/.exec(url.pathname) : /^\/([a-zA-Z0-9._]{1,30})\/?$/.exec(url.pathname);
  if (!match || ['accounts','explore','reels','reel','p','stories','direct','login','signup','settings','about'].includes(match[1].toLowerCase())) throw new ProfileLinkError('Enter your profile address, not a post or sign-in page.');
  return { handle: '@' + match[1], profileUrl: 'https://www.' + host + '/' + (provider === 'tiktok' ? '@' : '') + match[1] + (provider === 'instagram' ? '/' : '') };
}
