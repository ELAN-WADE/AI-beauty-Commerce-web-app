import { and, asc, desc, eq, sql } from 'drizzle-orm';
import type { AppDb, Db } from '../../db/client';
import { Errors } from '../../lib/errors';
import { productVariants, products } from '../catalog/schema';
import { getLevels } from '../inventory/service';
import { cartItems, carts, recentlyViewed, wishlists } from './schema';

export interface CartOwner {
  userId?: string;
  sessionId?: string;
}

/** Resolve (or lazily create) the caller's cart. Guests MUST present sessionId. */
export async function resolveCart(db: Db, owner: CartOwner) {
  if (owner.userId) {
    const found = await db.select().from(carts).where(eq(carts.userId, owner.userId)).limit(1);
    if (found[0]) return found[0];
    const [created] = await db.insert(carts).values({ userId: owner.userId }).returning();
    return created;
  }
  if (!owner.sessionId) throw Errors.badRequest('Guest carts require X-Session-Id.');
  const found = await db.select().from(carts).where(eq(carts.sessionId, owner.sessionId)).limit(1);
  if (found[0]) return found[0];
  const [created] = await db.insert(carts).values({ sessionId: owner.sessionId }).returning();
  return created;
}

export interface CartLine {
  id: string;
  variantId: string;
  sku: string;
  sizeLabel: string;
  productSlug: string;
  productName: string;
  unitPriceKobo: number;
  unitPriceNgn: number;
  qty: number;
  lineTotalKobo: number;
  available: number;
}

export async function getCartView(db: Db, cartId: string) {
  const rows = await db
    .select({
      item: cartItems,
      variant: productVariants,
      product: { slug: products.slug, name: products.name },
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(cartItems.cartId, cartId))
    .orderBy(asc(cartItems.createdAt));
  const levels = await getLevels(db, rows.map((r) => r.variant.id));
  const avail = new Map([...levels].map(([id, l]) => [id, l.available] as const));
  const lines: CartLine[] = rows.map((r) => ({
    id: r.item.id,
    variantId: r.variant.id,
    sku: r.variant.sku,
    sizeLabel: r.variant.sizeLabel,
    productSlug: r.product.slug,
    productName: r.product.name,
    unitPriceKobo: r.variant.priceKobo,
    unitPriceNgn: r.variant.priceKobo / 100,
    qty: r.item.qty,
    lineTotalKobo: r.variant.priceKobo * r.item.qty,
    available: avail.get(r.variant.id) ?? 0,
  }));
  return { cartId, lines, subtotalKobo: lines.reduce((s, l) => s + l.lineTotalKobo, 0) };
}

async function activeVariant(db: Db, variantId: string) {
  const rows = await db
    .select({ v: productVariants, active: products.isActive })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(productVariants.id, variantId))
    .limit(1);
  const row = rows[0];
  if (!row) throw Errors.notFound('Variant not found.');
  if (!row.v.isActive || !row.active) throw Errors.badRequest('This variant is no longer available.');
  return row.v;
}

export async function addItem(db: AppDb, owner: CartOwner, variantId: string, qty: number) {
  return db.transaction(async (tx) => {
    const cart = await resolveCart(tx, owner);
    await tx.select().from(carts).where(eq(carts.id, cart.id)).for('update').limit(1);
    const variant = await activeVariant(tx, variantId);
    const existing = await tx
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, variant.id)))
      .limit(1);
    if (existing[0]) {
      const next = Math.min(99, existing[0].qty + qty);
      await tx.update(cartItems).set({ qty: next, updatedAt: new Date() }).where(eq(cartItems.id, existing[0].id));
    } else {
      await tx.insert(cartItems).values({ cartId: cart.id, variantId: variant.id, qty: Math.min(99, qty) });
    }
    return getCartView(tx, cart.id);
  });
}

