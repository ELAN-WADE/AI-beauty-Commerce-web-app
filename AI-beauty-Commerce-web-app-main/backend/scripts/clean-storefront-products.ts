import 'dotenv/config';
import { getDb, closeDb } from '../src/db/client';
import { products, productVariants, productImages, productAttributes, productIngredients } from '../src/modules/catalog/schema';
import { stockLevels, reservations } from '../src/modules/inventory/schema';
import { orderItems } from '../src/modules/orders/schema';
import { revalidateStorefront } from '../src/lib/storefront-revalidate';
import { eq, or, ilike, inArray } from 'drizzle-orm';

async function main() {
  console.log('Cleaning up test/demo products from PostgreSQL...');
  const db = getDb();

  // Find all test/demo products
  const toClean = await db.select().from(products).where(
    or(
      ilike(products.name, '%test%'),
      ilike(products.name, '%fvfv%'),
      ilike(products.name, '%clinical%'),
      ilike(products.slug, 'draft-elixir-%'),
      ilike(products.slug, 'ceramide-barrier-%'),
      ilike(products.slug, 'clinical-barrier-elixir-%')
    )
  );

  console.log(`Found ${toClean.length} test/demo products:`);
  for (const p of toClean) {
    const variants = await db.select().from(productVariants).where(eq(productVariants.productId, p.id));
    const variantIds = variants.map(v => v.id);

    let hasOrders = false;
    if (variantIds.length > 0) {
      const orders = await db.select().from(orderItems).where(inArray(orderItems.variantId, variantIds)).limit(1);
      hasOrders = orders.length > 0;
    }

    if (hasOrders) {
      // Archive so it never shows up on storefront
      console.log(`- Archiving (has order references): [${p.id}] ${p.name} (${p.slug})`);
      await db.update(products).set({ isActive: false, name: `Archived Test ${p.slug}` }).where(eq(products.id, p.id));
      for (const v of variants) {
        await db.update(productVariants).set({ isActive: false }).where(eq(productVariants.id, v.id));
      }
    } else {
      // Safe to fully delete
      console.log(`- Fully Deleting: [${p.id}] ${p.name} (${p.slug})`);
      for (const v of variants) {
        await db.delete(reservations).where(eq(reservations.variantId, v.id));
        await db.delete(stockLevels).where(eq(stockLevels.variantId, v.id));
      }
      await db.delete(productVariants).where(eq(productVariants.productId, p.id));
      await db.delete(productImages).where(eq(productImages.productId, p.id));
      await db.delete(productAttributes).where(eq(productAttributes.productId, p.id));
      await db.delete(productIngredients).where(eq(productIngredients.productId, p.id));
      await db.delete(products).where(eq(products.id, p.id));
    }
  }

  // Also check if any active product has 'clinical' in its name or description
  const clinicalProducts = await db.select().from(products).where(ilike(products.name, '%clinical%'));
  for (const cp of clinicalProducts) {
    const cleanName = cp.name.replace(/clinical/gi, 'Natural');
    await db.update(products).set({ name: cleanName }).where(eq(products.id, cp.id));
    console.log(`- Renamed: ${cp.name} -> ${cleanName}`);
  }

  // Trigger live storefront cache invalidation and SSE broadcast
  revalidateStorefront();

  const remainingActive = await db.select().from(products).where(eq(products.isActive, true));
  console.log(`\nCleanup complete! Active products on storefront (${remainingActive.length}):`);
  for (const r of remainingActive) {
    console.log(`- [ACTIVE] ${r.name} (${r.slug})`);
  }

  await closeDb();
}

main().catch((err) => {
  console.error('Error during product cleanup:', err);
  process.exit(1);
});
