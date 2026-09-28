import { z } from 'zod';

const uuid = z.string().uuid();
const phone = z.string().trim().regex(/^\+?[0-9]{7,15}$/, 'Enter a valid phone number.');

export const distributorQuerySchema = z
  .object({
    city: z.string().trim().min(1).max(80).optional(),
    verified: z.enum(['true', 'false']).optional(),
    limit: z.coerce.number().int().min(1).default(20).transform((v) => Math.min(v, 100)),
  })
  .strict();

const applicationBody = z.object({
  name: z.string().trim().min(1).max(120),
  businessName: z.string().trim().max(160).default(''),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().max(80).default(''),
  address: z.string().trim().min(1).max(300),
  phone,
  whatsapp: z.string().trim().max(20).default(''),
});

export const distributorApplicationSchema = applicationBody.strict();

export const reviewApplicationSchema = z
  .object({ approve: z.boolean(), note: z.string().trim().max(500).default('') })
  .strict();

export const distributorStockSchema = z
  .object({
    distributorId: uuid,
    variantId: uuid,
    quantity: z.number().int().min(0).max(100000),
    available: z.boolean().default(true),
  })
  .strict();

export const stockLookupSchema = z
  .object({ variantId: uuid, city: z.string().trim().min(1).max(80) })
  .strict();
