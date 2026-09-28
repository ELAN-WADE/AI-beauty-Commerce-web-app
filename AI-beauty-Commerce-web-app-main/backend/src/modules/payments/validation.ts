import { z } from 'zod';

const uuid = z.string().uuid();
const email = z.string().trim().toLowerCase().email().max(254);

export const paymentProvider = z.enum(['flutterwave', 'paystack', 'opay', 'transfer']);

export const initPaymentSchema = z
  .object({ orderId: uuid, provider: paymentProvider, guestEmail: email.optional() })
  .strict();

export const paymentStatusQuery = z.object({ reference: z.string().trim().min(1).max(120) });

export const transferClaimSchema = z
  .object({
    orderId: uuid,
    guestEmail: email.optional(),
    senderName: z.string().trim().min(1).max(120),
    amountKobo: z.number().int().positive('Amount must be positive (kobo).'),
    bankName: z.string().trim().max(80).default(''),
    narration: z.string().trim().max(120).default(''),
    transferDate: z.string().trim().max(40).default(''),
  })
  .strict();

export const confirmClaimSchema = z
  .object({ claimId: uuid, approve: z.boolean(), note: z.string().trim().max(500).default('') })
  .strict();

export const refundSchema = z
  .object({
    paymentId: uuid,
    amountKobo: z.number().int().positive(),
    reason: z.string().trim().min(1).max(300),
  })
  .strict();

export type InitPaymentInput = z.infer<typeof initPaymentSchema>;
