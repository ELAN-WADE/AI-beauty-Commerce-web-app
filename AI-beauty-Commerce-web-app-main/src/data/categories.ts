import { Category } from '../types';

export const categories: Category[] = [
  {
    id: 'body-care',
    name: 'Body Care',
    slug: 'body-care',
    itemCount: 32,
    image: 'https://images.unsplash.com/photo-1608248597359-0c679234b4c7?auto=format&fit=crop&w=600&q=80',
    isFeatured: true,
    description: 'Nourishing body washes, micro-polishing scrubs, radiant dry oils, and whipped butters.'
  },
  {
    id: 'skincare',
    name: 'Skincare',
    slug: 'skincare',
    itemCount: 14,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
    isFeatured: true,
    description: 'Safe-conscious pH 5.5 face cleansers and 100% invisible SPF50+ broad spectrum defense.'
  },
  {
    id: 'fragrance',
    name: 'Haute Fragrance',
    slug: 'fragrance',
    itemCount: 18,
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80',
    isFeatured: true,
    description: '10ml concentrated artisanal perfume oils and 50ml luxury unisex Eau de Parfum.'
  },
  {
    id: 'makeup',
    name: 'Makeup & Lips',
    slug: 'makeup',
    itemCount: 45,
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80',
    isFeatured: true,
    description: 'High-shine peptide lip glosses, velvet matte lipsticks, and handcrafted faux mink lashes.'
  },
  {
    id: 'lifestyle',
    name: 'Fashion & Lifestyle',
    slug: 'lifestyle',
    itemCount: 12,
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80',
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