export async function setItemQty(db: AppDb, owner: CartOwner, itemId: string, qty: number) {
  return db.transaction(async (tx) => {
    const cart = await resolveCart(tx, owner);
    const rows = await tx
      .select({ item: cartItems })
      .from(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
      .limit(1);
    if (!rows[0]) throw Errors.notFound('Cart item not found.');
    await tx.update(cartItems).set({ qty, updatedAt: new Date() }).where(eq(cartItems.id, itemId));
    return getCartView(tx, cart.id);
  });
}

export async function removeItem(db: AppDb, owner: CartOwner, itemId: string) {
  const cart = await resolveCart(db, owner);
  const deleted = await db
    .delete(cartItems)
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
    .returning({ id: cartItems.id });
  if (deleted.length === 0) throw Errors.notFound('Cart item not found.');
  return getCartView(db, cart.id);
}

export async function clearCart(db: AppDb, owner: CartOwner) {
  const cart = await resolveCart(db, owner);
  await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  return getCartView(db, cart.id);
}

/** Login merge: guest lines fold into the user cart (qty summed, capped). */
export async function mergeGuestCart(db: AppDb, userId: string, sessionId: string) {
  return db.transaction(async (tx) => {
    const guest = await tx.select().from(carts).where(eq(carts.sessionId, sessionId)).limit(1);
    const user = await resolveCart(tx, { userId });
    if (!guest[0] || guest[0].id === user.id) return getCartView(tx, user.id);
    const lines = await tx.select().from(cartItems).where(eq(cartItems.cartId, guest[0].id));
    for (const line of lines) {
      const existing = await tx
        .select()
        .from(cartItems)
        .where(and(eq(cartItems.cartId, user.id), eq(cartItems.variantId, line.variantId)))
        .limit(1);
      if (existing[0]) {
        await tx
          .update(cartItems)
          .set({ qty: Math.min(99, existing[0].qty + line.qty), updatedAt: new Date() })
          .where(eq(cartItems.id, existing[0].id));
      } else {
        await tx.insert(cartItems).values({ cartId: user.id, variantId: line.variantId, qty: line.qty });
      }
    }
    await tx.delete(carts).where(eq(carts.id, guest[0].id));
    return getCartView(tx, user.id);
  });
}

// ---------- Wishlist (authenticated) ----------

export async function addWishlist(db: AppDb, userId: string, variantId: string) {
  const v = await db.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.id, variantId)).limit(1);
  if (!v[0]) throw Errors.notFound('Variant not found.');
  await db.insert(wishlists).values({ userId, variantId }).onConflictDoNothing();
  return listWishlist(db, userId);
}

export async function removeWishlist(db: AppDb, userId: string, variantId: string) {
  await db.delete(wishlists).where(and(eq(wishlists.userId, userId), eq(wishlists.variantId, variantId)));
  return listWishlist(db, userId);
}

export async function listWishlist(db: Db, userId: string) {
  const rows = await db
    .select({
      variantId: productVariants.id,
      sku: productVariants.sku,
      sizeLabel: productVariants.sizeLabel,
      priceKobo: productVariants.priceKobo,
      slug: products.slug,
      name: products.name,
    })
    .from(wishlists)
    .innerJoin(productVariants, eq(wishlists.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(wishlists.userId, userId))
    .orderBy(desc(wishlists.createdAt));
  const levels = await getLevels(db, rows.map((r) => r.variantId));
  return rows.map((r) => ({ ...r, priceNgn: r.priceKobo / 100, available: levels.get(r.variantId)?.available ?? 0 }));
}

// ---------- Recently viewed (authenticated, capped at 20) ----------

const RECENT_CAP = 20;

export async function recordView(db: AppDb, userId: string, productId: string) {
  const p = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1);
  if (!p[0]) throw Errors.notFound('Product not found.');
  await db
    .insert(recentlyViewed)
    .values({ userId, productId })
    .onConflictDoUpdate({ target: [recentlyViewed.userId, recentlyViewed.productId], set: { viewedAt: new Date() } });
  // Prune beyond cap (keeps the table bounded per user).
  await db.execute(sql`
    DELETE FROM "recently_viewed" a USING (
      SELECT "id" FROM "recently_viewed"
      WHERE "user_id" = ${userId}
      ORDER BY "viewed_at" DESC OFFSET ${RECENT_CAP}
    ) old WHERE a."id" = old."id"`);
  return listRecent(db, userId);
}

export async function listRecent(db: Db, userId: string) {
  return db
    .select({ productId: recentlyViewed.productId, slug: products.slug, name: products.name, viewedAt: recentlyViewed.viewedAt })
    .from(recentlyViewed)
    .innerJoin(products, eq(recentlyViewed.productId, products.id))
    .where(eq(recentlyViewed.userId, userId))
    .orderBy(desc(recentlyViewed.viewedAt))
    .limit(RECENT_CAP);
}
