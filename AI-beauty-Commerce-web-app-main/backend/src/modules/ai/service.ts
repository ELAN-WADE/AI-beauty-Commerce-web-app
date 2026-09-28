import { and, desc, eq, ilike, or } from 'drizzle-orm';
import type { AppDb, Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { getAiProvider } from '../../lib/ai-provider';
import { products } from '../catalog/schema';
import { productVariants } from '../catalog/schema';
import { aiConversations, aiMessages } from './schema';

const STOPWORDS = new Set(['what', 'which', 'with', 'that', 'this', 'have', 'from', 'they', 'them', 'your', 'about', 'there', 'their', 'would', 'should', 'recommend']);

function keywords(content: string): string[] {
  return [...new Set(content.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3 && !STOPWORDS.has(w)))].slice(0, 8);
}

/** Catalogue grounding: keyword match over active products (read-only context for the model). */
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
    .innerJoin(productVariants, eq(productVariants.productId, products.id))
    .where(and(eq(products.isActive, true), or(...conds)))
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
  return db.select().from(aiMessages).where(eq(aiMessages.conversationId, conversationId)).orderBy(aiMessages.createdAt).limit(100);
}

/**
 * Chat turn: persist user message → ground catalogue → provider reply
 * (length-capped, validated) → persist assistant message. The model receives
 * product names/prices as CONTEXT; it cannot write, price, or fulfil (§14).
 */
export async function postMessage(db: AppDb, userId: string, conversationId: string, content: string) {
  const conv = await db.select().from(aiConversations).where(and(eq(aiConversations.id, conversationId), eq(aiConversations.userId, userId))).limit(1);
  if (!conv[0]) throw Errors.notFound('Conversation not found.');
  const [userMsg] = await db.insert(aiMessages).values({ conversationId, role: 'user', content }).returning();

  const history = await db.select({ role: aiMessages.role, content: aiMessages.content }).from(aiMessages).where(eq(aiMessages.conversationId, conversationId)).orderBy(aiMessages.createdAt).limit(10);
  const grounded = await groundProducts(db, content);
  let reply: string;
  try {
    reply = await getAiProvider().chat({ history, catalog: grounded });
  } catch {
    throw Errors.badRequest('Assistant is temporarily unavailable — please retry.');
  }
  const [assistantMsg] = await db
    .insert(aiMessages)
    .values({ conversationId, role: 'assistant', content: reply.slice(0, 2000), groundedSlugs: grounded.map((g) => g.slug) })
    .returning();
  await db.update(aiConversations).set({ updatedAt: new Date() }).where(eq(aiConversations.id, conversationId));
  return { userMessage: userMsg, assistantMessage: assistantMsg, grounded, provider: getAiProvider().name };
}
