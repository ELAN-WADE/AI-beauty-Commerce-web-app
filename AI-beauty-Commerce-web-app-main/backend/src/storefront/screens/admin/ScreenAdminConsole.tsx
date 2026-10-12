import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutGrid,
  ShoppingBag,
  CreditCard,
  Boxes,
  ShieldCheck,
  Search,
  Bell,
  ChevronDown,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  MapPin,
  RefreshCw,
  LogOut,
  Settings,
  ExternalLink,
  Filter,
  FileSpreadsheet,
  Building2,
  DollarSign,
  Package,
  Plus,
  Edit2,
  Eye,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Check,
  Truck,
  UserCheck,
  Star,
  Award,
  Share2,
  User,
  HeartPulse,
  MessageSquare,
  Palette,
  Layers,
  Globe,
  Trash2,
  ChevronRight,
  Sliders,
  Gift,
  Video,
  Send
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  AdminOrder,
  AdminTransferClaim,
  AdminInventoryItem,
  AdminAuditLog,
  Product,
  Creator,
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
  LogisticsIncidentTicket
} from '../../types';
import {
  fetchAdminOrders,
  updateAdminOrderStatus,
  fetchAdminTransferClaims,
  confirmAdminTransferClaim,
  fetchAdminAudits,
  fetchInventoryOverview,
  adjustStockApi,
  isOwnedApiConfigured
} from '../../lib/owned-api';
import { NetworkPanel } from '../../components/admin/NetworkPanel';
import { ProductDrawer } from '../../components/admin/ProductDrawer';
import { products as initialProducts } from '../../data/products';
import { categories as initialCategories } from '../../data/categories';
import { creators as initialCreators } from '../../data/creators';
import { reviews as initialReviews } from '../../data/reviews';

interface CreatorApplication {
  id: string;
  name: string;
  handle: string;
  platform: 'Instagram' | 'TikTok' | 'YouTube';
  followers: string;
  niche: string;
  city: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedAt: string;
}

interface CustomerProfileSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  totalSpentNgn: number;
  ordersCount: number;
  skinType: string;
  concerns: string[];
  loyaltyPoints: number;
  tier: 'Gold' | 'Platinum' | 'Diamond';
  lastActive: string;
}

interface SkinScanRecord {
  id: string;
  customerName: string;
  email: string;
  timestamp: string;
  fitzpatrick: string;
  hydrationPercent: number;
  barrierHealthScore: number;
  primaryConcern: string;
  recommendedRoutine: string;
}

