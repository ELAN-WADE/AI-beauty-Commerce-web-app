import { z } from 'zod';

// NIST 800-63B: length is the control (min 8, cap 128). No complexity theatre.
const password = z.string().min(8, 'Password must be at least 8 characters.').max(128);
const email = z.string().trim().toLowerCase().email('Enter a valid email address.').max(254);

export const registerSchema = z
  .object({ email, password })
  .strict(); // mass-assignment closed: role/isAdmin etc. rejected (§8 API3)

export const loginSchema = z.object({ email, password: z.string().min(1).max(128) }).strict();

export const verifyEmailSchema = z.object({ token: z.string().min(16).max(128) }).strict();

export const requestPasswordResetSchema = z.object({ email }).strict();

export const resetPasswordSchema = z
  .object({ token: z.string().min(16).max(128), newPassword: password })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
