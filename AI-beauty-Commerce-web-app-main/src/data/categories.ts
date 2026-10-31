import { Category } from '../types';

export const categories: Category[] = [];

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
    title: 'Natural Skincare',
    slug: 'skincare',
    items: [
      { name: 'Face Cleanser (150ml)', sku: 'DES-FC' },
      { name: 'Invisible SPF50+ Sunscreen', sku: 'DES-SS' },
      { name: 'Barrier Restorative Care', sku: 'DES-SK' },
      { name: 'Natural Serums', sku: 'DES-SR' }
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
