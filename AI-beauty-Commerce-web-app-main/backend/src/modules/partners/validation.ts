import { z } from 'zod';
import { wholesalePriceInput } from '../wholesale/validation';
const id = z.string().uuid();
const kind = z.enum(['DISTRIBUTOR', 'CREATOR']);
const amount = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const partnerCommand = z.discriminatedUnion('action', [
  z.object({ action: z.literal('order'), kind: z.literal('DISTRIBUTOR'), orderId: id, transition: z.enum(['ACCEPT', 'DISPATCH', 'READY_PICKUP', 'CONFIRM_PICKUP', 'COMPLETE_DELIVERY']), code: z.string().regex(/^\d{6}$/).optional(), note: z.string().trim().max(300).default('') }).strict(),
  z.object({ action: z.literal('bank'), kind, bankCode: z.string().trim().regex(/^[0-9]{3,6}$/), bankName: z.string().trim().min(2).max(80), accountName: z.string().trim().min(2).max(120), accountNumber: z.string().regex(/^\d{10}$/) }).strict(),
  z.object({ action: z.literal('withdraw'), kind, amountKobo: amount, bankAccountId: id }).strict(),
  z.object({ action: z.literal('restock'), kind: z.literal('DISTRIBUTOR'), variantId: id, qty: z.number().int().min(1).max(10000) }).strict(),
  z.object({ action: z.literal('receive'), kind: z.literal('DISTRIBUTOR'), transferId: id }).strict(),
]);
export const networkCommand = z.discriminatedUnion('action', [
  wholesalePriceInput.extend({ action: z.literal('wholesalePrice') }).strict(),
  z.object({ action: z.literal('wholesaleReturn'), orderId: id, evidence: z.string().trim().min(6).max(300) }).strict(),
  z.object({ action: z.literal('location'), id: id.optional(), code: z.string().trim().min(2).max(40), name: z.string().trim().min(2).max(120), type: z.enum(['WAREHOUSE', 'DISTRIBUTOR', 'RETAIL_STORE']), distributorId: id.nullable().default(null), city: z.string().trim().min(1).max(80), state: z.string().trim().min(1).max(80), address: z.string().trim().min(3).max(300), phone: z.string().trim().max(30).default(''), operatingHours: z.string().trim().max(120).default(''), deliveryEnabled: z.boolean(), pickupEnabled: z.boolean(), deliveryFeeKobo: z.number().int().min(0).max(10000000).nullable(), etaText: z.string().trim().min(3).max(200), isActive: z.boolean() }).strict(),
  z.object({ action: z.literal('link'), kind, partnerId: id, userId: id, commissionBps: z.number().int().min(0).max(5000), tier: z.enum(['Bronze', 'Silver', 'Gold']).optional() }).strict(),
  z.object({ action: z.literal('adjust'), locationId: id, variantId: id, delta: z.number().int().min(-100000).max(100000).refine(v => v !== 0), reason: z.string().trim().min(3).max(200) }).strict(),
  z.object({ action: z.literal('transfer'), sourceLocationId: id, destinationLocationId: id, items: z.array(z.object({ variantId: id, qty: z.number().int().positive().max(10000) }).strict()).min(1).max(100), note: z.string().trim().max(300).default('') }).strict(),
  z.object({ action: z.literal('receive'), transferId: id }).strict(),
  z.object({ action: z.literal('verifyBank'), bankAccountId: id, evidence: z.string().trim().min(6).max(500) }).strict(),
  z.object({ action: z.literal('payout'), id, status: z.enum(['APPROVED', 'PROCESSING', 'PAID', 'REJECTED', 'FAILED']), evidence: z.string().trim().min(6).max(500), paymentReference: z.string().trim().min(4).max(120).optional() }).strict(),
  z.object({ action: z.literal('restock'), id, status: z.enum(['APPROVED', 'REJECTED', 'FULFILLED']) }).strict(),
]);
