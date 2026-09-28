import { z } from 'zod';

export const SKIN_TYPES = ['oily', 'dry', 'combination', 'sensitive', 'normal'] as const;
export const CONSENT_VERSION = '2026-09-v1';

const concern = z.string().trim().min(1).max(60);

export const skinProfileSchema = z
  .object({
    skinType: z.enum(SKIN_TYPES),
    concerns: z.array(concern).max(12).default([]),
    notes: z.string().trim().max(1000).default(''),
  })
  .strict();

export const ANALYSIS_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ANALYSIS_MAX_BYTES = 5 * 1024 * 1024;

export const initAnalysisSchema = z
  .object({
    consentAccepted: z.literal(true, { message: 'Explicit consent is required for face analysis.' }),
    consentVersion: z.literal(CONSENT_VERSION, { message: 'Consent text is outdated; please re-confirm.' }),
    mime: z.enum(ANALYSIS_MIMES),
    bytes: z.number().int().min(1024).max(ANALYSIS_MAX_BYTES),
  })
  .strict();

export const analysisResultSchema = z.object({
  skinType: z.enum(SKIN_TYPES),
  concerns: z.array(concern).max(12),
  hydration: z.number().int().min(0).max(100),
  oiliness: z.number().int().min(0).max(100),
  sensitivity: z.number().int().min(0).max(100),
  texture: z.number().int().min(0).max(100),
  summary: z.string().trim().min(1).max(1000),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
