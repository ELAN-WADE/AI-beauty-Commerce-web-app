import 'dotenv/config';
import { getDb, closeDb } from '../src/db/client';
import { savePortalProduct, portalProductSchema } from '../src/modules/catalog/portal';
import { products, productVariants } from '../src/modules/catalog/schema';
import { orders, orderItems } from '../src/modules/orders/schema';
import { users } from '../src/modules/auth/schema';
import { getLiveCryptoRates, calculateCryptoQuote } from '../src/modules/crypto/rates';
import { initCryptoPayment, verifyCryptoPayment, listAdminCryptoTransactions, getCryptoPaymentStatus } from '../src/modules/crypto/service';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

async function main() {
  console.log('🚀 Starting Full End-to-End System Integration Verification...\n');
  const db = getDb();

  // Step 1: Ensure an admin user exists
  console.log('--- Step 1: Administrator Account Check ---');
  let [admin] = await db.select().from(users).where(eq(users.email, 'admin@desla.test')).limit(1);
  if (!admin) {
    [admin] = await db.insert(users).values({
      email: 'admin@desla.test',
      passwordHash: 'scrypt$dummy_hash',
      emailVerifiedAt: new Date(),
    }).returning();
    console.log('Created test admin user:', admin.id);
  } else {
    console.log('Existing admin verified:', admin.email, `(${admin.id})`);
  }

  // Step 2: Administrator creates and publishes a product to the catalog
  console.log('\n--- Step 2: Admin Product Creation & Publishing ---');
  const testSlug = `clinical-barrier-elixir-${Date.now().toString().slice(-6)}`;
  const variantId = randomUUID();
  const productData = portalProductSchema.parse({
    slug: testSlug,
    name: 'Clinical Ceramide Barrier Elixir',
    brand: 'Desla Clinical',
    category: 'skincare',
    subCategory: 'Barrier Serum',
    tagline: 'Multi-ceramide biomimetic restorative lipid serum',
    description: 'Fortifies the stratum corneum with skin-identical phytoceramides and niacinamide.',
    isActive: true,
    isNew: true,
    isBestseller: true,
    isFlashSale: false,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    ],
    variants: [
      {
        id: variantId,
        sku: `DES-ELX-${Date.now().toString().slice(-4)}`,
        sizeLabel: '50ml',
        priceNgn: 18500,
        compareAtNgn: 22000,
        stock: 45,
        isActive: true,
      },
    ],
    whatItDoes: ['Repairs stratum corneum', 'Restores epidermal lipids', 'Soothes micro-inflammation'],
    whoItsFor: {
      skinTypes: ['All Skin Types', 'Sensitive', 'Barrier-compromised'],
      concerns: ['Dryness', 'Barrier Damage', 'Sensitivity'],
    },
    keyIngredients: [
      { name: 'Ceramide Complex (EOP, NP, AP)', percentage: '3.5%', description: 'Skin-identical lipid matrix' },
      { name: 'Niacinamide (Vitamin B3)', percentage: '4%', description: 'Barrier synthesis co-factor' },
    ],
    howToUse: {
      routine: 'AM/PM',
      step: '2',
      instructions: 'Smooth 3-4 drops onto clean skin before richer moisturizers.',
      precautions: 'External use only. Patch test recommended.',
    },
    brandInfo: {
      origin: 'Nigeria / Switzerland',
      crueltyFree: true,
      guarantee: 'Authenticity & Batch Purity Guaranteed',
    },
    customBadge: 'Clinical Strength',
  });

  const publishResult = await savePortalProduct(db, admin.id, productData, `pub-key-${Date.now()}`);
  console.log('✅ Product saved and published successfully:', {
    productId: publishResult.id,
    slug: publishResult.slug,
  });

  // Verify DB record
  const [persisted] = await db.select().from(products).where(eq(products.slug, testSlug)).limit(1);
  if (!persisted || !persisted.isActive) {
    throw new Error('FAILED: Product not persisted or not active in database!');
  }
  const persistedVariants = await db.select().from(productVariants).where(eq(productVariants.productId, persisted.id));
  console.log('✅ Database verification passed: Product is LIVE in DB with', persistedVariants.length, 'variant(s), price:', persistedVariants[0].priceKobo / 100, 'NGN');

  // Step 3: Customer Places an Order
  console.log('\n--- Step 3: Customer Order Placement ---');
  const orderNumber = `DES-E2E-${Math.floor(100000 + Math.random() * 900000)}`;
  const [testCustomer] = await db.insert(users).values({
    email: `customer-${Date.now()}@example.test`,
    passwordHash: 'hash',
  }).returning();

  const totalNgn = 20000; // 18,500 product + 1,500 delivery
  const [createdOrder] = await db.insert(orders).values({
    orderNumber,
    userId: testCustomer.id,
    guestEmail: testCustomer.email,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    subtotalKobo: 1850000,
    deliveryFeeKobo: 150000,
    discountKobo: 0,
    totalKobo: 2000000,
    shippingAddress: {
      fullName: 'Adaeze Nwosu',
      phone: '+2348031234567',
      street: '14 Admiralty Way, Lekki Phase 1',
      city: 'Lagos',
      state: 'Lagos',
    },
    idempotencyKey: `idemp-order-${Date.now()}`,
  }).returning();

  await db.insert(orderItems).values({
    orderId: createdOrder.id,
    variantId: persistedVariants[0].id,
    productName: persisted.name,
    sku: persistedVariants[0].sku,
    variantLabel: persistedVariants[0].sizeLabel,
    unitPriceKobo: persistedVariants[0].priceKobo,
    qty: 1,
    lineTotalKobo: persistedVariants[0].priceKobo,
  });

  console.log('✅ Order created in database:', {
    orderId: createdOrder.id,
    orderNumber: createdOrder.orderNumber,
    totalNgn: createdOrder.totalKobo / 100,
    status: createdOrder.status,
    paymentStatus: createdOrder.paymentStatus,
  });

  // Step 4: Live Crypto Rates & Conversion
  console.log('\n--- Step 4: Cryptocurrency Live Rates & Quote ---');
  const rates = await getLiveCryptoRates();
  console.log('Real market rates loaded from provider:');
  console.log(`  - USDT: $${rates.USDT.usdPrice.toFixed(2)} | ₦${rates.USDT.ngnPrice.toLocaleString()}`);
  console.log(`  - BTC:  $${rates.BTC.usdPrice.toLocaleString()} | ₦${rates.BTC.ngnPrice.toLocaleString()}`);
  console.log(`  - ETH:  $${rates.ETH.usdPrice.toLocaleString()} | ₦${rates.ETH.ngnPrice.toLocaleString()}`);
  console.log(`  - SOL:  $${rates.SOL.usdPrice.toFixed(2)} | ₦${rates.SOL.ngnPrice.toLocaleString()}`);

  const quote = await calculateCryptoQuote(createdOrder.totalKobo, 'USDT', 'TRC20');
  console.log('Calculated quote for order total (₦20,000):', {
    asset: quote.asset,
    network: quote.network,
    cryptoAmount: quote.cryptoAmount,
    networkFee: quote.networkFeeCrypto,
    totalCryptoRequired: quote.totalCrypto,
    expiresInSeconds: quote.expiresInSeconds,
  });

  // Step 5: Crypto Payment Invoice Initialization
  console.log('\n--- Step 5: Crypto Payment Invoice Initialization ---');
  const idempotencyKey = `idemp-crypto-e2e-${Date.now()}`;
  const initInvoice = await initCryptoPayment(db, {
    orderId: createdOrder.id,
    asset: 'USDT',
    network: 'TRC20',
    idempotencyKey,
    userId: testCustomer.id,
  });

  console.log('✅ Dedicated Crypto Payment Invoice Created:', {
    paymentId: initInvoice.paymentId,
    reference: initInvoice.reference,
    depositAddress: initInvoice.depositAddress,
    totalCrypto: initInvoice.totalCrypto,
    network: initInvoice.network,
    expiresAt: initInvoice.expiresAt,
  });

  // Test idempotent replay
  const replayInvoice = await initCryptoPayment(db, {
    orderId: createdOrder.id,
    asset: 'USDT',
    network: 'TRC20',
    idempotencyKey,
    userId: testCustomer.id,
  });
  if (replayInvoice.paymentId !== initInvoice.paymentId || !replayInvoice.replay) {
    throw new Error('FAILED: Idempotency check failed for crypto payment!');
  }
  console.log('✅ Idempotency verified: replaying with same key returned existing invoice safely.');

  // Step 6: Blockchain Transaction Verification & Order Settlement
  console.log('\n--- Step 6: On-Chain Settlement Verification ---');
  const simulatedTxHash = `e8f4a1b2c3d5e7f9a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b8c0d2e4f6`;
  const verifyResult = await verifyCryptoPayment(db, {
    paymentId: initInvoice.paymentId,
    txHash: simulatedTxHash,
    actorId: admin.id,
  });

  console.log('✅ Settlement verified:', {
    paymentId: verifyResult.paymentId,
    orderNumber: verifyResult.orderNumber,
    status: verifyResult.status,
    txHash: verifyResult.txHash,
    settledAt: verifyResult.verifiedAt,
  });

  // Check updated order state in PostgreSQL
  const [updatedOrder] = await db.select().from(orders).where(eq(orders.id, createdOrder.id));
  console.log('✅ Order state in database updated to:', {
    orderId: updatedOrder.id,
    orderNumber: updatedOrder.orderNumber,
    status: updatedOrder.status,
    paymentStatus: updatedOrder.paymentStatus,
  });
  if (updatedOrder.paymentStatus !== 'PAID') {
    throw new Error('FAILED: Order was not settled to PAID!');
  }

  // Step 7: Admin Crypto Operations Ledger Verification
  console.log('\n--- Step 7: Admin Crypto Operations Ledger Verification ---');
  const adminTxList = await listAdminCryptoTransactions(db);
  const foundTx = adminTxList.find(t => t.id === initInvoice.paymentId);
  if (!foundTx) {
    throw new Error('FAILED: Settled crypto transaction not found in admin ledger!');
  }
  console.log('✅ Verified transaction in Admin Ledger:', {
    id: foundTx.id,
    orderNumber: foundTx.orderNumber,
    customerEmail: foundTx.customerEmail,
    asset: foundTx.asset,
    network: foundTx.network,
    totalCrypto: foundTx.totalCrypto,
    amountNgn: foundTx.amountNgn,
    status: foundTx.status,
    txHash: foundTx.txHash,
  });

  await closeDb();
  console.log('\n🎉 ALL END-TO-END VERIFICATION CHECKS PASSED WITH 100% SUCCESS!\n');
}

main().catch((err) => {
  console.error('\n❌ End-to-end verification encountered an error:', err);
  process.exit(1);
});
