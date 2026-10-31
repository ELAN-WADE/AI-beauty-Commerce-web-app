import { Distributor } from '../types';

// Purged of fabricated demo seeds. Initialized empty for real PostgreSQL hydration.
export const distributors: Distributor[] = [];

export const supportedCities = [
  { city: 'Abuja', state: 'FCT', distributorCount: 0, estimatedDeliveryHours: '2-4 Hours', localFee: 1500 },
  { city: 'Lagos', state: 'Lagos State', distributorCount: 0, estimatedDeliveryHours: 'Same-day', localFee: 1000 },
  { city: 'Port Harcourt', state: 'Rivers State', distributorCount: 0, estimatedDeliveryHours: '3-5 Hours', localFee: 1500 },
  { city: 'Ibadan', state: 'Oyo State', distributorCount: 0, estimatedDeliveryHours: '2-4 Hours', localFee: 1200 },
  { city: 'Kano', state: 'Kano State', distributorCount: 0, estimatedDeliveryHours: '3-6 Hours', localFee: 1800 },
  { city: 'Enugu', state: 'Enugu State', distributorCount: 0, estimatedDeliveryHours: '4-6 Hours', localFee: 1600 }
];
