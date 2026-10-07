import { z } from 'zod';

export const rewardEligibilitySchema = z.object({ rewardEligible: z.boolean() }).strict();

export type RewardEligibilityInput = z.infer<typeof rewardEligibilitySchema>;
