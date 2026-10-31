import { z } from 'zod';

export const workspaceKind = z.enum(['CREATOR', 'DISTRIBUTOR']);
const text = z.string().trim().max(5000);
const url = z.union([z.literal(''), z.string().max(1000).refine(v => v.startsWith('/') || v.startsWith('http://') || v.startsWith('https://'), 'Use a valid media URL.')]);
const fields = {
  title: z.string().trim().min(2).max(160), body: text.default(''), url: url.default(''),
  productIds: z.array(z.string().min(1).max(120)).max(24).default([]),
};
export const workspaceCommand = z.discriminatedUnion('action', [
  z.object({ action: z.literal('archive'), kind: z.literal('CREATOR'), id: z.string().uuid(), version: z.number().int().positive() }).strict(),
  z.object({ action: z.literal('deliver'), kind: z.literal('CREATOR'), id: z.string().uuid(), version: z.number().int().positive(), url: z.string().max(1000).refine(v => v.startsWith('http://') || v.startsWith('https://'), 'Use a valid web URL.'), body: text }).strict(),
  z.object({ action: z.literal('save'), kind: workspaceKind, type: z.enum(['CONTENT', 'SUPPORT', 'STOREFRONT']), id: z.string().uuid().optional(), version: z.number().int().positive().optional(), status: z.enum(['DRAFT', 'SUBMITTED']), ...fields }).strict(),
  z.object({ action: z.literal('apply'), kind: workspaceKind, publicationId: z.string().uuid(), ...fields }).strict(),
  z.object({ action: z.literal('profile'), kind: workspaceKind, name: z.string().trim().min(2).max(120), handle: z.string().trim().max(80).default(''), address: z.string().trim().max(300).default(''), phone: z.string().trim().max(16).refine(value => !value || /^\+?[0-9]{7,15}$/.test(value), 'Enter a valid phone number.').default(''), operatingHours: z.string().trim().max(120).default(''), pickupEnabled: z.boolean().optional(), deliveryEnabled: z.boolean().optional() }).strict(),
]);
const publicationDetails = z.object({
  category: z.string().max(200).optional(), retailValue: z.string().max(100).optional(), spotsLeft: z.number().int().min(0).max(100000).optional(),
  commissionRate: z.string().max(100).optional(), bonus: z.string().max(100).optional(), deadline: z.string().max(100).optional(), slots: z.string().max(100).optional(),
  deliverables: z.array(z.string().max(1000)).max(30).optional(), includedProducts: z.array(z.string().max(200)).max(30).optional(), eligibleTiers: z.array(z.enum(['Rising', 'Verified', 'Icon'])).max(3).optional(),
}).strict();
export const adminWorkspaceCommand = z.discriminatedUnion('action', [
  z.object({ action: z.literal('publish'), type: z.enum(['CAMPAIGN', 'PR_BOX', 'RESOURCE', 'ANNOUNCEMENT', 'CMS']), audience: z.enum(['CREATOR', 'DISTRIBUTOR', 'ALL']), id: z.string().uuid().optional(), version: z.number().int().positive().optional(), active: z.boolean(), details: publicationDetails.optional(), ...fields }).strict(),
  z.object({ action: z.literal('review'), id: z.string().uuid(), version: z.number().int().positive(), status: z.enum(['APPROVED', 'REJECTED', 'DISPATCHED', 'DELIVERED', 'RESOLVED']), note: z.string().trim().min(3).max(1000) }).strict(),
]);
