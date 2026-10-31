import { getDb } from '../src/db/client';
import * as schema from '../src/db/schema';
import { portalCatalogue, portalProductSchema, savePortalProduct } from '../src/modules/catalog/portal';
import { checkMagicBytes } from '../src/lib/storage';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

async function run() {
  console.log('🧪 Starting End-to-End Verification: Admin Media Upload & Storefront Formulation Alignment');
  const db = getDb();

  // 1. Resolve or create an admin user
  let [admin] = await db.select().from(schema.users).limit(1);
  if (!admin) {
    [admin] = await db.insert(schema.users).values({
      email: `admin_${Date.now()}@glowly.local`,
      passwordHash: 'argon2id_mock_hash',
      emailVerifiedAt: new Date(),
    }).returning();
  }
  console.log(`✅ Admin actor resolved: ${admin.email} (${admin.id})`);

  // 2. Validate Image Magic Bytes logic
  console.log('🖼️ Testing Image Magic Bytes validation...');
  // Genuine PNG buffer
  const validPngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const invalidFakeImage = Buffer.from('<?php echo "evil script"; ?>');

  const pngValid = checkMagicBytes(validPngHeader, 'image/png');
  const fakeRejected = !checkMagicBytes(invalidFakeImage, 'image/png');

  if (!pngValid || !fakeRejected) {
    throw new Error(`Magic bytes check failed: pngValid=${pngValid}, fakeRejected=${fakeRejected}`);
  }
  console.log('✅ Magic byte security checks passed (genuine images accepted, script files rejected).');

  // 3. Simulate image upload to public/uploads/products/
  const testFilename = `test_packshot_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.png`;
  const relativeUrl = `/uploads/products/${testFilename}`;

  const targetDirs = [
    path.resolve(process.cwd(), 'public/uploads/products'),
    path.resolve(process.cwd(), '../public/uploads/products')
  ];

  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.resolve(dir, testFilename), validPngHeader);
  }
  console.log(`✅ Test packshot written to disk: ${relativeUrl}`);
  console.log(`   - Verified existence in backend/public: ${fs.existsSync(path.resolve(process.cwd(), 'public/uploads/products', testFilename))}`);
  console.log(`   - Verified existence in root public: ${fs.existsSync(path.resolve(process.cwd(), '../public/uploads/products', testFilename))}`);

  // 4. Publish Product with Rich Clinical Formulation
  console.log('📝 Publishing product with complete formulation fields to catalog...');
  const testSlug = `clinical-barrier-elixir-${Date.now().toString(36)}`;
  const idempotencyKey = `pub-formulation-${Date.now()}`;

  const formulationPayload = portalProductSchema.parse({
    slug: testSlug,
    name: 'Nilotica Bio-Active Barrier Elixir',
    brand: 'DESLA!™ Clinical',
    category: 'facial-care',
    subCategory: 'Lipid Treatment Balm',
    tagline: 'Deep stratum corneum lipid restitution with cold-pressed Nilotica butter',
    description: 'A breakthrough restorative concentrate developed to repair and defend skin against dry, harmattan atmospheric conditions.',
    hashtag: '#NiloticaBarrier',
    isActive: true,
    isNew: true,
    isBestseller: true,
    isFlashSale: false,
    image: relativeUrl,
    galleryImages: [relativeUrl, '/product_barrier_cream.jpg'],
    variants: [
      {
        sku: `NILOTICA-50ML-${Date.now().toString(36).toUpperCase()}`,
        sizeLabel: '50ml / 1.7 fl oz',
        priceNgn: 32000,
        compareAtNgn: 38000,
        stock: 85,
        isActive: true,
      },
      {
        sku: `NILOTICA-100ML-${Date.now().toString(36).toUpperCase()}`,
        sizeLabel: '100ml / 3.4 fl oz',
        priceNgn: 54000,
        compareAtNgn: 62000,
        stock: 40,
        isActive: true,
      }
    ],
    customBadge: 'NAFDAC Clinical Assay Certified',
    whatItDoes: [
      'Clinically demonstrates 84% reduction in transepidermal water loss (TEWL) within 48 hours.',
      'Replenishes intercellular lipid matrix depleted by arid Harmattan climate.'
    ],
    whoItsFor: {
      skinTypes: ['Dry', 'Sensitive', 'Compromised Barrier', 'All Skin Types'],
      concerns: ['Harmattan Dehydration', 'Compromised Moisture Barrier', 'Micro-inflammation']
    },
    keyIngredients: [
      {
        name: 'Cold-Pressed Nilotica Karité',
        percentage: '18.5%',
        description: 'Wildcrafted East African shea fraction with 25% higher olein content than western shea.'
      },
      {
        name: 'Ceramide NP & Phytosphingosine',
        percentage: '3.0%',
        description: 'Bio-identical lipids that rebuild damaged corneal envelopes.'
      }
    ],
    howToUse: {
      routine: 'AM & PM',
      step: 'Moisturize & Lock',
      instructions: 'Warm half a pea-sized amount between clean fingertips. Press gently into face, neck, and décolletage after serums.',
      precautions: 'For external cosmetic use only. Patch test behind the ear 24 hours prior to initial application.'
    },
    brandInfo: {
      origin: 'Lagos Clinical Laboratory & Paris Derm-Center',
      crueltyFree: true,
      guarantee: '100% Potency & Authenticity Guaranteed with Certificate of Analysis'
    }
  });

  const saved = await savePortalProduct(db, admin.id, formulationPayload, idempotencyKey);
  console.log(`✅ Product saved successfully in database: ID=${saved.id}, slug=${saved.slug}`);

  // 5. Verify Storefront Retrieval via portalCatalogue
  console.log('🔍 Retrieving catalogue from portalCatalogue()...');
  const catalogue = await portalCatalogue(db);
  const found = catalogue.products.find(p => p.slug === testSlug);

  if (!found) {
    throw new Error(`Published product with slug ${testSlug} not returned by portalCatalogue!`);
  }

  console.log(`✅ Product retrieved on storefront catalogue!`);
  console.log(`   - Name: ${found.name}`);
  console.log(`   - Packshot Image: ${found.image}`);
  console.log(`   - Gallery count: ${found.galleryImages?.length}`);
  console.log(`   - Custom Badge: ${found.customBadge}`);
  console.log(`   - What It Does bullets: ${found.whatItDoes?.length}`);
  console.log(`   - Key Ingredients: ${found.keyIngredients?.length}`);
  console.log(`   - How To Use routine: ${found.howToUse?.routine}, step: ${found.howToUse?.step}`);
  console.log(`   - Brand Info origin: ${found.brandInfo?.origin}, crueltyFree: ${found.brandInfo?.crueltyFree}`);
  console.log(`   - Variants count: ${found.variants?.length}, Price: ₦${found.price}`);

  // Clean assertions
  if (found.image !== relativeUrl) throw new Error(`Packshot mismatch: expected ${relativeUrl}, got ${found.image}`);
  if (found.customBadge !== 'NAFDAC Clinical Assay Certified') throw new Error('customBadge mismatch');
  if (found.whatItDoes?.length !== 2) throw new Error('whatItDoes length mismatch');
  if (found.keyIngredients?.length !== 2) throw new Error('keyIngredients length mismatch');
  if (found.howToUse?.routine !== 'AM & PM') throw new Error('howToUse.routine mismatch');
  if (found.brandInfo?.crueltyFree !== true) throw new Error('brandInfo.crueltyFree mismatch');

  // Clean up test file
  for (const dir of targetDirs) {
    const fPath = path.resolve(dir, testFilename);
    if (fs.existsSync(fPath)) fs.unlinkSync(fPath);
  }
  console.log('🧹 Cleaned up test packshot file.');

  console.log('\n🎉 ALL FORMULATION ALIGNMENT AND MEDIA VERIFICATIONS PASSED 100%!');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
