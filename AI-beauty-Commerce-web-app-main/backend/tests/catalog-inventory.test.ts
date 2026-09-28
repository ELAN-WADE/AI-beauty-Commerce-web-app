import { describe, expect, it } from 'vitest';
import { decodeCursor, encodeCursor } from '@/modules/catalog/service';
import { productCreateSchema, productQuerySchema } from '@/modules/catalog/validation';
import { adjustStockSchema, reserveStockSchema } from '@/modules/inventory/validation';
import { computeAvailable } from '@/modules/inventory/service';
import { hasAnyRole } from '@/lib/authz';

// THREAT (expensive scans via deep pages / crafted cursors) → CONTROL (opaque
// keyset cursor, invalid → restart, capped limits) → TEST below.
describe('catalog cursor', () => {
  it('round-trips and rejects garbage by restarting from head', () => {
    const token = encodeCursor({ k: '2026-01-01T00:00:00.000Z', id: 'abc' });
    expect(decodeCursor(token)).toEqual({ k: '2026-01-01T00:00:00.000Z', id: 'abc' });
    expect(decodeCursor('!!!not-base64!!!')).toBeNull();
    expect(decodeCursor(undefined)).toBeNull();
    expect(decodeCursor('')).toBeNull();
  });
});

describe('catalog query validation', () => {
  it('caps limit and rejects unknown sorts (query-cost bound, §10)', () => {
    const capped = productQuerySchema.parse({ limit: 5000 });
    expect(capped.limit).toBe(100);
    expect(productQuerySchema.safeParse({ sort: 'popular' }).success).toBe(false);
  });

  it('rejects over-posted pricing/internal fields on admin create', () => {
    const base = {
      brandId: '11111111-1111-1111-1111-111111111111',
      categoryId: '22222222-2222-2222-2222-222222222222',
      name: 'Test Oil',
      variants: [{ sku: 'T-1', priceKobo: 250000 }],
    };
    expect(productCreateSchema.safeParse(base).success).toBe(true);
    expect(
      productCreateSchema.safeParse({ ...base, variants: [{ sku: 'T-1', priceKobo: -5 }] }).success,
    ).toBe(false); // negative price rejected before DB CHECK
    expect(
      productCreateSchema.safeParse({ ...base, variants: [] }).success,
    ).toBe(false); // variant-less product rejected
    expect(
      productCreateSchema.safeParse({ ...base, rating: 5, reviewsCount: 99 }).success,
    ).toBe(false); // counters are server-maintained, never client-set
  });
});

describe('inventory math + validation', () => {
  it('available = on_hand - reserved, floored at zero', () => {
    expect(computeAvailable(10, 3)).toBe(7);
    expect(computeAvailable(2, 5)).toBe(0);
  });

  it('rejects zero/negative reservation quantities and zero adjustments', () => {
    expect(reserveStockSchema.safeParse({ variantId: '11111111-1111-1111-1111-111111111111', qty: 0, refType: 'cart', refId: 'c1' }).success).toBe(false);
    expect(adjustStockSchema.safeParse({ variantId: '11111111-1111-1111-1111-111111111111', delta: 0, reason: 'x' }).success).toBe(false);
    expect(adjustStockSchema.safeParse({ variantId: '11111111-1111-1111-1111-111111111111', delta: 10, reason: 'restock' }).success).toBe(true);
  });
});

describe('role gating (BFLA)', () => {
  it('grants only listed roles, denies empty/unknown', () => {
    expect(hasAnyRole(['CUSTOMER'], 'ADMIN', 'STAFF')).toBe(false);
    expect(hasAnyRole(['STAFF'], 'ADMIN', 'STAFF')).toBe(true);
    expect(hasAnyRole([], 'ADMIN')).toBe(false);
  });
});
