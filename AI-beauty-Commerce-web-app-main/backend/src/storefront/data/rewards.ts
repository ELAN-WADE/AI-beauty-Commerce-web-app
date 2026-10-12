import { RewardVoucher, PointsActivity, UserProfile } from '../types';

export const initialUserProfile: UserProfile = {
  name: 'Grace Johnson',
  email: 'grace@example.com',
  phone: '+234 812 345 6789',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  tier: 'Gold',
  points: 1240,
  pointsToNextReward: 260,
  savedAddressesCount: 2
};

export const initialVouchers: RewardVoucher[] = [
  {
    id: 'VOUCH-2500',
    title: '₦2,500 Off Cart',
    pointsCost: 400,
    code: 'GLOW2500',
    discountValue: '₦2,500 OFF',
    isRedeemed: false,
    expiresAt: 'Expires 31 Oct 2026',
    category: 'discount'
  },
  {
    id: 'VOUCH-SHIP',
    title: 'Free Express Shipping',
    pointsCost: 350,
    code: 'FREESHIPLG',
    discountValue: 'FREE DELIVERY',
    isRedeemed: true,
    expiresAt: 'Expires 15 Nov 2026',
    category: 'shipping'
  },
  {
    id: 'VOUCH-5000',
    title: '₦5,000 Off Luxury Serums',
    pointsCost: 800,
    code: 'SERUMLUX5',
    discountValue: '₦5,000 OFF',
    isRedeemed: false,
    expiresAt: 'Expires 20 Dec 2026',
    category: 'discount'
  },
  {
    id: 'VOUCH-10PCT',
    title: '10% Off Entire Order',
    pointsCost: 650,
    code: 'GLOWTIER10',
    discountValue: '10% OFF',
    isRedeemed: false,
    expiresAt: 'Expires 31 Dec 2026',
    category: 'discount'
  }
];

export const initialPointsActivity: PointsActivity[] = [
  {
    id: 'ACT-001',
    title: 'Order #AF10294',
    points: 120,
    date: '12 Sep 2026',
    orderId: 'AF10294'
  },
  {
    id: 'ACT-002',
    title: 'Product review',
    points: 50,
    date: '10 Sep 2026'
  },
  {
    id: 'ACT-003',
    title: 'Reward redeemed',
    points: -500,
    date: '05 Sep 2026'
  },
  {
    id: 'ACT-004',
    title: 'AI Skin Diagnosis Bonus',
    points: 200,
    date: '28 Aug 2026'
  }
];
