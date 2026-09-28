import { describe, expect, it } from 'vitest';
import { allowedTransition, makeOrderNumber } from '@/modules/orders/service';
import { cartItemSchema, cartQtySchema, checkoutSchema, orderStatusSchema } from '@/modules/cart/validation';

// THREAT (frontend marks order paid / jumps fulfilment) → CONTROL (actor-gated
// machine; PAID is system-only) → TEST: every illegal edge rejected.
describe('order state machine', () => {
  it('lets the system mark PAID but never customer or admin', () => {
    expect(allowedTransition('PENDING', 'PAID', 'system')).toBe(true);
    expect(allowedTransition('PENDING', 'PAID', 'customer')).toBe(false);
    expect(allowedTransition('PENDING', 'PAID', 'admin')).toBe(false);
  });

  it('walks the fulfilment path for staff only', () => {
    expect(allowedTransition('PAID', 'FULFILLING', 'admin')).toBe(true);
    expect(allowedTransition('FULFILLING', 'SHIPPED', 'admin')).toBe(true);
    expect(allowedTransition('SHIPPED', 'DELIVERED', 'admin')).toBe(true);
    expect(allowedTransition('PAID', 'FULFILLING', 'customer')).toBe(false);
    expect(allowedTransition('PENDING', 'SHIPPED', 'admin')).toBe(false); // no skipping
    expect(allowedTransition('SHIPPED', 'PAID', 'admin')).toBe(false); // no rewind
  });

  it('treats terminal and unknown states as dead ends', () => {
    for (const s of ['DELIVERED', 'CANCELLED', 'REFUNDED', 'NOPE']) {
      expect(allowedTransition(s, 'SHIPPED', 'admin')).toBe(false);
      expect(allowedTransition(s, 'CANCELLED', 'admin')).toBe(false);
    }
    expect(allowedTransition('PENDING', 'CANCELLED', 'customer')).toBe(true);
    expect(allowedTransition('PAID', 'CANCELLED', 'customer')).toBe(false); // staff only after pay
  });
});

describe('order numbers', () => {
  it('are DES-XXXXXX in an unambiguous alphabet and unique', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const n = makeOrderNumber();
      expect(n).toMatch(/^DES-[A-Z2-9]{6}$/);
      expect(n).not.toMatch(/[01OIL]/);
      seen.add(n);
    }
    expect(seen.size).toBe(100);
  });
});

describe('checkout input (never trust the client, §6)', () => {
  const guest = {
    guestAddress: { fullName: 'Ada Okafor', phone: '+2348012345678', street: '14 Admiralty Way', city: 'Lekki', state: 'Lagos' },
    guestEmail: 'ada@example.com',
  };

  it('accepts addressId XOR guest pair, rejects neither', () => {
    expect(checkoutSchema.safeParse({ addressId: '11111111-1111-1111-1111-111111111111' }).success).toBe(true);
    expect(checkoutSchema.safeParse(guest).success).toBe(true);
    expect(checkoutSchema.safeParse({}).success).toBe(false);
    expect(checkoutSchema.safeParse({ guestAddress: guest.guestAddress }).success).toBe(false);
  });

  it('rejects client-declared money and identity (fraud surface)', () => {
    for (const evil of [
      { ...guest, totalKobo: 100 },
      { ...guest, subtotalKobo: 100 },
      { ...guest, priceKobo: 100 },
      { ...guest, discount: 50 },
      { ...guest, userId: '11111111-1111-1111-1111-111111111111' },
      { ...guest, paymentStatus: 'PAID' },
      { ...guest, status: 'DELIVERED' },
    ]) {
      expect(checkoutSchema.safeParse(evil).success).toBe(false);
    }
  });
});

describe('cart + status validation', () => {
  it('bounds quantities and rejects unknown statuses', () => {
    expect(cartItemSchema.safeParse({ variantId: '11111111-1111-1111-1111-111111111111', qty: 0 }).success).toBe(false);
    expect(cartItemSchema.safeParse({ variantId: '11111111-1111-1111-1111-111111111111', qty: 100 }).success).toBe(false);
    expect(cartQtySchema.safeParse({ qty: 2 }).success).toBe(true);
    expect(orderStatusSchema.safeParse({ status: 'PAID-PLS' }).success).toBe(false);
    expect(orderStatusSchema.safeParse({ status: 'SHIPPED', admin: true }).success).toBe(false);
  });
});
