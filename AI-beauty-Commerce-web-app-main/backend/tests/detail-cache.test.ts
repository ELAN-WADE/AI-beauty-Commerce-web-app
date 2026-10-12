/**
 * Batch-2 (Part VIII): product-detail reads deduplicate — concurrent renders
 * share one request, warm entries serve from cache, TTL expiry refetches,
 * failures never poison the cache. `fetch` is stubbed; no network, no DB.
 */
import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { DETAIL_TTL_MS, fetchProductDetail } from '@/storefront/lib/owned-api';

let calls = 0;

const detail = {
  slug: 'test-oil',
  name: 'Test Oil',
  brand: { name: 'Desla', slug: 'desla' },
  category: { name: 'Skincare', slug: 'skincare' },
  variants: [{ id: 'v1', sku: 'T-1', sizeLabel: '50ml', priceKobo: 9000, priceNgn: 90, compareAtKobo: null, available: 3 }],
};

beforeEach(() => {
  calls = 0;
  vi.useFakeTimers();
  vi.stubGlobal('fetch', (async () => {
    calls += 1;
    return new Response(JSON.stringify(detail));
  }) as typeof fetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('fetchProductDetail cache', () => {
  it('shares one request across concurrent renders, then serves cache', async () => {
    const slug = `oil-${Date.now()}`;
    const [a, b, c] = await Promise.all([fetchProductDetail(slug), fetchProductDetail(slug), fetchProductDetail(slug)]);
    expect(calls).toBe(1);
    expect(a?.slug).toBe('test-oil');
    expect(b).toBe(a); // same reference, zero extra work
    expect(c).toBe(a);
    await fetchProductDetail(slug);
    expect(calls).toBe(1); // warm cache: no refetch
  });

  it('refetches after TTL and never caches failures', async () => {
    const slug = `ttl-${Date.now()}`;
    await fetchProductDetail(slug);
    expect(calls).toBe(1);
    vi.advanceTimersByTime(DETAIL_TTL_MS + 1);
    await fetchProductDetail(slug);
    expect(calls).toBe(2);

    const failSlug = `fail-${Date.now()}`;
    vi.stubGlobal('fetch', (async () => {
      calls += 1;
      throw new Error('network down');
    }) as typeof fetch);
    await expect(fetchProductDetail(failSlug)).resolves.toBeNull();
    vi.stubGlobal('fetch', (async () => {
      calls += 1;
      return new Response(JSON.stringify(detail));
    }) as typeof fetch);
    await expect(fetchProductDetail(failSlug)).resolves.not.toBeNull();
    expect(calls).toBe(4); // failure was not cached: retried
  });
});
