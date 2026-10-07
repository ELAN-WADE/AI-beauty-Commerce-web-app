import React, { createContext, useCallback, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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
  ProductReview
} from '../types';
import { products as sampleProducts } from '../data/products';
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

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Navigation State with URL deep linking (?screen=..., #..., or pathname)
  const [currentScreen, setCurrentScreen] = useState<ScreenId>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryScreen = params.get('screen') as ScreenId;
      if (queryScreen) return queryScreen;

      const hash = window.location.hash.replace('#', '') as ScreenId;
      if (hash) return hash;

      const path = window.location.pathname.replace(/^\//, '');
      if (path === 'verify-email') return 'verify-email';
      if (path === 'reset-password') return 'reset-password';
      if (path === 'creators' || path === 'creator-studio') return 'creators';
      if (path === 'distributor-portal' || path === 'distributors') return 'distributor-portal';
      if (path === 'admin-console') return 'admin-console';
    }
    return 'home';
  });
  const [previousScreens, setPreviousScreens] = useState<ScreenId[]>([]);
  const liveCheckoutAttempt = useRef<{ fingerprint: string; key: string; guestToken: string; orderId?: string } | null>(null);

  // Products (mock-first paint; upgraded from owned API when VITE_API_URL is set)
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(sampleProducts[0]);

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

  // Cart
  const [cartItems, setCartItems] = useState<CartItem[]>([
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
  ]);

  const [isAddToCartSheetOpen, setIsAddToCartSheetOpen] = useState(false);
  const [lastAddedCartItem, setLastAddedCartItem] = useState<CartItem | null>(null);

  // Wishlist
  const [wishlist, setWishlist] = useState<string[]>([sampleProducts[2].id]);

  // Orders
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeOrder, setActiveOrder] = useState<Order | null>(initialOrders[0] || null);

  // AI Skin Scan
  const [skinProfile, setSkinProfile] = useState<SkinAnalysisResult | null>(null);

  // User Profile & Rewards
  const [userProfile, setUserProfile] = useState<UserProfile>(initialUserProfile);
  const [vouchers, setVouchers] = useState<RewardVoucher[]>(initialVouchers);
  const [pointsActivity, setPointsActivity] = useState<PointsActivity[]>(initialPointsActivity);

  // Fulfillment & Checkout Address State
  const [checkoutAddress, setCheckoutAddress] = useState<CheckoutAddress>({
    fullName: initialUserProfile.name,
    email: initialUserProfile.email,
    phone: initialUserProfile.phone,
    street: 'Plot 742, Aminu Kano Crescent, Wuse 2',
    city: 'Abuja',
    state: 'Abuja FCT',
    deliveryNotes: 'Please ring upon arrival at estate gate.'
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
  const [communityMessages, setCommunityMessages] = useState<CommunityMessage[]>(initialCommunityMessages);
  const [activeCommunityChannel, setActiveCommunityChannel] = useState('all');
  const [unreadCommunityCount, setUnreadCommunityCount] = useState(3);

  // NEW: Distributors Store
  const [distributorsList, setDistributorsList] = useState<Distributor[]>(isOwnedApiConfigured ? [] : initialDistributors);

  // NEW: Creators & Affiliates Store
  const [creatorsList, setCreatorsList] = useState<Creator[]>(isOwnedApiConfigured ? [] : initialCreators);
  const [activeCreatorCode, setActiveCreatorCode] = useState<string | null>(null);
  const [creatorDiscountPercent, setCreatorDiscountPercent] = useState<number>(0);
  const appliedCreator = creatorsList.find((c) => c.promoCode === activeCreatorCode) || null;

  // NEW: Social Community Posts Feed
  const [communityPostsList, setCommunityPostsList] = useState<CommunityPost[]>(initialCommunityPosts);
  // NEW: Customer Reviews Store
  const [reviewsList, setReviewsList] = useState<ProductReview[]>(initialReviews);

  const [isCartBannerDismissed, setIsCartBannerDismissed] = useState(false);

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
    setPreviousScreens((prev) => [...prev, currentScreen]);
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('screen', screen);
        window.history.pushState({ screen }, '', url.toString());
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
          url.searchParams.set('screen', prev);
          window.history.pushState({ screen: prev }, '', url.toString());
        }
      } catch { /* ignore */ }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCurrentScreen('home');
      try {
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('screen');
          window.history.pushState({ screen: 'home' }, '', url.toString());
        }
      } catch { /* ignore */ }
    }
  };

  // Sync browser back/forward buttons with currentScreen
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = (e: PopStateEvent) => {
      const stateScreen = e.state?.screen;
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
  }, []);

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
        prepareLiveCheckout
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
