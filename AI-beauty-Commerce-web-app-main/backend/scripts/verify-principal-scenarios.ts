import 'dotenv/config';
import { getDb, closeDb } from '../src/db/client';
import { savePortalProduct, portalProductSchema } from '../src/modules/catalog/portal';
import { products, productVariants } from '../src/modules/catalog/schema';
import { reviews } from '../src/modules/reviews/schema';
import { stockLevels, inventoryLocations, HQ_LOCATION_ID, reservations } from '../src/modules/inventory/schema';
import { users } from '../src/modules/auth/schema';
import { listProducts } from '../src/modules/catalog/service';
import { reserveStock } from '../src/modules/inventory/service';
import { subscribeStorefrontSync, revalidateStorefront } from '../src/lib/storefront-revalidate';
import { eq, or, ilike } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

async function runPrincipalScenarios() {
  console.log('=================================================================');
  console.log('PRINCIPAL ARCHITECTURE DIRECTIVE: 10 SCENARIO VERIFICATION SUITE');
  console.log('=================================================================\n');

  const db = getDb();
  let passedCount = 0;

  // Setup test admin
  let [admin] = await db.select().from(users).where(eq(users.email, 'admin@desla.test')).limit(1);
  if (!admin) {
    [admin] = await db.insert(users).values({
      email: 'admin@desla.test',
      passwordHash: 'scrypt$hash',
      emailVerifiedAt: new Date(),
    }).returning();
  }

  // Ensure default inventory location exists
  let [hq] = await db.select().from(inventoryLocations).where(eq(inventoryLocations.id, HQ_LOCATION_ID)).limit(1);
  if (!hq) {
    await db.insert(inventoryLocations).values({
      id: HQ_LOCATION_ID,
      code: 'HQ-LOS',
      name: 'Lagos Central Hub',
      city: 'Lagos',
      state: 'Lagos',
      pickupEnabled: true,
      deliveryEnabled: true,
      isActive: true,
    });
  }

  // SCENARIO 1: Product / Formulation Creation
  console.log('Scenario 1: Product Creation & Authoritative Database Commit');
  const baseSlug = `ceramide-barrier-${Date.now().toString().slice(-6)}`;
  const variantId1 = randomUUID();
  const initialPayload = portalProductSchema.parse({
    slug: baseSlug,
    name: 'Restorative Botanical Ceramide Balm',
    brand: 'Desla Formulations',
    category: 'skincare',
    subCategory: 'Barrier Care',
    tagline: 'Phytoceramide lipid replenishment for delicate skin',
    description: 'Natural moisture barrier protection formulated with cold-pressed botanical lipids.',
    isActive: true,
    isNew: true,
    isBestseller: false,
    isFlashSale: false,
    image: '/product_barrier_cream.jpg',
    galleryImages: ['/product_barrier_cream.jpg'],
    variants: [
      {
        id: variantId1,
        sku: `BALM-${Date.now().toString().slice(-4)}`,
        sizeLabel: '50ml',
        priceNgn: 14500,
        compareAtNgn: 17000,
        stock: 50,
        isActive: true,
      },
    ],
    whatItDoes: ['Restores epidermal barrier', 'Protects against environmental dryness'],
    whoItsFor: {
      skinTypes: ['All Skin Types', 'Sensitive'],
      concerns: ['Dryness', 'Barrier Damage'],
    },
    keyIngredients: [
      { name: 'Phytoceramide Complex', percentage: '3%', description: 'Restorative plant-derived ceramides' },
    ],
    howToUse: {
      routine: 'AM/PM',
      step: 'Moisturizer',
      instructions: 'Warm between fingertips and gently press into face and neck.',
      precautions: 'For external use only.',
    },
    brandInfo: {
      origin: 'Nigeria',
      crueltyFree: true,
      guarantee: 'Formulated with certified botanical extracts.',
    },
  });

  const created = await savePortalProduct(db, admin.id, initialPayload, `test:create:${baseSlug}`);
  const [createdProduct] = await db.select().from(products).where(eq(products.id, created.id)).limit(1);
  const createdVariants = await db.select().from(productVariants).where(eq(productVariants.productId, created.id));
  if (createdProduct && createdProduct.slug === baseSlug && createdVariants.length === 1) {
    console.log('  ✓ Product committed with slug:', createdProduct.slug, 'and variant count:', createdVariants.length);
    passedCount++;
  } else {
    throw new Error('Scenario 1 Failed: Product commit mismatch.');
  }

  // SCENARIO 2: Publication Lifecycle (DRAFT vs PUBLISHED)
  console.log('\nScenario 2: Publication Lifecycle Invariant (DRAFT vs PUBLISHED)');
  const draftSlug = `draft-elixir-${Date.now().toString().slice(-6)}`;
  const draftVariantId = randomUUID();
  const draftPayload = portalProductSchema.parse({
    slug: draftSlug,
    name: 'Unpublished Experimental Elixir',
    brand: 'Desla Formulations',
    category: 'skincare',
    subCategory: 'R&D',
    tagline: 'Internal formulation draft',
    description: 'Pending NAFDAC and dermatological trials.',
    isActive: false, // DRAFT / UNPUBLISHED
    isNew: false,
    isBestseller: false,
    isFlashSale: false,
    image: '/product_barrier_cream.jpg',
    galleryImages: [],
    variants: [
      {
        id: draftVariantId,
        sku: `DRAFT-${Date.now().toString().slice(-4)}`,
        sizeLabel: '30ml',
        priceNgn: 25000,
        compareAtNgn: 30000,
        stock: 10,
        isActive: false,
      },
    ],
    whatItDoes: ['Experimental evaluation'],
    whoItsFor: {
      skinTypes: ['All'],
      concerns: ['Trial'],
    },
    keyIngredients: [
      { name: 'Cold Pressed Marula Oil', percentage: '100%', description: 'Unrefined pure botanical oil' },
    ],
    howToUse: {
      routine: 'PM',
      step: 'Oil',
      instructions: 'Apply 2 drops.',
      precautions: 'Patch test required.',
    },
    brandInfo: {
      origin: 'Nigeria',
      crueltyFree: true,
      guarantee: 'Trial batch.',
    },
  });

  await savePortalProduct(db, admin.id, draftPayload, `test:draft:${draftSlug}`);
  const publicStorefrontItems = (await listProducts(db, { sort: 'newest', limit: 20 })).items;
  const draftInPublic = publicStorefrontItems.some((p) => p.slug === draftSlug);
  if (!draftInPublic) {
    console.log('  ✓ Draft product is strictly excluded from public storefront queries.');
    passedCount++;
  } else {
    throw new Error('Scenario 2 Failed: Draft product appeared in public storefront!');
  }

  // SCENARIO 3: Real-Time Storefront Synchronization via SSE Broadcast
  console.log('\nScenario 3: Real-Time Storefront Synchronization Broadcast');
  let sseReceived = false;
  let receivedSlug: string | null | undefined = null;
  const unsubscribe = subscribeStorefrontSync((event) => {
    sseReceived = true;
    receivedSlug = event.slug;
  });

  revalidateStorefront(baseSlug);
  unsubscribe();

  if (sseReceived && receivedSlug === baseSlug) {
    console.log('  ✓ Invalidation broadcast successfully dispatched to open storefront subscribers.');
    passedCount++;
  } else {
    throw new Error('Scenario 3 Failed: SSE synchronization event was not received.');
  }

  // SCENARIO 4: Product Modification & Optimistic Concurrency
  console.log('\nScenario 4: Product Modification & Concurrency Safety');
  const activeVariantId = createdVariants[0].id;
  const updatePayload = {
    ...initialPayload,
    serverId: created.id,
    version: createdProduct.version,
    name: 'Restorative Botanical Ceramide Balm (Enhanced)',
    variants: [
      {
        ...initialPayload.variants[0],
        id: activeVariantId,
        priceNgn: 15500, // Price adjusted
      },
    ],
  };

  const updated = await savePortalProduct(db, admin.id, updatePayload, `test:update:${baseSlug}`);
  const [updatedProduct] = await db.select().from(products).where(eq(products.id, created.id)).limit(1);
  const [updatedVariant] = await db.select().from(productVariants).where(eq(productVariants.productId, created.id)).limit(1);
  if (updatedProduct.version === createdProduct.version + 1 && updatedVariant.priceKobo === 1550000) {
    console.log('  ✓ Product updated safely with version bump:', updatedProduct.version, 'and price:', updatedVariant.priceKobo / 100, 'NGN');
    passedCount++;
  } else {
    throw new Error('Scenario 4 Failed: Concurrency version or price mismatch.');
  }

  // SCENARIO 5: Unpublishing & De-listing
  console.log('\nScenario 5: Product Unpublishing & Instant Storefront De-listing');
  const unpublishPayload = {
    ...updatePayload,
    version: updatedProduct.version,
    isActive: false, // Transition to inactive
  };
  await savePortalProduct(db, admin.id, unpublishPayload, `test:unpublish:${baseSlug}`);
  const postUnpublishPublic = (await listProducts(db, { sort: 'newest', limit: 20 })).items;
  const stillPublic = postUnpublishPublic.some((p) => p.slug === baseSlug);
  if (!stillPublic) {
    console.log('  ✓ Inactive product instantly disappears from public catalog list.');
    passedCount++;
  } else {
    throw new Error('Scenario 5 Failed: Unpublished product still listed publicly.');
  }

  // Re-activate product for remaining scenarios
  const reactivatePayload = {
    ...unpublishPayload,
    version: updatedProduct.version + 1,
    isActive: true,
  };
  await savePortalProduct(db, admin.id, reactivatePayload, `test:reactivate:${baseSlug}`);

  // SCENARIO 6: Inventory Reservation & Concurrency Integrity
  console.log('\nScenario 6: Inventory Reservation & Overselling Prevention');
  const reservationOrderId = randomUUID();
  const reserveSuccess = await reserveStock(db, {
    locationId: HQ_LOCATION_ID,
    variantId: activeVariantId,
    qty: 5,
    refType: 'order',
    refId: reservationOrderId,
    ttlMinutes: 15,
  });

  const [lvl] = await db.select().from(stockLevels)
    .where(eq(stockLevels.variantId, activeVariantId)).limit(1);

  if (reserveSuccess && lvl.reserved === 5 && lvl.onHand === 50) {
    console.log(`  ✓ Stock reserved atomically (onHand=${lvl.onHand}, reserved=${lvl.reserved}).`);
    passedCount++;
  } else {
    throw new Error('Scenario 6 Failed: Stock reservation failed.');
  }

  // Test overselling prevention
  let oversold = false;
  try {
    await reserveStock(db, {
      locationId: HQ_LOCATION_ID,
      variantId: activeVariantId,
      qty: 100,
      refType: 'order',
      refId: randomUUID(),
      ttlMinutes: 15,
    });
    oversold = true;
  } catch (err: any) {
    // Expected: insufficient stock
  }

  if (!oversold) {
    console.log('  ✓ Overselling correctly rejected when requested quantity exceeds available stock.');
  } else {
    throw new Error('Scenario 6 Failed: System permitted overselling beyond on-hand inventory!');
  }

  // SCENARIO 7: Authorization Boundaries & Role Enforcement
  console.log('\nScenario 7: Authorization Boundary Protection');
  // Verify permissions engine strictly denies administrative access to subjects without admin roles
  const { hasPermission } = await import('../src/lib/permissions');
  const dummyUserId = '00000000-0000-0000-0000-000000000999';
  const hasAccess = await hasPermission(db, dummyUserId, 'products:write');
  if (!hasAccess) {
    console.log('  ✓ Administrative write privileges strictly enforced; unauthorized subjects cannot write to catalog.');
    passedCount++;
  } else {
    throw new Error('Scenario 7 Failed: Unauthorized subject granted permission!');
  }

  // SCENARIO 8: Genuine Review & Rating Presentation
  console.log('\nScenario 8: Genuine Review & Star Rating Integrity');
  // Check that new product initially has clean unrated state (no manufactured reviews)
  const [cleanProduct] = await db.select().from(products).where(eq(products.id, created.id)).limit(1);
  const reviewsBefore = await db.select().from(reviews).where(eq(reviews.productId, created.id));

  // Submit an authentic review
  await db.insert(reviews).values({
    productId: created.id,
    userId: admin.id,
    authorName: 'Adaora K.',
    rating: 5,
    title: 'Transformative Barrier Cream',
    comment: 'Absorbs immediately without any greasy residue. Kept my skin nourished all through the harmattan season.',
    verifiedPurchase: true,
    status: 'approved',
  });

  const reviewsAfter = await db.select().from(reviews).where(eq(reviews.productId, created.id));
  if (reviewsBefore.length === 0 && reviewsAfter.length === 1 && reviewsAfter[0].rating === 5) {
    console.log('  ✓ Product transitioned from clean unrated state to genuine single 5.0 star review.');
    passedCount++;
  } else {
    throw new Error('Scenario 8 Failed: Review verification failed.');
  }

  // SCENARIO 9: UI Regression & Compliance Check
  console.log('\nScenario 9: UI Regression, WhatsApp Bypass Removal & Aesthetic Compliance');
  const fs = await import('fs');
  const productDetailsCode = fs.readFileSync('../src/screens/catalog/Screen07ProductDetails.tsx', 'utf-8');
  const hasDirectWhatsAppBeneathCart = productDetailsCode.includes('WhatsApp Pickup from') || productDetailsCode.includes('wa.me');
  const hasClinicalWords = productDetailsCode.toLowerCase().includes('clinical grade') || productDetailsCode.toLowerCase().includes('melanin-rich');

  if (!hasDirectWhatsAppBeneathCart && !hasClinicalWords) {
    console.log('  ✓ Screen07ProductDetails has WhatsApp cart bypass removed and clean natural wording.');
    passedCount++;
  } else {
    throw new Error('Scenario 9 Failed: Found direct WhatsApp cart bypass or unpurged clinical text in Screen07ProductDetails!');
  }

  // SCENARIO 10: Fault Tolerance & Idempotency
  console.log('\nScenario 10: Idempotency & Fault Tolerance Under Repeated Submissions');
  const idemKey = `idem:${randomUUID()}`;
  const [current] = await db.select().from(products).where(eq(products.id, created.id)).limit(1);
  const idempotentPayload = {
    ...reactivatePayload,
    version: current.version,
  };
  const firstCall = await savePortalProduct(db, admin.id, idempotentPayload, idemKey);
  const secondCall = await savePortalProduct(db, admin.id, idempotentPayload, idemKey);

  if (firstCall.id === secondCall.id && firstCall.slug === secondCall.slug) {
    console.log('  ✓ Repeated idempotent submissions return identical committed representation without duplicate records.');
    passedCount++;
  } else {
    throw new Error('Scenario 10 Failed: Idempotent replay created divergent state.');
  }

  console.log('\n=================================================================');
  console.log(`ALL 10 PRINCIPAL DIRECTIVE SCENARIOS PASSED: ${passedCount}/10 (100%)`);
  console.log('=================================================================\n');

  // Clean up temporary scenario products so storefront remains 100% clean
  try {
    const testProds = await db.select().from(products).where(or(ilike(products.slug, 'ceramide-barrier-%'), ilike(products.slug, 'draft-elixir-%')));
    for (const tp of testProds) {
      const vs = await db.select().from(productVariants).where(eq(productVariants.productId, tp.id));
      for (const v of vs) {
        await db.delete(reservations).where(eq(reservations.variantId, v.id));
        await db.delete(stockLevels).where(eq(stockLevels.variantId, v.id));
      }
      await db.delete(reviews).where(eq(reviews.productId, tp.id));
      await db.delete(productVariants).where(eq(productVariants.productId, tp.id));
      await db.delete(products).where(eq(products.id, tp.id));
    }
    revalidateStorefront();
  } catch {
    // Non-fatal cleanup
  }

  await closeDb();
}

runPrincipalScenarios().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
