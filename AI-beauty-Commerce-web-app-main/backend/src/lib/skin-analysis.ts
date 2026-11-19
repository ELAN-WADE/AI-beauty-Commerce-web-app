import { z } from 'zod';

export const skinAnalysisSchema = z.object({
  usable: z.boolean(),
  summary: z.string().max(1800),
  observations: z.array(z.object({ area: z.string().max(100), detail: z.string().max(600) })).max(6),
  routine: z.array(z.object({ step: z.string().max(100), advice: z.string().max(600) })).max(5),
  limitations: z.string().max(1000),
});

export type SkinAnalysis = z.infer<typeof skinAnalysisSchema>;
