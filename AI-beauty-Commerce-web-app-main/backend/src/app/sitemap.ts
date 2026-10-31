import type { MetadataRoute } from 'next';
import { listProductSlugs } from '@/lib/server-catalog';
import { publicSiteOrigin } from '@/storefront/lib/site-seo';
export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = publicSiteOrigin(); if (!origin) return [];
  const slugs = await listProductSlugs(45000);
  return ['/', '/catalogue', '/categories', '/distributors', ...slugs.map(slug => '/products/' + encodeURIComponent(slug))].map(path => ({ url: origin + path }));
}
