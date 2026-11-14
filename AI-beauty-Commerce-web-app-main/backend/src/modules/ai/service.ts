import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import type { AppDb, Db } from '../../db/client';
import { ApiError, Errors } from '../../lib/errors';
import { getAiProvider } from '../../lib/ai-provider';
import { products } from '../catalog/schema';
import { productVariants } from '../catalog/schema';
import { stockLevels } from '../inventory/schema';
import { aiConversations, aiMessages } from './schema';

const STOPWORDS = new Set(['what', 'which', 'with', 'that', 'this', 'have', 'from', 'they', 'them', 'your', 'about', 'there', 'their', 'would', 'should', 'recommend']);

function keywords(content: string): string[] {
  return [...new Set(content.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3 && !STOPWORDS.has(w)))].slice(0, 8);
}

/** Catalogue grounding: keyword match over active, in-stock variants only. */
export async function groundProducts(db: Db, content: string) {
  const keys = keywords(content);
  if (keys.length === 0) return [];
  const conds = keys.flatMap((k) => {
    const like = `%${k.replace(/[%_]/g, '')}%`;
    return [ilike(products.name, like), ilike(products.subCategory, like)];
  });
  const rows = await db
    .select({
      slug: products.slug,
      name: products.name,
      subCategory: products.subCategory,
      priceKobo: productVariants.priceKobo,
    })
    .from(products)
    .innerJoin(productVariants, and(eq(productVariants.productId, products.id), eq(productVariants.isActive, true)))
    .innerJoin(stockLevels, and(eq(stockLevels.variantId, productVariants.id), eq(stockLevels.pool, 'PLATFORM')))
    .where(and(eq(products.isActive, true), sql`${stockLevels.onHand} > ${stockLevels.reserved}`, or(...conds)))
    .orderBy(desc(products.rating))
    .limit(5);
  const seen = new Set<string>();
  return rows
    .filter((r) => (seen.has(r.slug) ? false : (seen.add(r.slug), true)))
    .map((r) => ({ slug: r.slug, name: r.name, priceNgn: Math.round(r.priceKobo / 100), subCategory: r.subCategory }));
}

export async function createConversation(db: AppDb, userId: string, title: string) {
  const [row] = await db.insert(aiConversations).values({ userId, title }).returning();
  return row;
}

export async function listConversations(db: Db, userId: string) {
  return db.select().from(aiConversations).where(eq(aiConversations.userId, userId)).orderBy(desc(aiConversations.updatedAt)).limit(20);
}

export async function getMessages(db: Db, userId: string, conversationId: string) {
  const conv = await db.select().from(aiConversations).where(and(eq(aiConversations.id, conversationId), eq(aiConversations.userId, userId))).limit(1);
  if (!conv[0]) throw Errors.notFound('Conversation not found.');
  const recent = await db.select().from(aiMessages).where(eq(aiMessages.conversationId, conversationId)).orderBy(desc(aiMessages.createdAt), desc(aiMessages.id)).limit(100);
  return recent.reverse();
}

/**
 * Chat turn: persist user message → ground catalogue → provider reply
 * (length-capped, validated) → persist assistant message. The model receives
 * product names/prices as CONTEXT; it cannot write, price, or fulfil (§14).
 */
export async function postMessage(db: AppDb, userId: string, conversationId: string, content: string) {
  const conv = await db.select().from(aiConversations).where(and(eq(aiConversations.id, conversationId), eq(aiConversations.userId, userId))).limit(1);
  if (!conv[0]) throw Errors.notFound('Conversation not found.');
  const provider = getAiProvider();
  const recent = await db.select({ role: aiMessages.role, content: aiMessages.content }).from(aiMessages)
    .where(eq(aiMessages.conversationId, conversationId)).orderBy(desc(aiMessages.createdAt), desc(aiMessages.id)).limit(9);
  const history = [...recent.reverse(), { role: 'user', content }];
  const grounded = await groundProducts(db, content);
  let reply: string;
  try {
    reply = await provider.chat({ history, catalog: grounded });
  } catch {
    throw new ApiError(503, 'assistant_unavailable', 'The assistant is temporarily unavailable. Please try again.', true);
  }
  // No database connection is held while awaiting the provider. Persist a complete
  // pair atomically, with deterministic chronological order even for simultaneous tabs.
  return db.transaction(async tx => {
    const [owned] = await tx.select({ id: aiConversations.id }).from(aiConversations)
      .where(and(eq(aiConversations.id, conversationId), eq(aiConversations.userId, userId))).for('update');
    if (!owned) throw Errors.notFound('Conversation not found.');
    const [latest] = await tx.select({ at: aiMessages.createdAt }).from(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId)).orderBy(desc(aiMessages.createdAt)).limit(1);
    const at = Math.max(Date.now(), (latest?.at.getTime() ?? 0) + 1);
    const [userMessage, assistantMessage] = await tx.insert(aiMessages).values([
      { conversationId, role: 'user', content, createdAt: new Date(at) },
      { conversationId, role: 'assistant', content: reply.slice(0, 2000), groundedSlugs: grounded.map(product => product.slug), createdAt: new Date(at + 1) },
    ]).returning();
    await tx.update(aiConversations).set({ updatedAt: new Date(at + 1) }).where(eq(aiConversations.id, conversationId));
    return { userMessage, assistantMessage, grounded, provider: provider.name };
  });
}
