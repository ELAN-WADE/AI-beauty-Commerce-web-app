import { z } from 'zod';

const uuid = z.string().uuid();

export const creatorCodeQuery = z.object({
  code: z.string().trim().min(1).max(40),
});

export const creatorApplicationSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    handle: z.string().trim().max(80).default(''),
    platform: z.enum(['Instagram', 'TikTok', 'YouTube']).default('Instagram'),
    niche: z.string().trim().max(200).default(''),
  })
  .strict();

export const reviewCreatorApplicationSchema = z
  .object({
    approve: z.boolean(),
    promoCode: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9]+$/, 'Promo code must be alphanumeric.').optional(),
    discountPercent: z.number().int().min(0).max(50).default(10),
    commissionRate: z.number().int().min(0).max(50).default(12),
    note: z.string().trim().max(500).default(''),
  })
  .strict()
  .refine((v) => !v.approve || v.promoCode !== undefined, 'Approved creators need a promo code.');

export const clickSchema = z.object({ code: z.string().trim().min(1).max(40) }).strict();
