import { z } from 'zod';

const uuid = z.string().uuid();
const email = z.string().trim().toLowerCase().email().max(254);

export const cartItemSchema = z
  .object({ variantId: uuid, qty: z.number().int().min(1).max(99).default(1) })
  .strict();

export const cartQtySchema = z.object({ qty: z.number().int().min(1).max(99) }).strict();

export const mergeCartSchema = z.object({ sessionId: uuid }).strict();

const addressBody = z.object({
  fullName: z.string().trim().min(1).max(120),
  phone: z.string().trim().regex(/^\+?[0-9]{7,15}$/, 'Enter a valid phone number.'),
  street: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().min(2).max(60).default('NG'),
  deliveryNotes: z.string().trim().max(500).default(''),
});

/**
 * Checkout input. Deliberately NO totals/prices/discounts — strict() rejects
 * them (adversarial: client-declared totals are fraud, §6). The server prices.
 */
export const checkoutSchema = z
  .object({
    sessionId: uuid.optional(),
    addressId: uuid.optional(),
    guestAddress: addressBody.optional(),
    guestEmail: email.optional(),
    voucherCode: z.string().trim().min(1).max(32).optional(),
    creatorCode: z.string().trim().min(1).max(40).optional(),
    note: z.string().trim().max(500).default(''),
  })
  .strict()
  .refine(
    (v) => v.addressId !== undefined || (v.guestAddress !== undefined && v.guestEmail !== undefined),
    'Provide addressId or guestAddress + guestEmail.',
  );

export const wishlistAddSchema = z.object({ variantId: uuid }).strict();

export const recordViewSchema = z.object({ productId: uuid }).strict();

export const orderStatusSchema = z
  .object({
    status: z.enum(['PENDING', 'PAID', 'FULFILLING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  })
  .strict();

export type CheckoutInput = z.infer<typeof checkoutSchema>;
