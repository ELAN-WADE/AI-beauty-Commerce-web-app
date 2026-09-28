import { z } from 'zod';

export const adjustStockSchema = z
  .object({
    variantId: z.string().uuid(),
    delta: z.number().int().min(-100000).max(100000).refine((d) => d !== 0, 'Delta cannot be zero.'),
    reason: z.string().trim().min(1).max(200),
  })
  .strict();

export const reserveStockSchema = z
  .object({
    variantId: z.string().uuid(),
    qty: z.number().int().min(1).max(999),
    refType: z.enum(['cart', 'order']),
    refId: z.string().trim().min(1).max(120),
    ttlMinutes: z.number().int().min(5).max(1440).default(30),
  })
  .strict();

export type AdjustStockInput = z.infer<typeof adjustStockSchema>;
export type ReserveStockInput = z.infer<typeof reserveStockSchema>;
