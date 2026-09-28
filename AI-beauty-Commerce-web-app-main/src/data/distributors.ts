import { Distributor } from '../types';

export const distributors: Distributor[] = [
  {
    id: 'dist-lagos-hq',
    name: 'Desla!™ Central Laboratory & HQ',
    businessName: 'Desla Beauty and Lifestyle Limited',
    city: 'Lagos',
    state: 'Lagos State',
    address: 'Plot 14 Admiralty Way, Lekki Phase 1, Lagos',
    phone: '08148120642',
    whatsapp: '2348148120642',
    verified: true,
    tier: 'Gold',
    isOnlineOnly: false,
    pickupAvailable: true,
    operatingHours: 'Mon - Fri (9:00 AM - 5:00 PM)',
    rating: 5.0,
    reviewsCount: 384,
    stockedSkus: [
      'DES-BW-01-250ML',
      'DES-BW-01-500ML',
      'DES-BO-01-100ML',
      'DES-BO-01-200ML',
      'DES-BB-01-200ML',
      'DES-BL-01-250ML',
      'DES-FC-01-150ML',
      'DES-SS-01-50ML',
      'DES-PO-01-10ML',
      'DES-PF-01-50ML',
      'DES-LG-01-4ML',
      'DES-LS-01-1size'
    ]
  },
  {
    id: 'dist-abuja-wuse',
    name: 'Desla Abuja Capital Hub',
    businessName: 'Aura Luxe Beauty Co.',
    city: 'Abuja',
    state: 'FCT',
    address: 'Suite 204, Aminu Kano Crescent, Wuse 2, Abuja',
    phone: '09030456510',
    whatsapp: '2349030456510',
    verified: true,
    tier: 'Gold',
    isOnlineOnly: false,
    pickupAvailable: true,
    operatingHours: 'Mon - Sat (10:00 AM - 7:00 PM)',
    rating: 4.9,
    reviewsCount: 198,
    stockedSkus: [
      'DES-BO-01-100ML',
      'DES-BO-01-200ML',
      'DES-BB-01-200ML',
      'DES-BW-01-250ML',
      'DES-FC-01-150ML',
      'DES-SS-01-50ML',
      'DES-PO-01-10ML',
      'DES-PF-01-50ML',
      'DES-LG-01-4ML'
    ]
  },
  {
    id: 'dist-abuja-gwarinpa',
    name: 'Desla Express Abuja North',
    businessName: 'GlowSphere Abuja',
    city: 'Abuja',
    state: 'FCT',
    address: '3rd Avenue, Gwarinpa Estate, Abuja',
    phone: '08148120642',
    whatsapp: '2348148120642',
    verified: true,
    tier: 'Silver',
    isOnlineOnly: true,
    pickupAvailable: false,
    operatingHours: 'Same-day instant dispatch across Gwarinpa & Jabi',
    rating: 4.8,
    reviewsCount: 84,
    stockedSkus: [
      'DES-BO-01-100ML',
      'DES-BB-01-200ML',
      'DES-PO-01-10ML',
      'DES-LG-01-4ML'
    ]
  },
  {
    id: 'dist-ph-gra',
    name: 'Desla Port Harcourt Luxury Partner',
    businessName: 'Eden Glow Studio PH',
    city: 'Port Harcourt',
    state: 'Rivers State',
    address: '18 Tombia Street, GRA Phase 2, Port Harcourt',
    phone: '09030456510',
    whatsapp: '2349030456510',
    verified: true,
    tier: 'Gold',
    isOnlineOnly: false,
    pickupAvailable: true,
    operatingHours: 'Mon - Sat (9:30 AM - 6:30 PM)',
    rating: 4.9,
    reviewsCount: 142,
    stockedSkus: [
      'DES-BO-01-100ML',
      'DES-BB-01-200ML',
      'DES-SS-01-50ML',
      'DES-PO-01-10ML',
      'DES-PF-01-50ML'
    ]
  },
  {
    id: 'dist-ibadan-bodija',
    name: 'Desla Ibadan Stockist',
    businessName: 'Velvet Horizon Beauty',
    city: 'Ibadan',
    state: 'Oyo State',
    address: 'Awolowo Avenue, Old Bodija, Ibadan',
    phone: '08148120642',
    whatsapp: '2348148120642',
    verified: true,
    tier: 'Silver',
    isOnlineOnly: false,
    pickupAvailable: true,
    operatingHours: 'Mon - Sat (9:00 AM - 6:00 PM)',
    rating: 4.8,
    reviewsCount: 67,
    stockedSkus: [
      'DES-BW-01-250ML',
      'DES-BO-01-100ML',
      'DES-BB-01-200ML',
      'DES-FC-01-150ML'
    ]
  },
  {
    id: 'dist-kano-nasarawa',
    name: 'Desla Northern Express',
    businessName: 'Sahara Luxe Essentials',
    city: 'Kano',
    state: 'Kano State',
    address: 'Bompai Road, Nasarawa GRA, Kano',
    phone: '09030456510',
    whatsapp: '2349030456510',
    verified: true,
    tier: 'Silver',
    isOnlineOnly: false,
    pickupAvailable: true,
    operatingHours: 'Mon - Sat (10:00 AM - 5:00 PM)',
    rating: 4.7,
    reviewsCount: 53,
    stockedSkus: [
      'DES-BO-01-100ML',
      'DES-BB-01-200ML',
      'DES-PO-01-10ML'
    ]
  }
];

export const supportedCities = [
  { city: 'Abuja', state: 'FCT', distributorCount: 2, estimatedDeliveryHours: '2-4 Hours', localFee: 1500 },
  { city: 'Lagos', state: 'Lagos State', distributorCount: 1, estimatedDeliveryHours: 'Same-day', localFee: 1000 },
  { city: 'Port Harcourt', state: 'Rivers State', distributorCount: 1, estimatedDeliveryHours: '3-5 Hours', localFee: 1500 },
  { city: 'Ibadan', state: 'Oyo State', distributorCount: 1, estimatedDeliveryHours: '2-4 Hours', localFee: 1200 },
  { city: 'Kano', state: 'Kano State', distributorCount: 1, estimatedDeliveryHours: '3-6 Hours', localFee: 1800 },
  { city: 'Enugu', state: 'Enugu State', distributorCount: 1, estimatedDeliveryHours: '4-6 Hours', localFee: 1600 }
];
