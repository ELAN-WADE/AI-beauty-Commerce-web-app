import { Product } from '../types';

export const products: Product[] = [
  {
    id: 'des-bo-01',
    sku: 'DES-BO-01-100ML',
    name: 'DESLA!™ Radiant Golden Body Oil',
    brand: 'DESLA!™',
    tagline: 'Fast-absorbing dry botanical body oil with shimmering golden undertones',
    rating: 4.9,
    reviewsCount: 218,
    price: 24000,
    originalPrice: 28000,
    discountPercentage: 14,
    image: 'https://images.unsplash.com/photo-1608248597359-0c679234b4c7?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1608248597359-0c679234b4c7?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'body-care',
    subCategory: 'Body Oil',
    sizes: ['100ml', '200ml'],
    selectedSize: '100ml',
    inStock: true,
    stockCount: 84,
    isBestseller: true,
    isFlashSale: true,
    hashtag: '#DeslaBodyOil',
    distributorStock: [
      { city: 'Abuja', available: true, quantity: 24 },
      { city: 'Lagos', available: true, quantity: 45 },
      { city: 'Port Harcourt', available: true, quantity: 18 },
      { city: 'Ibadan', available: true, quantity: 12 }
    ],
    description: 'An ultra-lightweight, non-greasy unisex dry body elixir infused with cold-pressed Jojoba, Kalahari Melon, and Vitamin E to lock in deep hydration while leaving skin with an imperial, healthy satin sheen.',
    whatItDoes: [
      'Delivers instant 24-hour lipid moisture retention without residue',
      'Infuses skin with a warm subtle radiant glow that enhances natural tone',
      'Restores skin elasticity and soothes dryness from harmattan weather',
      'Subtle unisex amber-vanilla fragrance note that lingers effortlessly'
    ],
    keyIngredients: [
      {
        name: 'Cold-Pressed Jojoba Seed Oil',
        percentage: '35%',
        description: 'Mimics the skin natural sebum for instant deep absorption without clogging pores.'
      },
      {
        name: 'Kalahari Melon Seed Oil',
        percentage: '20%',
        description: 'Rich in essential fatty acids to repair moisture barrier and stimulate cellular renewal.'
      },
      {
        name: 'Tocopherol (Vitamin E)',
        percentage: '2%',
        description: 'Powerful antioxidant shielding against environmental dryness and free radicals.'
      }
    ],
    howToUse: {
      routine: 'AM & PM',
      step: 'Step 3: Moisture Seal (apply after shower on damp skin)',
      instructions: 'Dispense 4-6 pumps into palms, warm gently, and glide smoothly across entire body.',
      precautions: 'For external body use only. Keep away from direct eye contact.'
    },
    whoItsFor: {
      skinTypes: ['All Skin Types', 'Dry Skin', 'Sensitive', 'Normal'],
      concerns: ['Dryness', 'Dull Tone', 'Rough Texture', 'Ashen Skin']
    },
    brandInfo: {
      origin: 'Lagos, Nigeria',
      crueltyFree: true,
      guarantee: '100% Authentic Laboratory Batch Guarantee'
    }
  },
  {
    id: 'des-bb-01',
    sku: 'DES-BB-01-200ML',
    name: 'DESLA!™ Whipped Shea & Ceramide Butter',
    brand: 'DESLA!™',
    tagline: 'Velvety whipped barrier restoration butter with pure West African Shea',
    rating: 4.95,
    reviewsCount: 312,
    price: 19500,
    originalPrice: 23000,
    discountPercentage: 15,
    image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1608248597359-0c679234b4c7?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'body-care',
    subCategory: 'Body Butter',
    sizes: ['200ml', '400ml'],
    selectedSize: '200ml',
    inStock: true,
    stockCount: 65,
    isBestseller: true,
    isNew: false,
    hashtag: '#DeslaBodyButter',
    distributorStock: [
      { city: 'Abuja', available: true, quantity: 18 },
      { city: 'Lagos', available: true, quantity: 38 },
      { city: 'Port Harcourt', available: true, quantity: 14 },
      { city: 'Kano', available: true, quantity: 10 }
    ],
    description: 'Decadent, airy whipped formula merging raw unrefined West African Shea with 3 essential biomimetic ceramides. Melts on contact to transform dry, cracked skin into supple velvet.',
    whatItDoes: [
      'Soothes compromised skin barriers and relieves immediate tightness',
      'Air-whipped texture ensures fast absorption with zero chalky heaviness',
      'Locks in moisture for up to 48 hours in dry and tropical climates',
      'Formulated without synthetic fragrance or artificial dyes'
    ],
    keyIngredients: [
      {
        name: 'Artisanal Whipped Shea Butter',
        percentage: '40%',
        description: 'Ethically harvested unrefined butter packed with vitamins A, E and fatty acids.'
      },
      {
        name: 'Ceramide NP, AP, EOP',
        percentage: '3%',
        description: 'Identical to skin natural lipid matrix to rebuild barrier integrity.'
      }
    ],
    howToUse: {
      routine: 'AM & PM',
      step: 'Step 2: Intensive Hydration',
      instructions: 'Scoop a generous dollop and massage into clean skin, paying special attention to elbows, knees and heels.',
      precautions: 'External use only. Store in a cool dry place away from direct heat.'
    },
    whoItsFor: {
      skinTypes: ['Extremely Dry', 'Sensitive', 'Normal', 'Eczema-prone'],
      concerns: ['Barrier Damage', 'Severe Flaking', 'Dehydration']
    },
    brandInfo: {
      origin: 'Lagos, Nigeria',
      crueltyFree: true,
      guarantee: 'Dermatologist Safety Verified'
    }
  },
  {
    id: 'des-bw-01',
    sku: 'DES-BW-01-250ML',
    name: 'DESLA!™ Hydrating Velvet Body Wash',
    brand: 'DESLA!™',
    tagline: 'Sulphate-free gentle body cleanser with oat extract and amino acids',
    rating: 4.85,
    reviewsCount: 145,
    price: 14500,
    originalPrice: 17000,
    discountPercentage: 15,
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'body-care',
    subCategory: 'Body Wash',
    sizes: ['250ml', '500ml'],
    selectedSize: '250ml',
    inStock: true,
    stockCount: 92,
    isBestseller: false,
    isNew: true,
    hashtag: '#DeslaBodyWash',
    distributorStock: [
      { city: 'Abuja', available: true, quantity: 20 },
      { city: 'Lagos', available: true, quantity: 50 },
      { city: 'Ibadan', available: true, quantity: 15 }
    ],
    description: 'A comforting, pH-balanced daily wash that removes impurities without stripping natural oils. Leaves the body feeling refreshed, supple, and delicately scented with notes of warm wood and bergamot.',
    whatItDoes: [
      'Cleanses thoroughly while maintaining natural skin acid mantle',
      'Leaves skin soft and hydrated straight out of the shower',
      'Produces a micro-fine lather using plant-based glucoside surfactants'
    ],
    keyIngredients: [
      {
        name: 'Colloidal Oat Extract',
        percentage: '5%',
        description: 'Clinically proven to soothe irritation, calm redness, and reduce trans-epidermal water loss.'
      },
      {
        name: 'Panthenol (Pro-Vitamin B5)',
        percentage: '2%',
        description: 'Deep humectant that attracts moisture and softens skin texture.'
      }
    ],
    howToUse: {
      routine: 'AM & PM',
      step: 'Step 1: Gentle Cleansing',
      instructions: 'Lather between palms or with a washcloth, massage over damp body, and rinse cleanly with warm water.',
      precautions: 'Avoid contact with eyes. Rinse thoroughly if contact occurs.'
    },
    whoItsFor: {
      skinTypes: ['All Skin Types', 'Sensitive Skin'],
      concerns: ['Dryness after shower', 'Skin Irritation']
    },
    brandInfo: {
      origin: 'Lagos, Nigeria',
      crueltyFree: true,
      guarantee: '100% Sulphate and Paraben Free'
    }
  },
  {
    id: 'des-bs-01',
    sku: 'DES-BS-01-250G',
    name: 'DESLA!™ Botanical Micro-Polishing Body Scrub',
    brand: 'DESLA!™',
    tagline: 'Gentle exfoliating body polish with sugar crystals and botanical oils',
    rating: 4.88,
    reviewsCount: 172,
    price: 16500,
    originalPrice: 19000,
    discountPercentage: 13,
    image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'body-care',
    subCategory: 'Body Scrub',
    sizes: ['250g'],
    selectedSize: '250g',
    inStock: true,
    stockCount: 48,
    isBestseller: false,
    hashtag: '#DeslaBodyScrub',
    distributorStock: [
      { city: 'Abuja', available: true, quantity: 15 },
      { city: 'Lagos', available: true, quantity: 30 }
    ],
    description: 'Gentle micro-crystals suspended in a golden botanical oil emulsion. Buffs away dead skin cells to reveal baby-soft, luminous skin without stinging or micro-tears.',
    whatItDoes: [
      'Exfoliates rough patches on elbows, knees, and strawberry legs',
      'Leaves a nourishing botanical veil that eliminates the need for heavy lotion',
      'Preps skin for deeper absorption of Desla Body Oil'
    ],
    keyIngredients: [
      {
        name: 'Ultra-Fine Cane Sugar Crystals',
        percentage: '45%',
        description: 'Biodegradable physical exfoliant that dissolves cleanly without polluting water.'
      },
      {
        name: 'Sweet Almond Oil',
        percentage: '20%',
        description: 'Nourishes and protects against abrasion while buffing.'
      }
    ],
    howToUse: {
      routine: 'AM or PM (2-3 times weekly)',
      step: 'Step 2: Exfoliate',
      instructions: 'Gently massage in circular motions on damp skin, then rinse with lukewarm water.',
      precautions: 'Do not use on broken or sunburned skin.'
    },
    whoItsFor: {
      skinTypes: ['All Body Skin Types'],
      concerns: ['Keratosis Pilaris', 'Dull Skin', 'Flaking']
    },
    brandInfo: {
      origin: 'Lagos, Nigeria',
      crueltyFree: true,
      guarantee: 'Clean Formulation Guarantee'
    }
  },
  {
    id: 'des-fc-01',
    sku: 'DES-FC-01-150ML',
    name: 'DESLA!™ Gentle Barrier Face Cleanser',
    brand: 'DESLA!™',
    tagline: 'pH 5.5 facial cleanser that melts makeup and unclogs pores safely',
    rating: 4.92,
    reviewsCount: 260,
    price: 13500,
    originalPrice: 15500,
    discountPercentage: 13,
    image: '/product_cleanser.jpg',
    galleryImages: [
      '/product_cleanser.jpg',
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'skincare',
    subCategory: 'Cleanser',
    sizes: ['150ml'],
    selectedSize: '150ml',
    inStock: true,
    stockCount: 75,
    isBestseller: true,
    hashtag: '#DeslaFaceCleanser',
    distributorStock: [
      { city: 'Abuja', available: true, quantity: 22 },
      { city: 'Lagos', available: true, quantity: 40 },
      { city: 'Ibadan', available: true, quantity: 12 }
    ],
    description: 'Designed around health-before-beauty principles. This gel-to-milk cleanser gently lifts SPF, oil, and pollution while infusing the facial barrier with Centella Asiatica and Niacinamide.',
    whatItDoes: [
      'Cleanses pores without stripping the facial moisture barrier',
      'Maintains ideal physiological skin pH of 5.5',
      'Leaves face feeling calm, refreshed, and hydrated with zero squeak'
    ],
    keyIngredients: [
      {
        name: 'Centella Asiatica (Cica) Extract',
        percentage: '4%',
        description: 'Soothes inflammation, redness, and speeds up acne recovery.'
      },
      {
        name: 'Niacinamide (Vitamin B3)',
        percentage: '2%',
        description: 'Regulates pore size and refines skin texture.'
      }
    ],
    howToUse: {
      routine: 'AM & PM',
      step: 'Step 1: Facial Cleansing',
      instructions: 'Pump onto damp face, gently massage in upward circular motions for 60 seconds, then rinse with water.',
      precautions: 'Avoid contact with eyes.'
    },
    whoItsFor: {
      skinTypes: ['Oily', 'Combination', 'Dry', 'Sensitive'],
      concerns: ['Blemishes', 'Sensitivity', 'Enlarged Pores']
    },
    brandInfo: {
      origin: 'Lagos, Nigeria',
      crueltyFree: true,
      guarantee: 'Dermatologist Certified'
    }
  },
  {
    id: 'des-ss-01',
    sku: 'DES-SS-01-50ML',
    name: 'DESLA!™ Invisible Shield Sunscreen SPF50+',
    brand: 'DESLA!™',
    tagline: '100% invisible water-gel sunscreen with zero white cast and PA++++ defense',
    rating: 4.96,
    reviewsCount: 388,
    price: 17500,
    originalPrice: 21000,
    discountPercentage: 17,
    image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'skincare',
    subCategory: 'Sunscreen',
    sizes: ['50ml'],
    selectedSize: '50ml',
    inStock: true,
    stockCount: 110,
    isBestseller: true,
    isFlashSale: true,
    hashtag: '#DeslaSunscreen',
    distributorStock: [
      { city: 'Abuja', available: true, quantity: 30 },
      { city: 'Lagos', available: true, quantity: 60 },
      { city: 'Port Harcourt', available: true, quantity: 25 },
      { city: 'Kano', available: true, quantity: 15 }
    ],
    description: 'Formulated specifically for melanin-rich and tropical skin. Melts instantaneously like water with absolutely zero white-cast, zero greasy shine, and zero eye-sting. Layers invisibly under makeup.',
    whatItDoes: [
      'Provides SPF50+ Broad Spectrum UVA/UVB shield',
      'Completely invisible finish on all Fitzpatrick skin tones',
      'Controls midday T-zone oiliness while providing weightless hydration'
    ],
    keyIngredients: [
      {
        name: 'Modern Organic UV Filter Matrix',
        percentage: 'Broad Spectrum',
        description: 'Photostable next-gen UV filters that do not degrade in intense Nigerian sun.'
      },
      {
        name: 'Hyaluronic Acid Complex',
        percentage: '1.5%',
        description: 'Multi-molecular hydration preventing photo-induced dehydration.'
      }
    ],
    howToUse: {
      routine: 'AM (Daily)',
      step: 'Step 4: Ultimate Daily Protection',
      instructions: 'Apply generously (two finger lengths) to face and neck 15 minutes before sun exposure.',
      precautions: 'Reapply every 2 hours during continuous outdoor activity.'
    },
    whoItsFor: {
      skinTypes: ['All Skin Types', 'Melanin-Rich', 'Acne-Prone'],
      concerns: ['Hyperpigmentation', 'Sun Damage', 'Uneven Tone']
    },
    brandInfo: {
      origin: 'Lagos, Nigeria',
      crueltyFree: true,
      guarantee: 'Zero White-Cast Certified'
    }
  },
  {
    id: 'des-po-01',
    sku: 'DES-PO-01-10ML',
    name: 'DESLA!™ Royal Amber Perfume Oil',
    brand: 'DESLA!™',
    tagline: 'Artisanal unisex roll-on perfume oil with warm amber, Madagascar vanilla & saffron',
    rating: 4.97,
    reviewsCount: 194,
    price: 22000,
    originalPrice: 26000,
    discountPercentage: 15,
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'fragrance',
    subCategory: 'Perfume Oil',
    sizes: ['10ml'],
    selectedSize: '10ml',
    inStock: true,
    stockCount: 52,
    isBestseller: true,
    hashtag: '#DeslaPerfumeOil',
    distributorStock: [
      { city: 'Abuja', available: true, quantity: 20 },
      { city: 'Lagos', available: true, quantity: 35 },
      { city: 'Port Harcourt', available: true, quantity: 15 }
    ],
    description: 'A pure, alcohol-free perfume oil concentrate housed in an imperial gold roll-on vial. Intimate, long-lasting, and designed to interact with your personal body heat for 12+ hours of distinctive presence.',
    whatItDoes: [
      'Provides high-concentration sillage without alcohol evaporation or drying',
      'Pocket-friendly luxury flacon for effortless on-the-go reapplication',
      'Unisex olfactory signature: warm resinous amber, creamy vanilla, and spiced cardamom'
    ],
    keyIngredients: [
      {
        name: 'Pure Golden Amber & Saffron Essence',
        description: 'Rich, sensual, and intoxicating base notes.'
      },
      {
        name: 'Fractionated Botanical Carrier Oil',
        description: 'Glides smoothly onto pulse points and absorbs cleanly without staining clothing.'
      }
    ],
    howToUse: {
      routine: 'Anytime',
      step: 'Olfactory Signature',
      instructions: 'Glide rollerball across pulse points: inner wrists, collarbone, and sides of neck.',
      precautions: 'Store upright away from extreme temperatures.'
    },
    whoItsFor: {
      skinTypes: ['Unisex — For everyone'],
      concerns: ['Long-lasting luxury fragrance']
    },
    brandInfo: {
      origin: 'Lagos, Nigeria',
      crueltyFree: true,
      guarantee: '100% Pure Alcohol-Free Oil'
    }
  },
  {
    id: 'des-pf-01',
    sku: 'DES-PF-01-50ML',
    name: 'DESLA!™ Impérial Noir Eau de Parfum',
    brand: 'DESLA!™',
    tagline: 'Sophisticated unisex extrait fragrance with smoked oud, cedar, and velvety iris',
    rating: 4.93,
    reviewsCount: 148,
    price: 48000,
    originalPrice: 55000,
    discountPercentage: 13,
    image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'fragrance',
    subCategory: 'Perfume',
    sizes: ['50ml'],
    selectedSize: '50ml',
    inStock: true,
    stockCount: 38,
    isBestseller: true,
    hashtag: '#DeslaImperialNoir',
    distributorStock: [
      { city: 'Abuja', available: true, quantity: 12 },
      { city: 'Lagos', available: true, quantity: 25 },
      { city: 'Port Harcourt', available: true, quantity: 8 }
    ],
    description: 'A statement of quiet luxury and distinction. Impérial Noir opens with crisp Italian bergamot before settling into a deep, magnetic heart of velvety Florentine iris, cedarwood, and smoky agarwood.',
    whatItDoes: [
      '24% concentrated perfume oil formulation guaranteeing all-day longevity',
      'Artisanal glass flacon with brushed golden cap and magnetic closure',
      'Sophisticated unisex profile that transitions seamlessly from boardroom to evening galas'
    ],
    keyIngredients: [
      {
        name: 'Top Notes',
        description: 'Calabrian Bergamot, Pink Peppercorn, Cardamom'
      },
      {
        name: 'Heart Notes',
        description: 'Florentine Orris, Turkish Rose, Smoked Cedar'
      },
      {
        name: 'Base Notes',
        description: 'Cambodian Oud, Golden Amber, Cashmere Musk'
      }
    ],
    howToUse: {
      routine: 'Anytime',
      step: 'Luxury Fragrance Ritual',
      instructions: 'Spray 2-3 mists on pulse points and clothing from 6 inches away.',
      precautions: 'Flammable until dry. Keep away from flames.'
    },
    whoItsFor: {
      skinTypes: ['Unisex'],
      concerns: ['Signature scent presence']
    },
    brandInfo: {
      origin: 'Lagos, Nigeria',
      crueltyFree: true,
      guarantee: 'Master Parfumeur Formulation'
    }
  },
  {
    id: 'des-lg-01',
    sku: 'DES-LG-01-4ML',
    name: 'DESLA!™ High-Shine Glaze Lip Gloss',
    brand: 'DESLA!™',
    tagline: 'Hydrating peptide lip glaze in Shade 01 (Imperial Champagne Gold)',
    rating: 4.89,
    reviewsCount: 220,
    price: 9500,
    originalPrice: 11000,
    discountPercentage: 14,
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'makeup',
    subCategory: 'Lip Gloss',
    sizes: ['4ml', '8ml'],
    selectedSize: '4ml',
    inStock: true,
    stockCount: 88,
    isBestseller: true,
    hashtag: '#DeslaLipGlaze',
    distributorStock: [
      { city: 'Abuja', available: true, quantity: 25 },
      { city: 'Lagos', available: true, quantity: 50 },
      { city: 'Ibadan', available: true, quantity: 15 }
    ],
    description: 'Glass-like optical shine without any stickiness or tackiness. Packed with plumping peptides and jojoba seed oil to cushion lips in deep, lasting hydration with luminous gold-flecked reflection.',
    whatItDoes: [
      'Delivers intense cushiony shine with zero hair-sticking texture',
      'Visibly plumps fine lip lines over 2 weeks of use',
      'Features a custom jumbo doe-foot applicator for one-swipe luxury coverage'
    ],
    keyIngredients: [
      {
        name: 'Palmitoyl Tripeptide-38',
        percentage: '1.5%',
        description: 'Volumizing peptide boosting collagen and hyaluronic acid synthesis.'
      },
      {
        name: 'Cold-Pressed Jojoba & Meadowfoam Oil',
        percentage: '25%',
        description: 'Locks in moisture for all-day comfort.'
      }
    ],
    howToUse: {
      routine: 'Daily',
      step: 'Lip Glaze Finish',
      instructions: 'Glide smoothly over bare lips for a natural dewy luster or layer over Desla Lipstick.',
      precautions: 'For external cosmetic use on lips.'
    },
    whoItsFor: {
      skinTypes: ['All Skin Tones'],
      concerns: ['Dry, chapped lips', 'Lack of volume']
    },
    brandInfo: {
      origin: 'Lagos, Nigeria',
      crueltyFree: true,
      guarantee: 'Non-Sticky Formula Guarantee'
    }
  },
  {
    id: 'des-ls-01',
    sku: 'DES-LS-01-1size',
    name: 'DESLA!™ Velvet Matte Lipstick — Nude Silk',
    brand: 'DESLA!™',
    tagline: 'Weightless comfort-matte lipstick in universal neutral Nude Silk',
    rating: 4.87,
    reviewsCount: 165,
    price: 11500,
    originalPrice: 13500,
    discountPercentage: 15,
    image: 'https://images.unsplash.com/photo-1591360236480-4ed861025fa1?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1591360236480-4ed861025fa1?auto=format&fit=crop&w=800&q=80'
    ],
    category: 'makeup',
    subCategory: 'Lipstick',
    sizes: ['1 size'],
    selectedSize: '1 size',
    inStock: true,
    stockCount: 60,
    isBestseller: false,
    hashtag: '#DeslaVelvetLip',
    distributorStock: [
      { city: 'Abuja', available: true, quantity: 15 },
      { city: 'Lagos', available: true, quantity: 30 }
    ],
    description: 'Pure, high-impact pigment enveloped in a silky blurring powder matrix. Glides like silk and dries down to a transfer-resistant, featherweight velvet veil that never dehydrates lips.',
    whatItDoes: [
      'Rich one-swipe color payoff crafted for African skin undertones',
      'Magnetic weighted matte-black and gold packaging',
      'Infused with hyaluronic spheres preventing creasing or flaking'
    ],
    keyIngredients: [
      {
        name: 'Hyaluronic Filling Spheres',
        description: 'Micro-reservoirs that plump and smooth dry lip fissures.'
      }
    ],
    howToUse: {
      routine: 'Daily',
      step: 'Lip Color',
      instructions: 'Apply directly from bullet starting at Cupid bow and sweeping outward.',
      precautions: 'Store in cool temperature.'
    },
    whoItsFor: {
      skinTypes: ['All Tones'],
      concerns: ['Dry matte formulas']
    },
    brandInfo: {
      origin: 'Lagos, Nigeria',
      crueltyFree: true,
      guarantee: '100% Transfer-Resistant Comfort'
    }
  }
];
