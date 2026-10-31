import { cache } from 'react';
import { mapOwned } from './owned-api';
const upstream = () => (process.env.API_UPSTREAM_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3005').replace(/\/+$/, '');
export const getPublicProduct = cache(async (slug: string) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const response = await fetch(upstream() + '/api/products/' + encodeURIComponent(slug), { next: { revalidate: 60, tags: ['public-catalogue'] }, signal: AbortSignal.timeout(10000) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('The catalogue is temporarily unavailable.');
  return mapOwned(await response.json());
});
export async function publicProductSlugs() {
  const slugs: string[] = []; let cursor: string | null = null;
  try {
    for (let page = 0; page < 450; page++) {
      const url = new URL(upstream() + '/api/products'); url.searchParams.set('limit', '100'); if (cursor) url.searchParams.set('cursor', cursor);
      const response = await fetch(url, { next: { revalidate: 3600, tags: ['public-catalogue'] }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) break;
      const data = await response.json(); slugs.push(...data.items.map((product: { slug: string }) => product.slug)); cursor = data.nextCursor; if (!cursor) break;
    }
  } catch { /* Return only saved public entries actually read. */ }
  return slugs;
}
