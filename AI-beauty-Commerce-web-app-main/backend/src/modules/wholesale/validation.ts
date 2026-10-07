import { z } from 'zod';

export const wholesaleLines = z.array(z.object({
  variantId: z.string().uuid(), cartons: z.number().int().min(1).max(1000),
}).strict()).min(1).max(50).refine(lines => new Set(lines.map(l => l.variantId)).size === lines.length, 'Choose each variant once.');

export const wholesalePriceInput = z.object({
  variantId: z.string().uuid(), tier: z.enum(['Bronze', 'Silver', 'Gold']),
  unitPriceKobo: z.number().int().min(1).max(100_000_000),
  unitsPerCarton: z.number().int().min(1).max(1000),
  minimumCartons: z.number().int().min(1).max(1000), isActive: z.boolean(),
}).strict();

export const wholesaleCommand = z.discriminatedUnion('action', [
  z.object({ action: z.literal('quote'), items: wholesaleLines }).strict(),
  z.object({ action: z.literal('checkout'), items: wholesaleLines, quoteFingerprint: z.string().regex(/^[a-f0-9]{64}$/) }).strict(),
  z.object({ action: z.literal('receive'), orderId: z.string().uuid() }).strict(),
  z.object({ action: z.literal('cancel'), orderId: z.string().uuid() }).strict(),
  z.object({ action: z.literal('directSale'), variantId: z.string().uuid(), qty: z.number().int().min(1).max(10000), note: z.string().trim().min(3).max(200) }).strict(),
]);
