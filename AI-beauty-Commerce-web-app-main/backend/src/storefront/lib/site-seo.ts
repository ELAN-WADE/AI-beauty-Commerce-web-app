import type { Product } from '../types';
export function publicSiteOrigin(): string | null {
  const configured = process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || process.env.APP_URL;
  try {
    const url = new URL(configured || (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : ''));
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    if (process.env.NODE_ENV === 'production' && (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) return null;
    return url.origin;
  } catch { return null; }
}
export function absoluteAsset(source: string, origin: string | null): string | undefined {
  try { const url = new URL(source, origin || undefined); return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined; } catch { return undefined; }
}
export function productStructuredData(product: Product, origin: string | null) {
  if (!origin) return null;
  const variants = product.variants?.filter(variant => variant.isActive) || [];
  const prices = variants.length ? variants.map(variant => variant.priceNgn) : [product.price];
  return {
    '@context': 'https://schema.org', '@type': 'Product', name: product.name, description: product.description || product.tagline,
    ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
    ...(absoluteAsset(product.image, origin) ? { image: absoluteAsset(product.image, origin) } : {}),
    url: origin + '/products/' + encodeURIComponent(product.id),
    offers: { '@type': 'AggregateOffer', priceCurrency: 'NGN', lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: Math.max(1, variants.length), availability: 'https://schema.org/' + (product.inStock ? 'InStock' : 'OutOfStock') },
    ...(product.reviewsCount > 0 && product.rating > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviewsCount } } : {}),
  };
}
export const safeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');
export function privateSearchSurface(pathname: string, screen?: string | null) {
  const paths = ['admin', 'account', 'orders', 'cart', 'checkout', 'creators', 'distributor', 'login', 'signup', 'forgot-password', 'reset-password', 'verify-email', 'community'];
  return paths.some(path => pathname === '/' + path || pathname.startsWith('/' + path + '/')) ||
    ['admin-console', 'account', 'orders', 'cart', 'checkout', 'payment', 'creators', 'distributor-portal', 'login', 'signup', 'verify-email', 'reset-password', 'forgot-password', 'community'].includes(screen || '');
}
