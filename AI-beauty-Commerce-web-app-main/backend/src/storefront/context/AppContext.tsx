import React, { createContext, useCallback, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SCREEN_PATHS, screenForPath, productPath } from '@/lib/screen-routes';
import {
  Product,
  CartItem,
  Order,
  RewardVoucher,
  PointsActivity,
  UserProfile,
  SkinAnalysisResult,
  ScreenId,
  CommunityMessage,
  Distributor,
  Creator,
  CommunityPost,
  ProductReview,
  Category,
  HeroSlide,
  EditorialRoutineStep,
  BrandStoryConfig,
  AnnouncementTickerConfig,
  PRBoxOffering,
  CreatorCampaignBrief,
  WholesaleCartonItem,
  LabRestockShipment,
  LogisticsIncidentTicket,
  CouponRule
} from '../types';
import { products as sampleProducts } from '../data/products';
import { categories as sampleCategories } from '../data/categories';
import { initialOrders } from '../data/orders';
import { initialUserProfile, initialVouchers, initialPointsActivity } from '../data/rewards';
import { initialCommunityMessages } from '../data/community';
import { distributors as initialDistributors, supportedCities } from '../data/distributors';
import { creators as initialCreators } from '../data/creators';
import { communityPosts as initialCommunityPosts } from '../data/communityPosts';
import { reviews as initialReviews } from '../data/reviews';
import { routingKey, type CheckoutFulfilment } from '../lib/fulfilment';
import {
  ApiError,
  apiLogin,
  apiLogout,
  apiMe,
  apiRegister,
  apiRequestPasswordReset,
  apiResetPassword,
  apiVerifyEmail,
  fetchCatalogFromOwnedApi,
  fetchServerCart,
  fetchServerOrder,
  initPayment,
  isOwnedApiConfigured,
  mapServerOrder,
  mergeServerCart,
  mirrorWishlist,
  newIdempotencyKey,
  newGuestOrderToken,
  rememberGuestOrderToken,
  guestOrderToken,
  paymentTokenFor,
  paymentStatus,
  rememberServerOrder,
  serverCheckout,
  fetchDistributors,
  fetchCreators,
  fetchCommunityPosts,
  fetchCommunityChat,
  createCommunityPostApi,
  likeCommunityPostApi,
  sendCommunityChatApi,
  storeReferralFromUrl,
  storedReferralCode,
  clearReferralCode,
  submitDistributorApplication,
  submitCreatorApplication,
  validateCreatorCodeLive,
  syncCartToServer,
  type AuthUser,
  type PayProvider,
  type ServerOrderView,
} from '../lib/owned-api';

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  recommendedProductIds?: string[];
}

interface AppContextType {
  // Navigation
  currentScreen: ScreenId;
  previousScreens: ScreenId[];
  navigateTo: (screen: ScreenId, stateData?: any) => void;
  goBack: () => void;

  // Products
  products: Product[];
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  seedCatalogue: (items: Product[]) => void;
  viewProductDetails: (product: Product) => void;

  // Filter & Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedConcern: string;
  setSelectedConcern: (concern: string) => void;
  sortOption: 'recommended' | 'price-low' | 'price-high' | 'rating' | 'newest';
  setSortOption: (sort: 'recommended' | 'price-low' | 'price-high' | 'rating' | 'newest') => void;
  isFilterSheetOpen: boolean;
  setIsFilterSheetOpen: (open: boolean) => void;

  // Cart & Fulfillment
  cartItems: CartItem[];
  addToCart: (product: Product, size?: string, quantity?: number, fulfillmentType?: 'local' | 'central') => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, newQty: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartDeliveryFee: number;
  cartDiscount: number;
  cartTotal: number;
  cartCount: number;

  // Screen 08 Add to Cart confirmation sheet
  isAddToCartSheetOpen: boolean;
  lastAddedCartItem: CartItem | null;
  closeAddToCartSheet: () => void;

  // Product Quick View Modal
  quickModalProduct: Product | null;
  openQuickModal: (product: Product) => void;
  closeQuickModal: () => void;

  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;

  // Orders & Tracking
  orders: Order[];
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;
  createOrderFromCart: (paymentMethod: string, addressData?: any) => Order;

  // AI Skin Scan
  skinProfile: SkinAnalysisResult | null;
  setSkinProfile: (profile: SkinAnalysisResult | null) => void;

  // Loyalty & Rewards
  userProfile: UserProfile;
  vouchers: RewardVoucher[];
  pointsActivity: PointsActivity[];
  redeemVoucher: (voucherId: string) => boolean;

  // AI Beauty Concierge
  isAIAssistantOpen: boolean;
  openAIAssistant: () => void;
  closeAIAssistant: () => void;
  aiMessages: AIMessage[];
  sendAIMessage: (text: string) => void;

  // Desla Community
  isCommunityOpen: boolean;
  openCommunity: () => void;
  closeCommunity: () => void;
  communityMessages: CommunityMessage[];
  activeCommunityChannel: string;
  setActiveCommunityChannel: (channel: string) => void;
  sendCommunityMessage: (text: string) => void;
  likeCommunityMessage: (messageId: string) => void;
  unreadCommunityCount: number;

  // NEW: Location & Local Sourcing
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (open: boolean) => void;
  distributors: Distributor[];
  getDistributorsForCity: (city: string) => Distributor[];
  registerDistributor: typeof submitDistributorApplication;

  // NEW: Creator & Influencer Hub
  creators: Creator[];
  activeCreatorCode: string | null;
  creatorDiscountPercent: number;
  appliedCreator: Creator | null;
  applyCreatorCode: (code: string) => Promise<{ success: boolean; message: string }>;
  registerCreator: typeof submitCreatorApplication;

  // NEW: Social Community Feed Posts
  communityPosts: CommunityPost[];
  likeCommunityPost: (postId: string) => void;
  createCommunityPost: (post: Omit<CommunityPost, 'id' | 'timestamp' | 'likesCount' | 'commentsCount'>) => void;
  getPostsForProduct: (productId: string, hashtag?: string) => CommunityPost[];

  // NEW: Customer Reviews System
  reviews: ProductReview[];
  addReview: (review: Omit<ProductReview, 'id' | 'date' | 'helpfulCount'>) => void;
  getReviewsForProduct: (productId: string) => ProductReview[];

  // Cart Alert Banner
  isCartBannerDismissed: boolean;
  dismissCartBanner: () => void;

  // Checkout Fulfillment Details
  checkoutAddress: CheckoutAddress;
  setCheckoutAddress: React.Dispatch<React.SetStateAction<CheckoutAddress>>;
  checkoutFulfilment: CheckoutFulfilment | null;
  setCheckoutFulfilment: React.Dispatch<React.SetStateAction<CheckoutFulfilment | null>>;
  preferredDistributor: Distributor | null;
  setPreferredDistributor: React.Dispatch<React.SetStateAction<Distributor | null>>;
  voucherCode: string;
  setVoucherCode: (code: string) => void;

  // Owned live backend (no-ops in demo mode; demo flow untouched)
  authUser: AuthUser | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; message: string; devToken?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; devToken?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; message: string }>;
  setSimulatedUserRole: (role: string) => void;
  loginAsDemoRole: (role: 'CUSTOMER' | 'CREATOR' | 'DISTRIBUTOR' | 'SUPER_ADMIN') => void;
  previewRole: string | null;
  isPreviewMode: boolean;
  enterPreviewRole: (role: string) => void;
  exitPreviewRole: () => void;
  logout: () => Promise<void>;
  isLiveBackend: boolean;
  livePayment: { status: 'idle' | 'preparing' | 'redirecting' | 'verifying' | 'error'; message: string };
  dismissLivePayment: () => void;
  reverifyPayment: (reference: string) => Promise<boolean>;
  addLocalOrder: (order: Order) => void;
  prepareLiveCheckout: (provider: PayProvider) => Promise<LiveCheckoutResult>;
  selectedGateway: 'flutterwave' | 'stripe' | 'transfer';
  setSelectedGateway: (gateway: 'flutterwave' | 'stripe' | 'transfer') => void;

  // Storefront & Editorial CMS State
  heroSlides: HeroSlide[];
  updateHeroSlides: (slides: HeroSlide[]) => void;
  routineSteps: EditorialRoutineStep[];
  updateRoutineSteps: (steps: EditorialRoutineStep[]) => void;
  brandStory: BrandStoryConfig;
  updateBrandStory: (config: BrandStoryConfig) => void;
  announcementTicker: AnnouncementTickerConfig;
  updateAnnouncementTicker: (config: AnnouncementTickerConfig) => void;

  // Categories & Taxonomy CRUD
  categories: Category[];
  updateCategories: (cats: Category[]) => void;
  addCategory: (cat: Category) => void;
  deleteCategory: (id: string) => void;

  // Creator PR & Campaigns
  prBoxes: PRBoxOffering[];
  updatePRBoxes: (boxes: PRBoxOffering[]) => void;
  addPRBox: (box: PRBoxOffering) => void;
  creatorCampaigns: CreatorCampaignBrief[];
  updateCreatorCampaigns: (campaigns: CreatorCampaignBrief[]) => void;
  addCreatorCampaign: (campaign: CreatorCampaignBrief) => void;

  // Wholesale & Logistics
  wholesaleCartons: WholesaleCartonItem[];
  updateWholesaleCartons: (cartons: WholesaleCartonItem[]) => void;
  labShipments: LabRestockShipment[];
  updateLabShipments: (shipments: LabRestockShipment[]) => void;
  addLabShipment: (shipment: LabRestockShipment) => void;
  incidentTickets: LogisticsIncidentTicket[];
  updateIncidentTickets: (tickets: LogisticsIncidentTicket[]) => void;
  resolveIncidentTicket: (ticketId: string, note?: string) => void;

  // Coupons & Promo Rules
  couponRules: CouponRule[];
  updateCouponRules: (rules: CouponRule[]) => void;
  addCouponRule: (rule: CouponRule) => void;

  // Product CRUD mutations from Admin
  saveProductFromAdmin: (productData: Partial<Product>) => Promise<void>;
  deleteProductFromAdmin: (productId: string) => void;
  toggleProductStock: (productId: string) => void;
}

