import { z } from 'zod';

const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{7,15}$/, 'Enter a valid phone number.')
  .max(16);

export const updateProfileSchema = z
  .object({
    displayName: z.string().trim().min(1).max(80).optional(),
    phone: phone.optional(),
    avatarUrl: z.string().trim().url('Avatar must be a URL.').max(500).optional(),
  })
  .strict();

const addressBody = z.object({
  label: z.string().trim().min(1).max(40).default('Home'),
  fullName: z.string().trim().min(1).max(120),
  phone,
  street: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().min(2).max(60).default('NG'),
  isDefault: z.boolean().default(false),
});

export const createAddressSchema = addressBody.strict();
export const updateAddressSchema = addressBody.partial().strict().refine(
  (v) => Object.keys(v).length > 0,
  'Provide at least one field to update.',
);

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
