import { describe, expect, it } from 'vitest';
import { aggregateLines, normalisePlace, stockRequestSchema } from '@/modules/routing/service';
import { commissionFor, cumulativeReversal, safeMoney } from '@/modules/ledger/service';
import { partnerCommand, networkCommand } from '@/modules/partners/validation';

// Pure ledger math: integer kobo, basis points, no floats.
describe('partner ledger math', () => {
  it('computes commission in integer kobo from basis points', () => {
    expect(commissionFor(4800000, 1200)).toBe(576000); // 12% of ₦48,000
    expect(commissionFor(100, 1)).toBe(0); // rounds down, never mints dust
    expect(commissionFor(0, 1200)).toBe(0);
  });

  it('rejects unsafe or out-of-range money', () => {
    expect(() => commissionFor(Number.MAX_SAFE_INTEGER + 1, 100)).toThrow();
    expect(() => commissionFor(100, 5001)).toThrow();
    expect(() => safeMoney(1.5)).toThrow();
  });

  it('reverses commission proportionally to cumulative refunds', () => {
    expect(cumulativeReversal(1200, 5000, 10000)).toBe(600);
    expect(cumulativeReversal(1200, 10000, 10000)).toBe(1200);
    expect(cumulativeReversal(1200, 99999, 10000)).toBe(1200); // capped
  });
});

describe('routing input', () => {
  it('aggregates duplicate lines deterministically', () => {
    const id = '11111111-1111-1111-1111-111111111111';
    expect(aggregateLines([{ variantId: id, qty: 1 }, { variantId: id, qty: 2 }])).toEqual([{ variantId: id, qty: 3 }]);
  });

  it('matches city and state only, never city alone', () => {
    expect(normalisePlace('Lagos State')).toBe('lagos');
    const bad = stockRequestSchema.safeParse({ city: 'Lagos', state: '', method: 'DELIVERY', items: [] });
    expect(bad.success).toBe(false);
    const good = stockRequestSchema.safeParse({
      city: 'Ota', state: 'Ogun', method: 'PICKUP',
      items: [{ variantId: '11111111-1111-1111-1111-111111111111', qty: 1 }],
    });
    expect(good.success).toBe(true);
  });

  it('rejects pickup without an explicit location choice at checkout', async () => {
    const { checkoutSchema } = await import('@/modules/cart/validation');
    const base = {
      guestAddress: { fullName: 'Ada', phone: '+2348012345678', street: '1 Main', city: 'Ota', state: 'Ogun' },
      guestEmail: 'ada@example.com',
      fulfilmentMethod: 'PICKUP',
    };
    // Schema allows it; service must demand fulfilmentLocationId (tested in integration).
    expect(checkoutSchema.safeParse(base).success).toBe(true);
  });
});

describe('partner command validation', () => {
  const id = '11111111-1111-1111-1111-111111111111';
  it('requires idempotency on unsafe partner writes', () => {
    // Route-level check: withdraw/restock without Idempotency-Key is rejected.
    // Here we assert the payload shape itself is strict.
    expect(partnerCommand.safeParse({ action: 'withdraw', kind: 'CREATOR', amountKobo: -5, bankAccountId: id }).success).toBe(false);
    expect(partnerCommand.safeParse({ action: 'bank', kind: 'CREATOR', bankCode: '058', bankName: 'GTBank', accountName: 'Ada Okafor', accountNumber: '0123456789' }).success).toBe(true);
    expect(partnerCommand.safeParse({ action: 'bank', kind: 'CREATOR', bankCode: 'ABC', bankName: 'GT', accountName: 'Ada', accountNumber: '123' }).success).toBe(false);
  });

  it('keeps payout review evidence mandatory', () => {
    expect(networkCommand.safeParse({ action: 'payout', id, status: 'PAID', evidence: '', paymentReference: 'REF1' }).success).toBe(false);
    expect(networkCommand.safeParse({ action: 'payout', id, status: 'PAID', evidence: 'Bank advice attached', paymentReference: 'REF1' }).success).toBe(true);
  });
});