export interface LiveCheckoutResult {
  order: Order;
  serverOrderId: string | null;
  authorizationUrl: string | null;
  reference: string;
  bankDetails?: { bankName: string; accountNumber: string; accountName: string };
}

export interface CheckoutAddress {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  deliveryNotes: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode; initialCatalogue?: Product[] }> = ({ children, initialCatalogue }) => {
  // Demo seed is opt-in: production/fresh visitors start with empty,
  // truthful state (empty bag, no fake orders). Set
  // NEXT_PUBLIC_DEMO_SEED=1 locally to restore the showcase fixtures.
  const DEMO_SEED = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_DEMO_SEED === '1';
  // Navigation State. Initial render is ALWAYS 'home' on both server and
  // client (any window-derived initial value hydrates mismatched and
  // crashes React #418). The pathname effect below syncs post-mount.
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');
  const [previousScreens, setPreviousScreens] = useState<ScreenId[]>([]);
  const liveCheckoutAttempt = useRef<{ fingerprint: string; key: string; guestToken: string; orderId?: string } | null>(null);

  // Products (ISR/server seed first; upgraded from owned API when configured)
  const [products, setProducts] = useState<Product[]>(
    DEMO_SEED ? sampleProducts : (initialCatalogue && initialCatalogue.length > 0 ? initialCatalogue : [])
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    DEMO_SEED ? sampleProducts[0] : (initialCatalogue?.[0] ?? null)
  );

  // Server/ISR catalogue seed (Home/Catalogue/Product routes). Accepts
  // updated (or smaller) arrays; refreshes the selected product in place.
  const seedCatalogue = useCallback((items: Product[]) => {
    if (!items || items.length === 0) return;
    setProducts(items);
    setSelectedProduct((prev) => {
      if (!prev) return items[0] ?? null;
      return items.find((p) => p.id === prev.id) ?? prev;
    });
  }, []);

