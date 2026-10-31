import { beforeEach, describe, expect, it, vi } from 'vitest';
const cache = vi.hoisted(() => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }));
vi.mock('next/cache', () => cache);
import { revalidateStorefront, subscribeStorefrontSync } from '@/lib/storefront-revalidate';
beforeEach(() => { cache.revalidateTag.mockReset(); cache.revalidatePath.mockReset(); });
describe('publication invalidates public render caches', () => {
  it('invalidates shared catalogue/editorial data and the affected product after a write', () => {
    const listener = vi.fn(), unsubscribe = subscribeStorefrontSync(listener);
    try {
      revalidateStorefront(' Saved-Product ');
      expect(cache.revalidateTag.mock.calls).toEqual([['public-catalogue'], ['public-editorial']]);
      expect(cache.revalidatePath).toHaveBeenCalledWith('/products/saved-product');
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: 'CATALOG_UPDATE', slug: 'saved-product' }));
    } finally { unsubscribe(); }
  });
  it('keeps client invalidation working when Next cache access is unavailable', () => {
    cache.revalidateTag.mockImplementation(() => { throw new Error('Cache unavailable'); });
    cache.revalidatePath.mockImplementation(() => { throw new Error('Cache unavailable'); });
    const listener = vi.fn(), unsubscribe = subscribeStorefrontSync(listener);
    try { expect(() => revalidateStorefront()).not.toThrow(); expect(listener).toHaveBeenCalledOnce(); }
    finally { unsubscribe(); }
  });
});
