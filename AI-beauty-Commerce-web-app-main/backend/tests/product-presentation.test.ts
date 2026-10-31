import { describe, expect, it } from 'vitest';
import { mapOwned } from '@/storefront/lib/owned-api';
import { mapOwned as rootMap } from '../../src/lib/owned-api';
const product = {
  slug: 'actual-formulation', name: 'Saved formulation', brand: { name: 'Saved brand', slug: 'saved-brand' }, category: { name: 'Skincare', slug: 'skincare' },
  tagline: '', description: '', subCategory: '', hashtag: null, rating: 0, reviewsCount: 0, isBestseller: false, isNew: false, isFlashSale: false,
  minPriceKobo: 12345, minPriceNgn: 123.45, totalAvailable: 5, images: [{ url: '/saved-image.jpg', alt: 'Saved image' }],
  variants: [{ id: 'variant-50', sku: 'SAVED-50', sizeLabel: '50ml', priceKobo: 12345, priceNgn: 123.45, compareAtKobo: 18000, available: 3 }, { id: 'variant-100', sku: 'SAVED-100', sizeLabel: '100ml', priceKobo: 24690, priceNgn: 246.90, compareAtKobo: null, available: 2 }],
};
describe.each([['root', rootMap], ['backend', mapOwned]] as const)('%s published variant presentation', (_, map) => {
  it('preserves exact prices, compare-at discounts, and the distinct size prices and stock', () => {
    const mapped = map(product);
    expect(mapped.price).toBe(123.45); expect(mapped.originalPrice).toBe(180);
    expect(mapped.variants?.map(variant => [variant.sizeLabel, variant.priceNgn, variant.stock])).toEqual([['50ml', 123.45, 3], ['100ml', 246.90, 2]]);
  });
});
