import { afterEach, describe, expect, it, vi } from 'vitest';
import { mapServerOrder } from '../src/storefront/lib/owned-api';
import { mapServerOrder as rootMap } from '../../src/lib/owned-api';
import { creatorDiscountNaira, nextPartnerOrderAction } from '../src/storefront/lib/order-journey';
import { creatorDiscountKobo } from '@/modules/creators/service';
import { buildCreatorSubmission, creatorMediaUrl, type CreatorSubmissionInput } from '../src/storefront/lib/creator-submission';
import { initPaymentSchema } from '@/modules/payments/validation';

afterEach(() => vi.unstubAllEnvs());
const serverOrder = { id: '00000000-0000-4000-8000-000000000001', orderNumber: 'DES-REAL01', status: 'PAID', paymentStatus: 'PAID', fulfilmentMethod: 'PICKUP', subtotalKobo: 12345, deliveryFeeKobo: 100, totalKobo: 12445, createdAt: '2026-10-30T10:00:00Z', shippingAddress: { fullName: 'Saved recipient', street: 'Saved street', city: 'Lagos', state: 'Lagos', phone: '+2348000000000' }, items: [{ variantId: 'variant', productName: 'Saved formulation', variantLabel: '50ml', sku: 'SAVED', unitPriceKobo: 12345, qty: 1, lineTotalKobo: 12345 }], history: [{ toStatus: 'PENDING', createdAt: '2026-10-30T10:00:00Z' }, { toStatus: 'PAID', createdAt: '2026-10-30T10:01:00Z' }] };

describe.each([['root', rootMap], ['backend', mapServerOrder]] as const)('%s customer order mapping', (_, map) => {
  it.each([['PENDING', 'Processing'], ['PAID', 'Processing'], ['FULFILLING', 'Awaiting Packing'], ['READY_PICKUP', 'Ready for Pickup'], ['SHIPPED', 'In Transit'], ['DELIVERED', 'Delivered'], ['CANCELLED', 'Cancelled']])('maps %s without advancing the order to an invented state', (status, expected) => {
    expect(map({ ...serverOrder, status }, [], 'stripe').status).toBe(expected);
  });
  it('retains server ownership IDs, payment, method, saved address, cents and recorded history', () => {
    const order = map(serverOrder, [], 'stripe');
    expect(order).toMatchObject({ serverId: serverOrder.id, serverStatus: 'PAID', paymentStatus: 'PAID', fulfilmentMethod: 'PICKUP', total: 124.45, subtotal: 123.45, shippingAddress: { name: 'Saved recipient', street: 'Saved street' } });
    expect(order.items[0].price).toBe(123.45);
    expect(order.trackingSteps.map(step => step.title)).toEqual(['Order placed', 'Payment confirmed']);
    expect(order.trackingSteps).toHaveLength(serverOrder.history.length);
  });
  it('does not invent addresses, items, dates or shipment history when the server has none', () => {
    const order = map({ ...serverOrder, items: [], shippingAddress: undefined, history: [], createdAt: undefined }, [], '');
    expect(order.items).toEqual([]); expect(order.trackingSteps).toEqual([]); expect(order.date).toBe(''); expect(Object.values(order.shippingAddress).every(value => value === '')).toBe(true);
  });
});

describe('distributor journey follows the server state and fulfilment method', () => {
  it.each([[12345, 8], [12345, 10], [55055, 15], [100, 0], [99999, 80]])('keeps the displayed creator discount equal to server pricing for %s kobo at %s percent', (amount, percent) => {
    expect(creatorDiscountNaira(amount / 100, percent)).toBe(creatorDiscountKobo(amount, percent) / 100);
  });
  it.each([['PAID', 'PICKUP', 'ACCEPT'], ['FULFILLING', 'PICKUP', 'READY_PICKUP'], ['READY_PICKUP', 'PICKUP', 'CONFIRM_PICKUP'], ['PAID', 'DELIVERY', 'ACCEPT'], ['FULFILLING', 'DELIVERY', 'DISPATCH'], ['SHIPPED', 'DELIVERY', 'COMPLETE_DELIVERY'], ['DELIVERED', 'PICKUP', null], ['READY_PICKUP', 'DELIVERY', null], ['SHIPPED', 'PICKUP', null]] as const)('%s %s offers only %s', (status, method, action) => {
    expect(nextPartnerOrderAction({ serverId: serverOrder.id, paymentStatus: 'PAID', serverStatus: status, fulfilmentMethod: method })).toBe(action);
  });
  it('offers no fulfilment action before payment or without a persisted server order', () => {
    expect(nextPartnerOrderAction({ serverId: serverOrder.id, serverStatus: 'PAID', paymentStatus: 'UNPAID', fulfilmentMethod: 'DELIVERY' })).toBeNull();
    expect(nextPartnerOrderAction({ serverStatus: 'PAID', paymentStatus: 'PAID', fulfilmentMethod: 'DELIVERY' })).toBeNull();
  });
});

