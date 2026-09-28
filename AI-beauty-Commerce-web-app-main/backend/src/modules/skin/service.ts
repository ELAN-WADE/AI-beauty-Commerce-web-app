import { and, desc, eq } from 'drizzle-orm';
import type { AppDb, Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { checkMagicBytes, headBytes, headScan, presignedGetUrl, presignedPutUrl, scanObjectKey, scansBucket } from '../../lib/storage';
import { getAiProvider } from '../../lib/ai-provider';
import { hydrate, type PublicProduct } from '../catalog/service';
import { products } from '../catalog/schema';
import { brands, categories } from '../catalog/schema';
import { analysisResults, skinAnalyses, skinProfiles } from './schema';
import { ANALYSIS_MAX_BYTES, analysisResultSchema, CONSENT_VERSION } from './validation';

// ---------- Skin profile ----------

export async function getSkinProfile(db: Db, userId: string) {
  const rows = await db.select().from(skinProfiles).where(eq(skinProfiles.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function upsertSkinProfile(db: AppDb, userId: string, input: { skinType: string; concerns: string[]; notes: string }) {
  const [row] = await db
    .insert(skinProfiles)
    .values({ userId, ...input })
    .onConflictDoUpdate({ target: skinProfiles.userId, set: { ...input, updatedAt: new Date() } })
    .returning();
  return row;
}

// ---------- Analyses ----------

export async function initAnalysis(db: AppDb, userId: string, input: { mime: string; bytes: number; consentVersion: string }) {
  // Consent + version are enforced by Zod literals at the route; recorded here.
  const [job] = await db
    .insert(skinAnalyses)
    .values({ userId, status: 'pending', consentAccepted: true, consentVersion: input.consentVersion, imageMime: input.mime, imageBytes: input.bytes })
    .returning({ id: skinAnalyses.id });
  const key = scanObjectKey(userId, job.id, input.mime);
  await db.update(skinAnalyses).set({ imageKey: key }).where(eq(skinAnalyses.id, job.id));
  const uploadUrl = await presignedPutUrl(scansBucket(), key, input.mime);
  return { analysisId: job.id, uploadUrl, objectKey: key, expiresInSec: 900 };
}

async function failJob(db: AppDb, id: string, error: string): Promise<never> {
  await db.update(skinAnalyses).set({ status: 'failed', error: error.slice(0, 500), updatedAt: new Date() }).where(eq(skinAnalyses.id, id));
  throw Errors.badRequest(error);
}

/**
 * Complete: verify the upload (HEAD size/mime + magic bytes), run the
 * provider, Zod-validate the output, store the result, refresh the profile.
 * Model output is data, never a decision — matching happens against the DB.
 */
export async function completeAnalysis(db: AppDb, userId: string, analysisId: string) {
  const rows = await db.select().from(skinAnalyses).where(and(eq(skinAnalyses.id, analysisId), eq(skinAnalyses.userId, userId))).limit(1);
  const job = rows[0];
  if (!job) throw Errors.notFound('Analysis not found.');
  if (job.status !== 'pending') throw Errors.conflict('Analysis already processed.');
  if (!job.imageKey || !job.imageMime) throw Errors.badRequest('No upload registered for this analysis.');

  const head = await headScan(scansBucket(), job.imageKey);
  if (!head) return failJob(db, job.id, 'Upload not found — please upload again.');
  if (head.bytes <= 0 || head.bytes > ANALYSIS_MAX_BYTES) return failJob(db, job.id, 'Upload size invalid.');
  if (head.mime !== job.imageMime) return failJob(db, job.id, 'Upload content type mismatch.');
  if (head.bytes !== (job.imageBytes ?? -1)) return failJob(db, job.id, 'Upload corrupted in transit — please retry.');
  const magic = await headBytes(scansBucket(), job.imageKey, 12);
  if (!checkMagicBytes(magic, job.imageMime)) {
    return failJob(db, job.id, 'File content is not a genuine image.');
  }

  await db.update(skinAnalyses).set({ status: 'processing', updatedAt: new Date() }).where(eq(skinAnalyses.id, job.id));
  const profile = await getSkinProfile(db, userId);
  let parsed: ReturnType<typeof analysisResultSchema.parse>;
  try {
    const raw = await getAiProvider().analyze({
      skinTypeHint: profile?.skinType ?? '',
      concernHints: profile?.concerns ?? [],
    });
    parsed = analysisResultSchema.parse(raw);
  } catch {
    await db.update(skinAnalyses).set({ status: 'failed', error: 'Analysis engine error — please retry.', updatedAt: new Date() }).where(eq(skinAnalyses.id, job.id));
    throw Errors.badRequest('Analysis engine error — please retry.');
  }

  await db.transaction(async (tx) => {
    await tx.insert(analysisResults).values({
      analysisId: job.id,
      skinType: parsed.skinType,
      concerns: parsed.concerns,
      hydration: parsed.hydration,
      oiliness: parsed.oiliness,
      sensitivity: parsed.sensitivity,
      texture: parsed.texture,
      summary: parsed.summary,
    }).onConflictDoNothing();
    await tx
      .insert(skinProfiles)
      .values({ userId, skinType: parsed.skinType, concerns: parsed.concerns, notes: profile?.notes ?? '' })
      .onConflictDoUpdate({ target: skinProfiles.userId, set: { skinType: parsed.skinType, concerns: parsed.concerns, updatedAt: new Date() } });
    await tx.update(skinAnalyses).set({ status: 'complete', updatedAt: new Date() }).where(eq(skinAnalyses.id, job.id));
  });

  return { analysisId: job.id, provider: getAiProvider().name, result: parsed };
}

export async function getAnalysis(db: Db, userId: string, analysisId: string) {
  const rows = await db.select().from(skinAnalyses).where(and(eq(skinAnalyses.id, analysisId), eq(skinAnalyses.userId, userId))).limit(1);
  const job = rows[0];
  if (!job) throw Errors.notFound('Analysis not found.');
  const res = await db.select().from(analysisResults).where(eq(analysisResults.analysisId, job.id)).limit(1);
  const viewUrl = job.imageKey && job.status === 'complete' ? await presignedGetUrl(scansBucket(), job.imageKey) : null;
  return { job: { ...job }, result: res[0] ?? null, viewUrl };
}

export async function listAnalyses(db: Db, userId: string, limit = 20) {
  return db.select().from(skinAnalyses).where(eq(skinAnalyses.userId, userId)).orderBy(desc(skinAnalyses.createdAt)).limit(Math.min(50, Math.max(1, limit)));
}

// ---------- Recommendation engine (DB-grounded, never model-invented) ----------

export interface ConcernRule {
  match: RegExp;
  categories: string[];
  subLikes: string[];
  nameLikes: string[];
  reason: string;
}

const RULES: ConcernRule[] = [
  { match: /dry|dehydrat|ashen|flak/i, categories: ['body-care'], subLikes: ['oil', 'butter', 'lotion'], nameLikes: ['shea', 'oil', 'butter'], reason: 'Deep moisture barrier support' },
  { match: /dull|glow|radiance|tone/i, categories: ['body-care', 'skincare'], subLikes: ['oil', 'serum'], nameLikes: ['glow', 'radiant', 'vitamin'], reason: 'Radiance and tone support' },
  { match: /acne|blemish|breakout|oil\b|oily|pore|blackhead/i, categories: ['skincare'], subLikes: ['cleanser', 'serum'], nameLikes: ['cleanser', 'niacinamide', 'salicylic'], reason: 'Congestion-conscious care' },
  { match: /sun|uv|hyperpigment|dark.?spot|melasma|spf/i, categories: ['skincare'], subLikes: ['sunscreen', 'spf'], nameLikes: ['spf', 'sunscreen', 'shield'], reason: 'Daily UV defence' },
  { match: /ag(e|ing)|wrinkle|fine.?line|firm|elastic/i, categories: ['skincare'], subLikes: ['serum', 'moisturizer'], nameLikes: ['retinol', 'peptide', 'ceramide'], reason: 'Firmness and texture support' },
  { match: /sensitiv|redness|irritat|calm/i, categories: ['skincare'], subLikes: ['cleanser', 'moisturizer'], nameLikes: ['gentle', 'calm', 'soothe'], reason: 'Gentle, barrier-first care' },
  { match: /lip|chapped/i, categories: ['makeup'], subLikes: ['lip'], nameLikes: ['lip'], reason: 'Lip care' },
  { match: /fragrance|scent|perfume|cologne|oud/i, categories: ['fragrance'], subLikes: ['perfume', 'oil'], nameLikes: ['amber', 'oud', 'parfum'], reason: 'Haute parfumerie match' },
];

export interface Recommendation {
  slug: string;
  name: string;
  priceNgn: number;
  rating: number;
  available: number;
  reasons: string[];
}

/** Pure concern→rule matching (unit-tested; scoring stays in the engine). */
export function matchingRules(concerns: string[]): ConcernRule[] {
  const text = concerns.join(' ').toLowerCase();
  const hits = RULES.filter((r) => r.match.test(text));
  return hits.length > 0 ? hits : [{ match: /.*/, categories: [], subLikes: [], nameLikes: [], reason: 'Community bestsellers' }];
}

export async function recommendForConcerns(db: AppDb, concerns: string[]): Promise<Recommendation[]> {
  const rules = matchingRules(concerns);

  // Candidate pool: active products, best first (small catalogue: single pass).
  const pool = await db
    .select({ p: products, brandSlug: brands.slug, catSlug: categories.slug, catName: categories.name, brandName: brands.name })
    .from(products)
    .innerJoin(brands, eq(products.brandId, brands.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.isActive, true))
    .orderBy(desc(products.rating))
    .limit(200);
  const hydrated: PublicProduct[] = await hydrate(
    db,
    pool.map((r) => r.p),
    pool.map((r) => ({ brandName: r.brandName, brandSlug: r.brandSlug, catName: r.catName, catSlug: r.catSlug })),
  );

  const scored: { item: PublicProduct; score: number; reasons: string[] }[] = [];
  for (const item of hydrated) {
    if (item.totalAvailable <= 0 || item.variants.length === 0) continue; // in-stock only (§14)
    let score = 0;
    const reasons: string[] = [];
    for (const rule of rules) {
      let matched = false;
      if (rule.categories.length === 0) {
        score += 1; // bestseller fallback
        matched = true;
      } else {
        if (rule.categories.includes(item.category.slug)) {
          score += 3;
          matched = true;
        }
        const hay = `${item.subCategory} ${item.name}`.toLowerCase();
        if (rule.subLikes.some((s) => hay.includes(s))) {
          score += 2;
          matched = true;
        }
        if (rule.nameLikes.some((s) => hay.includes(s))) {
          score += 1;
          matched = true;
        }
      }
      if (matched && !reasons.includes(rule.reason)) reasons.push(rule.reason);
    }
    if (item.isBestseller) score += 1;
    if (score > 0) scored.push({ item, score, reasons });
  }
  scored.sort((a, b) => b.score - a.score || b.item.rating - a.item.rating);
  return scored.slice(0, 8).map((s) => ({
    slug: s.item.slug,
    name: s.item.name,
    priceNgn: s.item.minPriceNgn,
    rating: s.item.rating,
    available: s.item.totalAvailable,
    reasons: s.reasons,
  }));
}

export async function recommendForAnalysis(db: AppDb, userId: string, analysisId: string) {
  const rows = await db.select().from(skinAnalyses).where(and(eq(skinAnalyses.id, analysisId), eq(skinAnalyses.userId, userId))).limit(1);
  if (!rows[0]) throw Errors.notFound('Analysis not found.');
  const res = await db.select().from(analysisResults).where(eq(analysisResults.analysisId, analysisId)).limit(1);
  if (!res[0]) throw Errors.badRequest('Analysis has no result yet.');
  return { analysisId, concerns: res[0].concerns, recommendations: await recommendForConcerns(db, res[0].concerns), provider: getAiProvider().name };
}

export { CONSENT_VERSION };
