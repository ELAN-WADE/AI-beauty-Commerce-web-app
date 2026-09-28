import { z } from 'zod';

export const chatMessageSchema = z
  .object({ content: z.string().trim().min(1).max(2000) })
  .strict();

export const conversationSchema = z
  .object({ title: z.string().trim().min(1).max(120).default('Consultation') })
  .strict();