const draft = (): CreatorSubmissionInput => ({ format: 'tutorial', videoTitle: '', videoCaption: '', mediaUrl: '', selectedProductIds: [], routineTitle: '', routineCategory: '', routineSkinType: '', routineTimeOfDay: 'morning', routineSteps: [], reviewProductId: '', reviewVerdict: '', testingDuration: '', textureScore: 0, absorptionScore: 0, longevityScore: 0, tutorialTitle: 'Actual technique', tutorialDifficulty: 'Beginner', tutorialSteps: [{ title: 'Apply gently', detail: 'The creator’s entered instructions.' }] });
describe('creator data reaches the moderation record', () => {
  it('keeps tutorial instructions rather than replacing the body with its title', () => {
    expect(buildCreatorSubmission(draft(), [], true).body).toContain('The creator’s entered instructions.');
  });
  it('keeps routine formulation references and deduplicates repeated tags', () => {
    const input = { ...draft(), format: 'routine' as const, routineTitle: 'My entered routine', routineSteps: [{ name: 'Apply', productId: 'real-oil', proTip: 'Entered tip' }, { name: 'Repeat', productId: 'real-oil', proTip: '' }] };
    expect(buildCreatorSubmission(input, [{ id: 'real-oil', name: 'Actual oil' }], true)).toMatchObject({ productIds: ['real-oil'] });
    expect(buildCreatorSubmission(input, [{ id: 'real-oil', name: 'Actual oil' }], true).body).toContain('Entered tip');
    expect(() => buildCreatorSubmission(input, [], true)).toThrow('formulation');
  });
  it('rejects an empty video or an unrated review, rather than submitting fabricated scores', () => {
    expect(() => buildCreatorSubmission({ ...draft(), format: 'video', videoTitle: 'My video' }, [], true)).toThrow('Upload a video');
    expect(() => buildCreatorSubmission({ ...draft(), format: 'review', reviewProductId: 'oil', reviewVerdict: 'My review' }, [{ id: 'oil', name: 'Oil' }], true)).toThrow('choose each product score');
  });
  it('accepts actual local uploads in development and HTTPS hosting, but rejects temporary and unsafe URLs', () => {
    vi.stubEnv('NODE_ENV', 'development'); expect(creatorMediaUrl('http://localhost:3005/uploads/partner/upload.mp4')).toContain('localhost');
    expect(creatorMediaUrl('/uploads/partner/upload.mp4')).toBe('/uploads/partner/upload.mp4');
    for (const value of ['blob:temporary', 'javascript:alert(1)', '//untrusted.test/file.png', 'https://name:secret@example.test/a.mp4']) expect(() => creatorMediaUrl(value)).toThrow();
    vi.stubEnv('NODE_ENV', 'production'); expect(() => creatorMediaUrl('http://example.test/video.mp4')).toThrow(); expect(creatorMediaUrl('https://media.example.test/video.mp4')).toContain('https:');
  });
  it('uses a hosted checkout provider supported by the actual backend contract', () => {
    for (const provider of ['stripe', 'flutterwave']) expect(initPaymentSchema.safeParse({ orderId: serverOrder.id, provider }).success).toBe(true);
    expect(initPaymentSchema.safeParse({ orderId: serverOrder.id, provider: 'paystack' }).success).toBe(false);
  });
});
