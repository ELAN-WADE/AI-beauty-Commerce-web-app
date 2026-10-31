import type { MetadataRoute } from 'next';
import { publicSiteOrigin } from '../lib/site-seo';
export default function robots(): MetadataRoute.Robots {
  const origin = publicSiteOrigin();
  return { rules: { userAgent: '*', ...(origin ? { allow: '/', disallow: ['/api/', '/admin', '/account', '/orders', '/cart', '/checkout', '/creators', '/distributor/', '/login', '/signup', '/verify-email', '/reset-password', '/community'] } : { disallow: '/' }) }, ...(origin ? { sitemap: origin + '/sitemap.xml' } : {}) };
}
