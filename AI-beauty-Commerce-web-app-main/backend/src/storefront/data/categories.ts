import { Category } from '../types';

export const categories: Category[] = [
  {
    id: 'body-care',
    name: 'Body Care',
    slug: 'body-care',
    itemCount: 32,
    image: '/cat_bodycare.jpg',
    isFeatured: true,
    description: 'Nourishing body washes, micro-polishing scrubs, radiant dry oils, and whipped butters.'
  },
  {
    id: 'skincare',
    name: 'Skincare',
    slug: 'skincare',
    itemCount: 14,
    image: '/cat_skincare.jpg',
    isFeatured: true,
    description: 'Safe-conscious pH 5.5 face cleansers and 100% invisible SPF50+ broad spectrum defense.'
  },
  {
    id: 'fragrance',
    name: 'Haute Fragrance',
    slug: 'fragrance',
    itemCount: 18,
    image: '/cat_fragrance.jpg',
    isFeatured: true,
    description: '10ml concentrated artisanal perfume oils and 50ml luxury unisex Eau de Parfum.'
  },
  {
    id: 'makeup',
    name: 'Makeup & Lips',
    slug: 'makeup',
    itemCount: 45,
    image: '/cat_makeup.jpg',
    isFeatured: true,
    description: 'High-shine peptide lip glosses, velvet matte lipsticks, and handcrafted faux mink lashes.'
  },
  {
    id: 'lifestyle',
    name: 'Fashion & Lifestyle',
    slug: 'lifestyle',
    itemCount: 12,
    image: '/cat_lifestyle.jpg',
    isFeatured: false,
    description: 'Unisex loungewear, raw silk head accessories, and minimalist beauty lifestyle essentials.'
  }
];

export const desktopNavCategories = [
  {
    title: 'Body Care Rituals',
    slug: 'body-care',
    items: [
      { name: 'Body Oils (Dry Glow)', sku: 'DES-BO' },
      { name: 'Whipped Body Butters', sku: 'DES-BB' },
      { name: 'Hydrating Body Wash', sku: 'DES-BW' },
      { name: 'Botanical Body Scrubs', sku: 'DES-BS' },
      { name: 'Daily Body Lotions', sku: 'DES-BL' }
    ]
  },
  {
    title: 'Clinical Skincare',
    slug: 'skincare',
    items: [
      { name: 'Face Cleanser (150ml)', sku: 'DES-FC' },
      { name: 'Invisible SPF50+ Sunscreen', sku: 'DES-SS' },
      { name: 'Barrier Restorative Care', sku: 'DES-SK' },
      { name: 'Clinical Serums', sku: 'DES-SR' }
    ]
  },
  {
    title: 'Haute Parfumerie',
    slug: 'fragrance',
    items: [
      { name: 'Perfume Oils (10ml Roll-on)', sku: 'DES-PO' },
      { name: 'Eau de Parfum (50ml Spray)', sku: 'DES-PF' },
      { name: 'Royal Amber & Oud', sku: 'DES-PF-01' },
      { name: 'Discovery Coffret Sets', sku: 'DES-PF-SET' }
    ]
  },
  {
    title: 'Complexion & Lips',
    slug: 'makeup',
    items: [
      { name: 'High-Shine Lip Gloss (10 Shades)', sku: 'DES-LG' },
      { name: 'Velvet Matte Lipsticks', sku: 'DES-LS' },
      { name: 'Restorative Lip Balms', sku: 'DES-LB' },
      { name: 'Faux Mink Eyelashes', sku: 'DES-EY' }
    ]
  }
];