  useEffect(() => {
    if (!isOwnedApiConfigured) return;
    let cancelled = false;
    fetchCatalogFromOwnedApi()
      .then((live) => {
        if (!live || cancelled || live.length === 0) return;
        setProducts(live);
        setSelectedProduct((prev) => {
          if (!prev) return live[0] ?? null;
          return live.find((p) => p.id === prev.id) ?? live[0] ?? prev;
        });
        console.info(`[glowly] catalogue live: ${live.length} products from owned API`);
      })
      .catch(() => {
        // Silent: mocks stay. Live path is verified at staging (§S2).
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Ecosystem hydration (distributors, creators, community — same pattern).
  useEffect(() => {
    if (!isOwnedApiConfigured) return;
    let cancelled = false;
    fetchDistributors()
      .then((live) => {
        if (!cancelled && live) setDistributorsList(live);
      })
      .catch(() => {});
    fetchCreators()
      .then((live) => {
        if (!cancelled && live) setCreatorsList(live);
      })
      .catch(() => {});
    fetchCommunityPosts()
      .then((live) => {
        if (!cancelled && live && live.length > 0) setCommunityPostsList(live);
      })
      .catch(() => {});
    fetchCommunityChat('routine')
      .then((live) => {
        if (!cancelled && live && live.length > 0) setCommunityMessages(live);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedConcern, setSelectedConcern] = useState<string>('All');
  const [sortOption, setSortOption] = useState<'recommended' | 'price-low' | 'price-high' | 'rating' | 'newest'>('recommended');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState<boolean>(false);

  // Location / City State (Default to Abuja as highlighted in user brief)
  const [selectedCity, setSelectedCity] = useState<string>('Abuja');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [preferredDistributor, setPreferredDistributor] = useState<Distributor | null>(null);
  const [checkoutFulfilment, setCheckoutFulfilment] = useState<CheckoutFulfilment | null>(null);

  // Cart (demo fixtures only with DEMO_SEED; otherwise restored from server)
  const [cartItems, setCartItems] = useState<CartItem[]>(DEMO_SEED ? [
    {
      id: 'cart-1',
      productId: sampleProducts[0].id,
      product: sampleProducts[0],
      size: '100ml',
      quantity: 1,
      unitPrice: 24000,
      fulfillmentType: 'local'
    },
    {
      id: 'cart-2',
      productId: sampleProducts[1].id,
      product: sampleProducts[1],
      size: '200ml',
      quantity: 1,
      unitPrice: 19500,
      fulfillmentType: 'local'
    }
  ] : []);

  const [isAddToCartSheetOpen, setIsAddToCartSheetOpen] = useState(false);
  const [lastAddedCartItem, setLastAddedCartItem] = useState<CartItem | null>(null);

  // Product Quick View Modal
  const [quickModalProduct, setQuickModalProduct] = useState<Product | null>(null);
  const openQuickModal = (product: Product) => setQuickModalProduct(product);
  const closeQuickModal = () => setQuickModalProduct(null);

  // Wishlist
  const [wishlist, setWishlist] = useState<string[]>(DEMO_SEED ? [sampleProducts[2].id] : []);

  // Orders
  const [orders, setOrders] = useState<Order[]>(DEMO_SEED ? initialOrders : []);
  const [activeOrder, setActiveOrder] = useState<Order | null>(DEMO_SEED ? (initialOrders[0] || null) : null);

  // AI Skin Scan
  const [skinProfile, setSkinProfile] = useState<SkinAnalysisResult | null>(null);

  // User Profile & Rewards
  const [userProfile, setUserProfile] = useState<UserProfile>(
    DEMO_SEED ? initialUserProfile : { ...initialUserProfile, name: '', email: '', phone: '', points: 0 }
  );
  const [vouchers, setVouchers] = useState<RewardVoucher[]>(DEMO_SEED ? initialVouchers : []);
  const [pointsActivity, setPointsActivity] = useState<PointsActivity[]>(DEMO_SEED ? initialPointsActivity : []);

  // Fulfillment & Checkout Address State
  const [checkoutAddress, setCheckoutAddress] = useState<CheckoutAddress>(DEMO_SEED ? {
    fullName: initialUserProfile.name,
    email: initialUserProfile.email,
    phone: initialUserProfile.phone,
    street: 'Plot 742, Aminu Kano Crescent, Wuse 2',
    city: 'Abuja',
    state: 'Abuja FCT',
    deliveryNotes: 'Please ring upon arrival at estate gate.'
  } : {
    fullName: '',
    email: '',
    phone: '',
    street: '',
    city: 'Abuja',
    state: 'Abuja FCT',
    deliveryNotes: ''
  });

  // AI Concierge Messages
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    {
      id: 'ai-welcome',
      sender: 'assistant',
      text: 'Greetings. I am your Desla!™ AI Diagnostic & Formulation Concierge. How may I assist your skin, body, or fragrance ritual today?',
      timestamp: 'Just now'
    }
  ]);

  // Community Messages (Direct Chat)
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [communityMessages, setCommunityMessages] = useState<CommunityMessage[]>(DEMO_SEED ? initialCommunityMessages : []);
  const [activeCommunityChannel, setActiveCommunityChannel] = useState('all');
  const [unreadCommunityCount, setUnreadCommunityCount] = useState(DEMO_SEED ? 3 : 0);

  // NEW: Distributors Store
  const [distributorsList, setDistributorsList] = useState<Distributor[]>(isOwnedApiConfigured ? [] : initialDistributors);

  // NEW: Creators & Affiliates Store
  const [creatorsList, setCreatorsList] = useState<Creator[]>(isOwnedApiConfigured ? [] : initialCreators);
  const [activeCreatorCode, setActiveCreatorCode] = useState<string | null>(null);
  const [creatorDiscountPercent, setCreatorDiscountPercent] = useState<number>(0);
  const appliedCreator = creatorsList.find((c) => c.promoCode === activeCreatorCode) || null;

  // NEW: Social Community Posts Feed
  const [communityPostsList, setCommunityPostsList] = useState<CommunityPost[]>(DEMO_SEED ? initialCommunityPosts : []);
  // NEW: Customer Reviews Store
  const [reviewsList, setReviewsList] = useState<ProductReview[]>(DEMO_SEED ? initialReviews : []);

  const [isCartBannerDismissed, setIsCartBannerDismissed] = useState(false);

  // Storefront & Editorial CMS State
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([
    {
      id: 'routine',
      image: '/hero_slide_1.jpg',
      tag: 'Clinical Formulation',
      headline: 'Health Before Beauty. Intention Before Trend.',
      subtext: 'Bio-compatible shea, cold-pressed botanical oils, and active formulations engineered specifically for melanin-rich skin.',
      actionLabel: 'Shop Formulations',
      actionRoute: 'catalogue',
      secondaryActionText: 'AI Skin Analysis',
      secondaryRoute: 'ai-scan',
      isActive: true,
      displayOrder: 1
    },
    {
      id: 'body-care',
      image: '/hero_slide_2.jpg',
      tag: 'Nourishing Body Rituals',
      headline: 'Cold-Pressed Extrait Oils. Lasting Radiance.',
      subtext: 'Lightweight, rapidly absorbing botanical oils infused with indigenous botanicals to nourish and restore deep cellular radiance.',
      actionLabel: 'Explore Body Care',
      actionRoute: 'catalogue',
      actionCategory: 'body-care',
      secondaryActionText: 'View Collections',
      secondaryRoute: 'categories',
      isActive: true,
      displayOrder: 2
    },
    {
      id: 'sun-defense',
      image: '/hero_slide_3.jpg',
      tag: 'Daily Shield SPF 50+',
      headline: 'Invisible Sun Defense. Tailored for Melanin.',
      subtext: 'No chalky residue, no pore congestion. Lightweight daily mineral protection engineered specifically for Fitzpatrick IV–VI skin tones.',
      actionLabel: 'Discover Sun Protection',
      actionRoute: 'catalogue',
      actionCategory: 'skincare',
      secondaryActionText: 'Our Formulation Ethics',
      secondaryRoute: 'categories',
      isActive: true,
      displayOrder: 3
    }
  ]);

  const updateHeroSlides = (slides: HeroSlide[]) => {
    setHeroSlides(slides);
  };

  const [routineSteps, setRoutineSteps] = useState<EditorialRoutineStep[]>([
    {
      id: 'step-01',
      number: '01',
      title: 'Cleanse',
      productName: 'Gentle Purifying Cleanser',
      image: '/routine_lady_cleanse.jpg',
      tagline: 'Acid Mantle Balancing',
      description: 'Preserves the delicate skin barrier while removing impurities. Formulated at pH 5.5 to prevent tightness and moisture loss.',
      keyBenefit: 'NAFDAC Certified • Zero Sulfates • Microbiome Safe',
      associatedProductId: 'prod-1',
      isActive: true
    },
    {
      id: 'step-02',
      number: '02',
      title: 'Moisturize',
      productName: 'Bio-Active Barrier Cream',
      image: '/routine_lady_moisturize.jpg',
      tagline: 'Deep Cellular Lipids',
      description: 'Cold-pressed Nilotica shea and restorative niacinamide seal deep hydration to protect against harsh harmattan and dry climates.',
      keyBenefit: '48h Lipid Lock • Cold-Pressed Shea • 2% Niacinamide',
      associatedProductId: 'prod-2',
      isActive: true
    },
    {
      id: 'step-03',
      number: '03',
      title: 'Protect',
      productName: 'Melanin Defense Sun Shield SPF 50+',
      image: '/routine_lady_protect.jpg',
      tagline: 'Invisible Broad Spectrum',
      description: 'Engineered specifically for Fitzpatrick IV–VI skin tones. Leaves zero white cast, absorbs in seconds, and protects against UVA/UVB and blue light.',
      keyBenefit: 'SPF 50+ PA++++ • 0% White Cast • Antioxidant Infused',
      associatedProductId: 'prod-3',
      isActive: true
    }
  ]);

  const updateRoutineSteps = (steps: EditorialRoutineStep[]) => {
    setRoutineSteps(steps);
  };

  const [brandStory, setBrandStory] = useState<BrandStoryConfig>({
    tagline: 'Rooted in Science. Inspired by Heritage.',
    heading: 'Formulations Engineered Specifically for Melanin-Rich Skin.',
    paragraph1: 'Founded on clinical dermatological evidence, Desla merges indigenous African botanical bio-actives with Swiss pharmaceutical-grade actives. We address hyperpigmentation, barrier sensitivity, and dehydration without compromise.',
    paragraph2: 'Every batch is cold-formulated, small-batch blended in accredited laboratories, and distributed with full cold-chain tracking across West Africa.',
    image: '/brand_story_hero.jpg',
    badge1: 'NAFDAC Laboratory Certified',
    badge2: 'Ethically Sourced African Botanicals'
  });

  const updateBrandStory = (config: BrandStoryConfig) => {
    setBrandStory(config);
  };

  const [announcementTicker, setAnnouncementTicker] = useState<AnnouncementTickerConfig>({
    text: 'Complimentary Express Delivery on orders above ₦50,000 within Lagos & Abuja FCT',
    linkText: 'Explore Formulations',
    linkRoute: 'catalogue',
    isActive: true
  });

  const updateAnnouncementTicker = (config: AnnouncementTickerConfig) => {
    setAnnouncementTicker(config);
  };

  // Taxonomy & Categories CRUD
  const [categoriesList, setCategoriesList] = useState<Category[]>(sampleCategories);

  const updateCategories = (cats: Category[]) => {
    setCategoriesList(cats);
  };

  const addCategory = (cat: Category) => {
    setCategoriesList((prev) => [cat, ...prev]);
  };

  const deleteCategory = (id: string) => {
    setCategoriesList((prev) => prev.filter((c) => c.id !== id));
  };

  // Creator PR & Campaigns
  const [prBoxesList, setPrBoxesList] = useState<PRBoxOffering[]>([
    {
      id: 'pr-1',
      title: 'Radiant Glow Clinical Collection',
      category: 'Seasonal Skincare',
      retailValue: '₦64,000',
      openSpots: '5 spots remaining',
      spotsLeft: 5,
      thumbnail: 'https://images.unsplash.com/photo-1608248597359-0026e6328325?auto=format&fit=crop&w=400&q=80',
      description: 'Full-sized luxury bottle package formulated for deep melanin illumination.',
      includedProducts: ['Radiant Glow Oil (100ml)', 'Gentle Amino Cleanser', 'Barrier Essence Mist'],
      eligibleTiers: ['Rising', 'Verified', 'Icon'],
      isActive: true
    },
    {
      id: 'pr-2',
      title: 'Melanin Barrier & UV Defense Kit',
      category: 'Clinical Protection',
      retailValue: '₦48,500',
      openSpots: '8 spots remaining',
      spotsLeft: 8,
      thumbnail: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=400&q=80',
      description: 'Zero white cast clinical UV defense set with ceramide nourishment.',
      includedProducts: ['Sun Defense SPF50+', 'Ceramide Hydration Cream'],
      eligibleTiers: ['Verified', 'Icon'],
      isActive: true
    }
  ]);

  const updatePRBoxes = (boxes: PRBoxOffering[]) => {
    setPrBoxesList(boxes);
  };

  const addPRBox = (box: PRBoxOffering) => {
    setPrBoxesList((prev) => [box, ...prev]);
  };

  const [creatorCampaignsList, setCreatorCampaignsList] = useState<CreatorCampaignBrief[]>([
    {
      id: 'camp-1',
      title: 'Glow Season 2026: The Melanin Radiance Initiative',
      category: 'Seasonal Skincare Campaign',
      commissionRate: '15% Commission',
      bonus: '+ ₦25,000 Milestone Bonus',
      deadline: '12 Days Left',
      description: 'Highlight real skin texture, morning hydration regimens, and clinical barrier restoration. Discourage excessive skin bleaching claims; emphasize radiant healthy nourishment.',
      heroImage: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80',
      deliverables: ['1 High-Resolution Instagram Reel (9:16)', '1 Shoppable Desla Routine published'],
      slots: '10/15 creators accepted',
      status: 'ACTIVE'
    },
    {
      id: 'camp-2',
      title: 'Harmattan Defense: Maximum Barrier Hydration',
      category: 'Seasonal Climate Campaign',
      commissionRate: '12% Commission',
      bonus: '+ ₦15,000 Bonus',
      deadline: '24 Days Left',
      description: 'Educate followers on managing extreme harmattan dryness across Northern and Central Nigeria through clinical occlusives and ceramide layering.',
      heroImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
      deliverables: ['2 TikTok Application Videos', '1 Skin Article Guide'],
      slots: '8/10 creators accepted',
      status: 'ACTIVE'
    }
  ]);

  const updateCreatorCampaigns = (campaigns: CreatorCampaignBrief[]) => {
    setCreatorCampaignsList(campaigns);
  };

  const addCreatorCampaign = (campaign: CreatorCampaignBrief) => {
    setCreatorCampaignsList((prev) => [campaign, ...prev]);
  };

  // Wholesale & Logistics
  const [wholesaleCartonsList, setWholesaleCartonsList] = useState<WholesaleCartonItem[]>([
    {
      id: 'wh-1',
      sku: 'DES-RGO-100',
      name: 'Radiant Glow Clinical Oil (100ml)',
      category: 'Body Care',
      cartonUnits: 24,
      wholesalePrice: 391680,
      retailCartonValue: 576000,
      expectedMargin: 184320,
      marginPercent: 32,
      image: '/hero_slide_1.jpg'
    },
    {
      id: 'wh-2',
      sku: 'DES-GPC-200',
      name: 'Gentle Purifying Amino Cleanser (200ml)',
      category: 'Skincare',
      cartonUnits: 24,
      wholesalePrice: 318240,
      retailCartonValue: 468000,
      expectedMargin: 149760,
      marginPercent: 32,
      image: '/routine_lady_cleanse.jpg'
    },
    {
      id: 'wh-3',
      sku: 'DES-SUN-50',
      name: 'Melanin Defense Invisible Sun Shield SPF 50+',
      category: 'Skincare',
      cartonUnits: 36,
      wholesalePrice: 489600,
      retailCartonValue: 720000,
      expectedMargin: 230400,
      marginPercent: 32,
      image: '/routine_lady_protect.jpg'
    }
  ]);

  const updateWholesaleCartons = (cartons: WholesaleCartonItem[]) => {
    setWholesaleCartonsList(cartons);
  };

  const [labShipmentsList, setLabShipmentsList] = useState<LabRestockShipment[]>([
    {
      id: 'lab-1',
      batchNumber: 'BATCH-2026-04A',
      courier: 'GIG Logistics Priority Cold-Chain',
      trackingNumber: 'GIG-NG-8894102',
      destinationHub: 'Abuja Central Distribution Hub',
      itemCount: 450,
      status: 'IN_TRANSIT',
      dispatchedAt: 'Today, 08:30 AM',
      estimatedArrival: 'Tomorrow, 02:00 PM'
    },
    {
      id: 'lab-2',
      batchNumber: 'BATCH-2026-03F',
      courier: 'Red Star Express Direct',
      trackingNumber: 'RSE-LAG-110294',
      destinationHub: 'Lagos Victoria Island Warehouse',
      itemCount: 800,
      status: 'DELIVERED',
      dispatchedAt: 'Yesterday, 10:15 AM',
      estimatedArrival: 'Delivered (Received by Warehouse Lead)'
    }
  ]);

  const updateLabShipments = (shipments: LabRestockShipment[]) => {
    setLabShipmentsList(shipments);
  };

  const addLabShipment = (shipment: LabRestockShipment) => {
    setLabShipmentsList((prev) => [shipment, ...prev]);
  };

  const [incidentTicketsList, setIncidentTicketsList] = useState<LogisticsIncidentTicket[]>([
    {
      id: 'inc-1',
      ticketNumber: 'DIS-4190',
      hubName: 'Abuja Wuse 2 Hub',
      category: 'Damaged Batch In Transit',
      message: 'Carton #DES-RGO-100 arrived with outer seal compromised from regional transit depot.',
      contactEmail: 'abuja.hub@deslabeauty.com',
      severity: 'HIGH',
      status: 'IN_REVIEW',
      createdAt: '2 hours ago'
    },
    {
      id: 'inc-2',
      ticketNumber: 'DIS-4182',
      hubName: 'Port Harcourt GRA Hub',
      category: 'Stock Discrepancy',
      message: 'Physical stock reconciliation discrepancy of 3 units SPF 50+ after weekend surge.',
      contactEmail: 'ph.gra@deslabeauty.com',
      severity: 'NORMAL',
      status: 'RESOLVED',
      createdAt: '1 day ago',
      resolvedAt: 'Today, 09:00 AM',
      resolutionNote: 'Adjusted in ledger, replacement carton dispatched.'
    }
  ]);

  const updateIncidentTickets = (tickets: LogisticsIncidentTicket[]) => {
    setIncidentTicketsList(tickets);
  };

  const resolveIncidentTicket = (ticketId: string, note?: string) => {
    setIncidentTicketsList((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: 'RESOLVED',
              resolvedAt: 'Just now',
              resolutionNote: note || 'Resolved by Central Admin Operations.'
            }
          : t
      )
    );
  };

  // Coupons & Promo Rules
  const [couponRulesList, setCouponRulesList] = useState<CouponRule[]>([
    {
      id: 'c-1',
      code: 'WELCOME10',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderNgn: 15000,
      usedCount: 142,
      isActive: true,
      expiresAt: '2026-12-31'
    },
    {
      id: 'c-2',
      code: 'CHIOMA15',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minOrderNgn: 20000,
      creatorHandle: '@dermatology_chi',
      usedCount: 88,
      isActive: true,
      expiresAt: '2026-12-31'
    }
  ]);

  const updateCouponRules = (rules: CouponRule[]) => {
    setCouponRulesList(rules);
  };

  const addCouponRule = (rule: CouponRule) => {
    setCouponRulesList((prev) => [rule, ...prev]);
  };

  // Product CRUD mutations from Admin
  const saveProductFromAdmin = async (productData: Partial<Product>) => {
    setProducts((prev) => {
      if (productData.id && prev.some((p) => p.id === productData.id)) {
        return prev.map((p) => (p.id === productData.id ? ({ ...p, ...productData } as Product) : p));
      } else {
        const newProd: Product = {
          id: productData.id || `prod-${Date.now()}`,
          name: productData.name || 'Untitled Formulation',
          brand: productData.brand || 'Delsla Clinical',
          category: productData.category || 'Skincare',
          price: productData.price || 15000,
          comparePrice: productData.comparePrice,
          rating: productData.rating || 5.0,
          reviewsCount: productData.reviewsCount || 0,
          image: productData.image || '/hero_slide_1.jpg',
          gallery: productData.gallery || [productData.image || '/hero_slide_1.jpg'],
          inStock: productData.inStock !== false,
          isNew: productData.isNew || false,
          isBestseller: productData.isBestseller || false,
          description: productData.description || '',
          whatItDoes: productData.whatItDoes || [],
          howToUse: productData.howToUse || { instructions: '', precautions: '' },
          brandInfo: productData.brandInfo || { origin: 'Nigeria / Switzerland', crueltyFree: true, guarantee: '100% Satisfaction Guarantee' },
          skinTypes: productData.skinTypes || ['All Skin Types'],
          concerns: productData.concerns || [],
          ingredients: productData.ingredients || [],
          sizes: productData.sizes || ['100ml'],
          customBadge: productData.customBadge,
          distributorStock: productData.distributorStock,
          ...productData
        } as Product;
        return [newProd, ...prev];
      }
    });
  };

  const deleteProductFromAdmin = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const toggleProductStock = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, inStock: !p.inStock } : p))
    );
  };

  // Loyalty voucher applied at checkout (server-validated; empty = none).
  const [voucherCode, setVoucherCode] = useState<string>('');

  // Creator referral (?ref=CODE): capture once, reuse at checkout, clear after order.
  const [referralCode, setReferralCode] = useState<string | null>(null);
  useEffect(() => {
    try {
      const captured = storeReferralFromUrl();
      setReferralCode(captured ?? storedReferralCode());
    } catch { /* non-browser safe */ }
  }, []);

  // Navigation: every screen has a real Next.js URL (see screen-routes).
  // navigateTo pushes the pathname so URL, history, and state stay in sync.
  const router = useRouter();
  const pathname = usePathname();

  const navigateTo = (screen: ScreenId, stateData?: any) => {
    setPreviousScreens((prev) => [...prev, currentScreen]);
    setCurrentScreen(screen);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });

    if (screen === 'catalogue' && stateData?.category) {
      setSelectedCategory(stateData.category);
    }
    if (screen === 'product-details' && stateData?.product) {
      setSelectedProduct(stateData.product);
      try { router.push(productPath(String(stateData.product.id ?? ''))); } catch { /* ignore */ }
      return;
    }
    const path = SCREEN_PATHS[screen];
    if (typeof path === 'string') {
      let target = path;
      if (screen === 'catalogue' && stateData?.category) {
        target += `?category=${encodeURIComponent(stateData.category)}`;
      }
      try {
        if (target !== pathname) router.push(target);
      } catch { /* ignore non-browser context */ }
    }
  };

  const goBack = () => {
    if (previousScreens.length > 0) {
      const prev = previousScreens[previousScreens.length - 1];
      setPreviousScreens((prevList) => prevList.slice(0, -1));
      setCurrentScreen(prev);
    }
    try {
      router.back();
    } catch {
      setCurrentScreen('home');
    }
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync Next.js pathname (including back/forward) with currentScreen,
  // plus legacy ?screen=/#/hash deep links and category/search params.
  // This is the ONLY place window-derived screen state enters (post-mount),
  // so server HTML and first client render always agree.
  useEffect(() => {
    let next: ScreenId | null = screenForPath(pathname);
    try {
      const params = new URLSearchParams(window.location.search);
      const queryScreen = params.get('screen') as ScreenId | null;
      if (queryScreen) {
        next = queryScreen;
      } else if (window.location.hash) {
        next = (window.location.hash.replace('#', '') as ScreenId) || next;
      }
      const category = params.get('category');
      if (category) setSelectedCategory(category);
      const q = params.get('q');
      if (q !== null) setSearchQuery(q);
    } catch { /* ignore non-browser context */ }
    if (next) {
      const target = next;
      setCurrentScreen((prev) => (prev === target ? prev : target));
    }
    // Pathname-driven sync only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const viewProductDetails = (product: Product) => {
    setSelectedProduct(product);
    navigateTo('product-details', { product });
  };

  // Cart operations
  const addToCart = (
    product: Product,
    size: string = 'Standard',
    quantity: number = 1,
    fulfillmentType: 'local' | 'central' = 'local'
  ) => {
    setCartItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.productId === product.id && item.size === size
      );

      if (existingItemIndex > -1) {
        const updated = [...prevItems];
        updated[existingItemIndex].quantity += quantity;
        setLastAddedCartItem(updated[existingItemIndex]);
        return updated;
      } else {
        const newItem: CartItem = {
          id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          productId: product.id,
          product,
          size,
          quantity,
          unitPrice: product.price,
          fulfillmentType
        };
        setLastAddedCartItem(newItem);
        return [...prevItems, newItem];
      }
    });

    setIsAddToCartSheetOpen(true);
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity: newQty } : item))
    );
  };

  const clearCart = () => setCartItems([]);

  const closeAddToCartSheet = () => {
    setIsAddToCartSheetOpen(false);
  };

  // Restore the durable server cart once (guest session or login) into an
  // empty bag after products load. Placed after cart state by necessity.
  const cartRestored = useRef(false);
  useEffect(() => {
    if (cartRestored.current || !isOwnedApiConfigured || DEMO_SEED) return;
    if (cartItems.length > 0 || products.length === 0) return;
    cartRestored.current = true;
    let cancelled = false;
    fetchServerCart()
      .then((lines) => {
        if (cancelled || !lines || lines.length === 0) return;
        const mapped: CartItem[] = [];
        for (const line of lines) {
          const product =
            products.find((p) => p.id.toLowerCase() === line.productSlug.toLowerCase()) ??
            products.find((p) => p.name === line.productName);
          if (!product) continue;
          const size = product.sizes.includes(line.sizeLabel) ? line.sizeLabel : (product.sizes[0] ?? 'Standard');
          mapped.push({
            id: `srv-${line.id}`,
            productId: product.id,
            product,
            size,
            quantity: Math.max(1, line.qty),
            unitPrice: Math.round(line.unitPriceKobo / 100),
            fulfillmentType: 'local',
          });
        }
        if (mapped.length > 0) setCartItems(mapped);
      })
      .catch(() => {
        // Offline/expired session: start empty, checkout re-syncs.
      });
    return () => {
      cancelled = true;
    };
    // Intentionally run on every render until restored (cheap guards above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  // Calculations
  const cartSubtotal = cartItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  // Delivery fee: Local delivery in selected city (₦1,500) vs Lagos interstate (₦5,000). Free over ₦50,000.
  const isEligibleForFreeShipping = cartSubtotal >= 50000;
  const cartDeliveryFee = isOwnedApiConfigured ? (checkoutFulfilment?.feeKobo ?? 0) / 100 : isEligibleForFreeShipping
    ? 0
    : selectedCity === 'Lagos'
    ? 1000
    : 1500;

  const cartDiscount = activeCreatorCode
    ? Math.round(cartSubtotal * (creatorDiscountPercent / 100))
    : 0;

  const cartTotal = Math.max(0, cartSubtotal - cartDiscount + cartDeliveryFee);

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  // Wishlist (local first; live mirror when the owned backend is configured)
  const toggleWishlist = (productId: string) => {
    const adding = !wishlist.includes(productId);
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
    if (isOwnedApiConfigured) {
      const product = products.find((p) => p.id === productId);
      mirrorWishlist(productId, product?.sizes?.[0] ?? product?.selectedSize, adding).catch(() => {});
    }
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);

  // Order creation
  const createOrderFromCart = (paymentMethod: string, addressData?: any): Order => {
    const newOrder: Order = {
      id: `DES-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      status: 'Processing',
      items: cartItems.map((ci) => ({
        productId: ci.productId,
        productName: ci.product.name,
        brand: ci.product.brand,
        size: ci.size,
        price: ci.unitPrice,
        quantity: ci.quantity,
        image: ci.product.image
      })),
      subtotal: cartSubtotal,
      deliveryFee: cartDeliveryFee,
      total: cartTotal,
      fulfillmentType: 'local',
      distributorCity: selectedCity,
      trackingSteps: [
        {
          title: 'Order Confirmed',
          timestamp: 'Just now',
          status: 'completed',
          description: 'Payment authorized via Flutterwave'
        },
        {
          title: `Assigned to Verified ${selectedCity} Partner`,
          timestamp: 'Pending local fulfillment',
          status: 'current',
          description: `Allocated to local partner in ${selectedCity} for same-day dispatch`
        },
        {
          title: 'Out for Delivery',
          timestamp: 'Upcoming',
          status: 'upcoming',
          description: 'Local courier dispatch to your address'
        },
        {
          title: 'Delivered & Authentic Verification',
          timestamp: 'Upcoming',
          status: 'upcoming',
          description: 'Scan QR code on box to verify batch formulation'
        }
      ],
      shippingAddress: addressData || {
        name: checkoutAddress.fullName || userProfile.name,
        street: checkoutAddress.street || 'Plot 742, Aminu Kano Crescent, Wuse 2',
        city: checkoutAddress.city || selectedCity,
        state: checkoutAddress.state || (selectedCity === 'Abuja' ? 'Abuja FCT' : 'Lagos State'),
        phone: checkoutAddress.phone || userProfile.phone
      },
      paymentMethod
    };

    setOrders((prev) => [newOrder, ...prev]);
    setActiveOrder(newOrder);
    clearCart();
    return newOrder;
  };

  // Vouchers
  const redeemVoucher = (voucherId: string) => {
    const voucher = vouchers.find((v) => v.id === voucherId);
    if (!voucher || voucher.isRedeemed || userProfile.points < voucher.pointsCost) {
      return false;
    }

    setUserProfile((prev) => ({
      ...prev,
      points: prev.points - voucher.pointsCost
    }));

    setVouchers((prev) =>
      prev.map((v) => (v.id === voucherId ? { ...v, isRedeemed: true } : v))
    );

    setPointsActivity((prev) => [
      {
        id: `act-${Date.now()}`,
        title: `Redeemed ${voucher.title}`,
        points: -voucher.pointsCost,
        date: 'Just now',
        type: 'redeem'
      },
      ...prev
    ]);

    return true;
  };

  // Community Messages
  const openCommunity = () => {
    setIsCommunityOpen(true);
    setUnreadCommunityCount(0);
  };
  const closeCommunity = () => setIsCommunityOpen(false);

  const sendCommunityMessage = (text: string) => {
    const newMsg: CommunityMessage = {
      id: `comm-${Date.now()}`,
      senderName: userProfile.name,
      senderAvatar: userProfile.avatar,
      time: 'Just now',
      message: text,
      likes: 0,
      channel: activeCommunityChannel === 'all' ? 'routine' : activeCommunityChannel
    };
    setCommunityMessages((prev) => [...prev, newMsg]);
    // Live mirror: channel chat server-side (silent when offline/unauthenticated).
    sendCommunityChatApi(newMsg.channel, text).catch(() => {});
  };

  const likeCommunityMessage = (messageId: string) => {
    setCommunityMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const liked = !msg.likedByMe;
          return {
            ...msg,
            likedByMe: liked,
            likes: liked ? (msg.likes || 0) + 1 : Math.max(0, (msg.likes || 0) - 1)
          };
        }
        return msg;
      })
    );
  };

  // AI Assistant Handlers
  const openAIAssistant = () => setIsAIAssistantOpen(true);
  const closeAIAssistant = () => setIsAIAssistantOpen(false);

  const sendAIMessage = (text: string) => {
    const userMsg: AIMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setAiMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      const lower = text.toLowerCase();
      let botResponse = 'Desla!™ formulations prioritize melanin barrier health before aesthetic trends. How can I assist your skincare, package, or order today?';
      let recommendedIds: string[] = ['des-bo-01', 'des-ss-01'];

      // 1. ORDER & PACKAGE TRACKING INQUIRIES
      if (lower.includes('track') || lower.includes('order') || lower.includes('package') || lower.includes('where is') || lower.includes('status') || lower.includes('dispatch') || lower.includes('delivery')) {
        const topOrder = orders[0] || activeOrder;
        const orderNum = topOrder?.id || 'DES-829104';
        const orderStatus = topOrder?.status || 'In Transit';
        botResponse = `📦 **Package Status for #${orderNum}:**\n\nYour order is currently **${orderStatus}** with our verified **${selectedCity} Local Partner Dispatch**.\n\n• **Fulfillment Route:** ${selectedCity} Partner Hub → Same-Day Bike Courier\n• **Status:** Dispatched with local courier\n• **Estimated Arrival:** Today within 25–45 minutes\n• **Verification:** Sealed with tamper-evident NAFDAC batch seal.\n\nYou can track the live map in real time under the "Orders" tab.`;
        recommendedIds = [];
      }
      // 2. NAFDAC & AUTHENTICITY INQUIRIES
      else if (lower.includes('nafdac') || lower.includes('authentic') || lower.includes('fake') || lower.includes('original') || lower.includes('batch')) {
        botResponse = `🛡️ **100% NAFDAC Authentic Formulation Guarantee:**\n\nEvery Desla!™ product is formulated under strict Good Manufacturing Practices (GMP) and certified by NAFDAC (Reg No. A8-9042L).\n\n• Each luxury jar includes a unique holographic tamper-evident seal.\n• Scan the QR code on your product box to verify batch lab testing and formulation origin.\n• All stock is dispatched exclusively from verified cold-storage hubs in ${selectedCity} and Lagos.`;
        recommendedIds = ['des-bb-01', 'des-bo-01'];
      }
      // 3. HYPERPIGMENTATION & DARK SPOTS
      else if (lower.includes('hyperpigmentation') || lower.includes('dark spot') || lower.includes('glow') || lower.includes('brighten') || lower.includes('even')) {
        botResponse = `✨ **Targeted Melanin Glow Routine:**\n\nFor persistent hyperpigmentation and uneven skin tone on melanin-rich skin, we recommend avoiding harsh hydroquinone. Instead, utilize our clinically formulated Tyrosinase Inhibitor complex:\n\n1. **AM Routine:** Gentle cleanser followed by Invisible Shield SPF50+ (crucial to prevent UV-triggered melanogenesis).\n2. **PM Routine:** 24K Radiant Golden Body & Face Oil layered over damp skin for lipid repair.`;
        recommendedIds = ['des-ss-01', 'des-bo-01'];
      }
      // 4. BODY CARE & DRY SKIN
      else if (lower.includes('body') || lower.includes('dry') || lower.includes('shea') || lower.includes('butter') || lower.includes('moisture')) {
        botResponse = `🧴 **Profound Barrier Nourishment:**\n\nFor dry, dehydrated, or textured skin, our **Whipped Shea Butter** paired with the **Radiant Golden Body Oil** creates a lipid-rich biomimetic moisture barrier that lasts 24 hours without a heavy residue.`;
        recommendedIds = ['des-bb-01', 'des-bo-01'];
      }
      // 5. FRAGRANCES & PERFUMES
      else if (lower.includes('fragrance') || lower.includes('perfume') || lower.includes('scent') || lower.includes('oil') || lower.includes('smell')) {
        botResponse = `💎 **Artisanal Extrait Parfums & Perfume Oils:**\n\nOur perfume oils are 100% alcohol-free, concentrated at 35% pure perfume oils that interact directly with skin warmth for over 14 hours of intimate sillage. **Royal Amber & Madagascar Vanilla** is our #1 unisex signature creation.`;
        recommendedIds = ['des-po-01', 'des-pf-01'];
      }
      // 6. SUNSCREEN & SPF
      else if (lower.includes('sun') || lower.includes('spf') || lower.includes('uv') || lower.includes('white cast')) {
        botResponse = `☀️ **Zero White-Cast Clinical Protection:**\n\nThe **DESLA!™ Invisible Shield SPF50+ PA++++** is specifically engineered for Fitzpatrick skin types IV–VI. It melts into the skin completely transparently within 8 seconds, leaves zero greasy sheen, and does not sting the eyes.`;
        recommendedIds = ['des-ss-01', 'des-fc-01'];
      }
      // 7. PAYMENT & CHECKOUT INQUIRIES
      else if (lower.includes('payment') || lower.includes('paystack') || lower.includes('flutterwave') || lower.includes('transfer') || lower.includes('card') || lower.includes('ussd')) {
        botResponse = `💳 **Secured Dual-Gateway Payment System:**\n\nDesla!™ accepts both **Paystack** and **Flutterwave** gateways.\n\n• **Debit Cards:** Visa, Mastercard, and Verve supported with 3D Secure.\n• **Instant Bank Transfer:** Dedicated one-time virtual account generated automatically.\n• **USSD Quick Dial:** Instant codes for GTB (*737#), Zenith (*966#), Access (*901#), and UBA (*919#).\n• All payments are backed by our 100% Escrow Protection Guarantee.`;
        recommendedIds = [];
      }
      // 8. CUSTOMER SERVICE & DISPATCH
      else if (lower.includes('customer') || lower.includes('service') || lower.includes('contact') || lower.includes('help') || lower.includes('whatsapp') || lower.includes('support')) {
        botResponse = `💬 **Desla!™ Customer Care & Concierge:**\n\nOur human concierge team is available 24/7. You can reach our dedicated Abuja & Lagos VIP Concierge lines via WhatsApp at **+234 814 812 0642**, or continue chatting with me here for instant resolution regarding order tracking, product recommendations, or ingredient safety.`;
        recommendedIds = [];
      }

      const botMsg: AIMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendedProductIds: recommendedIds
      };

      setAiMessages((prev) => [...prev, botMsg]);
    }, 500);
  };

  // Location / Distributor Handlers
  const getDistributorsForCity = (city: string) => {
    return distributorsList.filter((d) => d.city.toLowerCase() === city.toLowerCase());
  };

  const registerDistributor = submitDistributorApplication;

  // Creator & Affiliate Handlers
  const applyCreatorCode = async (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (isOwnedApiConfigured) {
      try {
        const live = await validateCreatorCodeLive(normalized);
        setActiveCreatorCode(normalized);
        setCreatorDiscountPercent(live.discountPercent);
        return {
          success: true,
          message: `Applied ${live.name}'s Creator Code: ${live.discountPercent}% Off Total Order!`
        };
      } catch (e) {
        return { success: false, message: e instanceof Error ? e.message : 'Could not validate this creator code.' };
      }
    }
    const found = creatorsList.find((c) => c.promoCode === normalized);
    if (found) {
      setActiveCreatorCode(found.promoCode);
      setCreatorDiscountPercent(found.discountPercent);
      return {
        success: true,
        message: `Applied ${found.name}'s Creator Code: ${found.discountPercent}% Off Total Order!`
      };
    }
    return { success: false, message: 'Invalid or expired Creator Promo Code.' };
  };

  const registerCreator = submitCreatorApplication;

  // Community Posts Handlers
  const likeCommunityPost = (postId: string) => {
    setCommunityPostsList((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          const liked = !post.likedByMe;
          return {
            ...post,
            likedByMe: liked,
            likesCount: liked ? post.likesCount + 1 : post.likesCount - 1
          };
        }
        return post;
      })
    );
    // Live mirror: toggle like server-side (silent 404s for mock-only ids).
    likeCommunityPostApi(postId).catch(() => {});
  };

  const createCommunityPost = (
    post: Omit<CommunityPost, 'id' | 'timestamp' | 'likesCount' | 'commentsCount'>
  ) => {
    const newPost: CommunityPost = {
      ...post,
      id: `post-${Date.now()}`,
      timestamp: 'Just now',
      likesCount: 1,
      commentsCount: 0,
      likedByMe: true
    };
    setCommunityPostsList((prev) => [newPost, ...prev]);
    // Live mirror: persist server-side (silent when offline/unauthenticated).
    createCommunityPostApi({
      content: post.content,
      taggedProductId: post.taggedProductId,
      taggedProductHashtag: post.taggedProductHashtag
    }).catch(() => {});
  };

  const getPostsForProduct = (productId: string, hashtag?: string) => {
    return communityPostsList.filter(
      (p) =>
        p.taggedProductId === productId ||
        (hashtag && p.taggedProductHashtag?.toLowerCase() === hashtag.toLowerCase())
    );
  };

  // Product Reviews Handlers
  const addReview = (review: Omit<ProductReview, 'id' | 'date' | 'helpfulCount'>) => {
    const newReview: ProductReview = {
      ...review,
      id: `rev-${Date.now()}`,
      date: 'Just now',
      helpfulCount: 1
    };
    setReviewsList((prev) => [newReview, ...prev]);
  };

  const getReviewsForProduct = (productId: string) => {
    return reviewsList.filter((r) => r.productId === productId);
  };

  const dismissCartBanner = () => setIsCartBannerDismissed(true);

  // ---------- Owned live backend (additive; demo flow untouched) ----------
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(isOwnedApiConfigured);
  const [livePayment, setLivePayment] = useState<{
    status: 'idle' | 'preparing' | 'redirecting' | 'verifying' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  const dismissLivePayment = () => setLivePayment({ status: 'idle', message: '' });

  // Shared checkout gateway: checkout and payment screens stay in sync.
  const [selectedGateway, setSelectedGateway] = useState<'flutterwave' | 'stripe' | 'transfer'>('flutterwave');

  const addLocalOrder = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
    setActiveOrder(order);
  };

  const login = async (email: string, password: string) => {
    if (!isOwnedApiConfigured) {
      const demoRoles = email.includes('admin')
        ? ['SUPER_ADMIN', 'ADMIN', 'STAFF']
        : email.includes('creator')
        ? ['CREATOR']
        : email.includes('distributor')
        ? ['DISTRIBUTOR']
        : ['CUSTOMER'];
      const demoUser: AuthUser = {
        id: 'usr-demo-' + Math.random().toString(36).slice(2, 6),
        email: email.trim(),
        emailVerified: true,
        roles: demoRoles,
        profile: { displayName: email.split('@')[0] || 'Desla Member' }
      };
      setAuthUser(demoUser);
      return { success: true, message: `Welcome to Desla!, ${demoUser.email}` };
    }
    try {
      await apiLogin(email.trim(), password);
      const me = await apiMe();
      setAuthUser(me);
      if (me) {
        mergeServerCart().catch(() => {});
        return { success: true, message: `Welcome back, ${me.email}` };
      }
      return { success: false, message: 'Login failed. Please try again.' };
    } catch (e) {
      return { success: false, message: e instanceof ApiError ? e.message : 'Login failed.' };
    }
  };

  const register = async (email: string, password: string) => {
    if (!isOwnedApiConfigured) {
      const demoUser: AuthUser = {
        id: 'usr-demo-' + Math.random().toString(36).slice(2, 6),
        email: email.trim(),
        emailVerified: false,
        roles: ['CUSTOMER'],
        profile: { displayName: email.split('@')[0] || 'Desla Member' }
      };
      setAuthUser(demoUser);
      return { success: true, message: 'Account registered. Verification code sent!' };
    }
    try {
      const res = await apiRegister(email.trim(), password);
      setAuthUser(null);
      return { success: true, message: 'Check your inbox for a verification link. Already registered? Sign in or resend verification.', devToken: import.meta.env.DEV ? res._devVerificationToken : undefined };
    } catch (e) {
      return { success: false, message: e instanceof ApiError ? e.message : 'Registration failed.' };
    }
  };

  const requestPasswordReset = async (email: string) => {
    if (!isOwnedApiConfigured) {
      return { success: true, message: 'A 4-digit reset code has been sent to ' + email, devToken: '5739' };
    }
    try {
      const res = await apiRequestPasswordReset(email.trim());
      return { success: true, message: 'If an account exists for this email, a password-reset link will arrive shortly.', devToken: import.meta.env.DEV ? res._devResetToken : undefined };
    } catch (e) {
      return { success: false, message: e instanceof ApiError ? e.message : 'Could not request password reset.' };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    if (!isOwnedApiConfigured) {
      return { success: true, message: 'Password updated successfully. You can now log in.' };
    }
    try {
      await apiResetPassword(token, newPassword);
      return { success: true, message: 'Password updated successfully.' };
    } catch (e) {
      return { success: false, message: e instanceof ApiError ? e.message : 'Reset failed. Invalid or expired token.' };
    }
  };

  const verifyEmail = async (token: string) => {
    if (!isOwnedApiConfigured) {
      if (authUser) setAuthUser({ ...authUser, emailVerified: true });
      return { success: true, message: 'Email address verified successfully!' };
    }
    try {
      await apiVerifyEmail(token);
      setAuthUser(null);
      return { success: true, message: 'Email verified. Sign in with your password to continue.' };
    } catch (e) {
      return { success: false, message: e instanceof ApiError ? e.message : 'Verification failed. Invalid or expired token.' };
    }
  };

  // Preview role: frontend-only mock access to dashboards (creator/distributor/
  // admin). Never creates a session and never authorizes backend calls —
  // live APIs still enforce the real cookie session via requirePerm().
  const [previewRole, setPreviewRole] = useState<string | null>(() => {
    try {
      return localStorage.getItem('glowly-preview-role');
    } catch {
      return null;
    }
  });
  const isPreviewMode = previewRole !== null;
  const enterPreviewRole = (role: string) => {
    try {
      localStorage.setItem('glowly-preview-role', role);
    } catch { /* storage unavailable — preview lasts for this tab only */ }
    setPreviewRole(role);
  };
  const exitPreviewRole = () => {
    try {
      localStorage.removeItem('glowly-preview-role');
    } catch { /* ignore */ }
    setPreviewRole(null);
  };

  const setSimulatedUserRole = (role: string) => {
    if (isOwnedApiConfigured) {
      // Live backend: do NOT fake a session. Enter frontend-only preview instead.
      enterPreviewRole(role);
      return;
    }
    if (authUser) {
      setAuthUser({ ...authUser, roles: [role] });
    } else {
      setAuthUser({
        id: 'usr-simulated-admin',
        email: 'admin.selena@desla-apothecary.com',
        emailVerified: true,
        roles: [role],
        profile: { displayName: 'Selena Thorne' }
      });
    }
  };

  const loginAsDemoRole = (role: 'CUSTOMER' | 'CREATOR' | 'DISTRIBUTOR' | 'SUPER_ADMIN') => {
    const roleProfiles: Record<string, { email: string; name: string }> = {
      CUSTOMER: { email: 'amina.bello@example.com', name: 'Amina Bello (Customer)' },
      CREATOR: { email: 'zara.okon@creator.desla.com', name: 'Zara Okon (Creator & MUA)' },
      DISTRIBUTOR: { email: 'amaka.chioma@distributor.desla.com', name: 'Amaka Chioma (Abuja Hub)' },
      SUPER_ADMIN: { email: 'admin.selena@desla.com', name: 'Selena Thorne (Admin)' }
    };
    const prof = roleProfiles[role] || roleProfiles.CUSTOMER;
    const demoUser: AuthUser = {
      id: `usr-demo-${role.toLowerCase()}-${Math.random().toString(36).slice(2, 6)}`,
      email: prof.email,
      emailVerified: true,
      roles: [role],
      profile: { displayName: prof.name }
    };
    setAuthUser(demoUser);
    enterPreviewRole(role);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
      // Cookie may already be gone; local state still clears.
    }
    setAuthUser(null);
    exitPreviewRole();
  };

  // Session restore (silent; stays logged out in demo mode).
  useEffect(() => {
    if (!isOwnedApiConfigured) return;
    let cancelled = false;
    apiMe()
      .then((me) => {
        if (!cancelled) setAuthUser(me);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAuthLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const prepareLiveCheckout = async (provider: PayProvider): Promise<LiveCheckoutResult> => {
    setLivePayment({ status: 'preparing', message: 'Preparing secure checkout…' });
    try {
      if (cartItems.length === 0) throw new Error('Your bag is empty.');
      const email = checkoutAddress.email || userProfile.email;
      const creatorCode = activeCreatorCode || referralCode || undefined;
       const fulfilment = checkoutFulfilment;
       if (!fulfilment || fulfilment.routingKey !== routingKey(cartItems, checkoutAddress.city || selectedCity, checkoutAddress.state, fulfilment.method)) throw new Error('Review delivery or pickup options again before payment.');
      const fingerprint = JSON.stringify({
        cart: cartItems.map((item) => [item.productId, item.size, item.quantity]),
        address: checkoutAddress,
        fulfilment,
        voucherCode: voucherCode.trim(),
        creatorCode,
      });
       if (liveCheckoutAttempt.current?.fingerprint !== fingerprint) {
         let stored: typeof liveCheckoutAttempt.current = null;
         try { stored = JSON.parse(sessionStorage.getItem('glowly-active-checkout') ?? 'null'); } catch { /* ignore */ }
         liveCheckoutAttempt.current = stored?.fingerprint === fingerprint ? stored : { fingerprint, key: newIdempotencyKey(), guestToken: newGuestOrderToken() };
         try { sessionStorage.setItem('glowly-active-checkout', JSON.stringify(liveCheckoutAttempt.current)); } catch { /* ignore */ }
      }
       const operationKey = liveCheckoutAttempt.current.key;
       if (!liveCheckoutAttempt.current.orderId) await syncCartToServer(cartItems.map((ci) => ({ productId: ci.productId, size: ci.size, quantity: ci.quantity })));
       const view = liveCheckoutAttempt.current.orderId
         ? await fetchServerOrder(liveCheckoutAttempt.current.orderId, liveCheckoutAttempt.current.guestToken)
         : (await serverCheckout(
        {
          fullName: checkoutAddress.fullName || userProfile.name,
          email,
          phone: checkoutAddress.phone || userProfile.phone,
          street: checkoutAddress.street,
          city: checkoutAddress.city || selectedCity,
          state: checkoutAddress.state,
          deliveryNotes: checkoutAddress.deliveryNotes,
        },
        voucherCode.trim() || undefined,
        creatorCode,
        fulfilment,
         `${operationKey}:checkout`,
         liveCheckoutAttempt.current.guestToken,
       )).order;
       if (!view) throw new Error('Unable to restore checkout. Please contact support with your order number.');
       liveCheckoutAttempt.current.orderId = view.id;
       try { sessionStorage.setItem('glowly-active-checkout', JSON.stringify(liveCheckoutAttempt.current)); } catch { /* ignore */ }
       rememberGuestOrderToken(view.id, view.orderNumber, liveCheckoutAttempt.current.guestToken);
      try { clearReferralCode(); setReferralCode(null); } catch { /* ignore */ }
       const init = await initPayment(view.id, provider, email || undefined, `${operationKey}:payment:${provider}`);
       try { localStorage.setItem(`glowly-payment-token:${init.reference}`, liveCheckoutAttempt.current.guestToken); } catch { /* storage unavailable */ }
      const local = mapServerOrder(
        view,
        cartItems,
        provider === 'transfer' ? 'Bank transfer (pending)' : `${provider} (hosted checkout)`
      );
      rememberServerOrder(local.id, view.id);
      try {
        if (email) localStorage.setItem('glowly-guest-email', email);
        localStorage.setItem('glowly-last-reference', init.reference);
      } catch { /* storage unavailable — return flow falls back to typed email */ }
       clearCart();
       try { sessionStorage.removeItem('glowly-active-checkout'); } catch { /* ignore */ }
      if (init.authorizationUrl) {
        setLivePayment({ status: 'redirecting', message: 'Opening secure payment page…' });
        window.location.href = init.authorizationUrl;
      } else {
        setLivePayment({ status: 'idle', message: '' });
      }
      return { order: local, serverOrderId: view.id, authorizationUrl: init.authorizationUrl, reference: init.reference, bankDetails: init.bankDetails };
    } catch (e) {
      const message = e instanceof ApiError || e instanceof Error ? e.message : 'Checkout failed. Please try again.';
      setLivePayment({ status: 'error', message });
      throw e;
    }
  };

  // Provider return (?pay=reference): verify server-side, mirror locally, confirm.
  // Exposed as reverifyPayment so the payment screen can resume a pending
  // reference after reloads, closed provider tabs, or cleared navigation state.
  const verifyPaymentReturn = useCallback(async (
    ref: string,
    opts?: { pending?: boolean; orderNumber?: string | null; retries?: number },
  ): Promise<boolean> => {
    setLivePayment({ status: 'verifying', message: 'Confirming your payment…' });
    try {
      const st = await paymentStatus(ref);
      if (!st.settled) {
        // Webhooks/worker may land seconds after the redirect: retry briefly
        // when the backend flagged the return pending before giving up.
        if (opts?.pending && (opts?.retries ?? 0) < 3) {
          await new Promise((r) => setTimeout(r, 4000));
          return verifyPaymentReturn(ref, { ...opts, retries: (opts?.retries ?? 0) + 1 });
        }
        const orderHint = opts?.orderNumber ?? (st.orderNumber || undefined);
        setLivePayment({ status: 'error', message: `Payment is not complete yet${orderHint ? ` (order ${orderHint})` : ''}. If you paid, wait a minute and check Orders.` });
        return false;
      }
      // Guest capability: payment-attempt token first, remembered order token
      // second, session cookie last (logged-in shoppers need none of these).
      const token = paymentTokenFor(ref) ?? guestOrderToken(st.orderId) ?? undefined;
      const view: ServerOrderView | null = await fetchServerOrder(st.orderId, token);
      if (!view) {
        const orderHint = opts?.orderNumber ?? st.orderNumber;
        setLivePayment({ status: 'error', message: `Payment confirmed${orderHint ? ` for order ${orderHint}` : ''}, but the order could not be loaded. Contact support with reference ${ref}.` });
        return false;
      }
      const local = mapServerOrder(view, cartItems, 'Online payment');
      rememberServerOrder(local.id, view.id);
      setOrders((prev) => [local, ...prev]);
      setActiveOrder(local);
      clearCart();
      setLivePayment({ status: 'idle', message: '' });
      setPreviousScreens((prev) => [...prev, currentScreen]);
      setCurrentScreen('order-confirmed');
      try { router.push('/order-confirmed'); } catch { /* ignore */ }
      window.scrollTo({ top: 0 });
      return true;
    } catch {
      const orderHint = opts?.orderNumber ? ` (order ${opts.orderNumber})` : '';
      setLivePayment({ status: 'error', message: `Could not verify payment${orderHint}. Contact support with reference ${ref}.` });
      return false;
    }
    // State snapshots are intentionally call-time; the mount effect below
    // pins the landing-page snapshot, the resume button uses fresh state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems, currentScreen]);

  useEffect(() => {
    if (!isOwnedApiConfigured) return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('pay');
    const payError = params.get('pay_error');
    if (payError && !ref) {
      setLivePayment({ status: 'error', message: 'Payment return was incomplete. Check Orders or try again.' });
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    if (!ref) return;
    const pending = params.get('pending') === '1';
    const orderNumber = params.get('order');
    window.history.replaceState({}, '', window.location.pathname);
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await verifyPaymentReturn(ref, { pending, orderNumber });
    })();
    return () => {
      cancelled = true;
    };
    // Mount-once return handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        previousScreens,
        navigateTo,
        goBack,
        products,
        selectedProduct,
        setSelectedProduct,
        seedCatalogue,
        viewProductDetails,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        selectedConcern,
        setSelectedConcern,
        sortOption,
        setSortOption,
        isFilterSheetOpen,
        setIsFilterSheetOpen,
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartSubtotal,
        cartDeliveryFee,
        cartDiscount,
        cartTotal,
        cartCount,
        isAddToCartSheetOpen,
        lastAddedCartItem,
        closeAddToCartSheet,
        quickModalProduct,
        openQuickModal,
        closeQuickModal,
        wishlist,
        toggleWishlist,
        isWishlisted,
        orders,
        activeOrder,
        setActiveOrder,
        createOrderFromCart,
        skinProfile,
        setSkinProfile,
        userProfile,
        vouchers,
        pointsActivity,
        redeemVoucher,
        isAIAssistantOpen,
        openAIAssistant,
        closeAIAssistant,
        aiMessages,
        sendAIMessage,
        isCommunityOpen,
        openCommunity,
        closeCommunity,
        communityMessages,
        activeCommunityChannel,
        setActiveCommunityChannel,
        sendCommunityMessage,
        likeCommunityMessage,
        unreadCommunityCount,
        selectedCity,
        setSelectedCity,
        isLocationModalOpen,
        setIsLocationModalOpen,
        distributors: distributorsList,
        getDistributorsForCity,
        registerDistributor,
        creators: creatorsList,
        activeCreatorCode,
        creatorDiscountPercent,
        appliedCreator,
        applyCreatorCode,
        registerCreator,
        communityPosts: communityPostsList,
        likeCommunityPost,
        createCommunityPost,
        getPostsForProduct,
        reviews: reviewsList,
        addReview,
        getReviewsForProduct,
        isCartBannerDismissed,
        dismissCartBanner,
        checkoutAddress,
        setCheckoutAddress,
        checkoutFulfilment,
        setCheckoutFulfilment,
        preferredDistributor,
        setPreferredDistributor,
        voucherCode,
        setVoucherCode,
        authUser,
        authLoading,
        login,
        register,
        requestPasswordReset,
        resetPassword,
        verifyEmail,
        setSimulatedUserRole,
        loginAsDemoRole,
        previewRole,
        isPreviewMode,
        enterPreviewRole,
        exitPreviewRole,
        logout,
        isLiveBackend: isOwnedApiConfigured,
        livePayment,
        dismissLivePayment,
        reverifyPayment: (reference: string) => verifyPaymentReturn(reference),
        addLocalOrder,
        prepareLiveCheckout,
        selectedGateway,
        setSelectedGateway,

        // Storefront & Editorial CMS State
        heroSlides,
        updateHeroSlides,
        routineSteps,
        updateRoutineSteps,
        brandStory,
        updateBrandStory,
        announcementTicker,
        updateAnnouncementTicker,

        // Taxonomy & Categories CRUD
        categories: categoriesList,
        updateCategories,
        addCategory,
        deleteCategory,

        // Creator PR & Campaigns
        prBoxes: prBoxesList,
        updatePRBoxes,
        addPRBox,
        creatorCampaigns: creatorCampaignsList,
        updateCreatorCampaigns,
        addCreatorCampaign,

        // Wholesale & Logistics
        wholesaleCartons: wholesaleCartonsList,
        updateWholesaleCartons,
        labShipments: labShipmentsList,
        updateLabShipments,
        addLabShipment,
        incidentTickets: incidentTicketsList,
        updateIncidentTickets,
        resolveIncidentTicket,

        // Coupons & Promo Rules
        couponRules: couponRulesList,
        updateCouponRules,
        addCouponRule,

        // Product CRUD mutations from Admin
        saveProductFromAdmin,
        deleteProductFromAdmin,
        toggleProductStock
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
