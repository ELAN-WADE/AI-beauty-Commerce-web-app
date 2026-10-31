import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { workspaceRecords } from './schema';
import { audit } from '../audit/service';
import { revalidateStorefront } from '../../lib/storefront-revalidate';
import { DEFAULT_HERO_SETTINGS, HERO_TARGETS } from '@/storefront/lib/hero-settings';

const text = z.string().max(8000);
const image = z.string().max(1000).refine(v => /^\/(?!\/)/.test(v) || /^https:\/\//.test(v), 'Use a site image path or HTTPS URL.');
const route = z.string().max(100).regex(/^[a-z0-9-]*$/);

export const storefrontSchema = z.object({
  hero: z.object({
    mode: z.enum(['flex', 'slideshow']), heading: z.string().trim().min(1).max(48),
    body: z.string().trim().max(100), actionLabel: z.string().trim().min(1).max(40),
    actionRoute: z.enum(HERO_TARGETS), intervalSeconds: z.number().int().min(3).max(15),
  }).default(DEFAULT_HERO_SETTINGS),
  heroSlides: z.array(z.object({ id: text, image, tag: text, headline: text, subtext: text, actionLabel: text, actionRoute: route.optional(), actionCategory: route.optional(), secondaryActionText: text.optional(), secondaryRoute: route.optional(), isActive: z.boolean(), order: z.number().optional(), displayOrder: z.number().optional() }).strict()).max(20),
  routineSteps: z.array(z.object({ id: text.optional(), step: text.optional(), price: z.number().optional(), skinType: text.optional(), number: text.optional(), title: text, productName: text, productId: text.optional(), associatedProductId: text.optional(), image, tagline: text, description: text, keyBenefit: text, isActive: z.boolean().optional() }).strict()).max(20),
  brandStory: z.object({ tagline: text, heading: text, paragraph1: text, paragraph2: text, image, badge1: text, badge2: text }).strict(),
  announcementTicker: z.object({ text, linkText: text.optional(), linkRoute: route.optional(), isActive: z.boolean() }).strict(),
}).strict();

const key = 'storefront-editorial-config';

export async function readStorefront(db: Db) {
  const [row] = await db.select().from(workspaceRecords).where(eq(workspaceRecords.idempotencyKey, key));
  return { version: row?.version ?? 0, config: row ? storefrontSchema.parse(JSON.parse(row.body)) : null };
}

export async function saveStorefront(db: Db, actorId: string, version: number, config: z.infer<typeof storefrontSchema>) {
  const result = await db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${key}, 0))`);
    const current = await readStorefront(tx);
    if (version !== current.version) throw Errors.conflict('Storefront changed. Reload before publishing.');
    await tx.insert(workspaceRecords).values({ audience: 'ALL', kind: 'STOREFRONT_CONFIG', title: 'Storefront editorial', status: 'PUBLISHED', body: JSON.stringify(config), idempotencyKey: key }).onConflictDoUpdate({ target: workspaceRecords.idempotencyKey, set: { body: JSON.stringify(config), version: version + 1, updatedAt: new Date() } });
    await audit(tx, { actorId, action: 'storefront.publish', entityType: 'storefront', entityId: key, after: { version: version + 1 } });
    return { version: version + 1, config };
  });
  revalidateStorefront();
  return result;
}
