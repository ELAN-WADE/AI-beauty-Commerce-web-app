import type { MetadataRoute } from 'next';
import { publicSiteOrigin } from '../lib/site-seo';
import { publicProductSlugs } from '../lib/server-public-catalog';
export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = publicSiteOrigin(); if (!origin) return [];
  const slugs = await publicProductSlugs();
  return ['/', '/catalogue', '/distributors', ...slugs.map(slug => '/products/' + encodeURIComponent(slug))].map(path => ({ url: origin + path }));
}
