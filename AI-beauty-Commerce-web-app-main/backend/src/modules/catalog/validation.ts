import { z } from 'zod';

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case.')
  .max(120);
const url = z.string().trim().url().max(500);

// ---------- Public catalogue query (all clients share these caps) ----------
export const productQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(80).optional(),
    category: slug.optional(),
    brand: slug.optional(),
    sort: z.enum(['newest', 'price-asc', 'price-desc', 'rating']).default('newest'),
    inStock: z.enum(['true', 'false']).optional(),
    // Cursor (opaque, keyset) — offset pagination is banned on growing sets (§10).
    // Over-large limits clamp (never reject — clients stay functional, cost bounded).
    limit: z.coerce.number().int().min(1).default(20).transform((v) => Math.min(v, 100)),
    cursor: z.string().max(500).optional(),
  })
  .strict();

export type ProductQuery = z.infer<typeof productQuerySchema>;

// ---------- Admin writes (role-gated at the route; price-change audit lands S7) ----------
export const brandSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    slug: slug.optional(),
    description: z.string().trim().max(2000).default(''),
    logoUrl: url.optional(),
    isActive: z.boolean().default(true),
  })
  .strict();

export const categorySchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    slug: slug.optional(),
    parentId: z.string().uuid().nullable().default(null),
    description: z.string().trim().max(2000).default(''),
    imageUrl: url.optional(),
    sortOrder: z.number().int().min(0).max(10000).default(0),
    isActive: z.boolean().default(true),
  })
  .strict();

const variantSchema = z
  .object({
    sku: z.string().trim().min(1).max(60),
    sizeLabel: z.string().trim().min(1).max(40).default('Standard'),
    priceKobo: z.number().int().positive('Price must be positive (kobo).'),
    compareAtKobo: z.number().int().positive().nullable().default(null),
    isActive: z.boolean().default(true),
    position: z.number().int().min(0).max(100).default(0),
  })
  .strict();

export const productCreateSchema = z
  .object({
    brandId: z.string().uuid(),
    categoryId: z.string().uuid(),
    name: z.string().trim().min(1).max(200),
    slug: slug.optional(),
    tagline: z.string().trim().max(300).default(''),
    description: z.string().trim().max(8000).default(''),
    subCategory: z.string().trim().max(120).default(''),
    hashtag: z.string().trim().max(60).optional(),
    isBestseller: z.boolean().default(false),
    isNew: z.boolean().default(false),
    isFlashSale: z.boolean().default(false),
    isActive: z.boolean().default(true),
    variants: z.array(variantSchema).min(1, 'At least one variant is required.').max(20),
    images: z.array(z.object({ url, alt: z.string().trim().max(200).default('') }).strict()).max(10).default([]),
    attributes: z.array(z.object({ name: z.string().trim().min(1).max(80), value: z.string().trim().min(1).max(300) }).strict()).max(40).default([]),
    ingredients: z.array(z.object({ name: z.string().trim().min(1).max(160), description: z.string().trim().max(1000).default(''), detail: z.string().trim().max(80).default('') }).strict()).max(40).default([]),
  })
  .strict();

export const productUpdateSchema = productCreateSchema
  .omit({ variants: true })
  .partial()
  .extend({ variants: z.array(variantSchema.extend({ id: z.string().uuid().optional() })).max(20).optional() })
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update.');

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
