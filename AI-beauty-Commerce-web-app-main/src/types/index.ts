export interface Product {
  id: string;
  sku?: string;
  name: string;
  brand: string;
  tagline?: string;
  rating: number;
  reviewsCount: number;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  image: string;
  galleryImages: string[];
  category: string;
  subCategory: string;
  sizes: string[];
  selectedSize?: string;
  inStock: boolean;
  stockCount: number;
  isBestseller?: boolean;
  isNew?: boolean;
  isFlashSale?: boolean;
  hashtag?: string;
  distributorStock?: { city: string; available: boolean; quantity: number }[];
  description: string;
  whatItDoes: string[];
  keyIngredients: {
    name: string;
    percentage?: string;
    description: string;
  }[];
  howToUse: {
    routine: 'AM' | 'PM' | 'AM & PM' | string;
    step: string;
    instructions: string;
    precautions: string;
  };
  whoItsFor: {
    skinTypes: string[];
    concerns: string[];
  };
  brandInfo: {
    origin: string;
    crueltyFree: boolean;
    guarantee: string;
  };
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  size: string;
  quantity: number;
  unitPrice: number;
  fulfillmentType?: 'local' | 'central';
  distributorId?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  itemCount: number;
  image: string;
  isFeatured?: boolean;
  description?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  brand: string;
  size: string;
  price: number;
  quantity: number;
  image: string;
}

export type OrderStatus = 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface TrackingStep {
  title: string;
  timestamp: string;
  status: 'completed' | 'current' | 'upcoming';
  description: string;
}

export interface Order {
  id: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  fulfillmentType?: 'local' | 'central';
  distributorCity?: string;
  trackingSteps: TrackingStep[];
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    phone: string;
  };
  paymentMethod: string;
  reviewed?: boolean;
}

export interface RewardVoucher {
  id: string;
  code: string;
  title: string;
  discountAmount?: number;
  discountValue?: string | number;
  minSpend?: number;
  pointsCost: number;
  expiryDate?: string;
  expiresAt?: string;
  isRedeemed: boolean;
  category?: string;
}

export interface PointsActivity {
  id: string;
  title: string;
  points: number;
  date: string;
  type?: 'earn' | 'redeem';
  orderId?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  memberTier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Obsidian';
  tier?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Obsidian';
  points: number;
  pointsToNextReward?: number;
  savedAddressesCount?: number;
  savedAddresses?: {
    id: string;
    isDefault: boolean;
    name: string;
    street: string;
    city: string;
    state: string;
    phone: string;
  }[];
}

export interface SkinMetric {
  name: string;
  score: number;
  value?: number;
  status: 'optimal' | 'moderate' | 'needs-attention';
  description: string;
  insight?: string;
}

export interface SkinAnalysisResult {
  overallScore: number;
  overallGlowScore?: number;
  analysisSummary?: string;
  skinType: string;
  hydrationLevel: number;
  oilinessLevel: number;
  sensitivityLevel: number;
  textureSmoothness: number;
  primaryConcerns: string[];
  metrics?: SkinMetric[];
  recommendedRoutine: {
    step: string;
    product: Product;
  }[];
  recommendedProductIds?: string[];
  timestamp: string;
}

export interface CommunityMessage {
  id: string;
  senderName?: string;
  sender?: string;
  senderAvatar?: string;
  avatar?: string;
  role?: string;
  roleBadge?: string;
  skinType?: string;
  time?: string;
  timestamp?: string;
  message?: string;
  text?: string;
  likes?: number;
  likesCount?: number;
  likedByMe?: boolean;
  taggedProduct?: Partial<Product> | Product;
  channel: string;
  isVerifiedMUA?: boolean;
  isDermatologist?: boolean;
}

/* --- NEW DESLA!™ ARCHITECTURAL TYPES --- */

export interface Distributor {
  id: string;
  name: string;
  businessName: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  whatsapp: string;
  verified: boolean;
  tier: 'Bronze' | 'Silver' | 'Gold';
  isOnlineOnly: boolean;
  pickupAvailable: boolean;
  operatingHours: string;
  rating: number;
  reviewsCount: number;
  stockedSkus: string[];
}

export interface Creator {
  id: string;
  name: string;
  handle: string;
  platform: 'Instagram' | 'TikTok' | 'YouTube';
  niche: string;
  avatar: string;
  promoCode: string;
  discountPercent: number;
  commissionRate: number;
  totalSalesNgn: number;
  commissionEarnedNgn: number;
  clicks: number;
  ordersCount: number;
  verified: boolean;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  authorRole: 'Verified Buyer' | 'Creator / MUA' | 'Dermatologist' | 'Distributor';
  skinType?: string;
  timestamp: string;
  content: string;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  videoDuration?: string;
  taggedProductId?: string;
  taggedProductSku?: string;
  taggedProductHashtag?: string;
  taggedProductName?: string;
  likesCount: number;
  commentsCount: number;
  isTransformation?: boolean;
  beforeAfterImages?: { before: string; after: string; duration: string };
  likedByMe?: boolean;
}

export interface ProductReview {
  id: string;
  productId: string;
  productSku?: string;
  authorName: string;
  authorAvatar?: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  city?: string;
  skinType?: string;
  photoUrl?: string;
  helpfulCount: number;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  totalKobo: number;
  totalNgn: number;
  customerEmail: string;
  customerName?: string;
  customerCity?: string;
  itemsCount: number;
  fulfillmentType: 'local' | 'central';
}

export interface AdminTransferClaim {
  id: string;
  orderId: string;
  orderNumber: string;
  senderName: string;
  bankName: string;
  amountKobo: number;
  amountNgn: number;
  narration?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface AdminInventoryItem {
  id: string;
  sku: string;
  productName: string;
  category: string;
  centralStock: number;
  lagosHub: number;
  abujaHub: number;
  phHub: number;
  kanoHub: number;
  lowStockThreshold: number;
  isLowStock: boolean;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  role: string;
  details: string;
  ipAddress?: string;
}

export type ScreenId =
  | 'splash'
  | 'onboarding'
  | 'home'
  | 'search'
  | 'categories'
  | 'catalogue'
  | 'product-details'
  | 'cart'
  | 'checkout'
  | 'payment'
  | 'order-confirmed'
  | 'orders'
  | 'ai-scan'
  | 'ask-ai'
  | 'rewards'
  | 'account'
  | 'desktop-home'
  | 'community'
  | 'distributors'
  | 'distributor-portal'
  | 'creators'
  | 'admin-console'
  | 'login'
  | 'signup'
  | 'forgot-password'
  | 'reset-password'
  | 'verify-email'
  | 'guest-order-lookup'
  | 'creator-dashboard'
  | 'distributor-dashboard';

