import { z } from 'zod';
export const additionalProgramme = z.enum(['INFLUENCER']);
const webUrl = z.string().trim().url().max(1000).refine(value => { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; }, 'Use an HTTPS web address.');
export const programmeCommand = z.discriminatedUnion('action', [
  z.object({ action: z.literal('apply'), programme: additionalProgramme, name: z.string().trim().min(2).max(120), profileUrl: webUrl, motivation: z.string().trim().min(20).max(3000) }).strict(),
  z.object({ action: z.literal('accept'), programme: additionalProgramme, version: z.number().int().positive() }).strict(),
  z.object({ action: z.literal('submit'), programme: additionalProgramme, taskId: z.string().uuid(), version: z.number().int().positive(), url: webUrl, note: z.string().trim().min(5).max(3000) }).strict(),
]);
export const adminProgrammeCommand = z.discriminatedUnion('action', [
  z.object({ action: z.literal('review'), id: z.string().uuid(), version: z.number().int().positive(), decision: z.enum(['APPROVED','REJECTED','REVOKED']), note: z.string().trim().min(3).max(1000), agreement: z.string().trim().max(10000).default(''), verificationReference: z.string().trim().max(500).default('') }).strict(),
  z.object({ action: z.literal('assign'), requestId: z.string().uuid(), id: z.string().uuid(), title: z.string().trim().min(3).max(160), brief: z.string().trim().min(10).max(5000) }).strict(),
  z.object({ action: z.literal('review-submission'), id: z.string().uuid(), version: z.number().int().positive(), approved: z.boolean(), note: z.string().trim().min(3).max(1000) }).strict(),
]);
