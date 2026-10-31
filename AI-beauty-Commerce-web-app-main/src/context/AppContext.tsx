import type { StorefrontSeed } from '../../backend/src/storefront/lib/storefront-seed';
import React, { createContext, useCallback, useContext, useState, useEffect, useRef, useMemo, ReactNode } from 'react';
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
  CouponRule,
  AdminInventoryItem,
  StockMovementLog,
  CreatorReferralLink,
  CreatorLedgerTransaction,
  DistributorLedgerTransaction,
  CreatorPRRequest,
  CreatorCampaignSubmission,
  OrderStatus
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
import { beginGoogleSignIn, restoreOAuthCallback, rememberSignInFrom, rememberAuthIntent, localReturnTo } from '../lib/auth-flow';
import { useCustomerCart } from '../lib/use-customer-cart';
import { clearPendingBag } from '../lib/customer-journey';
import { DEFAULT_HERO_SETTINGS, type HeroSettings } from '../lib/hero-settings';
import { isPartnerDesignPreview } from '../lib/partner-preview';
import { creatorDiscountNaira } from '../lib/order-journey';
import { portalForScreen } from '../lib/portal-navigation';
import {
  ApiError,
  apiFetch,
  apiLogin,
  apiLogout,
  apiMe,
  apiRegister,
  apiRequestPasswordReset,
  apiResetPassword,
  apiVerifyEmail,
  subscribeStorefrontSyncApi,
  fetchCategoriesApi,
  fetchCatalogFromOwnedApi,
  saveAdminCatalogueProduct,
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
  fetchPartnerDashboard,
  fetchPartnerWorkspace,
  writePartnerWorkspace,
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
  initCryptoPayment,
  verifyCryptoPayment,
  getCryptoPaymentStatus,
  fetchCryptoRates,
  type CryptoInitDto,
  type CryptoRatesDto,
  type CryptoStatusDto,
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
  addToCart: (product: Product, size?: string, quantity?: number, fulfillmentType?: 'local' | 'central') => boolean;
  addToCartBatch: (items: { product: Product; size?: string; quantity?: number; fulfillmentType?: 'local' | 'central' }[]) => boolean;
  requestCustomerSignIn: (returnTo?: string) => void;
  cartReady: boolean;
  cartError: string;
  cartSaving: boolean;
  retryCart: () => void;
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
  sendCommunityMessage: (text: string) => Promise<void>;
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
  createCommunityPost: (post: Omit<CommunityPost, 'id' | 'timestamp' | 'likesCount' | 'commentsCount'>) => Promise<void>;
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
  authError: string;
  refreshAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: AuthUser }>;
  loginWithGoogle: (redirect?: string, role?: string, email?: string) => Promise<void>;

  register: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; message: string; user?: AuthUser }>;
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
  prepareLiveCryptoCheckout: (asset: string, network: string) => Promise<CryptoInitDto & { serverOrderId: string; orderNumber: string }>;
  confirmLiveCryptoPayment: (paymentId: string, txHash?: string) => Promise<{ order: Order; status: string }>;

  // Storefront & Editorial CMS State
  heroSlides: HeroSlide[];
  updateHeroSlides: (slides: React.SetStateAction<HeroSlide[]>) => void;
  heroSettings: HeroSettings;
  updateHeroSettings: (settings: HeroSettings) => void;
  routineSteps: EditorialRoutineStep[];
  updateRoutineSteps: (steps: EditorialRoutineStep[]) => void;
  brandStory: BrandStoryConfig;
  updateBrandStory: (config: BrandStoryConfig) => void;
  announcementTicker: AnnouncementTickerConfig;
  updateAnnouncementTicker: (config: AnnouncementTickerConfig) => void;

  // Categories & Taxonomy CRUD
  categories: Category[];
  updateCategories: (cats: Category[]) => void;
  addCategory: (cat: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

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
  deleteProductFromAdmin: (productId: string) => Promise<void>;
  toggleProductStock: (productId: string) => Promise<void>;
  refreshAdminCatalogue: () => Promise<void>;
  adminCatalogueProducts: Product[];
  publishStorefront: () => Promise<void>;

  // Master Inventory & Multi-Hub Logistics
  inventoryItems: AdminInventoryItem[];
  updateInventoryItems: (items: AdminInventoryItem[]) => void;
  adjustStock: (sku: string, hub: 'central' | 'lagos' | 'abuja' | 'ph' | 'kano', delta: number, reason: string, notes?: string) => void;
  transferStock: (sku: string, fromHub: 'central' | 'lagos' | 'abuja' | 'ph' | 'kano', toHub: 'central' | 'lagos' | 'abuja' | 'ph' | 'kano', quantity: number, notes?: string) => void;
  updateStockThreshold: (sku: string, threshold: number) => void;
  stockMovementLogs: StockMovementLog[];

  // Dynamic Order Pipeline
  updateOrderStatus: (orderId: string, status: OrderStatus, courierInfo?: { courierName?: string; courierPhone?: string; courierPin?: string; trackingNumber?: string }) => void;

  // Creator Affiliate Studio Operations
  creatorLinks: CreatorReferralLink[];
  createCreatorLink: (linkData: { name: string; url: string; promoCode: string; targetSku?: string; discountPercent?: number }) => CreatorReferralLink;
  creatorLedger: CreatorLedgerTransaction[];
  creatorAvailableBalanceNgn: number | null;
  requestCreatorPayout: (amount: number, bankDetails: { bank: string; nuban: string; accountName: string }) => boolean;
  creatorPRRequests: CreatorPRRequest[];
  requestPRBox: (boxId: string, creatorName: string, creatorHandle: string, address: string) => Promise<boolean>;
  creatorSubmissions: CreatorCampaignSubmission[];
  applyToCampaign: (campaignId: string, creatorHandle: string, pitch?: string) => Promise<boolean>;
  submitCampaignDeliverable: (campaignId: string, creatorHandle: string, deliverableUrl: string) => Promise<boolean>;
  creatorStorefrontProducts: string[];
  toggleCreatorStorefrontProduct: (productId: string) => void;

  // Distributor City Hub Operations
  distributorLedger: DistributorLedgerTransaction[];
  distributorAvailableBalanceNgn: number | null;
  requestDistributorPayout: (amount: number, bankDetails: { bank: string; nuban: string; accountName: string }) => boolean;
  updateShipmentStatus: (shipmentId: string, status: LabRestockShipment['status']) => void;
  createLabRestockOrder: (hubName: string, items: { sku: string; name: string; cartons: number; units: number; price: number }[]) => LabRestockShipment;
  distributorHubSettings: {
    hubName: string;
    address: string;
    city: string;
    state: string;
    operatingHours: string;
    whatsappNumber: string;
    pickupEnabled: boolean;
    deliveryEnabled: boolean;
  };
  updateDistributorHubSettings: (settings: Partial<{
    hubName: string;
    address: string;
    city: string;
    state: string;
    operatingHours: string;
    whatsappNumber: string;
    pickupEnabled: boolean;
    deliveryEnabled: boolean;
  }>) => Promise<boolean>;
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
type ProductActions = Pick<AppContextType, 'addToCart' | 'toggleWishlist' | 'isWishlisted' | 'openQuickModal'>;
const ProductActionsContext = createContext<ProductActions | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode; initialScreen?: ScreenId; initialProduct?: Product; initialCatalogue?: Product[]; initialEditorial?: StorefrontSeed }> = ({ children, initialScreen, initialProduct, initialCatalogue, initialEditorial }) => {
  // Navigation State with URL deep linking (?screen=..., #..., or pathname)
  const [currentScreen, setCurrentScreen] = useState<ScreenId>(() => {
    if (initialScreen) return initialScreen;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryScreen = params.get('screen') as ScreenId;
      if (queryScreen) return queryScreen;

      const hash = window.location.hash.replace('#', '') as ScreenId;
      if (hash && !hash.includes('=')) return hash;

      const path = window.location.pathname.replace(/^\//, '');
      if (path === 'verify-email') return 'verify-email';
      if (path === 'reset-password') return 'reset-password';
      if (path === 'creators' || path === 'creator-studio') return 'creators';
      if (path === 'distributor-portal' || path === 'distributors' || path === 'distributor') return 'distributor-portal';
      if (path === 'admin-console' || path === 'admin') return 'admin-console';
    }
    return 'home';
  });
  const [previousScreens, setPreviousScreens] = useState<ScreenId[]>([]);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(isOwnedApiConfigured);
  const [authError, setAuthError] = useState('');
  const liveCheckoutAttempt = useRef<{ fingerprint: string; key: string; guestToken: string; orderId?: string } | null>(null);

  // Public server seed renders immediately; live updates arrive after hydration.
  const [products, setProducts] = useState<Product[]>(initialProduct ? [initialProduct, ...(initialCatalogue || []).filter(product => product.id !== initialProduct.id)] : initialCatalogue || []);
  const hasServerCatalogue = useRef(initialCatalogue !== undefined);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialProduct || null);

  useEffect(() => {
    if (!isOwnedApiConfigured || hasServerCatalogue.current) return;
    let cancelled = false;
    fetchCatalogFromOwnedApi()
      .then((live) => {
        if (!live || cancelled) return;
        setProducts(live);
        setSelectedProduct((prev) => {
          if (!prev) return live[0] ?? null;
          return live.find((p) => p.id === prev.id) ?? live[0] ?? null;
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

  const editorialDraftRevision = useRef(0);
  // Live storefront synchronization via Server-Sent Events (SSE)
  useEffect(() => {
    if (!isOwnedApiConfigured) return;
    const unsubscribe = subscribeStorefrontSyncApi(() => {
      Promise.all([
        fetchCatalogFromOwnedApi(100, true),
        fetchCategoriesApi(),
        apiFetch<any>('/api/storefront').catch(() => null),
      ])
        .then(([live, liveCats, editorial]) => {
          if (live) {
            setProducts(live);
            setSelectedProduct((prev) => {
              if (!prev) return live[0] ?? null;
              return live.find((p) => p.id === prev.id) ?? live[0] ?? null;
            });
          }
          if (liveCats && live) {
            const catsWithCounts = liveCats.map((cat) => ({
              ...cat,
              itemCount: live.filter((p) => (p.category || '').toLowerCase() === (cat.slug || '').toLowerCase() || (p.category || '').toLowerCase() === (cat.name || '').toLowerCase()).length,
            }));
            setCategoriesList(catsWithCounts);
          } else if (liveCats) {
            setCategoriesList(liveCats);
          }
          if (editorial?.config && editorialDraftRevision.current === 0) {
            setStorefrontVersion(editorial.version);
            if (editorial.config.heroSlides) setHeroSlides(editorial.config.heroSlides);
            if (editorial.config.hero) setHeroSettings(editorial.config.hero);
            if (editorial.config.routineSteps) setRoutineSteps(editorial.config.routineSteps);
            if (editorial.config.brandStory) setBrandStory(editorial.config.brandStory);
            if (editorial.config.announcementTicker) setAnnouncementTicker(editorial.config.announcementTicker);
          }
        })
        .catch(() => {});
    });
    return () => {
      unsubscribe();
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

  // Product Quick View Modal
  const [quickModalProduct, setQuickModalProduct] = useState<Product | null>(null);
  const openQuickModal = useCallback((product: Product) => setQuickModalProduct(product), []);
  const closeQuickModal = useCallback(() => setQuickModalProduct(null), []);

  // Wishlist
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Orders
  const [orders, setOrders] = useState<Order[]>(() => isPartnerDesignPreview() ? initialOrders : []);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // AI Skin Scan
  const [skinProfile, setSkinProfile] = useState<SkinAnalysisResult | null>(null);

  // User Profile & Rewards
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: '', email: '', phone: '', avatar: '', points: 0, savedAddresses: [] });
  const [vouchers, setVouchers] = useState<RewardVoucher[]>([]);
  const [pointsActivity, setPointsActivity] = useState<PointsActivity[]>([]);

  // Fulfillment & Checkout Address State
  const [checkoutAddress, setCheckoutAddress] = useState<CheckoutAddress>({
    fullName: '', email: '', phone: '', street: '', city: '', state: '', deliveryNotes: ''
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
  const [communityMessages, setCommunityMessages] = useState<CommunityMessage[]>([]);
  const [activeCommunityChannel, setActiveCommunityChannel] = useState('all');
  const [unreadCommunityCount, setUnreadCommunityCount] = useState(0);

  // Chat is outside the shopping page's critical path; fetch its selected
  // channel when the drawer or full community screen is actually opened.
  useEffect(() => {
    if (!isOwnedApiConfigured || !authUser || (!isCommunityOpen && currentScreen !== 'community')) return;
    let cancelled = false;
    setCommunityMessages([]);
    fetchCommunityChat(activeCommunityChannel === 'all' ? 'routine' : activeCommunityChannel)
      .then(live => { if (!cancelled && live !== null) setCommunityMessages(live); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isCommunityOpen, currentScreen, activeCommunityChannel, authUser?.id]);

  // NEW: Distributors Store
  const [distributorsList, setDistributorsList] = useState<Distributor[]>([]);

  // NEW: Creators & Affiliates Store
  const [creatorsList, setCreatorsList] = useState<Creator[]>([]);
  const [activeCreatorCode, setActiveCreatorCode] = useState<string | null>(null);
  const [creatorDiscountPercent, setCreatorDiscountPercent] = useState<number>(0);
  const appliedCreator = creatorsList.find((c) => c.promoCode === activeCreatorCode) || null;

  // NEW: Social Community Posts Feed
  const [communityPostsList, setCommunityPostsList] = useState<CommunityPost[]>([]);
  useEffect(() => {
    setCommunityPostsList([]); setCommunityMessages([]);
    if (!authUser) return;
    let cancelled = false;
    fetchCommunityPosts().then(live => { if (!cancelled && live) setCommunityPostsList(live); }).catch(() => {});
    return () => { cancelled = true; };
  }, [authUser?.id]);
  useEffect(() => {
    if (!authUser || currentScreen !== 'community') return;
    let cancelled = false;
    const refresh = () => { if (document.hidden) return; void fetchCommunityPosts().then(posts => { if (!cancelled && posts) setCommunityPostsList(posts); }).catch(() => {}); };
    refresh(); window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { cancelled = true; window.removeEventListener('focus', refresh); window.clearInterval(timer); };
  }, [authUser?.id, currentScreen]);
  // NEW: Customer Reviews Store
  const [reviewsList, setReviewsList] = useState<ProductReview[]>([]);

  const [isCartBannerDismissed, setIsCartBannerDismissed] = useState(false);

  // Storefront & Editorial CMS State
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(initialEditorial?.config?.heroSlides || []);
  const [heroSettings, setHeroSettings] = useState<HeroSettings>(initialEditorial?.config?.hero || DEFAULT_HERO_SETTINGS);
  const updateHeroSettings = (settings: HeroSettings) => { editorialDraftRevision.current++; setHeroSettings(settings); };

  const updateHeroSlides = (slides: React.SetStateAction<HeroSlide[]>) => {
    editorialDraftRevision.current++;
    setHeroSlides(slides);
  };

  const [routineSteps, setRoutineSteps] = useState<EditorialRoutineStep[]>(initialEditorial?.config?.routineSteps || []);

  const updateRoutineSteps = (steps: EditorialRoutineStep[]) => {
    editorialDraftRevision.current++;
    setRoutineSteps(steps);
  };

  const [brandStory, setBrandStory] = useState<BrandStoryConfig>(initialEditorial?.config?.brandStory || { tagline: '', heading: '', paragraph1: '', paragraph2: '', image: '/brand_story_hero.jpg', badge1: '', badge2: '' });

  const updateBrandStory = (config: BrandStoryConfig) => {
    editorialDraftRevision.current++;
    setBrandStory(config);
  };

  const [announcementTicker, setAnnouncementTicker] = useState<AnnouncementTickerConfig>(initialEditorial?.config?.announcementTicker || { text: '', linkText: '', linkRoute: 'catalogue', isActive: false });

  const updateAnnouncementTicker = (config: AnnouncementTickerConfig) => {
    editorialDraftRevision.current++;
    setAnnouncementTicker(config);
  };

  // Taxonomy & Categories CRUD
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);

  const updateCategories = (cats: Category[]) => {
    setCategoriesList(cats);
  };

  const addCategory = async (cat: Category) => {
    if (!isPartnerDesignPreview()) {
      await apiFetch('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: cat.name,
          slug: cat.slug,
          description: cat.description || '',
          image: cat.image || '/cat_skincare.jpg',
          displayOrder: 0,
        }),
      });
      const liveCats = await fetchCategoriesApi();
      if (liveCats) setCategoriesList(liveCats);
      return;
    }
    setCategoriesList((prev) => [cat, ...prev]);
  };

  const deleteCategory = async (id: string) => {
    if (!isPartnerDesignPreview()) {
      await apiFetch('/api/admin/categories', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      const liveCats = await fetchCategoriesApi();
      if (liveCats) setCategoriesList(liveCats);
      return;
    }
    setCategoriesList((prev) => prev.filter((c) => c.id !== id));
  };

  // Creator PR & Campaigns
        const [storefrontVersion, setStorefrontVersion] = useState(initialEditorial?.version || 0);
  useEffect(() => {
    if (isPartnerDesignPreview()) return;
    let cancelled = false;
    apiFetch<any>('/api/storefront').then(result => {
      if (cancelled || editorialDraftRevision.current !== 0) return;
      setStorefrontVersion(result.version);
      if (result.config) {
        setHeroSlides(result.config.heroSlides); setRoutineSteps(result.config.routineSteps);
        if (result.config.hero) setHeroSettings(result.config.hero);
        setBrandStory(result.config.brandStory); setAnnouncementTicker(result.config.announcementTicker);
      }
    }).catch(() => { /* Keep the existing editorial defaults if no saved configuration can be loaded. */ });
    return () => { cancelled = true; };
  }, []);
  const publishStorefront = async () => {
    if (isPartnerDesignPreview()) return;
    const revision = editorialDraftRevision.current;
    const result = await apiFetch<{ version: number }>('/api/admin/storefront', { method: 'PUT', body: JSON.stringify({ version: storefrontVersion, config: { hero: heroSettings, heroSlides, routineSteps, brandStory, announcementTicker } }) });
    setStorefrontVersion(result.version);
    if (editorialDraftRevision.current === revision) editorialDraftRevision.current = 0;
  };

  const [prBoxesList, setPrBoxesList] = useState<PRBoxOffering[]>([]);

  const updatePRBoxes = (boxes: PRBoxOffering[]) => {
    setPrBoxesList(boxes);
  };

  const addPRBox = (box: PRBoxOffering) => {
    setPrBoxesList((prev) => [box, ...prev]);
  };

  const [creatorCampaignsList, setCreatorCampaignsList] = useState<CreatorCampaignBrief[]>([]);

  const updateCreatorCampaigns = (campaigns: CreatorCampaignBrief[]) => {
    setCreatorCampaignsList(campaigns);
  };

  const addCreatorCampaign = (campaign: CreatorCampaignBrief) => {
    setCreatorCampaignsList((prev) => [campaign, ...prev]);
  };

  // Wholesale & Logistics
  const [wholesaleCartonsList, setWholesaleCartonsList] = useState<WholesaleCartonItem[]>([]);

  const updateWholesaleCartons = (cartons: WholesaleCartonItem[]) => {
    setWholesaleCartonsList(cartons);
  };

  const [labShipmentsList, setLabShipmentsList] = useState<LabRestockShipment[]>([]);

  const updateLabShipments = (shipments: LabRestockShipment[]) => {
    setLabShipmentsList(shipments);
  };

  const addLabShipment = (shipment: LabRestockShipment) => {
    setLabShipmentsList((prev) => [shipment, ...prev]);
  };

  const [incidentTicketsList, setIncidentTicketsList] = useState<LogisticsIncidentTicket[]>([]);

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
  const [couponRulesList, setCouponRulesList] = useState<CouponRule[]>([]);

  const updateCouponRules = (rules: CouponRule[]) => {
    setCouponRulesList(rules);
  };

  const addCouponRule = (rule: CouponRule) => {
    setCouponRulesList((prev) => [rule, ...prev]);
  };

  // Product CRUD mutations from Admin
  const [adminCatalogueProducts, setAdminCatalogueProducts] = useState<Product[]>([]);
  const refreshAdminCatalogue = useCallback(async () => {
    if (isPartnerDesignPreview()) return;
    const result = await apiFetch<{ products: Product[]; categories: Category[] }>('/api/admin/catalogue');
    if (!Array.isArray(result.products) || !Array.isArray(result.categories)) {
      throw new Error('Could not load catalogue: the service returned invalid products or categories.');
    }
    setAdminCatalogueProducts(result.products); setCategoriesList(result.categories);
  }, []);
  const productSaveAttempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const saveProductFromAdmin = async (productData: Partial<Product>) => {
    if (!isPartnerDesignPreview()) {
      const fingerprint = JSON.stringify(productData);
      if (productSaveAttempt.current?.fingerprint !== fingerprint) productSaveAttempt.current = { fingerprint, key: crypto.randomUUID() };
      await saveAdminCatalogueProduct(productData, productSaveAttempt.current.key);
      await refreshAdminCatalogue();
      const published = await fetchCatalogFromOwnedApi();
      if (published) setProducts(published);
      productSaveAttempt.current = null;
      return;
    }
    setProducts((prev) => {
      if (productData.id && prev.some((p) => p.id === productData.id)) {
        return prev.map((p) => (p.id === productData.id ? ({ ...p, ...productData } as Product) : p));
      } else {
        const newProd: Product = {
          id: productData.id || `prod-${Date.now()}`,
          name: productData.name || 'Untitled Formulation',
          brand: productData.brand || 'Delsla Natural',
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

  const deleteProductFromAdmin = async (productId: string) => {
    if (!isPartnerDesignPreview()) {
      const product = adminCatalogueProducts.find(p => p.id === productId);
      if (!product?.serverId) throw new Error('Reload the live catalogue before editing.');
      await apiFetch(`/api/admin/products/${product.serverId}`, { method: 'PATCH', body: JSON.stringify({ isActive: false }) });
      await refreshAdminCatalogue();
      const publicCatalogue = await fetchCatalogFromOwnedApi();
      if (publicCatalogue) setProducts(publicCatalogue);
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const toggleProductStock = async (productId: string) => {
    if (!isPartnerDesignPreview()) {
      const product = adminCatalogueProducts.find(p => p.id === productId);
      if (!product?.serverId) throw new Error('Reload the live catalogue before editing.');
      await apiFetch(`/api/admin/products/${product.serverId}`, { method: 'PATCH', body: JSON.stringify({ isActive: !product.isActive }) });
      await refreshAdminCatalogue();
      const publicCatalogue = await fetchCatalogFromOwnedApi();
      if (publicCatalogue) setProducts(publicCatalogue);
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, inStock: !p.inStock } : p))
    );
  };

  // Master Inventory & Regional Hubs
  const [inventoryItemsList, setInventoryItemsList] = useState<AdminInventoryItem[]>([]);

  const updateInventoryItems = (items: AdminInventoryItem[]) => {
    setInventoryItemsList(items);
  };

  // Stock Movement Logs
  const [stockMovementLogsList, setStockMovementLogsList] = useState<StockMovementLog[]>([]);

  const adjustStock = (
    sku: string,
    hub: 'central' | 'lagos' | 'abuja' | 'ph' | 'kano',
    delta: number,
    reason: string,
    notes?: string
  ) => {
    setInventoryItemsList((prev) =>
      prev.map((item) => {
        if (item.sku !== sku && item.id !== sku) return item;
        const key = hub === 'central' ? 'centralStock' : hub === 'lagos' ? 'lagosHub' : hub === 'abuja' ? 'abujaHub' : hub === 'ph' ? 'phHub' : 'kanoHub';
        const newHubQty = Math.max(0, item[key] + delta);
        const updatedItem = {
          ...item,
          [key]: newHubQty
        };
        const total = updatedItem.centralStock + updatedItem.lagosHub + updatedItem.abujaHub + updatedItem.phHub + updatedItem.kanoHub;
        updatedItem.isLowStock = total <= updatedItem.lowStockThreshold || updatedItem.lagosHub <= 10;

        // Sync catalog product inStock
        setProducts((prods) =>
          prods.map((p) => {
            if (p.sku === item.sku || p.id.toLowerCase() === item.id.toLowerCase()) {
              return {
                ...p,
                stockCount: updatedItem.centralStock,
                inStock: total > 0
              };
            }
            return p;
          })
        );
        return updatedItem;
      })
    );

    const targetItem = inventoryItemsList.find((i) => i.sku === sku || i.id === sku);
    const logItem: StockMovementLog = {
      id: `mov-${Date.now()}`,
      sku,
      productName: targetItem?.productName || sku,
      action: delta > 0 ? 'STOCK_IN' : 'STOCK_OUT',
      quantity: Math.abs(delta),
      fromHub: delta < 0 ? `${hub.toUpperCase()} Hub` : 'Central Supplier',
      toHub: delta > 0 ? `${hub.toUpperCase()} Hub` : 'Adjustment / Write-off',
      actor: authUser?.profile?.displayName || authUser?.email || 'Central Admin Operations',
      reason: notes ? `${reason} — ${notes}` : reason,
      timestamp: 'Just now'
    };
    setStockMovementLogsList((prev) => [logItem, ...prev]);
  };

  const transferStock = (
    sku: string,
    fromHub: 'central' | 'lagos' | 'abuja' | 'ph' | 'kano',
    toHub: 'central' | 'lagos' | 'abuja' | 'ph' | 'kano',
    quantity: number,
    notes?: string
  ) => {
    if (fromHub === toHub || quantity <= 0) return;
    setInventoryItemsList((prev) =>
      prev.map((item) => {
        if (item.sku !== sku && item.id !== sku) return item;
        const fromKey = fromHub === 'central' ? 'centralStock' : fromHub === 'lagos' ? 'lagosHub' : fromHub === 'abuja' ? 'abujaHub' : fromHub === 'ph' ? 'phHub' : 'kanoHub';
        const toKey = toHub === 'central' ? 'centralStock' : toHub === 'lagos' ? 'lagosHub' : toHub === 'abuja' ? 'abujaHub' : toHub === 'ph' ? 'phHub' : 'kanoHub';
        const deducted = Math.min(item[fromKey], quantity);
        return {
          ...item,
          [fromKey]: item[fromKey] - deducted,
          [toKey]: item[toKey] + deducted
        };
      })
    );
    const targetItem = inventoryItemsList.find((i) => i.sku === sku || i.id === sku);
    const logItem: StockMovementLog = {
      id: `mov-${Date.now()}`,
      sku,
      productName: targetItem?.productName || sku,
      action: 'INTER_HUB_TRANSFER',
      quantity,
      fromHub: `${fromHub.toUpperCase()} Hub`,
      toHub: `${toHub.toUpperCase()} Hub`,
      actor: authUser?.profile?.displayName || authUser?.email || 'Central Logistics Officer',
      reason: notes || `Direct hub transfer from ${fromHub} to ${toHub}`,
      timestamp: 'Just now'
    };
    setStockMovementLogsList((prev) => [logItem, ...prev]);
  };

  const updateStockThreshold = (sku: string, threshold: number) => {
    setInventoryItemsList((prev) =>
      prev.map((item) => (item.sku === sku || item.id === sku ? { ...item, lowStockThreshold: threshold } : item))
    );
  };

  // Dynamic Order Pipeline
  const updateOrderStatus = (
    orderId: string,
    status: OrderStatus,
    courierInfo?: { courierName?: string; courierPhone?: string; courierPin?: string; trackingNumber?: string }
  ) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        const newStep = {
          title: `Status: ${status}`,
          timestamp: 'Just now',
          status: 'completed' as const,
          description: courierInfo?.courierName
            ? `Dispatched via ${courierInfo.courierName} (PIN: ${courierInfo.courierPin || 'Verified'})`
            : `Order updated to ${status} by fulfillment hub.`
        };
        return {
          ...ord,
          status,
          ...(courierInfo || {}),
          trackingSteps: [...(ord.trackingSteps || []), newStep]
        };
      })
    );
    setActiveOrder((prev) => (prev && prev.id === orderId ? { ...prev, status, ...(courierInfo || {}) } : prev));
  };

  // Creator Affiliate Studio Operations
  const [creatorLinksList, setCreatorLinksList] = useState<CreatorReferralLink[]>([]);

  const createCreatorLink = (linkData: { name: string; url: string; promoCode: string; targetSku?: string; discountPercent?: number }) => {
    const newLink: CreatorReferralLink = {
      id: `link-${Date.now()}`,
      name: linkData.name || 'Custom Referral Link',
      url: linkData.url,
      promoCode: linkData.promoCode.toUpperCase(),
      targetSku: linkData.targetSku,
      discountPercent: linkData.discountPercent || 10,
      clicks: 0,
      orders: 0,
      conversion: '0.0%',
      earnedNgn: 0,
      createdAt: 'Just now'
    };
    setCreatorLinksList((prev) => [newLink, ...prev]);
    addCouponRule({
      id: `c-${Date.now()}`,
      code: newLink.promoCode,
      discountType: 'PERCENTAGE',
      discountValue: newLink.discountPercent,
      minOrderNgn: 15000,
      creatorHandle: '@amara_glows',
      usedCount: 0,
      isActive: true,
      expiresAt: '2026-12-31'
    });
    return newLink;
  };

  const [creatorLedgerList, setCreatorLedgerList] = useState<CreatorLedgerTransaction[]>([]);

  const requestCreatorPayout = (amount: number, bankDetails: { bank: string; nuban: string; accountName: string }): boolean => {
    if (amount <= 0) return false;
    const newTx: CreatorLedgerTransaction = {
      id: `payout-${Date.now()}`,
      date: 'Just now',
      orderNumber: `PAYOUT-NIP-${Math.floor(1000 + Math.random() * 9000)}`,
      client: `Withdrawal to ${bankDetails.bank} (${bankDetails.nuban.slice(-4)})`,
      grossOrder: '—',
      commissionRate: 'Instant Settlement',
      netPayout: `-₦${amount.toLocaleString('en-NG')}`,
      status: 'paid',
      note: `Transferred to ${bankDetails.accountName} via Nigerian NIP`,
      type: 'PAYOUT'
    };
    setCreatorLedgerList((prev) => [newTx, ...prev]);
    return true;
  };

  const [creatorPRRequestsList, setCreatorPRRequestsList] = useState<CreatorPRRequest[]>([]);

  const requestPRBox = async (boxId: string, creatorName: string, creatorHandle: string, address: string): Promise<boolean> => {
    const box = prBoxesList.find((b) => b.id === boxId);
    if (!box) return false;
    if (!authUser?.roles.includes('CREATOR')) return false;
    let response: any;
    try { response = await writePartnerWorkspace({ action: 'apply', kind: 'CREATOR', publicationId: boxId, title: box.title, body: address, url: '', productIds: [] }); }
    catch { return false; }
    const saved = response?.result;
    if (!saved?.id) return false;
    setPrBoxesList((prev) => prev.map((b) => {
      if (b.id !== boxId || b.spotsLeft < 0) return b;
      const spotsLeft = Math.max(0, b.spotsLeft - 1);
      return { ...b, spotsLeft, openSpots: `${spotsLeft} spots remaining` };
    }));
    const newReq: CreatorPRRequest = {
      id: saved.id,
      boxId,
      boxTitle: box.title,
      creatorName,
      creatorHandle,
      creatorTier: 'Verified',
      shippingAddress: address,
      requestedAt: 'Just now',
      status: 'PENDING'
    };
    setCreatorPRRequestsList((prev) => [newReq, ...prev]);
    return true;
  };

  const [creatorSubmissionsList, setCreatorSubmissionsList] = useState<CreatorCampaignSubmission[]>([]);

  const applyToCampaign = async (campaignId: string, _creatorHandle: string, pitch?: string): Promise<boolean> => {
    const campaign = creatorCampaignsList.find((c) => c.id === campaignId);
    if (!campaign || !authUser?.roles.includes('CREATOR')) return false;
    try {
      const response = await writePartnerWorkspace({ action: 'apply', kind: 'CREATOR', publicationId: campaignId, title: campaign.title, body: pitch ?? '', url: '', productIds: [] });
      const saved = response?.result;
      if (!saved?.id) return false;
      setCreatorSubmissionsList((prev) => [{ id: saved.id, campaignId, campaignTitle: campaign.title, creatorHandle: authUser.profile?.displayName ?? authUser.email, creatorName: authUser.profile?.displayName ?? authUser.email, deliverableUrl: '', submittedAt: saved.createdAt, status: 'SUBMITTED' }, ...prev]);
      return true;
    } catch { return false; }
  };

  const submitCampaignDeliverable = async (campaignId: string, _creatorHandle: string, deliverableUrl: string): Promise<boolean> => {
    if (!authUser?.roles.includes('CREATOR')) return false;
    const entry = creatorSubmissionsList.find((submission) => submission.campaignId === campaignId && ['SUBMITTED', 'APPROVED', 'REJECTED'].includes(submission.status));
    if (!entry) return false;
    try {
      const record = (await fetchPartnerWorkspace('CREATOR'))?.records?.find((row: any) => row.id === entry.id);
      if (!record || !['APPROVED', 'REJECTED'].includes(record.status)) return false;
      const response = await writePartnerWorkspace({ action: 'deliver', kind: 'CREATOR', id: record.id, version: record.version, url: deliverableUrl, body: '' });
      if (!response?.result?.id) return false;
      setCreatorSubmissionsList((prev) => prev.map((submission) => submission.id === entry.id ? { ...submission, deliverableUrl, submittedAt: response.result.updatedAt, status: 'SUBMITTED' } : submission));
      return true;
    } catch { return false; }
  };

  const [creatorStorefrontProducts, setCreatorStorefrontProducts] = useState<string[]>([]);

  const toggleCreatorStorefrontProduct = (productId: string) => {
    setCreatorStorefrontProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  // Distributor City Hub Operations
  const [distributorLedgerList, setDistributorLedgerList] = useState<DistributorLedgerTransaction[]>([]);

  const requestDistributorPayout = (amount: number, bankDetails: { bank: string; nuban: string; accountName: string }): boolean => {
    if (amount <= 0) return false;
    const newTx: DistributorLedgerTransaction = {
      id: `dtx-${Date.now()}`,
      date: 'Just now',
      reference: `PAYOUT-DST-${Math.floor(1000 + Math.random() * 9000)}`,
      description: `Wholesale profit withdrawal to ${bankDetails.bank} (${bankDetails.nuban.slice(-4)})`,
      type: 'PAYOUT',
      amountNgn: -amount,
      status: 'paid',
      note: `Settled to ${bankDetails.accountName} via Direct NIP`
    };
    setDistributorLedgerList((prev) => [newTx, ...prev]);
    return true;
  };

  const updateShipmentStatus = (shipmentId: string, status: LabRestockShipment['status']) => {
    setLabShipmentsList((prev) =>
      prev.map((s) => (s.id === shipmentId ? { ...s, status } : s))
    );
    if (status === 'DELIVERED') {
      const ship = labShipmentsList.find((s) => s.id === shipmentId);
      if (ship) {
        const hubKey = ship.destinationHub.toLowerCase().includes('abuja')
          ? 'abuja'
          : ship.destinationHub.toLowerCase().includes('lagos')
          ? 'lagos'
          : ship.destinationHub.toLowerCase().includes('port')
          ? 'ph'
          : 'kano';
        adjustStock(
          inventoryItemsList[0]?.sku || 'DES-BO-01-100ML',
          hubKey as any,
          Math.round(ship.itemCount / 3),
          'Lab Batch Arrival Delivered',
          `Batch ${ship.batchNumber}`
        );
      }
    }
  };

  const createLabRestockOrder = (
    hubName: string,
    items: { sku: string; name: string; cartons: number; units: number; price: number }[]
  ): LabRestockShipment => {
    const totalUnits = items.reduce((acc, it) => acc + it.units, 0);
    const batchNumber = `BATCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newShipment: LabRestockShipment = {
      id: `lab-${Date.now()}`,
      batchNumber,
      courier: 'GIG Cold-Chain Fleet (Dispatched from Central Laboratory)',
      trackingNumber: `GIG-TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      destinationHub: hubName,
      itemCount: totalUnits,
      status: 'IN_TRANSIT',
      dispatchedAt: 'Just now',
      estimatedArrival: 'Tomorrow, within 24 hours'
    };
    addLabShipment(newShipment);

    const totalCost = items.reduce((acc, it) => acc + it.price, 0);
    const newTx: DistributorLedgerTransaction = {
      id: `dtx-${Date.now()}`,
      date: 'Just now',
      reference: `RESTOCK-${batchNumber}`,
      description: `Wholesale restock order (${items.length} cartons / ${totalUnits} units)`,
      type: 'RESTOCK_PURCHASE',
      amountNgn: -totalCost,
      status: 'cleared',
      note: `Destined for ${hubName}`
    };
    setDistributorLedgerList((prev) => [newTx, ...prev]);

    return newShipment;
  };

  const [distributorHubSettings, setDistributorHubSettings] = useState({
    hubName: '',
    address: '',
    city: '',
    state: '',
    operatingHours: '',
    whatsappNumber: '',
    pickupEnabled: false,
    deliveryEnabled: false
  });

  const updateDistributorHubSettings = async (settings: Partial<typeof distributorHubSettings>) => {
    if (!authUser?.roles.includes('DISTRIBUTOR')) return false;
    try {
      await writePartnerWorkspace({ action: 'profile', kind: 'DISTRIBUTOR', name: settings.hubName ?? distributorHubSettings.hubName, handle: '', address: settings.address ?? distributorHubSettings.address, phone: settings.whatsappNumber ?? distributorHubSettings.whatsappNumber, operatingHours: settings.operatingHours ?? distributorHubSettings.operatingHours, pickupEnabled: settings.pickupEnabled ?? distributorHubSettings.pickupEnabled, deliveryEnabled: settings.deliveryEnabled ?? distributorHubSettings.deliveryEnabled });
      setDistributorHubSettings((prev) => ({ ...prev, ...settings }));
      return true;
    } catch (error) { throw error; }
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

  // Navigation handlers with browser URL synchronization
  const navigateTo = (screen: ScreenId, stateData?: any) => {
    if (screen === 'admin-console') {
      const target = authUser?.adminEntryPath;
      if (target && window.location.pathname !== target) window.location.assign(target);
      return;
    }
    if (['login', 'signup'].includes(screen)) rememberSignInFrom(currentScreen, window.location.href);
    if (portalForScreen(screen)) rememberSignInFrom(screen, window.location.href);
    if (currentScreen === 'admin-console') {
      const destination = new URL('/', window.location.origin);
      if (screen !== 'home') destination.searchParams.set('screen', screen);
      window.location.assign(destination.toString());
      return;
    }
    setPreviousScreens((prev) => [...prev, currentScreen]);
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (portalForScreen(currentScreen) !== portalForScreen(screen)) {
          for (const key of ['workspace', 'tab', 'intent', 'returnTo']) url.searchParams.delete(key);
        }
        if (screen === 'product-details' && stateData?.product?.id) { url.pathname = '/products/' + encodeURIComponent(stateData.product.id); url.search = ''; }
        else { url.pathname = '/'; url.searchParams.set('screen', screen); }
        window.history.pushState({ screen, productId: stateData?.product?.id }, '', url.toString());
      }
    } catch { /* ignore non-browser context */ }

    if (screen === 'catalogue' && stateData?.category) {
      setSelectedCategory(stateData.category);
    }
    if (screen === 'product-details' && stateData?.product) {
      setSelectedProduct(stateData.product);
    }
  };

  const goBack = () => {
    if (previousScreens.length > 0) {
      const prev = previousScreens[previousScreens.length - 1];
      setPreviousScreens((prevList) => prevList.slice(0, -1));
      setCurrentScreen(prev);
      try {
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.pathname = '/'; url.searchParams.set('screen', prev);
          window.history.pushState({ screen: prev }, '', url.toString());
        }
      } catch { /* ignore */ }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCurrentScreen('home');
      try {
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.pathname = '/'; url.searchParams.delete('screen');
          window.history.pushState({ screen: 'home' }, '', url.toString());
        }
      } catch { /* ignore */ }
    }
  };

  // Sync browser back/forward buttons with currentScreen
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = (e: PopStateEvent) => {
      const productSlug = e.state?.productId || (window.location.pathname.startsWith('/products/') ? decodeURIComponent(window.location.pathname.split('/')[2] || '') : '');
      if (productSlug) { const product = products.find(product => product.id === productSlug); if (product) setSelectedProduct(product); }
      const stateScreen = e.state?.screen || (productSlug ? 'product-details' : null);
      if (stateScreen) {
        setCurrentScreen(stateScreen);
      } else {
        const params = new URLSearchParams(window.location.search);
        const queryScreen = (params.get('screen') as ScreenId) || 'home';
        setCurrentScreen(queryScreen);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

  const viewProductDetails = (product: Product) => {
    setSelectedProduct(product);
    navigateTo('product-details', { product });
  };

  const requestCustomerSignIn = useCallback((returnTo?: string) => {
    const target = localReturnTo(returnTo || window.location.pathname + window.location.search) || '/catalogue';
    rememberAuthIntent('CUSTOMER', target);
    setQuickModalProduct(null); setIsCommunityOpen(false); setIsAIAssistantOpen(false);
    setCurrentScreen('login');
    const destination = new URL('/', window.location.origin); destination.search = new URLSearchParams({ screen: 'login', intent: 'CUSTOMER', returnTo: target }).toString(); window.history.pushState({ screen: 'login' }, '', destination);
    window.scrollTo({ top: 0 });
  }, []);
  const resumeCustomerCart = useCallback(() => {
    setQuickModalProduct(null); setCurrentScreen('cart');
    const destination = new URL('/', window.location.origin); destination.searchParams.set('screen', 'cart'); window.history.replaceState({ screen: 'cart' }, '', destination);
  }, []);
  const { cartItems, addToCart, addToCartBatch, removeFromCart, updateQuantity, clearCart,
    isAddToCartSheetOpen, lastAddedCartItem, closeAddToCartSheet, cartReady, cartError, cartSaving, retryCart, flushCart } =
    useCustomerCart({ userId: authUser?.id, authLoading, onSignIn: requestCustomerSignIn, onResumed: resumeCustomerCart, catalogue: products });

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
    ? creatorDiscountNaira(cartSubtotal, creatorDiscountPercent)
    : 0;

  const cartTotal = Math.max(0, cartSubtotal - cartDiscount + cartDeliveryFee);

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  // Wishlist (local first; live mirror when the owned backend is configured)
  const toggleWishlist = useCallback((productId: string) => {
    if (!authUser) { requestCustomerSignIn(); return; }
    const adding = !wishlist.includes(productId);
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
    if (isOwnedApiConfigured) {
      const product = products.find((p) => p.id === productId);
      mirrorWishlist(productId, product?.sizes?.[0] ?? product?.selectedSize, adding).catch(() => {});
    }
  }, [wishlist, products, authUser?.id, requestCustomerSignIn]);

  const isWishlisted = useCallback((productId: string) => wishlist.includes(productId), [wishlist]);

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
    if (!authUser) { requestCustomerSignIn('/community'); return; }
    setIsCommunityOpen(true);
    setUnreadCommunityCount(0);
  };
  const closeCommunity = () => setIsCommunityOpen(false);

  const sendCommunityMessage = async (text: string) => {
    const newMsg: CommunityMessage = {
      id: `comm-${Date.now()}`,
      senderName: userProfile.name,
      senderAvatar: userProfile.avatar,
      time: 'Just now',
      message: text,
      likes: 0,
      channel: activeCommunityChannel === 'all' ? 'routine' : activeCommunityChannel
    };
    if (isPartnerDesignPreview()) throw new Error('Sign in to send community messages.');
    const serverMsg = await sendCommunityChatApi(newMsg.channel, text);
    setCommunityMessages((prev) => [...prev, serverMsg]);
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

  const sendAIMessage = async (text: string) => {
    const content = text.trim();
    if (!content) return;
    const stamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setAiMessages(previous => [...previous, { id: crypto.randomUUID(), sender: 'user', text: content, timestamp: stamp() }]);
    try {
      const reply = await apiFetch<{ text: string; recommendedProductIds: string[] }>('/api/ai/guest-chat', { method: 'POST', body: JSON.stringify({ content }) });
      setAiMessages(previous => [...previous, { id: crypto.randomUUID(), sender: 'assistant', text: reply.text, timestamp: stamp(), recommendedProductIds: reply.recommendedProductIds }]);
    } catch (error) {
      setAiMessages(previous => [...previous, { id: crypto.randomUUID(), sender: 'assistant', text: error instanceof Error ? error.message : 'The assistant is unavailable. Please try again.', timestamp: stamp(), recommendedProductIds: [] }]);
    }
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
    const snapshot = communityPostsList.find((p) => p.id === postId);
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
    // Live truth: adopt the server count/flag once confirmed; revert the
    // optimistic toggle if the request fails (or is demo/local only).
    const isServerPost = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId);
    if (!isServerPost) return;
    likeCommunityPostApi(postId)
      .then((server) =>
        setCommunityPostsList((prev) =>
          prev.map((post) => (post.id === postId ? { ...post, likedByMe: server.liked, likesCount: server.likesCount } : post))
        )
      )
      .catch(() => {
        if (!snapshot) return;
        setCommunityPostsList((prev) =>
          prev.map((post) => (post.id === postId ? { ...post, likedByMe: snapshot.likedByMe, likesCount: snapshot.likesCount } : post))
        );
      });
  };

  const createCommunityPost = async (
    post: Omit<CommunityPost, 'id' | 'timestamp' | 'likesCount' | 'commentsCount'>
  ) => {
    if (isPartnerDesignPreview()) throw new Error('Sign in to publish community posts.');
    const serverPost = await createCommunityPostApi({
      content: post.content,
      taggedProductId: post.taggedProductId,
      taggedProductHashtag: post.taggedProductHashtag,
      mediaType: post.mediaType,
      mediaUrl: post.mediaUrl,
      mediaId: post.mediaId
    });
    setCommunityPostsList((prev) => [serverPost, ...prev]);
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
  const profileOwner = useRef<string | null>(null);
  useEffect(() => {
    const owner = authUser?.id || null;
    const sameOwner = owner !== null && profileOwner.current === owner;
    profileOwner.current = owner;
    setUserProfile(previous => ({ ...(sameOwner ? previous : { points: 0, savedAddresses: [] }), name: authUser?.profile?.displayName || '', email: authUser?.email || '', phone: authUser?.profile?.phone || '', avatar: authUser?.profile?.avatarUrl || '' }));
    if (!sameOwner) { setActiveOrder(null); setOrders([]); setWishlist([]); setSkinProfile(null); setVouchers([]); setPointsActivity([]); }
  }, [authUser?.id, authUser?.email, authUser?.profile?.displayName, authUser?.profile?.phone, authUser?.profile?.avatarUrl]);

  const [creatorAvailableBalanceNgn, setCreatorAvailableBalanceNgn] = useState<number | null>(null);
  const [distributorAvailableBalanceNgn, setDistributorAvailableBalanceNgn] = useState<number | null>(null);
  const refreshAuth = useCallback(async (silent = false) => {
    if (!silent) setAuthLoading(true);
    try {
      const me = await apiMe();
      if (me) {
        setAuthUser(me);
        setAuthError('');
      } else {
        setAuthUser(null);
      }
    } catch (error) {
      if (!silent) setAuthError(error instanceof Error ? error.message : 'Could not restore your session.');
    } finally {
      if (!silent) setAuthLoading(false);
    }
  }, [authUser?.id]);
  const [livePayment, setLivePayment] = useState<{
    status: 'idle' | 'preparing' | 'redirecting' | 'verifying' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  const dismissLivePayment = () => setLivePayment({ status: 'idle', message: '' });

  const addLocalOrder = (order: Order) => {
    setOrders((prev) => [order, ...prev.filter(existing => existing.id !== order.id)]);
    setActiveOrder(order);
  };

  const login = async (email: string, password: string) => {
    setAuthError('');

    try {
      await apiLogin(email.trim(), password);
      const me = await apiMe();
      setAuthUser(me);
      if (me) {
        return { success: true, message: `Welcome back, ${me.email}`, user: me };
      }
      return { success: false, message: 'Login failed. Please try again.' };
    } catch (e) {
      return { success: false, message: e instanceof ApiError ? e.message : 'Login failed.' };
    }
  };

  const loginWithGoogle = async (redirect?: string, role?: string, _email?: string) => {
    setAuthError('');
    try { await beginGoogleSignIn(apiFetch, redirect, role); }
    catch (error) { setAuthError(error instanceof Error ? error.message : 'Could not start Google sign-in.'); }
  };

  const register = async (email: string, password: string) => {

    try {
      const res = await apiRegister(email.trim(), password);
      setAuthUser(null);
      return { success: true, message: 'Check your email for a verification link or sign-in instructions. Your existing password is unchanged.' };
    } catch (e) {
      return { success: false, message: e instanceof ApiError ? e.message : 'Registration failed.' };
    }
  };

  const requestPasswordReset = async (email: string) => {

    try {
      const res = await apiRequestPasswordReset(email.trim());
      return { success: true, message: 'If an account exists for this email, a password-reset link will arrive shortly.' };
    } catch (e) {
      return { success: false, message: e instanceof ApiError ? e.message : 'Could not request password reset.' };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {

    try {
      await apiResetPassword(token, newPassword);
      return { success: true, message: 'Password updated successfully.' };
    } catch (e) {
      return { success: false, message: e instanceof ApiError ? e.message : 'Reset failed. Invalid or expired token.' };
    }
  };

  const verifyEmail = async (token: string) => {

    try {
      await apiVerifyEmail(token);
      const user = await apiMe();
      if (!user) return { success: false, message: 'Email verified. Sign in with your email and password to continue.' };
      setAuthUser(user);
      return { success: true, message: 'Email verified. You are signed in.', user };
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
  const isPreviewMode = isPartnerDesignPreview() || previewRole !== null;
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

  const setSimulatedUserRole = (_role: string) => { setAuthError('Partner and staff access requires administrator approval.'); navigateTo('login'); };

  const loginAsDemoRole = (role: 'CUSTOMER' | 'CREATOR' | 'DISTRIBUTOR' | 'SUPER_ADMIN') => { navigateTo(role === 'CREATOR' ? 'creators' : role === 'DISTRIBUTOR' ? 'distributor-portal' : 'login'); };

  const logout = async () => {
    clearPendingBag();
    try {
      await apiLogout();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not sign out. Please retry.');
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('glowly-auth-token');
    }
    setAuthUser(null);
    exitPreviewRole();
  };

  // Session restore (silent; stays logged out in demo mode).
  useEffect(() => {
    if (isPartnerDesignPreview()) { setAuthLoading(false); return; }
    let cancelled = false;
    restoreOAuthCallback(apiFetch).then(() => apiMe())
      .then((me) => {
        if (!cancelled) setAuthUser(me);
      })
      .catch(error => { if (!cancelled) setAuthError(error instanceof Error ? error.message : 'Could not restore your session.'); })
      .finally(() => {
        if (!cancelled) setAuthLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isPartnerDesignPreview()) return;
    if (!authUser) {
      setCreatorLinksList([]); setCreatorLedgerList([]); setCreatorPRRequestsList([]); setCreatorSubmissionsList([]); setCreatorCampaignsList([]); setCreatorAvailableBalanceNgn(null); setPrBoxesList([]);
      setDistributorLedgerList([]); setDistributorAvailableBalanceNgn(null);
      return;
    }
    let cancelled = false;
    const hasCreator = authUser.roles.includes('CREATOR');
    const hasDistributor = authUser.roles.includes('DISTRIBUTOR');
    const money = (kobo: number) => `₦${(kobo / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
    if (!hasCreator) { setCreatorLinksList([]); setCreatorLedgerList([]); setCreatorPRRequestsList([]); setCreatorSubmissionsList([]); setCreatorCampaignsList([]); setCreatorAvailableBalanceNgn(null); setPrBoxesList([]); }
    if (!hasDistributor) { setDistributorLedgerList([]); setDistributorAvailableBalanceNgn(null); }
    if (hasCreator) {
      setCreatorLinksList([]); setCreatorLedgerList([]); setCreatorPRRequestsList([]); setCreatorSubmissionsList([]); setCreatorCampaignsList([]); setCreatorAvailableBalanceNgn(0);
      Promise.all([fetchPartnerDashboard('CREATOR'), fetchPartnerWorkspace('CREATOR')]).then(([dashboard, workspace]) => {
        if (cancelled) return;
        const profile = dashboard.profile;
        const metrics = dashboard.metrics;
        const entries = dashboard.wallet.entries ?? [];
        setCreatorsList([{ id: profile.id, name: profile.name, handle: profile.handle, platform: profile.platform, niche: profile.niche, avatar: profile.avatarUrl, promoCode: profile.promoCode, discountPercent: profile.discountPercent, commissionRate: profile.commissionRate, totalSalesNgn: (metrics.paidMerchandiseKobo ?? 0) / 100, commissionEarnedNgn: (metrics.commissionNetKobo ?? 0) / 100, clicks: profile.clicks, ordersCount: metrics.ordersCount ?? 0, verified: profile.verified }]);
        setCreatorAvailableBalanceNgn((dashboard.wallet.availableKobo ?? 0) / 100);
        setCreatorLinksList([{ id: profile.id, name: 'Creator referral', url: `${window.location.origin}/?ref=${encodeURIComponent(profile.promoCode)}`, promoCode: profile.promoCode, discountPercent: profile.discountPercent, clicks: profile.clicks, orders: metrics.ordersCount ?? 0, conversion: profile.clicks ? `${((metrics.ordersCount ?? 0) / profile.clicks * 100).toFixed(1)}%` : '0%', earnedNgn: (metrics.commissionNetKobo ?? 0) / 100, createdAt: profile.createdAt }]);
        setCreatorLedgerList(entries.map((entry: any) => ({ id: entry.id, date: new Date(entry.createdAt).toLocaleDateString(), orderNumber: entry.description, client: '—', grossOrder: money(entry.amountKobo), commissionRate: `${profile.commissionRate}%`, netPayout: money(entry.amountKobo), status: entry.bucket === 'PENDING' || entry.bucket === 'HELD' ? 'pending' : 'cleared', note: entry.description, type: 'COMMISSION' })));
        const records = workspace.records ?? [];
        setCreatorPRRequestsList(records.filter((r: any) => r.ownerId === authUser.id && r.kind === 'PR_REQUEST').map((r: any) => ({ id: r.id, boxId: r.parentId ?? r.id, boxTitle: r.title, creatorName: profile.name, creatorHandle: profile.handle, creatorTier: 'Verified', shippingAddress: r.body, requestedAt: r.createdAt, status: r.status === 'SUBMITTED' ? 'PENDING' : r.status, trackingNumber: r.data?.shipping?.trackingReference || (r.status === 'DISPATCHED' ? r.reviewNote : undefined), dispatchedAt: r.data?.shipping?.dispatchedAt, deliveredAt: r.data?.shipping?.deliveredAt })));
        const publicRecords = records.filter((r: any) => !r.ownerId && r.status === 'PUBLISHED');
        setCreatorSubmissionsList(records.filter((r: any) => r.ownerId === authUser.id && r.kind === 'CAMPAIGN_ENTRY').map((r: any) => ({ id: r.id, campaignId: r.parentId, campaignTitle: r.title, creatorHandle: profile.handle, creatorName: profile.name, deliverableUrl: r.url ?? '', submittedAt: r.updatedAt, status: r.status === 'APPROVED' ? 'APPROVED' : 'SUBMITTED', notes: r.reviewNote ?? '' })));
        setPrBoxesList(publicRecords.filter((r: any) => r.kind === 'PR_BOX').map((r: any) => ({ id: r.id, title: r.title, category: 'PR Box', retailValue: '', openSpots: 'Availability confirmed upon review', spotsLeft: -1, thumbnail: '', description: r.body, includedProducts: r.data?.productIds ?? [], eligibleTiers: ['Rising', 'Verified', 'Icon'], ...r.data?.details, isActive: true })));
        setCreatorCampaignsList(publicRecords.filter((r: any) => r.kind === 'CAMPAIGN').map((r: any) => ({ id: r.id, title: r.title, category: 'Campaign', commissionRate: '', bonus: '', deadline: '', description: r.body, heroImage: '', deliverables: [], slots: '', ...r.data?.details, status: 'ACTIVE' })));
      }).catch(() => { if (!cancelled) { setCreatorLinksList([]); setCreatorLedgerList([]); setCreatorPRRequestsList([]); setCreatorSubmissionsList([]); setCreatorCampaignsList([]); setCreatorAvailableBalanceNgn(0); setPrBoxesList([]); } });
    }
    if (hasDistributor) {
      setDistributorLedgerList([]); setDistributorAvailableBalanceNgn(0); setOrders([]); setLabShipmentsList([]);
      Promise.all([fetchPartnerDashboard('DISTRIBUTOR'), fetchPartnerWorkspace('DISTRIBUTOR')]).then(([dashboard]) => {
        if (cancelled) return;
        const profile = dashboard.profile;
        const entries = dashboard.wallet.entries ?? [];
        setDistributorHubSettings(prev => ({ ...prev, hubName: profile.name, address: profile.address, city: profile.city, state: profile.state, whatsappNumber: profile.phone, operatingHours: profile.operatingHours, pickupEnabled: profile.pickupAvailable, deliveryEnabled: dashboard.location?.deliveryEnabled ?? true }));
        setDistributorAvailableBalanceNgn((dashboard.wallet.availableKobo ?? 0) / 100);
        setDistributorLedgerList(entries.map((entry: any) => ({ id: entry.id, date: new Date(entry.createdAt).toLocaleDateString(), reference: entry.id, description: entry.description, type: 'WHOLESALE_MARGIN', amountNgn: entry.amountKobo / 100, status: entry.bucket === 'PENDING' || entry.bucket === 'HELD' ? 'pending' : 'cleared', note: entry.description })));
        setInventoryItemsList((dashboard.inventory ?? []).map((item: any) => ({ id: item.variantId, sku: item.sku, productName: item.name, category: '', centralStock: item.onHand, lagosHub: profile.city === 'Lagos' ? item.onHand : 0, abujaHub: profile.city === 'Abuja' ? item.onHand : 0, phHub: profile.city === 'Port Harcourt' ? item.onHand : 0, kanoHub: profile.city === 'Kano' ? item.onHand : 0, lowStockThreshold: 10, isLowStock: item.onHand <= 10 })));
        const statusMap: Record<string, Order['status']> = { PENDING: 'Processing', PAID: 'Processing', FULFILLING: 'Awaiting Packing', READY_PICKUP: 'Ready for Pickup', SHIPPED: 'In Transit', DELIVERED: 'Delivered', CANCELLED: 'Cancelled', REFUNDED: 'Cancelled' };
        setOrders((dashboard.orders ?? []).map((order: any) => ({ id: order.orderNumber, serverId: order.id, fulfilmentMethod: order.fulfilmentMethod, paymentStatus: order.paymentStatus, serverStatus: order.status, date: new Date(order.createdAt).toLocaleDateString(), status: statusMap[order.status] ?? 'Processing', items: (order.items ?? []).map((item: any) => ({ productId: item.sku, productName: item.productName, brand: '', size: item.size, price: item.priceKobo / 100, quantity: item.quantity, image: '' })), subtotal: order.subtotalKobo / 100, deliveryFee: order.deliveryFeeKobo / 100, total: order.totalKobo / 100, fulfillmentType: 'local', distributorCity: profile.city, trackingSteps: [], shippingAddress: { name: order.shippingAddress?.fullName || order.shippingAddress?.name || '', street: order.shippingAddress?.street || '', city: order.shippingAddress?.city || '', state: order.shippingAddress?.state || '', phone: order.shippingAddress?.phone || '' }, paymentMethod: '', } as Order)));
        setLabShipmentsList((dashboard.transfers ?? []).map((transfer: any) => ({ id: transfer.id, batchNumber: transfer.id, courier: '', trackingNumber: '', destinationHub: profile.city, itemCount: 0, status: transfer.status === 'RECEIVED' ? 'DELIVERED' : transfer.status === 'DISPATCHED' ? 'IN_TRANSIT' : 'PREPARING', dispatchedAt: transfer.dispatchedAt ?? transfer.createdAt, estimatedArrival: transfer.expectedAt ?? transfer.dispatchedAt ?? transfer.createdAt })));
      }).catch(() => { if (!cancelled) { setDistributorLedgerList([]); setDistributorAvailableBalanceNgn(0); setInventoryItemsList([]); setOrders([]); setLabShipmentsList([]); } });
    }
    return () => { cancelled = true; };
  }, [authUser?.id, authUser?.roles.join('|')]);

  useEffect(() => {
    const expired = () => { setAuthUser(null); };
    const check = () => { if (!isPartnerDesignPreview() && document.visibilityState === 'visible') void refreshAuth(true); };
    window.addEventListener('desla:session-expired', expired);
    window.addEventListener('focus', check);
    const timer = window.setInterval(check, 60000);
    return () => { clearInterval(timer); window.removeEventListener('desla:session-expired', expired); window.removeEventListener('focus', check); };
  }, [refreshAuth]);

  const prepareLiveCryptoCheckout = async (
    asset: string,
    network: string,
  ): Promise<CryptoInitDto & { serverOrderId: string; orderNumber: string }> => {
    if (!isOwnedApiConfigured || isPartnerDesignPreview()) {
      const orderNumber = `DES-CRYPTO-${Math.floor(1000 + Math.random() * 9000)}`;
      const mockDeposit = asset === 'BTC' ? 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' : asset === 'SOL' ? '7EYnhQoR9YM3N7UoaKRoA44BW8PYJuYYXibUh1HeQLA' : '0x71C8366420A092679E5486965480201134093B66';
      return {
        paymentId: `crypto-mock-${Date.now()}`,
        reference: `CRYPTO-${orderNumber}`,
        depositAddress: mockDeposit,
        amountNgn: cartTotal > 0 ? cartTotal : Math.max(0, cartSubtotal - (appliedCreator ? Math.round(cartSubtotal * 0.1) : 0) + (cartDeliveryFee || 1500)),
        cryptoAmount: asset === 'BTC' ? '0.00031200' : asset === 'ETH' ? '0.00845000' : asset === 'SOL' ? '0.1250' : '22.500000',
        networkFeeCrypto: asset === 'BTC' ? '0.00005000' : asset === 'ETH' ? '0.00150000' : asset === 'SOL' ? '0.0050' : '1.000000',
        totalCrypto: asset === 'BTC' ? '0.00036200' : asset === 'ETH' ? '0.00995000' : asset === 'SOL' ? '0.1300' : '23.500000',
        asset,
        network,
        expiresInSeconds: 900,
        expiresAt: new Date(Date.now() + 900000).toISOString(),
        attemptId: `att-${Date.now()}`,
        exchangeRateNgn: '1450',
        replay: false,
        qrPayload: `${asset.toLowerCase()}:${mockDeposit}?amount=23.50`,
        status: 'PENDING',
        orderNumber,
        orderId: `ord-mock-${Date.now()}`,
        serverOrderId: `order-mock-${Date.now()}`,
      };
    }

    try {
      if (cartItems.length === 0) throw new Error('Your bag is empty.');
      const email = checkoutAddress.email || userProfile.email;
      const creatorCode = activeCreatorCode || referralCode || undefined;
      const fulfilment = checkoutFulfilment;
      if (!fulfilment || fulfilment.routingKey !== routingKey(cartItems, checkoutAddress.city || selectedCity, checkoutAddress.state, fulfilment.method)) {
        throw new Error('Review delivery or pickup options again before payment.');
      }
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
      if (!liveCheckoutAttempt.current.orderId) {
        await syncCartToServer(cartItems.map((ci) => ({ productId: ci.productId, size: ci.size, quantity: ci.quantity })));
      }
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

      const init = await initCryptoPayment(view.id, asset, network, `${operationKey}:crypto:${asset}:${network}`);
      return { ...init, serverOrderId: view.id, orderNumber: view.orderNumber };
    } catch (e) {
      const message = e instanceof ApiError || e instanceof Error ? e.message : 'Crypto checkout initialization failed.';
      throw new Error(message);
    }
  };

  const confirmLiveCryptoPayment = async (
    paymentId: string,
    txHash?: string,
  ): Promise<{ order: Order; status: string }> => {
    if (!isOwnedApiConfigured || isPartnerDesignPreview()) {
      const localOrder = createOrderFromCart(`Cryptocurrency (${txHash ? 'TX: ' + txHash.slice(0, 10) + '…' : 'Verified'})`, checkoutAddress);
      clearCart();
      return { order: localOrder, status: 'COMPLETED' };
    }

    try {
      const result = await verifyCryptoPayment(paymentId, txHash);
      const serverOrderId = result.orderId;
      const guestToken = liveCheckoutAttempt.current?.guestToken || guestOrderToken(serverOrderId) || undefined;
      const view = await fetchServerOrder(serverOrderId, guestToken);
      if (!view) throw new Error('Could not load settled server order.');
      const local = mapServerOrder(view, cartItems, `Cryptocurrency (${result.status})`);
      rememberServerOrder(local.id, serverOrderId);
      addLocalOrder(local);
      clearCart();
      try { sessionStorage.removeItem('glowly-active-checkout'); } catch { /* ignore */ }
      return { order: local, status: result.status };
    } catch (e) {
      const message = e instanceof ApiError || e instanceof Error ? e.message : 'Verification failed.';
      throw new Error(message);
    }
  };

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
       if (!liveCheckoutAttempt.current.orderId) await flushCart();
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
      setOrders((prev) => [local, ...prev.filter(existing => existing.id !== local.id)]);
      setActiveOrder(local);
      clearCart();
      setLivePayment({ status: 'idle', message: '' });
      setPreviousScreens((prev) => [...prev, currentScreen]);
      setCurrentScreen('order-confirmed');
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

  // Cards subscribe only to these stable actions and their wishlist state.
  const productActions = useMemo(() => ({ addToCart, toggleWishlist, isWishlisted, openQuickModal }), [addToCart, toggleWishlist, isWishlisted, openQuickModal]);

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
        addToCartBatch,
        requestCustomerSignIn,
        cartReady,
        cartError,
        cartSaving,
        retryCart,
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
        authError,
        refreshAuth,
        login,
        loginWithGoogle,
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
        isLiveBackend: isOwnedApiConfigured && !isPartnerDesignPreview(),
        livePayment,
        dismissLivePayment,
        reverifyPayment: (reference: string) => verifyPaymentReturn(reference),
        addLocalOrder,
        prepareLiveCheckout,
        prepareLiveCryptoCheckout,
        confirmLiveCryptoPayment,

        // Storefront & Editorial CMS State
        heroSlides,
        updateHeroSlides,
        heroSettings,
        updateHeroSettings,
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
        refreshAdminCatalogue,
        adminCatalogueProducts,
        publishStorefront,
        deleteProductFromAdmin,
        toggleProductStock,

        // Master Inventory & Logistics
        inventoryItems: inventoryItemsList,
        updateInventoryItems,
        adjustStock,
        transferStock,
        updateStockThreshold,
        stockMovementLogs: stockMovementLogsList,

        // Dynamic Order Pipeline
        updateOrderStatus,

        // Creator Affiliate Studio
        creatorLinks: creatorLinksList,
        createCreatorLink,
        creatorLedger: creatorLedgerList,
        creatorAvailableBalanceNgn,
        requestCreatorPayout,
        creatorPRRequests: creatorPRRequestsList,
        requestPRBox,
        creatorSubmissions: creatorSubmissionsList,
        applyToCampaign,
        submitCampaignDeliverable,
        creatorStorefrontProducts,
        toggleCreatorStorefrontProduct,

        // Distributor City Hub
        distributorLedger: distributorLedgerList,
        distributorAvailableBalanceNgn,
        requestDistributorPayout,
        updateShipmentStatus,
        createLabRestockOrder,
        distributorHubSettings,
        updateDistributorHubSettings
      }}
    >
      <ProductActionsContext.Provider value={productActions}>{children}</ProductActionsContext.Provider>
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

export const useProductActions = () => {
  const context = useContext(ProductActionsContext);
  if (!context) throw new Error('useProductActions must be used within an AppProvider');
  return context;
};
