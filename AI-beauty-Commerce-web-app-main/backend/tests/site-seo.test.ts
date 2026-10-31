import { afterEach, describe, expect, it, vi } from 'vitest';
import { absoluteAsset, privateSearchSurface, productStructuredData, publicSiteOrigin, safeJsonLd } from '@/storefront/lib/site-seo';
import type { Product } from '@/storefront/types';
afterEach(() => vi.unstubAllEnvs());
describe('public search metadata boundaries', () => {
  it('rejects a production localhost or non-origin canonical base', () => {
    vi.stubEnv('NODE_ENV', 'production');
    for (const value of ['http://localhost:3000', 'https://store.example/path', 'https://user:password@store.example']) {
      vi.stubEnv('PUBLIC_SITE_URL', value); expect(publicSiteOrigin()).toBeNull();
    }
    vi.stubEnv('PUBLIC_SITE_URL', 'https://store.example'); expect(publicSiteOrigin()).toBe('https://store.example');
  });
  it('keeps absolute product image URLs intact and rejects executable URLs', () => {
    expect(absoluteAsset('https://cdn.example/image.jpg', 'https://store.example')).toBe('https://cdn.example/image.jpg');
    expect(absoluteAsset('/image.jpg', 'https://store.example')).toBe('https://store.example/image.jpg');
    expect(absoluteAsset('javascript:alert(1)', 'https://store.example')).toBeUndefined();
  });
  it('escapes script delimiters while preserving valid JSON data', () => {
    const value = { name: '</script><img src=x>' }, json = safeJsonLd(value);
    expect(json).not.toContain('<'); expect(JSON.parse(json)).toEqual(value);
  });
  it('separates private role workspaces from the public distributor directory', () => {
    expect(privateSearchSurface('/distributor')).toBe(true);
    expect(privateSearchSurface('/distributors')).toBe(false);
    expect(privateSearchSurface('/', 'account')).toBe(true);
    expect(privateSearchSurface('/', 'creators')).toBe(true);
    expect(privateSearchSurface('/products/saved-formulation')).toBe(false);
  });
  it('uses saved active variant prices and includes ratings only when actual reviews exist', () => {
    const product = { id: 'saved-product', name: 'Saved product', description: 'Entered description', brand: 'Saved brand', price: 123.45, image: '/image.jpg', inStock: true, reviewsCount: 0, rating: 0,
      variants: [{ priceNgn: 123.45, isActive: true }, { priceNgn: 246.9, isActive: true }, { priceNgn: 1, isActive: false }] } as Product;
    const schema = productStructuredData(product, 'https://store.example')!;
    expect(schema.offers).toMatchObject({ lowPrice: 123.45, highPrice: 246.9, offerCount: 2, priceCurrency: 'NGN' });
    expect(schema.aggregateRating).toBeUndefined();
    expect(productStructuredData({ ...product, reviewsCount: 1, rating: 4 }, 'https://store.example')?.aggregateRating).toMatchObject({ reviewCount: 1, ratingValue: 4 });
    expect(productStructuredData(product, null)).toBeNull();
  });
});
