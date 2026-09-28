import { describe, expect, it } from 'vitest';
import { creatorDiscountKobo, normalizeCode } from '@/modules/creators/service';
import { clickSchema, creatorApplicationSchema, reviewCreatorApplicationSchema } from '@/modules/creators/validation';
import { distributorApplicationSchema, distributorStockSchema } from '@/modules/distributors/validation';
import { chatMessageSchema, createPostSchema } from '@/modules/community/validation';

// THREAT (affiliate fraud: inflated discounts, code squatting) → CONTROL
// (server-computed capped discounts, normalized unique codes) → TEST below.
describe('creator economics', () => {
  it('computes capped percentage discounts in kobo', () => {
    expect(creatorDiscountKobo(500000, 10)).toBe(50000); // ₦5,000 → ₦500 off
    expect(creatorDiscountKobo(0, 10)).toBe(0);
    expect(creatorDiscountKobo(500000, 0)).toBe(0);
    expect(creatorDiscountKobo(500000, 99)).toBe(250000); // capped at 50%
    expect(creatorDiscountKobo(100, 10)).toBe(10);
  });

  it('normalizes codes (case/space-insensitive, single identity)', () => {
    expect(normalizeCode('  amara10 ')).toBe('AMARA10');
    expect(normalizeCode('amara10')).toBe('AMARA10');
  });

  it('approvals require alphanumeric promo codes', () => {
    const base = { approve: true, promoCode: 'AMARA10', discountPercent: 10, commissionRate: 12 };
    expect(reviewCreatorApplicationSchema.safeParse(base).success).toBe(true);
    expect(reviewCreatorApplicationSchema.safeParse({ approve: true, discountPercent: 10, commissionRate: 12 }).success).toBe(false);
    expect(reviewCreatorApplicationSchema.safeParse({ ...base, promoCode: 'AMARA-10!' }).success).toBe(false);
    expect(reviewCreatorApplicationSchema.safeParse({ approve: false }).success).toBe(true);
    expect(clickSchema.safeParse({ code: 'AMARA10' }).success).toBe(true);
    expect(creatorApplicationSchema.safeParse({ name: 'A', platform: 'Snapchat' }).success).toBe(false);
  });
});

describe('distributor intake', () => {
  it('requires business identity + valid phone, bounds stock', () => {
    const base = { name: 'Aura Luxe', city: 'Abuja', address: 'Wuse 2', phone: '+2349030456510' };
    expect(distributorApplicationSchema.safeParse(base).success).toBe(true);
    expect(distributorApplicationSchema.safeParse({ ...base, phone: 'nope' }).success).toBe(false);
    expect(distributorApplicationSchema.safeParse({ ...base, city: '' }).success).toBe(false);
    const stock = { distributorId: '11111111-1111-1111-1111-111111111111', variantId: '22222222-2222-2222-2222-222222222222', quantity: 10 };
    expect(distributorStockSchema.safeParse(stock).success).toBe(true);
    expect(distributorStockSchema.safeParse({ ...stock, quantity: -1 }).success).toBe(false);
  });
});

describe('community guardrails', () => {
  it('bounds posts and requires media urls with media types', () => {
    const base = { content: 'My routine transformation!' };
    expect(createPostSchema.safeParse(base).success).toBe(true);
    expect(createPostSchema.safeParse({ ...base, content: '' }).success).toBe(false);
    expect(createPostSchema.safeParse({ ...base, content: 'x'.repeat(2001) }).success).toBe(false);
    expect(createPostSchema.safeParse({ ...base, mediaType: 'image' }).success).toBe(false);
    expect(createPostSchema.safeParse({ ...base, mediaType: 'image', mediaUrl: 'https://x/y.jpg' }).success).toBe(true);
    expect(createPostSchema.safeParse({ ...base, taggedProductId: 'nope' }).success).toBe(false);
  });

  it('bounds chat messages and strips control fields', () => {
    expect(chatMessageSchema.safeParse({ message: 'hello' }).success).toBe(true);
    expect(chatMessageSchema.safeParse({ message: 'x'.repeat(1001) }).success).toBe(false);
    expect(chatMessageSchema.safeParse({ message: 'hi', senderName: 'admin' }).success).toBe(false);
  });
});
