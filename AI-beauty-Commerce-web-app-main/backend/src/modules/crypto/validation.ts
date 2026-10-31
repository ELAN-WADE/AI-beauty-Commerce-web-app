import { z } from 'zod';

export const cryptoAssetEnum = z.enum(['USDT', 'BTC', 'ETH', 'SOL']);
export const cryptoNetworkEnum = z.enum(['TRC20', 'ERC20', 'Bitcoin', 'Solana']);

export const initCryptoPaymentSchema = z
  .object({
    orderId: z.string().uuid(),
    asset: cryptoAssetEnum,
    network: cryptoNetworkEnum,
  })
  .strict();

export const verifyCryptoPaymentSchema = z
  .object({
    paymentId: z.string().uuid(),
    txHash: z.string().trim().max(128).optional(),
  })
  .strict();

export const cryptoPaymentStatusQuerySchema = z
  .object({
    paymentId: z.string().uuid(),
  })
  .strict();

export type InitCryptoPaymentInput = z.infer<typeof initCryptoPaymentSchema>;
export type VerifyCryptoPaymentInput = z.infer<typeof verifyCryptoPaymentSchema>;

