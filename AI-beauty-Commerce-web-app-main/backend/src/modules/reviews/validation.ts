import { z } from 'zod';

export const createReviewSchema = z
  .object({
    productId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    title: z.string().trim().max(120).default(''),
    comment: z.string().trim().min(1).max(2000),
  })
  .strict();

export const moderateReviewSchema = z
  .object({ status: z.enum(['approved', 'rejected']) })
  .strict();

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