export const ScreenAdminConsole: React.FC = () => {
  const {
    authUser,
    navigateTo,
    logout,
    isLiveBackend,
    isPreviewMode,
    products: appProducts,
    saveProductFromAdmin,
    deleteProductFromAdmin,
    toggleProductStock,
    heroSlides,
    updateHeroSlides,
    routineSteps,
    updateRoutineSteps,
    brandStory,
    updateBrandStory,
    announcementTicker,
    updateAnnouncementTicker,
    categories: appCategories,
    addCategory,
    deleteCategory,
    prBoxes,
    updatePRBoxes,
    addPRBox,
    creatorCampaigns,
    updateCreatorCampaigns,
    addCreatorCampaign,
    wholesaleCartons,
    updateWholesaleCartons,
    labShipments,
    updateLabShipments,
    addLabShipment,
    incidentTickets,
    resolveIncidentTicket
  } = useApp();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'products'
    | 'cms'
    | 'orders'
    | 'creators'
    | 'customers'
    | 'inventory'
    | 'claims'
    | 'audit'
    | 'network'
  >('overview');

  // Chart range toggle in Overview
  const [chartRange, setChartRange] = useState<'monthly' | 'annually'>('monthly');

  // Products state & modal
  const [isProductDrawerOpen, setIsProductDrawerOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [productStatusFilter, setProductStatusFilter] = useState<'ALL' | 'LIVE' | 'LOW_STOCK' | 'BESTSELLER' | 'FLASH_SALE'>('ALL');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // CMS Sub-Tabs
  const [cmsSubTab, setCmsSubTab] = useState<'hero' | 'routine' | 'story' | 'ticker'>('hero');
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [newSlideForm, setNewSlideForm] = useState<Partial<HeroSlide>>({
    headline: '',
    subtext: '',
    tag: 'Clinical Formulation',
    image: '/hero_slide_1.jpg',
    actionLabel: 'Shop Formulations',
    actionRoute: 'catalogue',
    secondaryActionText: 'AI Skin Scan',
    secondaryRoute: 'ai-scan'
  });

  // Creator state
  const [creatorsList, setCreatorsList] = useState<Creator[]>(initialCreators);
  const [creatorApps, setCreatorApps] = useState<CreatorApplication[]>([
    {
      id: 'app-01',
      name: 'Dr. Chioma Ike',
      handle: '@dermatology_chi',
      platform: 'Instagram',
      followers: '84.5K',
      niche: 'Clinical Barrier Repair & Hyperpigmentation',
      city: 'Lagos Island',
      status: 'PENDING',
      appliedAt: '2 hours ago'
    },
    {
      id: 'app-02',
      name: 'Kenzy Glam',
      handle: '@kenzy_artistry',
      platform: 'TikTok',
      followers: '120K',
      niche: 'Editorial Melanin Makeup & Glow Prep',
      city: 'Abuja (Maitama)',
      status: 'PENDING',
      appliedAt: 'Yesterday'
    }
  ]);
  const [payingCreatorId, setPayingCreatorId] = useState<string | null>(null);

  // Creator Sub-Workspace & PR Gifting Suite
  const [creatorSubTab, setCreatorSubTab] = useState<'roster' | 'applications' | 'pr_boxes' | 'campaigns' | 'ugc'>('roster');
  const [prTrackingInput, setPrTrackingInput] = useState<Record<string, string>>({});
  const [isAddPRBoxModalOpen, setIsAddPRBoxModalOpen] = useState(false);
  const [newPRBoxForm, setNewPRBoxForm] = useState({
    title: '',
    category: 'Clinical PR Gifting',
    retailValue: '₦125,000',
    spotsLeft: 10,
    thumbnail: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
    description: 'Curated clinical collection for editorial content creators.',
    includedProducts: 'Radiant Glow Oil, Melanin Defense SPF 50+, Amino Cleanser',
    eligibleTiers: ['Verified', 'Icon'] as ('Rising' | 'Verified' | 'Icon')[]
  });
  const [isAddCampaignModalOpen, setIsAddCampaignModalOpen] = useState(false);
  const [newCampaignForm, setNewCampaignForm] = useState({
    title: '',
    category: 'Seasonal Campaign',
    commissionRate: '15%',
    bonus: '+₦30,000',
    deadline: 'May 30, 2026',
    description: 'Create high-fidelity 4K editorial content showcasing barrier health.',
    heroImage: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80',
    deliverables: '1 4K Reel + 2 Stories + Link in Bio',
    slots: '10 Spots Remaining',
    status: 'ACTIVE' as 'ACTIVE' | 'DRAFT' | 'COMPLETED'
  });
  const [prRequests, setPrRequests] = useState<{
    id: string;
    creatorName: string;
    creatorHandle: string;
    creatorTier: 'Rising' | 'Verified' | 'Icon';
    boxTitle: string;
    shippingAddress: string;
    requestedAt: string;
    status: 'PENDING' | 'DISPATCHED' | 'DELIVERED';
    courier?: string;
    trackingNumber?: string;
  }[]>([
    {
      id: 'pr-req-01',
      creatorName: 'Amara Nnadi',
      creatorHandle: '@amara_luxe',
      creatorTier: 'Verified',
      boxTitle: 'Radiant Glow Clinical Collection',
      shippingAddress: 'Plot 12 Admiralty Way, Lekki Phase 1, Lagos',
      requestedAt: '3 hours ago',
      status: 'PENDING',
      courier: 'GIG Logistics',
      trackingNumber: 'GIG-NG-889104'
    },
    {
      id: 'pr-req-02',
      creatorName: 'Kenzy Glam',
      creatorHandle: '@kenzy_artistry',
      creatorTier: 'Icon',
      boxTitle: 'Melanin Barrier Kit',
      shippingAddress: '14 Mississippi St, Maitama, Abuja',
      requestedAt: 'Yesterday',
      status: 'DISPATCHED',
      courier: 'DHL Express Nigeria',
      trackingNumber: 'DHL-ABJ-449102'
    }
  ]);
  const [ugcSubmissions, setUgcSubmissions] = useState<{
    id: string;
    creatorName: string;
    creatorHandle: string;
    title: string;
    category: string;
    thumbnail: string;
    duration: string;
    productsTagged: string[];
    submittedAt: string;
    status: 'PENDING' | 'APPROVED' | 'FLAGGED';
    featuredOnPDP: boolean;
  }[]>([
    {
      id: 'ugc-01',
      creatorName: 'Amara Nnadi',
      creatorHandle: '@amara_luxe',
      title: 'Glass Skin Melanin Morning Barrier Routine',
      category: 'Clinical Hydration',
      thumbnail: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80',
      duration: '0:58',
      productsTagged: ['Radiant Glow Clinical Oil', 'Bio-Active Barrier Cream'],
      submittedAt: 'Today, 10:14 AM',
      status: 'APPROVED',
      featuredOnPDP: true
    },
    {
      id: 'ugc-02',
      creatorName: 'Kenzy Glam',
      creatorHandle: '@kenzy_artistry',
      title: 'No-White-Cast Melanin SPF 50 Prep for Shoot Day',
      category: 'Sun & Climate Defense',
      thumbnail: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
      duration: '1:15',
      productsTagged: ['Melanin Defense SPF 50+'],
      submittedAt: 'Yesterday',
      status: 'PENDING',
      featuredOnPDP: false
    }
  ]);

  // Customers & Reviews state
  const [customerReviews, setCustomerReviews] = useState<ProductReview[]>(initialReviews);
  const [customersList] = useState<CustomerProfileSummary[]>([
    {
      id: 'cust-01',
      name: 'Amina Bello',
      email: 'amina.bello@example.com',
      phone: '+234 803 234 5678',
      city: 'Lagos (Ikeja)',
      totalSpentNgn: 148500,
      ordersCount: 4,
      skinType: 'Combination',
      concerns: ['Hyperpigmentation', 'Moisture Barrier'],
      loyaltyPoints: 1250,
      tier: 'Platinum',
      lastActive: '12 mins ago'
    },
    {
      id: 'cust-02',
      name: 'Emeka Okafor',
      email: 'emeka.okafor@example.com',
      phone: '+234 812 987 6543',
      city: 'Abuja (Wuse II)',
      totalSpentNgn: 89000,
      ordersCount: 2,
      skinType: 'Oily',
      concerns: ['Harmattan Dehydration', 'Uneven Texture'],
      loyaltyPoints: 680,
      tier: 'Gold',
      lastActive: '34 mins ago'
    },
    {
      id: 'cust-03',
      name: 'Nana Poku',
      email: 'nana.poku@example.com',
      phone: '+233 24 123 4567',
      city: 'Accra (Airport Residential)',
      totalSpentNgn: 210000,
      ordersCount: 5,
      skinType: 'Fitzpatrick V',
      concerns: ['Dullness', 'Barrier Repair'],
      loyaltyPoints: 2100,
      tier: 'Diamond',
      lastActive: '1 hr ago'
    },
    {
      id: 'cust-04',
      name: 'Folake Adeleke',
      email: 'folake.ade@example.com',
      phone: '+234 802 333 4444',
      city: 'Port Harcourt (GRA)',
      totalSpentNgn: 112000,
      ordersCount: 3,
      skinType: 'Dry',
      concerns: ['Moisture Loss', 'Fine Lines'],
      loyaltyPoints: 940,
      tier: 'Platinum',
      lastActive: '4 hrs ago'
    }
  ]);

  const [skinScanLogs] = useState<SkinScanRecord[]>([
    {
      id: 'scan-101',
      customerName: 'Amina Bello',
      email: 'amina.bello@example.com',
      timestamp: 'Today, 08:30 AM',
      fitzpatrick: 'Type V',
      hydrationPercent: 42,
      barrierHealthScore: 68,
      primaryConcern: 'Compromised Moisture Barrier',
      recommendedRoutine: '01 Cleanse -> 03 Barrier Cream -> 04 SPF50+'
    },
    {
      id: 'scan-102',
      customerName: 'Folake Adeleke',
      email: 'folake.ade@example.com',
      timestamp: 'Yesterday, 14:15 PM',
      fitzpatrick: 'Type VI',
      hydrationPercent: 35,
      barrierHealthScore: 54,
      primaryConcern: 'Harmattan Dehydration & Flaking',
      recommendedRoutine: '01 Milky Cleanse -> 02 Azelaic Elixir -> 03 Whipped Shea'
    }
  ]);

  // Orders State
  const [ordersViewMode, setOrdersViewMode] = useState<'all' | 'delivery_requests'>('all');
  const [orders, setOrders] = useState<AdminOrder[]>([
    {
      id: 'ord-101',
      orderNumber: 'DES-829104',
      createdAt: '12 mins ago',
      status: 'PROCESSING',
      paymentStatus: 'PAID',
      totalKobo: 3850000,
      totalNgn: 38500,
      customerEmail: 'amina.bello@example.com',
      customerName: 'Amina Bello',
      customerCity: 'Lagos (Ikeja Hub)',
      itemsCount: 3,
      fulfillmentType: 'local'
    },
    {
      id: 'ord-102',
      orderNumber: 'DES-829103',
      createdAt: '34 mins ago',
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      totalKobo: 1420000,
      totalNgn: 14200,
      customerEmail: 'emeka.okafor@example.com',
      customerName: 'Emeka Okafor',
      customerCity: 'Abuja (Wuse Hub)',
      itemsCount: 1,
      fulfillmentType: 'local'
    },
    {
      id: 'ord-103',
      orderNumber: 'DES-829102',
      createdAt: '1 hr ago',
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      totalKobo: 2700000,
      totalNgn: 27000,
      customerEmail: 'nana.poku@example.com',
      customerName: 'Nana Poku',
      customerCity: 'Accra (Airport Hub)',
      itemsCount: 2,
      fulfillmentType: 'central'
    },
    {
      id: 'ord-104',
      orderNumber: 'DES-829101',
      createdAt: '2 hrs ago',
      status: 'SHIPPED',
      paymentStatus: 'PAID',
      totalKobo: 4900000,
      totalNgn: 49000,
      customerEmail: 'folake.ade@example.com',
      customerName: 'Folake Adeleke',
      customerCity: 'Port Harcourt (GRA Hub)',
      itemsCount: 4,
      fulfillmentType: 'local'
    }
  ]);
  const [orderUpdatingId, setOrderUpdatingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // NIP Bank Transfer Claims
  const [transferClaims, setTransferClaims] = useState<AdminTransferClaim[]>([
    {
      id: 'clm-01',
      orderId: 'ord-102',
      orderNumber: 'DES-829103',
      senderName: 'Emeka Okafor',
      bankName: 'Guaranty Trust Bank (GTCO)',
      amountKobo: 1420000,
      amountNgn: 14200,
      narration: 'NIP/GTB/DES-829103/OKA-EMEK',
      status: 'PENDING',
      createdAt: '30 mins ago'
    },
    {
      id: 'clm-02',
      orderId: 'ord-101',
      orderNumber: 'DES-829104',
      senderName: 'Amina Bello',
      bankName: 'Access Bank Plc',
      amountKobo: 3850000,
      amountNgn: 38500,
      narration: 'TXN:98129038 AMINA BELLO BEAUTY',
      status: 'APPROVED',
      createdAt: '1 hr ago',
      reviewedBy: 'Central Finance Lead',
      reviewedAt: '45 mins ago'
    }
  ]);
  const [claimProcessingId, setClaimProcessingId] = useState<string | null>(null);

  // Regional Hub Inventory Matrix
  const [inventoryItems, setInventoryItems] = useState<AdminInventoryItem[]>([
    {
      id: 'inv-1',
      sku: 'DES-RGO-100',
      productName: 'Radiant Glow Clinical Oil (100ml)',
      category: 'Body Care',
      centralStock: 380,
      lagosHub: 120,
      abujaHub: 95,
      phHub: 45,
      kanoHub: 28,
      lowStockThreshold: 20,
      isLowStock: false
    },
    {
      id: 'inv-2',
      sku: 'DES-GPC-200',
      productName: 'Gentle Purifying Amino Cleanser (200ml)',
      category: 'Skincare',
      centralStock: 240,
      lagosHub: 80,
      abujaHub: 65,
      phHub: 18,
      kanoHub: 22,
      lowStockThreshold: 20,
      isLowStock: true
    },
    {
      id: 'inv-3',
      sku: 'DES-SUN-50',
      productName: 'Melanin Defense Sun Shield SPF 50+',
      category: 'Skincare',
      centralStock: 490,
      lagosHub: 160,
      abujaHub: 140,
      phHub: 60,
      kanoHub: 40,
      lowStockThreshold: 25,
      isLowStock: false
    }
  ]);

  // Security Audit Logs
  const [auditLogs] = useState<AdminAuditLog[]>([
    {
      id: 'aud-1',
      timestamp: '10 mins ago',
      action: 'NIP Claim Approved',
      actor: 'Selena Thorne',
      role: 'SUPER_ADMIN',
      details: 'Approved ₦38,500 manual transfer claim for Order #DES-829104 (Access Bank)',
      ipAddress: '102.89.44.12'
    },
    {
      id: 'aud-2',
      timestamp: '45 mins ago',
      action: 'Stock Allocation Updated',
      actor: 'System Automation',
      role: 'LOGISTICS_SERVICE',
      details: 'Dispatched 50 units SPF 50+ to Abuja Wuse 2 Distribution Hub',
      ipAddress: '197.210.65.8'
    },
    {
      id: 'aud-3',
      timestamp: '2 hours ago',
      action: 'Catalog Formulation Edited',
      actor: 'Dr. Alabi',
      role: 'FORMULATION_DIRECTOR',
      details: 'Updated active percentage on Azelaic Elixir (10% bio-ferment)',
      ipAddress: '105.112.98.41'
    }
  ]);

  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // PRODUCTS FILTERING & HANDLERS
  // --------------------------------------------------------------------------
  const productsList = appProducts.length > 0 ? appProducts : initialProducts;

  const filteredProducts = useMemo(() => {
    return productsList.filter((p) => {
      const searchMatch =
        !productSearch.trim() ||
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.subCategory?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.hashtag?.toLowerCase().includes(productSearch.toLowerCase());

      const catMatch =
        productCategoryFilter === 'ALL' ||
        p.category === productCategoryFilter ||
        p.category.toLowerCase().includes(productCategoryFilter.toLowerCase());

      let statusMatch = true;
      if (productStatusFilter === 'LIVE') statusMatch = p.inStock;
      else if (productStatusFilter === 'LOW_STOCK') statusMatch = (p.stockCount ?? 0) < 25;
      else if (productStatusFilter === 'BESTSELLER') statusMatch = !!p.isBestseller;
      else if (productStatusFilter === 'FLASH_SALE') statusMatch = !!p.isFlashSale;

      return searchMatch && catMatch && statusMatch;
    });
  }, [productsList, productSearch, productCategoryFilter, productStatusFilter]);

  const handleOpenCreateProduct = () => {
    setSelectedProductForEdit(null);
    setIsProductDrawerOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setSelectedProductForEdit(prod);
    setIsProductDrawerOpen(true);
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      await saveProductFromAdmin(productData);
      setActionNotice(`Formulation saved: ${productData.name || 'Untitled'}`);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      setActionNotice(`Error saving formulation: ${err.message || 'Unknown error'}`);
    }
  };

  const handleToggleProductStock = (id: string) => {
    toggleProductStock(id);
    setActionNotice('Catalog stock availability toggled.');
    setTimeout(() => setActionNotice(null), 2500);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to remove this formulation from the catalog?')) {
      deleteProductFromAdmin(id);
      setActionNotice('Formulation removed from catalog.');
      setTimeout(() => setActionNotice(null), 2500);
    }
  };

  // Add Category Handler
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatSlug.trim()) return;
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      slug: newCatSlug.trim().toLowerCase().replace(/\s+/g, '-'),
      itemCount: 0,
      image: '/cat_skincare.jpg',
      description: newCatDesc.trim() || 'Clinical formulation category.',
      isFeatured: true
    };
    addCategory(newCat);
    setNewCatName('');
    setNewCatSlug('');
    setNewCatDesc('');
    setIsCategoryModalOpen(false);
    setActionNotice(`Category added: ${newCat.name}`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // --------------------------------------------------------------------------
  // ORDER STATUS CHANGE
  // --------------------------------------------------------------------------
  const handleStatusChange = async (orderId: string, newStatus: AdminOrder['status']) => {
    setOrderUpdatingId(orderId);
    setActionNotice(null);
    try {
      if (isOwnedApiConfigured && !isPreviewMode) {
        await updateAdminOrderStatus(orderId, newStatus);
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      setActionNotice(`Order status updated to ${newStatus}.`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch {
      setActionNotice('Failed to update status on server.');
    } finally {
      setOrderUpdatingId(null);
    }
  };

  // Claim Review
  const handleReviewClaim = async (claimId: string, approved: boolean) => {
    setClaimProcessingId(claimId);
    setActionNotice(null);
    try {
      if (isOwnedApiConfigured && !isPreviewMode) {
        await confirmAdminTransferClaim(claimId, approved, approved ? 'Verified via bank portal' : 'Payment not matched');
      }
      setTransferClaims((prev) =>
        prev.map((c) =>
          c.id === claimId
            ? { ...c, status: approved ? 'APPROVED' : 'REJECTED', reviewedBy: 'Selena Thorne' }
            : c
        )
      );
      setActionNotice(approved ? 'Bank transfer claim APPROVED. Order marked as PAID.' : 'Bank claim REJECTED.');
      setTimeout(() => setActionNotice(null), 3500);
    } catch {
      setActionNotice('Failed to process claim.');
    } finally {
      setClaimProcessingId(null);
    }
  };

  // Creator App Review
  const handleReviewCreatorApp = (appId: string, approved: boolean) => {
    setCreatorApps((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: approved ? 'APPROVED' : 'REJECTED' } : app))
    );
    if (approved) {
      const app = creatorApps.find((a) => a.id === appId);
      if (app) {
        const promoCode = app.name.split(' ')[0].toUpperCase() + '10';
        setCreatorsList((prev) => [
          ...prev,
          {
            id: `creator-${Date.now()}`,
            name: app.name,
            handle: app.handle,
            tier: 'Verified Partner',
            followers: app.followers,
            commissionRate: 15,
            promoCode,
            totalSalesNgn: 0,
            commissionEarnedNgn: 0,
            totalSales: 0,
            earnings: 0,
            status: 'active'
          } as any
        ]);
        setActionNotice(`Creator approved with promo code ${promoCode} and 15% commission.`);
      }
    } else {
      setActionNotice('Creator application marked as declined.');
    }
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handlePayCreator = (creatorId: string) => {
    setPayingCreatorId(creatorId);
    setTimeout(() => {
      setPayingCreatorId(null);
      setCreatorsList((prev) =>
        prev.map((c) => (c.id === creatorId ? { ...c, commissionEarnedNgn: 0, earnings: 0 } : c))
      );
      setActionNotice('Creator commission payout initiated via NIP.');
      setTimeout(() => setActionNotice(null), 3000);
    }, 1200);
  };

  // Creator PR Package Dispatch
  const handleDispatchPRRequest = (reqId: string) => {
    const tracking = prTrackingInput[reqId] || `GIG-NG-${Math.floor(100000 + Math.random() * 900000)}`;
    setPrRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? { ...r, status: 'DISPATCHED', courier: 'GIG Logistics Express', trackingNumber: tracking }
          : r
      )
    );
    setActionNotice(`PR Box dispatched with tracking: ${tracking}`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Create PR Box Offering Handler
  const handleCreatePRBox = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPRBoxForm.title.trim()) return;
    addPRBox({
      id: 'pr-box-' + Date.now(),
      title: newPRBoxForm.title.trim(),
      category: newPRBoxForm.category,
      retailValue: newPRBoxForm.retailValue,
      openSpots: `${newPRBoxForm.spotsLeft} Spots`,
      spotsLeft: Number(newPRBoxForm.spotsLeft),
      thumbnail: newPRBoxForm.thumbnail,
      description: newPRBoxForm.description,
      includedProducts: newPRBoxForm.includedProducts.split(',').map((p) => p.trim()),
      eligibleTiers: newPRBoxForm.eligibleTiers,
      isActive: true
    });
    setIsAddPRBoxModalOpen(false);
    setNewPRBoxForm({
      title: '',
      category: 'Clinical PR Gifting',
      retailValue: '₦125,000',
      spotsLeft: 10,
      thumbnail: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
      description: 'Curated clinical collection for editorial content creators.',
      includedProducts: 'Radiant Glow Oil, Melanin Defense SPF 50+, Amino Cleanser',
      eligibleTiers: ['Verified', 'Icon']
    });
    setActionNotice('New PR Gift Box published to Creator Press Room.');
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Create Creator Campaign Brief Handler
  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignForm.title.trim()) return;
    addCreatorCampaign({
      id: 'camp-' + Date.now(),
      title: newCampaignForm.title.trim(),
      category: newCampaignForm.category,
      commissionRate: newCampaignForm.commissionRate,
      bonus: newCampaignForm.bonus,
      deadline: newCampaignForm.deadline,
      description: newCampaignForm.description,
      heroImage: newCampaignForm.heroImage,
      deliverables: newCampaignForm.deliverables.split('+').map((d) => d.trim()),
      slots: newCampaignForm.slots,
      status: newCampaignForm.status
    });
    setIsAddCampaignModalOpen(false);
    setNewCampaignForm({
      title: '',
      category: 'Seasonal Campaign',
      commissionRate: '15%',
      bonus: '+₦30,000',
      deadline: 'May 30, 2026',
      description: 'Create high-fidelity 4K editorial content showcasing barrier health.',
      heroImage: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80',
      deliverables: '1 4K Reel + 2 Stories + Link in Bio',
      slots: '10 Spots Remaining',
      status: 'ACTIVE'
    });
    setActionNotice('New Brand Campaign brief published to Creator Press Room.');
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Creator UGC Routine Moderation
  const handleModerateUGC = (id: string, action: 'approve' | 'flag') => {
    setUgcSubmissions((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              status: action === 'approve' ? 'APPROVED' : 'FLAGGED',
              featuredOnPDP: action === 'approve'
            }
          : u
      )
    );
    setActionNotice(action === 'approve' ? 'UGC approved & featured on Storefront PDP.' : 'UGC content flagged.');
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Review Moderation
  const handleModerateReview = (reviewId: string, approve: boolean) => {
    setCustomerReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId ? { ...r, verifiedPurchase: approve } : r
      )
    );
    setActionNotice(approve ? 'Review approved for PDP display.' : 'Review flagged.');
    setTimeout(() => setActionNotice(null), 2500);
  };

  // Filtered orders
  const displayedOrders = orders.filter((o) => {
    if (ordersViewMode === 'delivery_requests') {
      return o.fulfillmentType === 'local' && o.status !== 'DELIVERED';
    }
    if (filterStatus === 'ALL') return true;
    return o.status === filterStatus;
  });

  const pendingClaimsCount = transferClaims.filter((c) => c.status === 'PENDING').length;
  const pendingCreatorAppsCount = creatorApps.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F0F10] font-body flex selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      {/* ======================================================== */}
      {/* 1. LEFT MINIMALIST ICON DOCK                              */}
      {/* ======================================================== */}
      <aside className="hidden lg:flex flex-col items-center justify-between w-20 m-4 py-6 bg-white border border-[#EAE8E3] rounded-3xl shadow-[0_4px_24px_rgba(15,15,16,0.04)] z-20">
        <div className="flex flex-col items-center gap-6">
          {/* Brand Monogram */}
          <button
            onClick={() => navigateTo('home')}
            title="Return to Storefront"
            className="w-11 h-11 rounded-2xl bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center font-heading font-black text-lg border border-[#D4AF37]/30 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            D!
          </button>

          {/* Navigation Icon List */}
          <nav className="flex flex-col items-center gap-2.5">
            {[
              { id: 'overview', icon: LayoutGrid, label: 'Overview' },
              { id: 'products', icon: Package, label: 'Formulations & Taxonomy', badge: productsList.length },
              { id: 'cms', icon: Palette, label: 'Editorial CMS' },
              { id: 'orders', icon: ShoppingBag, label: 'Orders & Dispatch', badge: orders.filter((o) => o.status === 'PENDING').length },
              { id: 'creators', icon: Sparkles, label: 'Creator Press Room', badge: pendingCreatorAppsCount },
              { id: 'customers', icon: UserCheck, label: 'Customer Intelligence' },
              { id: 'inventory', icon: Boxes, label: 'Logistics & Wholesale' },
              { id: 'network', icon: Building2, label: 'Distributor Hubs' },
              { id: 'claims', icon: CreditCard, label: 'NIP Claims', badge: pendingClaimsCount },
              { id: 'audit', icon: ShieldCheck, label: 'Security & Audit' }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  title={tab.label}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center relative transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#0F0F10] text-[#D4AF37] shadow-sm'
                      : 'text-[#71717A] hover:bg-[#FAF9F6] hover:text-[#0F0F10]'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[1.8]" />
                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#0F0F10] text-[#D4AF37] border border-[#EAE8E3] text-[9px] font-mono font-bold flex items-center justify-center">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Utility Controls */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => navigateTo('home')}
            title="Storefront Preview"
            className="w-10 h-10 rounded-2xl text-[#71717A] hover:text-[#0F0F10] hover:bg-[#FAF9F6] flex items-center justify-center transition-colors cursor-pointer"
          >
            <Globe className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              logout();
              navigateTo('home');
            }}
            title="Sign Out"
            className="w-10 h-10 rounded-2xl text-[#71717A] hover:text-[#0F0F10] hover:bg-black/5 flex items-center justify-center transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MAIN WORKSPACE CONTAINER                               */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
        {/* TOP HEADER BAR */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono tracking-widest text-[#997A2E] uppercase font-bold">
                Administrative Control Console
              </span>
              <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-white border border-[#EAE8E3] text-[#0F0F10]">
                {isLiveBackend ? 'Live Backend Connected' : 'Staff Sandbox Workspace'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold tracking-tight text-[#0F0F10]">
              Delsla!™ Central Operations
            </h1>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Quick Export CSV */}
            <button
              onClick={() => alert('Exporting live operational ledger to CSV…')}
              className="px-4 py-2 rounded-full bg-white border border-[#EAE8E3] hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] shadow-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#0F0F10]" />
              <span>Export CSV</span>
            </button>

            {/* Quick Add Formulation (Opens Centered Modal) */}
            <button
              onClick={handleOpenCreateProduct}
              className="px-4 py-2 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold shadow-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>+ New Formulation</span>
            </button>

            {/* Manage Categories */}
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-4 py-2 rounded-full bg-white border border-[#EAE8E3] hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] shadow-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-[#997A2E]" />
              <span>Taxonomy ({appCategories.length})</span>
            </button>
          </div>
        </header>

        {/* Global Toast Action Notice */}
        {actionNotice && (
          <div className="mb-5 p-3 rounded-2xl bg-[#0F0F10] text-white text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in duration-200 border border-[#D4AF37]/30">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" /> {actionNotice}
            </span>
            <button onClick={() => setActionNotice(null)} className="text-[#9CA3AF] hover:text-white text-xs cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Pills for Mobile / Tablet View */}
        <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'products', label: `Catalog (${productsList.length})` },
            { id: 'cms', label: 'Editorial CMS' },
            { id: 'orders', label: `Orders (${orders.length})` },
            { id: 'creators', label: `Creators (${creatorsList.length})` },
            { id: 'customers', label: `Customers (${customersList.length})` },
            { id: 'inventory', label: 'Logistics Matrix' },
            { id: 'claims', label: `Claims (${pendingClaimsCount})` },
            { id: 'network', label: 'Partner Network' },
            { id: 'audit', label: 'Security Audit' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#0F0F10] text-[#D4AF37] shadow-xs'
                  : 'bg-white text-[#71717A] border border-[#EAE8E3]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ======================================================== */}
        {/* WORKSPACE 1: EXECUTIVE OVERVIEW                           */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
            {/* Left 4 Cols: Obsidian Vault Card & Liquidity */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="relative rounded-3xl p-6 bg-[#0F0F10] text-white shadow-xl overflow-hidden border border-[#D4AF37]/30">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col justify-between h-48">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-heading font-black tracking-wider text-[#D4AF37]">
                        DELSLA!™ VAULT
                      </span>
                      <span className="text-[9.5px] font-mono bg-white/10 px-2 py-0.5 rounded-full border border-white/10 text-white/90">
                        NAFDAC TIER-1
                      </span>
                    </div>
                    <span className="font-heading font-bold tracking-widest text-sm text-[#D4AF37]">
                      RESERVE
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-6 rounded bg-gradient-to-r from-[#D4AF37] to-[#E6CA65] border border-amber-300 shadow-xs" />
                    <span className="text-[11px] font-mono text-[#D4AF37]/90 tracking-wider">
                      •••• 909090
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <span className="block text-[10px] uppercase font-mono text-white/60">
                        Settled Net Volume
                      </span>
                      <span className="text-2xl font-mono font-bold tracking-tight text-white">
                        ₦28,495,200
                      </span>
                    </div>
                    <span className="text-[10px] font-mono bg-white/10 px-2.5 py-1 rounded-full border border-white/10 text-[#D4AF37]">
                      WAT LIVE
                    </span>
                  </div>
                </div>
              </div>

              {/* Inflow Channels */}
              <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-heading font-bold text-[#0F0F10]">
                    Inflow Channels
                  </h3>
                  <span className="text-[10px] font-mono text-[#71717A]">Rolling 30 Days</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3]">
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-4 h-4 text-[#0F0F10]" />
                      <span className="font-medium text-[#0F0F10]">Paystack / Cards</span>
                    </div>
                    <span className="font-mono font-bold text-[#0F0F10]">₦19,420,000</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3]">
                    <div className="flex items-center gap-2.5">
                      <Building2 className="w-4 h-4 text-[#0F0F10]" />
                      <span className="font-medium text-[#0F0F10]">NIP Bank Transfers</span>
                    </div>
                    <span className="font-mono font-bold text-[#0F0F10]">₦6,850,200</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3]">
                    <div className="flex items-center gap-2.5">
                      <Truck className="w-4 h-4 text-[#0F0F10]" />
                      <span className="font-medium text-[#0F0F10]">Hub Cash on Delivery</span>
                    </div>
                    <span className="font-mono font-bold text-[#0F0F10]">₦2,225,000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 8 Cols: Sales Velocity & Ledger */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Stat Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs">
                  <span className="text-[10px] font-mono uppercase text-[#71717A] block">Gross Sales</span>
                  <span className="text-xl font-heading font-extrabold text-[#0F0F10] mt-1 block">
                    ₦32.6M
                  </span>
                  <span className="text-[10px] font-mono text-[#0F0F10] flex items-center gap-1 mt-0.5">
                    <TrendingUp className="w-3 h-3 text-[#D4AF37]" /> +18.4% MoM
                  </span>
                </div>

                <div className="p-4 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs">
                  <span className="text-[10px] font-mono uppercase text-[#71717A] block">Active Orders</span>
                  <span className="text-xl font-heading font-extrabold text-[#0F0F10] mt-1 block">
                    {orders.length}
                  </span>
                  <span className="text-[10px] font-mono text-[#71717A]">
                    {orders.filter((o) => o.status === 'PENDING').length} awaiting courier
                  </span>
                </div>

                <div className="p-4 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs">
                  <span className="text-[10px] font-mono uppercase text-[#71717A] block">Active Creators</span>
                  <span className="text-xl font-heading font-extrabold text-[#0F0F10] mt-1 block">
                    {creatorsList.length}
                  </span>
                  <span className="text-[10px] font-mono text-[#71717A]">
                    {pendingCreatorAppsCount} apps pending
                  </span>
                </div>

                <div className="p-4 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs">
                  <span className="text-[10px] font-mono uppercase text-[#71717A] block">NIP Claims</span>
                  <span className="text-xl font-heading font-extrabold text-[#0F0F10] mt-1 block">
                    {pendingClaimsCount}
                  </span>
                  <span className="text-[10px] font-mono text-[#0F0F10]">
                    Verification queue
                  </span>
                </div>
              </div>

              {/* Sales Velocity Chart */}
              <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                      Transaction Velocity
                    </h3>
                    <p className="text-xs text-[#71717A]">
                      Multi-channel sales performance across Lagos, Abuja, Port Harcourt & Accra.
                    </p>
                  </div>

                  <div className="flex items-center gap-1 p-1 rounded-full bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-mono">
                    <button
                      onClick={() => setChartRange('monthly')}
                      className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                        chartRange === 'monthly' ? 'bg-[#0F0F10] text-[#D4AF37] font-bold' : 'text-[#71717A]'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setChartRange('annually')}
                      className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                        chartRange === 'annually' ? 'bg-[#0F0F10] text-[#D4AF37] font-bold' : 'text-[#71717A]'
                      }`}
                    >
                      Annually
                    </button>
                  </div>
                </div>

                {/* Minimalist SVG Curve */}
                <div className="h-36 w-full my-3">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="velocityGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,80 Q50,30 100,55 T200,35 T300,60 T400,20 L400,100 L0,100 Z"
                      fill="url(#velocityGrad)"
                    />
                    <path
                      d="M0,80 Q50,30 100,55 T200,35 T300,60 T400,20"
                      fill="none"
                      stroke="#0F0F10"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A] pt-2 border-t border-[#EAE8E3]">
                  <span>WK 01</span>
                  <span>WK 02</span>
                  <span>WK 03</span>
                  <span>WK 04</span>
                  <span className="font-bold text-[#0F0F10]">CURRENT RUN RATE: ₦1.08M / DAY</span>
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                    Recent Order Dispatches
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-mono font-bold text-[#0F0F10] hover:text-[#997A2E] flex items-center gap-1 cursor-pointer"
                  >
                    View All Orders <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-[#EAE8E3]">
                  {orders.slice(0, 3).map((ord) => (
                    <div key={ord.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-[#0F0F10]">#{ord.orderNumber}</span>
                        <span className="text-[#71717A] ml-2">{ord.customerName}</span>
                        <span className="block text-[10px] text-[#71717A] font-mono">{ord.customerCity}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-[#0F0F10] block">₦{(ord.totalNgn || 0).toLocaleString()}</span>
                        <span className="text-[9.5px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#FAF9F6] border border-[#EAE8E3] text-[#0F0F10]">
                          {ord.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* WORKSPACE 2: CATALOG & FORMULATIONS MANAGEMENT           */}
        {/* ======================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Stat Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs">
                <span className="text-[10px] font-mono text-[#71717A] block uppercase">Total Formulations</span>
                <span className="text-xl font-heading font-extrabold text-[#0F0F10] mt-1 block">
                  {productsList.length}
                </span>
                <span className="text-[10px] font-mono text-[#0F0F10]">Clinical Formulations</span>
              </div>

              <div className="p-4 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs">
                <span className="text-[10px] font-mono text-[#71717A] block uppercase">Published Live</span>
                <span className="text-xl font-heading font-extrabold text-[#0F0F10] mt-1 block">
                  {productsList.filter((p) => p.inStock).length}
                </span>
                <span className="text-[10px] font-mono text-[#71717A]">Active on Storefront</span>
              </div>

              <div className="p-4 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs">
                <span className="text-[10px] font-mono text-[#71717A] block uppercase">Featured Bestsellers</span>
                <span className="text-xl font-heading font-extrabold text-[#0F0F10] mt-1 block">
                  {productsList.filter((p) => p.isBestseller).length}
                </span>
                <span className="text-[10px] font-mono text-[#D4AF37]">Hero Featured</span>
              </div>

              <div className="p-4 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs">
                <span className="text-[10px] font-mono text-[#71717A] block uppercase">Active Categories</span>
                <span className="text-xl font-heading font-extrabold text-[#0F0F10] mt-1 block">
                  {appCategories.length}
                </span>
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-[10px] font-mono text-[#997A2E] underline cursor-pointer"
                >
                  Manage Taxonomy
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 max-w-lg">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search by formulation name, SKU, or subcategory..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#EAE8E3] bg-[#FAF9F6] text-xs focus:border-[#0F0F10] outline-none transition"
                    />
                  </div>

                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-full border border-[#EAE8E3] bg-[#FAF9F6] text-xs font-medium outline-none cursor-pointer"
                  >
                    <option value="ALL">All Categories</option>
                    {appCategories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenCreateProduct}
                    className="px-5 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold shadow-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>+ New Formulation</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Formulations Catalog Table */}
            <div className="rounded-3xl bg-white border border-[#EAE8E3] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9F6] text-[#71717A] font-mono text-[10px] uppercase border-b border-[#EAE8E3]">
                    <tr>
                      <th className="py-3.5 px-4">Formulation</th>
                      <th className="py-3.5 px-4">SKU / Discipline</th>
                      <th className="py-3.5 px-4 text-right">Price</th>
                      <th className="py-3.5 px-4 text-center">Stock</th>
                      <th className="py-3.5 px-4 text-center">Catalog Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE8E3]">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-[#FAF9F6]/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover border border-[#EAE8E3] shrink-0 bg-[#FAF9F6]"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/hero_slide_1.jpg';
                              }}
                            />
                            <div>
                              <strong className="text-xs font-heading font-bold text-[#0F0F10] block">
                                {p.name}
                              </strong>
                              <span className="text-[10px] text-[#71717A] line-clamp-1">
                                {p.tagline || p.subCategory || 'Clinical Formulation'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <span className="text-[#0F0F10] font-bold block">{p.sku || 'DES-SKU'}</span>
                          <span className="text-[10px] text-[#71717A] uppercase">{p.category}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0F0F10]">
                          ₦{p.price.toLocaleString()}
                          {p.originalPrice && (
                            <span className="block text-[10px] line-through text-[#71717A]">
                              ₦{p.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className="font-bold text-[#0F0F10]">
                            {p.stockCount ?? (p.inStock ? 50 : 0)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleProductStock(p.id)}
                            className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase font-bold border transition cursor-pointer ${
                              p.inStock
                                ? 'bg-[#0F0F10] text-[#D4AF37] border-[#0F0F10]'
                                : 'bg-white text-[#71717A] border-[#EAE8E3]'
                            }`}
                          >
                            {p.inStock ? 'Published' : 'Draft'}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              title="Edit Formulation (Centered Modal)"
                              className="p-2 rounded-xl border border-[#EAE8E3] hover:bg-[#FAF9F6] text-[#0F0F10] transition cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              title="Delete Formulation"
                              className="p-2 rounded-xl border border-[#EAE8E3] hover:bg-black/5 text-[#71717A] hover:text-[#0F0F10] transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* WORKSPACE 3: STOREFRONT & EDITORIAL CMS                  */}
        {/* ======================================================== */}
        {activeTab === 'cms' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header & Sub-Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#997A2E] font-bold">
                  Storefront Content Management System
                </span>
                <h2 className="text-lg font-heading font-extrabold text-[#0F0F10]">
                  Editorial &amp; Marketing Customizer
                </h2>
                <p className="text-xs text-[#71717A]">
                  Changes made here update the Customer Home, PDP, and Storefront pages instantly.
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-mono">
                {[
                  { id: 'hero', label: '1. Hero Slideshow' },
                  { id: 'routine', label: '2. 3-Chapter Ritual' },
                  { id: 'story', label: '3. Brand Story' },
                  { id: 'ticker', label: '4. Announcement Ticker' }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setCmsSubTab(st.id as any)}
                    className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                      cmsSubTab === st.id
                        ? 'bg-[#0F0F10] text-[#D4AF37] font-bold'
                        : 'text-[#71717A] hover:text-[#0F0F10]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-Tab 1: Hero Slideshow */}
            {cmsSubTab === 'hero' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {heroSlides.map((slide, idx) => (
                    <div
                      key={slide.id}
                      className="p-5 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#FAF9F6] border border-[#EAE8E3]">
                          <img
                            src={slide.image}
                            alt={slide.headline}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/hero_slide_1.jpg';
                            }}
                          />
                          <span className="absolute top-2 left-2 text-[9px] font-mono uppercase bg-[#0F0F10]/80 text-[#D4AF37] px-2 py-0.5 rounded-full backdrop-blur-xs font-bold">
                            Slide {idx + 1}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#997A2E] font-bold">
                            {slide.tag}
                          </span>
                          <h4 className="text-sm font-heading font-extrabold text-[#0F0F10] leading-snug mt-0.5">
                            {slide.headline}
                          </h4>
                          <p className="text-[11px] text-[#71717A] mt-1 line-clamp-2">
                            {slide.subtext}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#EAE8E3] flex items-center justify-between text-xs">
                        <span className="text-[10px] font-mono text-[#71717A]">
                          Route: /{slide.actionRoute || 'catalogue'}
                        </span>
                        <button
                          onClick={() => {
                            setEditingSlideId(slide.id);
                            setNewSlideForm(slide);
                          }}
                          className="px-3 py-1 rounded-full bg-[#FAF9F6] border border-[#EAE8E3] hover:bg-[#0F0F10] hover:text-[#D4AF37] transition font-mono font-bold cursor-pointer"
                        >
                          Edit Slide
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Edit / Add Slide Form */}
                <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4">
                  <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                    {editingSlideId ? 'Edit Hero Slide' : 'Add New Editorial Hero Slide'}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-mono text-[10px] uppercase text-[#71717A] mb-1 font-bold">
                        Tag Badge (e.g. Clinical Formulation)
                      </label>
                      <input
                        type="text"
                        value={newSlideForm.tag || ''}
                        onChange={(e) => setNewSlideForm({ ...newSlideForm, tag: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] uppercase text-[#71717A] mb-1 font-bold">
                        Photography Image URL
                      </label>
                      <input
                        type="text"
                        value={newSlideForm.image || ''}
                        onChange={(e) => setNewSlideForm({ ...newSlideForm, image: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none"
                        placeholder="/hero_slide_1.jpg or Unsplash URL"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-mono text-[10px] uppercase text-[#71717A] mb-1 font-bold">
                        Headline
                      </label>
                      <input
                        type="text"
                        value={newSlideForm.headline || ''}
                        onChange={(e) => setNewSlideForm({ ...newSlideForm, headline: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none font-medium"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block font-mono text-[10px] uppercase text-[#71717A] mb-1 font-bold">
                        Editorial Subtext
                      </label>
                      <textarea
                        rows={2}
                        value={newSlideForm.subtext || ''}
                        onChange={(e) => setNewSlideForm({ ...newSlideForm, subtext: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] uppercase text-[#71717A] mb-1 font-bold">
                        Primary CTA Label
                      </label>
                      <input
                        type="text"
                        value={newSlideForm.actionLabel || ''}
                        onChange={(e) => setNewSlideForm({ ...newSlideForm, actionLabel: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] uppercase text-[#71717A] mb-1 font-bold">
                        Primary Route Target
                      </label>
                      <input
                        type="text"
                        value={newSlideForm.actionRoute || ''}
                        onChange={(e) => setNewSlideForm({ ...newSlideForm, actionRoute: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    {editingSlideId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSlideId(null);
                          setNewSlideForm({
                            headline: '',
                            subtext: '',
                            tag: 'Clinical Formulation',
                            image: '/hero_slide_1.jpg',
                            actionLabel: 'Shop Formulations',
                            actionRoute: 'catalogue'
                          });
                        }}
                        className="px-4 py-2 rounded-full border border-[#EAE8E3] text-xs font-bold text-[#71717A] cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (!newSlideForm.headline) return;
                        if (editingSlideId) {
                          const updated = heroSlides.map((s) =>
                            s.id === editingSlideId ? ({ ...s, ...newSlideForm } as HeroSlide) : s
                          );
                          updateHeroSlides(updated);
                          setActionNotice('Hero slideshow updated live on storefront.');
                          setEditingSlideId(null);
                        } else {
                          const newSlide: HeroSlide = {
                            id: `slide-${Date.now()}`,
                            headline: newSlideForm.headline || 'Untitled',
                            subtext: newSlideForm.subtext || '',
                            tag: newSlideForm.tag || 'Clinical Formulation',
                            image: newSlideForm.image || '/hero_slide_1.jpg',
                            actionLabel: newSlideForm.actionLabel || 'Shop Formulations',
                            actionRoute: newSlideForm.actionRoute || 'catalogue',
                            isActive: true,
                            displayOrder: heroSlides.length + 1
                          };
                          updateHeroSlides([...heroSlides, newSlide]);
                          setActionNotice('New hero slide added to carousel.');
                        }
                        setTimeout(() => setActionNotice(null), 3000);
                      }}
                      className="px-6 py-2.5 rounded-full bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold hover:bg-[#27272A] cursor-pointer"
                    >
                      {editingSlideId ? 'Save & Update Slide' : 'Publish New Slide to Carousel'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Tab 2: 3-Chapter Everyday Routine */}
            {cmsSubTab === 'routine' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {routineSteps.map((step, idx) => (
                    <div
                      key={step.id}
                      className="p-5 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4"
                    >
                      <div className="aspect-square rounded-2xl overflow-hidden bg-[#FAF9F6] border border-[#EAE8E3]">
                        <img
                          src={step.image}
                          alt={step.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/routine_lady_cleanse.jpg';
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-mono uppercase bg-[#0F0F10] text-[#D4AF37] px-2 py-0.5 rounded-full font-bold">
                          Step {step.number} • {step.title}
                        </span>
                        <h4 className="text-sm font-heading font-extrabold text-[#0F0F10]">
                          {step.productName}
                        </h4>
                        <p className="text-[11px] text-[#71717A]">
                          {step.description}
                        </p>
                        <span className="block text-[10px] font-mono text-[#997A2E] font-bold">
                          {step.keyBenefit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Edit Step Form */}
                <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4">
                  <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                    Customize 3-Chapter Everyday Regimen Steps
                  </h3>
                  <p className="text-xs text-[#71717A]">
                    Edit the formulation assignments, copy, and clinical benefit bullets for the customer home ritual.
                  </p>

                  <div className="space-y-4">
                    {routineSteps.map((step, idx) => (
                      <div key={step.id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-[#71717A] font-bold mb-1">
                            Chapter {step.number} Title &amp; Formulation
                          </label>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => {
                              const updated = [...routineSteps];
                              updated[idx].title = e.target.value;
                              updateRoutineSteps(updated);
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-[#EAE8E3] bg-white text-xs mb-1.5"
                          />
                          <input
                            type="text"
                            value={step.productName}
                            onChange={(e) => {
                              const updated = [...routineSteps];
                              updated[idx].productName = e.target.value;
                              updateRoutineSteps(updated);
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-[#EAE8E3] bg-white text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-[#71717A] font-bold mb-1">
                            Chapter Description
                          </label>
                          <textarea
                            rows={3}
                            value={step.description}
                            onChange={(e) => {
                              const updated = [...routineSteps];
                              updated[idx].description = e.target.value;
                              updateRoutineSteps(updated);
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-[#EAE8E3] bg-white text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-[#71717A] font-bold mb-1">
                            Clinical Key Benefit &amp; Image
                          </label>
                          <input
                            type="text"
                            value={step.keyBenefit}
                            onChange={(e) => {
                              const updated = [...routineSteps];
                              updated[idx].keyBenefit = e.target.value;
                              updateRoutineSteps(updated);
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-[#EAE8E3] bg-white text-xs mb-1.5"
                          />
                          <input
                            type="text"
                            value={step.image}
                            onChange={(e) => {
                              const updated = [...routineSteps];
                              updated[idx].image = e.target.value;
                              updateRoutineSteps(updated);
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-[#EAE8E3] bg-white text-xs font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Tab 3: Brand Story Narrative */}
            {cmsSubTab === 'story' && (
              <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4">
                <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                  Brand Story &amp; Heritage Narrative Configuration
                </h3>
                <p className="text-xs text-[#71717A]">
                  This narrative is displayed on the customer home page and about section.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-[#71717A] mb-1 font-bold">
                      Tagline / Eyebrow
                    </label>
                    <input
                      type="text"
                      value={brandStory.tagline}
                      onChange={(e) => updateBrandStory({ ...brandStory, tagline: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase text-[#71717A] mb-1 font-bold">
                      Main Editorial Heading
                    </label>
                    <input
                      type="text"
                      value={brandStory.heading}
                      onChange={(e) => updateBrandStory({ ...brandStory, heading: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none font-bold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-mono text-[10px] uppercase text-[#71717A] mb-1 font-bold">
                      Primary Scientific Narrative (Paragraph 1)
                    </label>
                    <textarea
                      rows={3}
                      value={brandStory.paragraph1}
                      onChange={(e) => updateBrandStory({ ...brandStory, paragraph1: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-mono text-[10px] uppercase text-[#71717A] mb-1 font-bold">
                      Sourcing &amp; Cold-Chain Narrative (Paragraph 2)
                    </label>
                    <textarea
                      rows={3}
                      value={brandStory.paragraph2}
                      onChange={(e) => updateBrandStory({ ...brandStory, paragraph2: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase text-[#71717A] mb-1 font-bold">
                      Badge 1 (e.g. NAFDAC Certified)
                    </label>
                    <input
                      type="text"
                      value={brandStory.badge1}
                      onChange={(e) => updateBrandStory({ ...brandStory, badge1: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase text-[#71717A] mb-1 font-bold">
                      Badge 2 (e.g. African Botanicals)
                    </label>
                    <input
                      type="text"
                      value={brandStory.badge2}
                      onChange={(e) => updateBrandStory({ ...brandStory, badge2: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EAE8E3] flex justify-end">
                  <button
                    onClick={() => {
                      setActionNotice('Brand story updated successfully on live storefront.');
                      setTimeout(() => setActionNotice(null), 3000);
                    }}
                    className="px-6 py-2.5 rounded-full bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold cursor-pointer hover:bg-[#27272A]"
                  >
                    Save &amp; Propagate Brand Narrative
                  </button>
                </div>
              </div>
            )}

            {/* Sub-Tab 4: Announcement Ticker */}
            {cmsSubTab === 'ticker' && (
              <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4">
                <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                  Global Storefront Announcement Ticker
                </h3>
                <p className="text-xs text-[#71717A]">
                  Displayed at the very top of all customer pages. Used for flash shipping thresholds, delivery updates, or holidays.
                </p>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-[#71717A] mb-1 font-bold">
                      Announcement Message
                    </label>
                    <input
                      type="text"
                      value={announcementTicker.text}
                      onChange={(e) => updateAnnouncementTicker({ ...announcementTicker, text: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-[10px] uppercase text-[#71717A] mb-1 font-bold">
                        Link Button Text
                      </label>
                      <input
                        type="text"
                        value={announcementTicker.linkText || ''}
                        onChange={(e) => updateAnnouncementTicker({ ...announcementTicker, linkText: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] uppercase text-[#71717A] mb-1 font-bold">
                        Destination Screen / Route
                      </label>
                      <input
                        type="text"
                        value={announcementTicker.linkRoute || ''}
                        onChange={(e) => updateAnnouncementTicker({ ...announcementTicker, linkRoute: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="tickerActive"
                      checked={announcementTicker.isActive}
                      onChange={(e) => updateAnnouncementTicker({ ...announcementTicker, isActive: e.target.checked })}
                      className="w-4 h-4 accent-[#0F0F10] cursor-pointer"
                    />
                    <label htmlFor="tickerActive" className="font-bold text-[#0F0F10] cursor-pointer">
                      Activate Announcement Ticker on Storefront
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* WORKSPACE 4: ORDERS & DISPATCH                           */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* View Mode Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs">
              <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-mono">
                <button
                  onClick={() => setOrdersViewMode('all')}
                  className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                    ordersViewMode === 'all'
                      ? 'bg-[#0F0F10] text-[#D4AF37] font-bold'
                      : 'text-[#71717A] hover:text-[#0F0F10]'
                  }`}
                >
                  All Orders ({orders.length})
                </button>
                <button
                  onClick={() => setOrdersViewMode('delivery_requests')}
                  className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                    ordersViewMode === 'delivery_requests'
                      ? 'bg-[#0F0F10] text-[#D4AF37] font-bold'
                      : 'text-[#71717A] hover:text-[#0F0F10]'
                  }`}
                >
                  Regional Hub Deliveries ({orders.filter((o) => o.fulfillmentType === 'local').length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 rounded-full border border-[#EAE8E3] bg-[#FAF9F6] text-xs font-mono font-bold outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="rounded-3xl bg-white border border-[#EAE8E3] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9F6] text-[#71717A] font-mono text-[10px] uppercase border-b border-[#EAE8E3]">
                    <tr>
                      <th className="py-3.5 px-4">Order #</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Hub &amp; Dispatch</th>
                      <th className="py-3.5 px-4 text-right">Total</th>
                      <th className="py-3.5 px-4 text-center">Payment</th>
                      <th className="py-3.5 px-4 text-center">Fulfillment</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE8E3]">
                    {displayedOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#FAF9F6]/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0F0F10]">
                          #{order.orderNumber}
                          <span className="block text-[10px] font-normal text-[#71717A]">{order.createdAt}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[#0F0F10] block">{order.customerName}</span>
                          <span className="text-[11px] text-[#71717A]">{order.customerEmail}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-[#0F0F10] block">{order.customerCity}</span>
                          <span className="text-[9.5px] font-mono uppercase text-[#997A2E]">
                            {order.fulfillmentType === 'local' ? 'Local Same-Day Rider' : 'Central Warehouse Dispatch'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0F0F10]">
                          ₦{(order.totalNgn || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF9F6] border border-[#EAE8E3] text-[#0F0F10]">
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#0F0F10] text-[#D4AF37]">
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <select
                            disabled={orderUpdatingId === order.id}
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                            className="bg-[#FAF9F6] border border-[#EAE8E3] rounded-full px-3 py-1 text-xs font-mono font-bold text-[#0F0F10] outline-none cursor-pointer"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="SHIPPED">Dispatch Courier</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancel</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* WORKSPACE 5: CREATORS & PR PRESS ROOM                     */}
        {/* ======================================================== */}
        {activeTab === 'creators' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Creator Sub-Navigation Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs">
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-mono">
                <button
                  onClick={() => setCreatorSubTab('roster')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                    creatorSubTab === 'roster'
                      ? 'bg-[#0F0F10] text-[#D4AF37] font-bold'
                      : 'text-[#71717A] hover:text-[#0F0F10]'
                  }`}
                >
                  Affiliate Ledger ({creatorsList.length})
                </button>
                <button
                  onClick={() => setCreatorSubTab('applications')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    creatorSubTab === 'applications'
                      ? 'bg-[#0F0F10] text-[#D4AF37] font-bold'
                      : 'text-[#71717A] hover:text-[#0F0F10]'
                  }`}
                >
                  Applications ({pendingCreatorAppsCount})
                </button>
                <button
                  onClick={() => setCreatorSubTab('pr_boxes')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    creatorSubTab === 'pr_boxes'
                      ? 'bg-[#0F0F10] text-[#D4AF37] font-bold'
                      : 'text-[#71717A] hover:text-[#0F0F10]'
                  }`}
                >
                  <Gift className="w-3.5 h-3.5" /> PR Sampling Room ({prBoxes.length})
                </button>
                <button
                  onClick={() => setCreatorSubTab('campaigns')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    creatorSubTab === 'campaigns'
                      ? 'bg-[#0F0F10] text-[#D4AF37] font-bold'
                      : 'text-[#71717A] hover:text-[#0F0F10]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Campaign Briefs ({creatorCampaigns.length})
                </button>
                <button
                  onClick={() => setCreatorSubTab('ugc')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    creatorSubTab === 'ugc'
                      ? 'bg-[#0F0F10] text-[#D4AF37] font-bold'
                      : 'text-[#71717A] hover:text-[#0F0F10]'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" /> UGC Moderation ({ugcSubmissions.length})
                </button>
              </div>

              {creatorSubTab === 'pr_boxes' && (
                <button
                  onClick={() => setIsAddPRBoxModalOpen(true)}
                  className="px-4 py-2 rounded-full bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold hover:bg-[#27272A] cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> New PR Gift Box
                </button>
              )}

              {creatorSubTab === 'campaigns' && (
                <button
                  onClick={() => setIsAddCampaignModalOpen(true)}
                  className="px-4 py-2 rounded-full bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold hover:bg-[#27272A] cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Launch Campaign Brief
                </button>
              )}
            </div>

            {/* SUBTAB 1: AFFILIATE ROSTER & PAYOUTS */}
            {creatorSubTab === 'roster' && (
              <div className="space-y-6">
                {/* Creator Performance KPI Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-[#EAE8E3] shadow-xs">
                    <span className="text-[10px] font-mono uppercase text-[#71717A] block font-bold">Total Creator GMV</span>
                    <strong className="text-lg font-mono font-black text-[#0F0F10] mt-1 block">₦14,850,000</strong>
                    <span className="text-[10px] text-[#997A2E] font-medium">+18.4% vs last cycle</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-[#EAE8E3] shadow-xs">
                    <span className="text-[10px] font-mono uppercase text-[#71717A] block font-bold">Commissions Settled</span>
                    <strong className="text-lg font-mono font-black text-[#0F0F10] mt-1 block">₦2,180,000</strong>
                    <span className="text-[10px] text-[#71717A]">Via Automated NIP</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-[#EAE8E3] shadow-xs">
                    <span className="text-[10px] font-mono uppercase text-[#71717A] block font-bold">Outstanding Balances</span>
                    <strong className="text-lg font-mono font-black text-[#997A2E] mt-1 block">₦645,000</strong>
                    <span className="text-[10px] text-[#71717A]">Pending withdrawal</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-[#EAE8E3] shadow-xs">
                    <span className="text-[10px] font-mono uppercase text-[#71717A] block font-bold">Active Roster Size</span>
                    <strong className="text-lg font-mono font-black text-[#0F0F10] mt-1 block">{creatorsList.length} Partners</strong>
                    <span className="text-[10px] text-[#71717A]">100% verified KYC</span>
                  </div>
                </div>

                {/* Active Creator Collective Table */}
                <div className="rounded-3xl bg-white border border-[#EAE8E3] shadow-xs overflow-hidden">
                  <div className="p-5 border-b border-[#EAE8E3] flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                        Active Affiliate Roster &amp; Commission Ledger
                      </h3>
                      <p className="text-xs text-[#71717A]">
                        Live commission rates, driven GMV attribution, and direct 1-click NIP bank settlements.
                      </p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF9F6] text-[#71717A] font-mono text-[10px] uppercase border-b border-[#EAE8E3]">
                        <tr>
                          <th className="py-3 px-4">Creator</th>
                          <th className="py-3 px-4 font-mono">Promo Code</th>
                          <th className="py-3 px-4 text-center">Commission</th>
                          <th className="py-3 px-4 text-right">Driven GMV</th>
                          <th className="py-3 px-4 text-right">Unpaid Earned</th>
                          <th className="py-3 px-4 text-right">Settlement Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAE8E3]">
                        {creatorsList.map((c) => (
                          <tr key={c.id} className="hover:bg-[#FAF9F6]/50 transition-colors">
                            <td className="py-3.5 px-4">
                              <strong className="text-xs font-bold text-[#0F0F10] block">{c.name}</strong>
                              <span className="text-[10px] text-[#71717A] font-mono">{c.handle}</span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-[#0F0F10]">
                              {c.promoCode}
                            </td>
                            <td className="py-3.5 px-4 text-center font-mono font-bold text-[#997A2E]">
                              {c.commissionRate}%
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0F0F10]">
                              ₦{(c.totalSalesNgn ?? (c as any).totalSales ?? 0).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0F0F10]">
                              ₦{(c.commissionEarnedNgn ?? (c as any).earnings ?? 0).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                disabled={payingCreatorId === c.id || ((c.commissionEarnedNgn ?? (c as any).earnings ?? 0) === 0)}
                                onClick={() => handlePayCreator(c.id)}
                                className="px-3.5 py-1.5 rounded-full bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-mono font-bold hover:bg-[#27272A] cursor-pointer disabled:opacity-40"
                              >
                                {payingCreatorId === c.id ? 'Processing…' : ((c.commissionEarnedNgn ?? (c as any).earnings ?? 0) === 0) ? 'Settled ✓' : 'Settle Payout'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 2: APPLICATIONS QUEUE */}
            {creatorSubTab === 'applications' && (
              <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                      Creator Press Applications &amp; Credentials
                    </h3>
                    <p className="text-xs text-[#71717A]">
                      Review incoming influencer applications, verify social demographics, and approve with auto-generated promo code.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#0F0F10] text-[#D4AF37] text-xs font-mono font-bold">
                    {pendingCreatorAppsCount} Pending Review
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {creatorApps.map((app) => (
                    <div key={app.id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <strong className="text-xs font-bold text-[#0F0F10] block">{app.name}</strong>
                          <span className="text-[11px] font-mono text-[#71717A]">{app.handle} • {app.platform} ({app.followers})</span>
                        </div>
                        <span className="text-[10px] font-mono text-[#71717A]">{app.appliedAt}</span>
                      </div>

                      <p className="text-[11px] text-[#0F0F10] bg-white p-2.5 rounded-xl border border-[#EAE8E3]">
                        Niche: {app.niche} • Location: {app.city}
                      </p>

                      {app.status === 'PENDING' ? (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => handleReviewCreatorApp(app.id, true)}
                            className="py-1.5 px-3 rounded-full bg-[#0F0F10] text-[#D4AF37] text-xs font-bold border border-[#D4AF37]/30 hover:bg-[#27272A] cursor-pointer"
                          >
                            Approve (15% Code)
                          </button>
                          <button
                            onClick={() => handleReviewCreatorApp(app.id, false)}
                            className="py-1.5 px-3 rounded-full bg-white border border-[#EAE8E3] text-[#71717A] text-xs font-bold hover:bg-[#FAF9F6] cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono uppercase font-bold text-[#0F0F10]">
                          Status: {app.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUBTAB 3: PR SAMPLING PRESS GIFTING ROOM */}
            {creatorSubTab === 'pr_boxes' && (
              <div className="space-y-6">
                {/* 3A: PR Box Requests Queue */}
                <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4">
                  <div>
                    <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                      Creator PR Package Dispatch Queue ({prRequests.length})
                    </h3>
                    <p className="text-xs text-[#71717A]">
                      Packages requested by approved creators in their PR Room. Assign courier tracking numbers and dispatch.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {prRequests.map((req) => (
                      <div key={req.id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] space-y-3 text-xs">
                        <div className="flex items-start justify-between">
                          <div>
                            <strong className="text-xs font-bold text-[#0F0F10] block">{req.creatorName}</strong>
                            <span className="text-[11px] font-mono text-[#71717A]">{req.creatorHandle} • {req.creatorTier} Tier</span>
                          </div>
                          <span
                            className={`text-[9.5px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                              req.status === 'DISPATCHED'
                                ? 'bg-[#0F0F10] text-[#D4AF37]'
                                : 'bg-white border border-[#EAE8E3] text-[#0F0F10]'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white border border-[#EAE8E3] space-y-1">
                          <span className="text-[10px] font-mono uppercase text-[#997A2E] font-bold block">
                            Requested Box
                          </span>
                          <strong className="text-[#0F0F10] block">{req.boxTitle}</strong>
                          <span className="text-[11px] text-[#71717A] block">
                            Deliver to: {req.shippingAddress}
                          </span>
                        </div>

                        {req.status === 'PENDING' ? (
                          <div className="flex gap-2 pt-1">
                            <input
                              value={prTrackingInput[req.id] ?? ''}
                              onChange={(e) => setPrTrackingInput((p) => ({ ...p, [req.id]: e.target.value }))}
                              placeholder="Waybill tracking (e.g. GIG-NG-889104)"
                              className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-[#EAE8E3] text-xs font-mono outline-none"
                            />
                            <button
                              onClick={() => handleDispatchPRRequest(req.id)}
                              className="px-4 py-1.5 rounded-full bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold hover:bg-[#27272A] cursor-pointer shrink-0"
                            >
                              Dispatch Box
                            </button>
                          </div>
                        ) : (
                          <div className="pt-2 border-t border-[#EAE8E3] flex items-center justify-between text-[11px] font-mono text-[#71717A]">
                            <span>Courier: {req.courier}</span>
                            <span className="font-bold text-[#0F0F10]">{req.trackingNumber}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3B: Active PR Box Offerings Catalog */}
                <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4">
                  <div>
                    <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                      Active PR Gifting Offerings ({prBoxes.length})
                    </h3>
                    <p className="text-xs text-[#71717A]">
                      Catalog of luxury PR packages displayed in the Creator Office Press Room.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {prBoxes.map((box) => (
                      <div key={box.id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <img
                            src={box.thumbnail}
                            alt={box.title}
                            className="w-full h-32 object-cover rounded-xl border border-[#EAE8E3]"
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase text-[#997A2E] font-bold">
                              {box.category}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-[#0F0F10]">
                              {box.retailValue}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-[#0F0F10]">{box.title}</h4>
                          <p className="text-[11px] text-[#71717A] line-clamp-2">{box.description}</p>
                          <div className="pt-2 border-t border-[#EAE8E3] text-[10px] font-mono text-[#71717A]">
                            Included: {box.includedProducts.join(', ')}
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between text-xs font-mono">
                          <span className="text-[#0F0F10] font-bold">{box.spotsLeft} Spots Left</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white border border-[#EAE8E3] text-[#71717A]">
                            {box.eligibleTiers.join(' • ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 4: BRAND CAMPAIGN BRIEFS */}
            {creatorSubTab === 'campaigns' && (
              <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4">
                <div>
                  <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                    Brand Campaign Briefs &amp; Collabs ({creatorCampaigns.length})
                  </h3>
                  <p className="text-xs text-[#71717A]">
                    Active seasonal collaboration briefs accessible by creators in the Creator Office.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {creatorCampaigns.map((camp) => (
                    <div key={camp.id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <img
                          src={camp.heroImage}
                          alt={camp.title}
                          className="w-full h-36 object-cover rounded-xl border border-[#EAE8E3]"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase text-[#997A2E] font-bold">
                            {camp.category}
                          </span>
                          <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-[#0F0F10] text-[#D4AF37]">
                            {camp.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#0F0F10]">{camp.title}</h4>
                        <p className="text-xs text-[#71717A]">{camp.description}</p>

                        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-white border border-[#EAE8E3] font-mono text-[11px] text-center">
                          <div>
                            <span className="text-[9px] text-[#71717A] block">Commission</span>
                            <strong className="text-[#0F0F10]">{camp.commissionRate}</strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-[#71717A] block">Bonus</span>
                            <strong className="text-[#997A2E]">{camp.bonus}</strong>
                          </div>
                          <div>
                            <span className="text-[9px] text-[#71717A] block">Slots</span>
                            <strong className="text-[#0F0F10]">{camp.slots}</strong>
                          </div>
                        </div>

                        <div className="pt-2 text-xs">
                          <span className="text-[10px] font-mono uppercase text-[#71717A] font-bold block mb-1">
                            Required Deliverables:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {camp.deliverables.map((deliv, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-md bg-white border border-[#EAE8E3] text-[10px] font-mono text-[#0F0F10]">
                                ✓ {deliv}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#EAE8E3] flex items-center justify-between text-xs font-mono text-[#71717A]">
                        <span>Deadline: {camp.deadline}</span>
                        <span className="text-[#0F0F10] font-bold">Active Campaign</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUBTAB 5: CREATOR UGC & REGIMEN MODERATION */}
            {creatorSubTab === 'ugc' && (
              <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4">
                <div>
                  <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                    Creator UGC &amp; Regimen Moderation Desk ({ugcSubmissions.length})
                  </h3>
                  <p className="text-xs text-[#71717A]">
                    Review shoppable routines and tutorial videos submitted by creators. Feature on Product PDPs with one click.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ugcSubmissions.map((ugc) => (
                    <div key={ugc.id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="relative w-28 h-28 shrink-0 rounded-xl overflow-hidden border border-[#EAE8E3]">
                          <img src={ugc.thumbnail} alt={ugc.title} className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono font-bold">
                            {ugc.duration}
                          </span>
                        </div>
                        <div className="space-y-1 flex-1">
                          <span className="text-[10px] font-mono uppercase text-[#997A2E] font-bold block">
                            {ugc.category}
                          </span>
                          <h4 className="text-xs font-bold text-[#0F0F10]">{ugc.title}</h4>
                          <span className="text-[11px] font-mono text-[#71717A] block">
                            By {ugc.creatorName} ({ugc.creatorHandle})
                          </span>
                          <span className="text-[10px] text-[#71717A] block">{ugc.submittedAt}</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-white border border-[#EAE8E3] text-xs">
                        <span className="text-[10px] font-mono uppercase text-[#71717A] font-bold block mb-1">
                          Tagged Products:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {ugc.productsTagged.map((p, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full bg-[#FAF9F6] border border-[#EAE8E3] text-[10px] font-mono text-[#0F0F10]">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span
                          className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                            ugc.featuredOnPDP
                              ? 'bg-[#0F0F10] text-[#D4AF37]'
                              : 'bg-white border border-[#EAE8E3] text-[#71717A]'
                          }`}
                        >
                          {ugc.featuredOnPDP ? 'Live on PDP ★' : 'Pending Syndication'}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleModerateUGC(ugc.id, ugc.featuredOnPDP ? 'flag' : 'approve')}
                            className="px-3.5 py-1.5 rounded-full bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-mono font-bold hover:bg-[#27272A] cursor-pointer"
                          >
                            {ugc.featuredOnPDP ? 'Remove from PDP' : 'Feature on PDP'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* WORKSPACE 6: CUSTOMER INTELLIGENCE & REVIEWS             */}
        {/* ======================================================== */}
        {activeTab === 'customers' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Customer Directory */}
            <div className="rounded-3xl bg-white border border-[#EAE8E3] shadow-xs overflow-hidden">
              <div className="p-5 border-b border-[#EAE8E3]">
                <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                  Clientele Profiles &amp; Loyalty Ledger
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9F6] text-[#71717A] font-mono text-[10px] uppercase border-b border-[#EAE8E3]">
                    <tr>
                      <th className="py-3 px-4">Client Name</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Skin Profile</th>
                      <th className="py-3 px-4 text-right">Lifetime Spend</th>
                      <th className="py-3 px-4 text-center">Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE8E3]">
                    {customersList.map((cust) => (
                      <tr key={cust.id} className="hover:bg-[#FAF9F6]/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <strong className="text-xs font-bold text-[#0F0F10] block">{cust.name}</strong>
                          <span className="text-[10px] text-[#71717A]">{cust.city}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <span className="text-[#0F0F10] block">{cust.email}</span>
                          <span className="text-[#71717A]">{cust.phone}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[#0F0F10] block">{cust.skinType}</span>
                          <span className="text-[10px] text-[#71717A]">{cust.concerns.join(', ')}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0F0F10]">
                          ₦{cust.totalSpentNgn.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#0F0F10] text-[#D4AF37] text-[10px] font-bold">
                            {cust.tier}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Skin Scan Diagnostic Telemetry */}
            <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4">
              <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                AI Optical Skin Scan Telemetry (Fitzpatrick IV–VI)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skinScanLogs.map((scan) => (
                  <div key={scan.id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <strong className="text-xs font-bold text-[#0F0F10] block">{scan.customerName}</strong>
                        <span className="text-[11px] font-mono text-[#71717A]">{scan.email} • {scan.fitzpatrick}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#71717A]">{scan.timestamp}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-white border border-[#EAE8E3]">
                        <span className="text-[10px] text-[#71717A] block">Hydration</span>
                        <strong className="text-[#0F0F10] text-sm font-bold">{scan.hydrationPercent}%</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-[#EAE8E3]">
                        <span className="text-[10px] text-[#71717A] block">Barrier Health</span>
                        <strong className="text-[#0F0F10] text-sm font-bold">{scan.barrierHealthScore} / 100</strong>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-[#EAE8E3] text-xs">
                      <span className="text-[10px] font-mono uppercase text-[#997A2E] font-bold block">
                        Prescribed Regimen
                      </span>
                      <p className="text-[11px] font-bold text-[#0F0F10] mt-0.5">
                        {scan.recommendedRoutine}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Moderation */}
            <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4">
              <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                Customer Reviews Moderation Queue
              </h3>
              <div className="space-y-3">
                {customerReviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-bold text-[#0F0F10]">{rev.authorName}</strong>
                        <span className="text-[10px] font-mono text-[#71717A]">({rev.city})</span>
                        <div className="flex items-center text-[#D4AF37]">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      <h4 className="text-xs font-semibold text-[#0F0F10]">"{rev.title}"</h4>
                      <p className="text-[11px] text-[#71717A]">{rev.comment}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleModerateReview(rev.id, true)}
                        className="px-4 py-1.5 rounded-full bg-[#0F0F10] text-[#D4AF37] text-xs font-bold border border-[#D4AF37]/30 hover:bg-[#27272A] cursor-pointer"
                      >
                        Feature on PDP
                      </button>
                      <button
                        onClick={() => handleModerateReview(rev.id, false)}
                        className="px-4 py-1.5 rounded-full bg-white border border-[#EAE8E3] text-[#71717A] text-xs font-bold hover:bg-[#FAF9F6] cursor-pointer"
                      >
                        Flag
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* WORKSPACE 7: INVENTORY & WHOLESALE LOGISTICS             */}
        {/* ======================================================== */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Regional Hub Stock Breakdown */}
            <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4">
              <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                Regional Hub Stock Allocations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {inventoryItems.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <strong className="text-xs font-bold text-[#0F0F10] block">{item.productName}</strong>
                        <span className="text-[10px] font-mono text-[#71717A]">SKU: {item.sku}</span>
                      </div>
                      {item.isLowStock && (
                        <span className="text-[9px] font-mono uppercase bg-[#0F0F10] text-[#D4AF37] px-2 py-0.5 rounded-full font-bold">
                          Low Stock
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs pt-2 border-t border-[#EAE8E3]">
                      <div>
                        <span className="text-[9px] text-[#71717A] block">Lagos</span>
                        <strong className="text-[#0F0F10]">{item.lagosHub}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#71717A] block">Abuja</span>
                        <strong className="text-[#0F0F10]">{item.abujaHub}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#71717A] block">PH</span>
                        <strong className="text-[#0F0F10]">{item.phHub}</strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#71717A] block">Kano</span>
                        <strong className="text-[#0F0F10]">{item.kanoHub}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Wholesale Master Carton Price Book */}
            <div className="rounded-3xl bg-white border border-[#EAE8E3] shadow-xs overflow-hidden">
              <div className="p-5 border-b border-[#EAE8E3]">
                <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                  Wholesale Master Carton Price Book (Distributor Silver / Gold Tiers)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF9F6] text-[#71717A] font-mono text-[10px] uppercase border-b border-[#EAE8E3]">
                    <tr>
                      <th className="py-3 px-4">Master Carton Formulation</th>
                      <th className="py-3 px-4 font-mono">SKU</th>
                      <th className="py-3 px-4 text-center">Carton Units</th>
                      <th className="py-3 px-4 text-right">Wholesale Price</th>
                      <th className="py-3 px-4 text-right">Retail Carton GMV</th>
                      <th className="py-3 px-4 text-center">Margin %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE8E3]">
                    {wholesaleCartons.map((wc) => (
                      <tr key={wc.id} className="hover:bg-[#FAF9F6]/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#0F0F10]">{wc.name}</td>
                        <td className="py-3.5 px-4 font-mono text-[#71717A]">{wc.sku}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-[#0F0F10]">{wc.cartonUnits} Units</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0F0F10]">₦{wc.wholesalePrice.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#71717A]">₦{wc.retailCartonValue.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-[#997A2E]">{wc.marginPercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Central Lab Restock Tracker */}
            <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4">
              <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                Central Laboratory Batch Restock Shipments (#LAB-409)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {labShipments.map((ship) => (
                  <div key={ship.id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] space-y-2 text-xs">
                    <div className="flex items-center justify-between font-mono">
                      <strong className="text-[#0F0F10]">{ship.batchNumber}</strong>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0F0F10] text-[#D4AF37]">
                        {ship.status}
                      </span>
                    </div>
                    <p className="text-[#71717A]">
                      Destination: <strong className="text-[#0F0F10]">{ship.destinationHub}</strong> ({ship.itemCount} Units)
                    </p>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A] pt-2 border-t border-[#EAE8E3]">
                      <span>Courier: {ship.courier}</span>
                      <span>Track: {ship.trackingNumber}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* WORKSPACE 8: NIP BANK CLAIMS                             */}
        {/* ======================================================== */}
        {activeTab === 'claims' && (
          <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                  NIP Bank Transfer Claims Settlement
                </h3>
                <p className="text-xs text-[#71717A]">
                  Reconcile manual bank payments against core bank statements.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#0F0F10] text-[#D4AF37] text-xs font-mono font-bold">
                {pendingClaimsCount} Pending
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transferClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] space-y-3"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[#0F0F10]">#{claim.orderNumber}</span>
                    <span className="font-bold text-[#0F0F10] text-sm">
                      ₦{claim.amountNgn.toLocaleString()}
                    </span>
                  </div>

                  <div className="text-xs">
                    <p className="font-semibold text-[#0F0F10]">{claim.senderName}</p>
                    <p className="text-[11px] text-[#71717A]">{claim.bankName} • {claim.narration}</p>
                    <span className="text-[10px] text-[#71717A] font-mono mt-0.5 block">{claim.createdAt}</span>
                  </div>

                  {claim.status === 'PENDING' ? (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#EAE8E3]">
                      <button
                        disabled={claimProcessingId === claim.id}
                        onClick={() => handleReviewClaim(claim.id, true)}
                        className="py-1.5 px-3 rounded-full bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold hover:bg-[#27272A] cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        disabled={claimProcessingId === claim.id}
                        onClick={() => handleReviewClaim(claim.id, false)}
                        className="py-1.5 px-3 rounded-full bg-white border border-[#EAE8E3] text-[#71717A] text-xs font-bold hover:bg-[#FAF9F6] cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-[#EAE8E3] flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-[#0F0F10]">{claim.status}</span>
                      <span className="text-[#71717A]">By {claim.reviewedBy || 'Admin'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* WORKSPACE 9: SECURITY AUDIT & LOGS                       */}
        {/* ======================================================== */}
        {activeTab === 'audit' && (
          <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4 animate-in fade-in duration-200">
            <h3 className="text-base font-heading font-bold text-[#0F0F10]">
              Immutable Administrative Audit Log
            </h3>
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] space-y-1 text-xs">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-[#0F0F10]">{log.action}</span>
                    <span className="text-[#71717A]">{log.timestamp} • IP: {log.ipAddress}</span>
                  </div>
                  <p className="text-[11px] text-[#0F0F10] font-medium">{log.details}</p>
                  <span className="text-[10px] font-mono text-[#71717A] block">
                    Actor: {log.actor} ({log.role})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* WORKSPACE 10: PARTNER NETWORK PANEL                      */}
        {/* ======================================================== */}
        {activeTab === 'network' && (
          <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs animate-in fade-in duration-200">
            <NetworkPanel />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 5. CENTERED PRODUCT & FORMULATION MODAL                   */}
      {/* ======================================================== */}
      <ProductDrawer
        isOpen={isProductDrawerOpen}
        onClose={() => setIsProductDrawerOpen(false)}
        product={selectedProductForEdit}
        onSave={handleSaveProduct}
        categoriesList={appCategories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug
        }))}
      />

      {/* ======================================================== */}
      {/* 6. CATEGORY TAXONOMY MANAGEMENT MODAL                     */}
      {/* ======================================================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#EAE8E3] overflow-hidden">
            <div className="p-5 border-b border-[#EAE8E3] flex items-center justify-between bg-[#FAF9F6]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#997A2E] font-bold">
                  Catalog Taxonomy
                </span>
                <h3 className="text-base font-heading font-extrabold text-[#0F0F10]">
                  Manage Categories &amp; Disciplines
                </h3>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="w-8 h-8 rounded-full border border-[#EAE8E3] flex items-center justify-center text-[#71717A] hover:text-[#0F0F10] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Existing Categories */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-[#71717A] font-bold block">
                  Active Categories ({appCategories.length})
                </span>
                <div className="divide-y divide-[#EAE8E3] border border-[#EAE8E3] rounded-2xl overflow-hidden bg-[#FAF9F6]">
                  {appCategories.map((cat) => (
                    <div key={cat.id} className="p-3 flex items-center justify-between text-xs bg-white">
                      <div>
                        <strong className="text-[#0F0F10] block">{cat.name}</strong>
                        <span className="text-[10px] font-mono text-[#71717A]">slug: {cat.slug}</span>
                      </div>
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        className="text-xs font-mono text-[#71717A] hover:text-[#0F0F10] p-1.5 cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Category Form */}
              <form onSubmit={handleCreateCategory} className="pt-4 border-t border-[#EAE8E3] space-y-3">
                <span className="text-[10px] font-mono uppercase text-[#997A2E] font-bold block">
                  + Add New Category
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#71717A] mb-1 font-bold">
                      Category Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newCatName}
                      onChange={(e) => {
                        setNewCatName(e.target.value);
                        if (!newCatSlug) {
                          setNewCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                        }
                      }}
                      placeholder="e.g. Lip Care"
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#71717A] mb-1 font-bold">
                      Slug URL
                    </label>
                    <input
                      type="text"
                      required
                      value={newCatSlug}
                      onChange={(e) => setNewCatSlug(e.target.value)}
                      placeholder="e.g. lip-care"
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-[10px] font-mono uppercase text-[#71717A] mb-1 font-bold">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="Short description for storefront filter..."
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-full bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold hover:bg-[#27272A] cursor-pointer"
                >
                  Create Category
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. PR BOX OFFERING CREATION MODAL                         */}
      {/* ======================================================== */}
      {isAddPRBoxModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#EAE8E3] overflow-hidden">
            <div className="p-5 border-b border-[#EAE8E3] flex items-center justify-between bg-[#FAF9F6]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#997A2E] font-bold">
                  Press Gifting Suite
                </span>
                <h3 className="text-base font-heading font-extrabold text-[#0F0F10]">
                  Create New PR Gift Box
                </h3>
              </div>
              <button
                onClick={() => setIsAddPRBoxModalOpen(false)}
                className="w-8 h-8 rounded-full border border-[#EAE8E3] flex items-center justify-center text-[#71717A] hover:text-[#0F0F10] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePRBox} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#71717A] mb-1 font-bold">
                  Package Title
                </label>
                <input
                  type="text"
                  required
                  value={newPRBoxForm.title}
                  onChange={(e) => setNewPRBoxForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Melanin Climate Defense Press Kit"
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#71717A] mb-1 font-bold">
                    Retail Value (₦)
                  </label>
                  <input
                    type="text"
                    required
                    value={newPRBoxForm.retailValue}
                    onChange={(e) => setNewPRBoxForm((f) => ({ ...f, retailValue: e.target.value }))}
                    placeholder="₦145,000"
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#71717A] mb-1 font-bold">
                    Spots Left / Allocation
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newPRBoxForm.spotsLeft}
                    onChange={(e) => setNewPRBoxForm((f) => ({ ...f, spotsLeft: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#71717A] mb-1 font-bold">
                  Included Formulations (Comma separated)
                </label>
                <input
                  type="text"
                  required
                  value={newPRBoxForm.includedProducts}
                  onChange={(e) => setNewPRBoxForm((f) => ({ ...f, includedProducts: e.target.value }))}
                  placeholder="Radiant Glow Oil, Melanin Defense SPF 50+, Amino Cleanser"
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#71717A] mb-1 font-bold">
                  Description
                </label>
                <textarea
                  rows={2}
                  required
                  value={newPRBoxForm.description}
                  onChange={(e) => setNewPRBoxForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-full bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold hover:bg-[#27272A] cursor-pointer"
              >
                Publish to Creator PR Room
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. CAMPAIGN BRIEF CREATION MODAL                          */}
      {/* ======================================================== */}
      {isAddCampaignModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#EAE8E3] overflow-hidden">
            <div className="p-5 border-b border-[#EAE8E3] flex items-center justify-between bg-[#FAF9F6]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#997A2E] font-bold">
                  Creator Office Campaigns
                </span>
                <h3 className="text-base font-heading font-extrabold text-[#0F0F10]">
                  Launch Brand Campaign Brief
                </h3>
              </div>
              <button
                onClick={() => setIsAddCampaignModalOpen(false)}
                className="w-8 h-8 rounded-full border border-[#EAE8E3] flex items-center justify-center text-[#71717A] hover:text-[#0F0F10] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#71717A] mb-1 font-bold">
                  Campaign Title
                </label>
                <input
                  type="text"
                  required
                  value={newCampaignForm.title}
                  onChange={(e) => setNewCampaignForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Harmattan Barrier Defense Spotlight"
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#71717A] mb-1 font-bold">
                    Commission Rate
                  </label>
                  <input
                    type="text"
                    required
                    value={newCampaignForm.commissionRate}
                    onChange={(e) => setNewCampaignForm((f) => ({ ...f, commissionRate: e.target.value }))}
                    placeholder="15%"
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#71717A] mb-1 font-bold">
                    Completion Bonus
                  </label>
                  <input
                    type="text"
                    required
                    value={newCampaignForm.bonus}
                    onChange={(e) => setNewCampaignForm((f) => ({ ...f, bonus: e.target.value }))}
                    placeholder="+₦30,000"
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#71717A] mb-1 font-bold">
                    Deadline
                  </label>
                  <input
                    type="text"
                    required
                    value={newCampaignForm.deadline}
                    onChange={(e) => setNewCampaignForm((f) => ({ ...f, deadline: e.target.value }))}
                    placeholder="May 30, 2026"
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#71717A] mb-1 font-bold">
                    Slots
                  </label>
                  <input
                    type="text"
                    required
                    value={newCampaignForm.slots}
                    onChange={(e) => setNewCampaignForm((f) => ({ ...f, slots: e.target.value }))}
                    placeholder="8 Spots Remaining"
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#71717A] mb-1 font-bold">
                  Deliverables (+ separated)
                </label>
                <input
                  type="text"
                  required
                  value={newCampaignForm.deliverables}
                  onChange={(e) => setNewCampaignForm((f) => ({ ...f, deliverables: e.target.value }))}
                  placeholder="1 4K Reel + 2 Stories + Link in Bio"
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#71717A] mb-1 font-bold">
                  Brief Description
                </label>
                <textarea
                  rows={2}
                  required
                  value={newCampaignForm.description}
                  onChange={(e) => setNewCampaignForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE8E3] bg-[#FAF9F6] outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-full bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-bold hover:bg-[#27272A] cursor-pointer"
              >
                Launch Campaign
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
