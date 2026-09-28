import { describe, expect, it } from 'vitest';
import { earnPointsForKobo, makeVoucherCode, VOUCHER_TIERS } from '@/modules/loyalty/service';
import { adjustPointsSchema, redeemSchema } from '@/modules/loyalty/validation';
import { createReviewSchema, moderateReviewSchema } from '@/modules/reviews/validation';
import { createShipmentSchema, shipmentEventSchema } from '@/modules/shipping/validation';

// THREAT (points fraud / fake verified badges) → CONTROL (server-computed earn,
// server-set verified flag, strict inputs) → TEST below.
describe('loyalty math', () => {
  it('earns 1pt per ₦100, nothing for dust', () => {
    expect(earnPointsForKobo(2500000)).toBe(250); // ₦25,000 → 250pts
    expect(earnPointsForKobo(9999)).toBe(0);
    expect(earnPointsForKobo(0)).toBe(0);
  });

  it('mints unambiguous GLW- codes, unique across batch', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const c = makeVoucherCode();
      expect(c).toMatch(/^GLW-[A-Z2-9]{6}$/);
      seen.add(c);
    }
    expect(seen.size).toBe(50);
    expect(VOUCHER_TIERS[500]).toBe(50000);
  });

  it('accepts only fixed redeem tiers; blocks zero adjustments', () => {
    expect(redeemSchema.safeParse({ points: 500 }).success).toBe(true);
    expect(redeemSchema.safeParse({ points: 750 }).success).toBe(false);
    expect(adjustPointsSchema.safeParse({ userId: '11111111-1111-1111-1111-111111111111', points: 0, note: 'x' }).success).toBe(false);
    expect(adjustPointsSchema.safeParse({ userId: '11111111-1111-1111-1111-111111111111', points: -100, note: 'correction' }).success).toBe(true);
  });
});

describe('review input', () => {
  const base = { productId: '11111111-1111-1111-1111-111111111111', rating: 5, comment: 'Superb oil.' };

  it('bounds ratings 1–5 and requires a comment', () => {
    expect(createReviewSchema.safeParse(base).success).toBe(true);
    expect(createReviewSchema.safeParse({ ...base, rating: 0 }).success).toBe(false);
    expect(createReviewSchema.safeParse({ ...base, rating: 6 }).success).toBe(false);
    expect(createReviewSchema.safeParse({ ...base, comment: '' }).success).toBe(false);
  });

  it('rejects client-set trust flags (verified/status are server-computed)', () => {
    expect(createReviewSchema.safeParse({ ...base, verifiedPurchase: true }).success).toBe(false);
    expect(createReviewSchema.safeParse({ ...base, status: 'approved' }).success).toBe(false);
    expect(createReviewSchema.safeParse({ ...base, helpfulCount: 99 }).success).toBe(false);
  });

  it('moderation accepts only approved|rejected', () => {
    expect(moderateReviewSchema.safeParse({ status: 'approved' }).success).toBe(true);
    expect(moderateReviewSchema.safeParse({ status: 'pending' }).success).toBe(false);
  });
});

describe('shipment input', () => {
  it('defaults provider, rejects unknown statuses', () => {
    const s = createShipmentSchema.parse({ orderId: '11111111-1111-1111-1111-111111111111' });
    expect(s.provider).toBe('local');
    expect(shipmentEventSchema.safeParse({ status: 'teleported' }).success).toBe(false);
    expect(shipmentEventSchema.safeParse({ status: 'delivered', location: 'Lekki' }).success).toBe(true);
  });
});
