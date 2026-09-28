import { z } from 'zod';

export const REDEEM_TIERS = [500, 1000, 2500] as const;

export const redeemSchema = z
  .object({ points: z.number().int().refine((p): p is (typeof REDEEM_TIERS)[number] => (REDEEM_TIERS as readonly number[]).includes(p), 'Choose a valid tier.') })
  .strict();

export const adjustPointsSchema = z
  .object({
    userId: z.string().uuid(),
    points: z.number().int().min(-100000).max(100000).refine((p) => p !== 0, 'Points cannot be zero.'),
    note: z.string().trim().min(1).max(300),
  })
  .strict();
