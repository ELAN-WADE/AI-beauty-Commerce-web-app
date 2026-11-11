import { AdminContentComposer } from '../../components/admin/AdminContentComposer';
import { HeroCmsEditor } from '../../components/admin/HeroCmsEditor';
import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutGrid,
  ShoppingBag,
  CreditCard,
  Coins,
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
  Loader2,
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
  ArrowRight,
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
  apiFetch,
  fetchAdminOrders,
  updateAdminOrderStatus,
  fetchAdminTransferClaims,
  confirmAdminTransferClaim,
  fetchAdminAudits,
  fetchInventoryOverview,
  adjustStockApi,
  isOwnedApiConfigured
} from '../../lib/owned-api';
import { AdminAccessPanel } from '../../components/admin/AdminAccessPanel';
import { AdminReviewQueue } from '../../components/admin/AdminReviewQueue';
import { PartnerApplicationsPanel, type ApplicationQueue } from '../../components/admin/PartnerApplicationsPanel';
import { NetworkPanel } from '../../components/admin/NetworkPanel';
import { ProductDrawer } from '../../components/admin/ProductDrawer';
import { AdminInventoryConsole } from '../../components/admin/AdminInventoryConsole';
// Cleaned: Mock data imports purged for production

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
    adminCatalogueProducts,
    publishStorefront,
    saveProductFromAdmin,
    refreshAdminCatalogue,
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
    categories: appCategories = [],
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
  // Cryptocurrency ledger state
  const [cryptoTransactions, setCryptoTransactions] = useState<any[]>([]);
  const [cryptoFilter, setCryptoFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'EXPIRED'>('ALL');
  const [cryptoSearch, setCryptoSearch] = useState('');
  const [manualVerifyPaymentId, setManualVerifyPaymentId] = useState<string | null>(null);
  const [manualVerifyTxHash, setManualVerifyTxHash] = useState('');
  const [isVerifyingAdminCrypto, setIsVerifyingAdminCrypto] = useState(false);
  const [adminCryptoError, setAdminCryptoError] = useState<string | null>(null);
  const [adminCryptoSuccess, setAdminCryptoSuccess] = useState<string | null>(null);

  const pendingCryptoCount = cryptoTransactions.filter(t => t.status === 'PENDING').length;

  const filteredCryptoTransactions = useMemo(() => {
    return cryptoTransactions.filter((tx) => {
      if (cryptoFilter !== 'ALL' && tx.status !== cryptoFilter) return false;
      if (cryptoSearch.trim()) {
        const q = cryptoSearch.toLowerCase();
        const matches =
          (tx.orderNumber && tx.orderNumber.toLowerCase().includes(q)) ||
          (tx.customerEmail && tx.customerEmail.toLowerCase().includes(q)) ||
          (tx.depositAddress && tx.depositAddress.toLowerCase().includes(q)) ||
          (tx.txHash && tx.txHash.toLowerCase().includes(q)) ||
          (tx.asset && tx.asset.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [cryptoTransactions, cryptoFilter, cryptoSearch]);

  const handleManualVerifyCrypto = async (paymentId: string, txHash?: string) => {
    setIsVerifyingAdminCrypto(true);
    setAdminCryptoError(null);
    setAdminCryptoSuccess(null);
    try {
      if (isLiveBackend) {
        const res = await apiFetch<any>('/api/payments/crypto/verify', {
          method: 'POST',
          body: JSON.stringify({ paymentId, txHash: txHash?.trim() || undefined }),
        });
        setAdminCryptoSuccess(`Payment settled successfully! Order #${res.orderNumber} is marked PAID.`);
      } else {
        setAdminCryptoSuccess('Payment marked settled! Order settled in local ledger.');
      }
      setCryptoTransactions((prev) =>
        prev.map((t) => (t.id === paymentId ? { ...t, status: 'COMPLETED', txHash: txHash || t.txHash || 'ADMIN_VERIFIED_ON_CHAIN' } : t))
      );
      setManualVerifyPaymentId(null);
      setManualVerifyTxHash('');
    } catch (err: any) {
      setAdminCryptoError(err?.message || 'Verification failed');
    } finally {
      setIsVerifyingAdminCrypto(false);
    }
  };

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'products'
    | 'cms'
    | 'orders'
    | 'applications'
    | 'creators'
    | 'customers'
    | 'inventory'
    | 'claims'
    | 'crypto'
    | 'audit'
    | 'network'
  >(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (
        tabParam &&
        ['overview', 'products', 'cms', 'orders', 'applications', 'creators', 'customers', 'inventory', 'claims', 'crypto', 'audit', 'network'].includes(tabParam)
      ) {
        return tabParam as any;
      }
    }
    return 'overview';
  });

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
  const [cmsSubTab, setCmsSubTab] = useState<'hero' | 'routine' | 'story' | 'ticker' | 'posts'>('hero');
  // Creator state
  const [creatorsList, setCreatorsList] = useState<Creator[]>([]);
  const [creatorApps, setCreatorApps] = useState<CreatorApplication[]>([]);
  const [payingCreatorId, setPayingCreatorId] = useState<string | null>(null);

  // Creator Sub-Workspace & PR Gifting Suite
  const [creatorSubTab, setCreatorSubTab] = useState<'roster' | 'applications' | 'pr_boxes' | 'campaigns' | 'ugc'>('roster');
  const [prTrackingInput, setPrTrackingInput] = useState<Record<string, string>>({});
  const [isAddPRBoxModalOpen, setIsAddPRBoxModalOpen] = useState(false);
  const [newPRBoxForm, setNewPRBoxForm] = useState({
    audience: 'CREATOR' as 'CREATOR' | 'DISTRIBUTOR' | 'ALL', productIds: [] as string[],
    title: '',
    category: 'Natural PR Gifting',
    retailValue: '',
    spotsLeft: 0,
    thumbnail: '',
    description: '',
    includedProducts: '',
    eligibleTiers: ['Verified', 'Icon'] as ('Rising' | 'Verified' | 'Icon')[]
  });
  const [isAddCampaignModalOpen, setIsAddCampaignModalOpen] = useState(false);
  const [newCampaignForm, setNewCampaignForm] = useState({
    title: '',
    category: 'Seasonal Campaign',
    commissionRate: '',
    bonus: '',
    deadline: '',
    description: '',
    heroImage: '',
    deliverables: '',
    slots: '',
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
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISPATCHED' | 'DELIVERED';
    courier?: string;
    trackingNumber?: string;
  }[]>([]);
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
  }[]>([]);

  // Customers & Reviews state
  const [customerReviews, setCustomerReviews] = useState<ProductReview[]>([]);
  const [customersList, setCustomersList] = useState<CustomerProfileSummary[]>([]);

  const [skinScanLogs, setSkinScanLogs] = useState<SkinScanRecord[]>([]);

  // Orders State
  const [ordersViewMode, setOrdersViewMode] = useState<'all' | 'delivery_requests'>('all');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [orderUpdatingId, setOrderUpdatingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // NIP Bank Transfer Claims
  const [transferClaims, setTransferClaims] = useState<AdminTransferClaim[]>([]);
  const [claimProcessingId, setClaimProcessingId] = useState<string | null>(null);

  // Regional Hub Inventory Matrix
  const [inventoryItems, setInventoryItems] = useState<AdminInventoryItem[]>([]);

  // Security Audit Logs
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [loadingLive, setLoadingLive] = useState(isLiveBackend);
  const [workspaceRows, setWorkspaceRows] = useState<any[]>([]);
  const loadedOwner = React.useRef<string | undefined>(undefined);
  const can = (permission: string) => !isLiveBackend || Boolean(authUser?.roles.includes('SUPER_ADMIN') || authUser?.permissions?.includes(permission));
  const tabPermission: Record<string, string> = { overview: 'audit:read', products: 'products:write', cms: 'products:write', orders: 'orders:read:all', applications: 'partners:review', creators: 'partners:review', customers: 'users:read:all', inventory: 'inventory:write', network: 'network:manage', claims: 'payments:confirm', crypto: 'payments:confirm', audit: 'audit:read' };
  const canOpen = (tab: string) => can(tabPermission[tab]);
  const [pendingApplications, setPendingApplications] = useState({ creators: 0, distributors: 0, programmes: 0 });
  const [applicationsError, setApplicationsError] = useState('');
  useEffect(() => {
    if (!isLiveBackend || !can('partners:review')) return;
    let cancelled = false;
    const load = () => Promise.all([
      apiFetch<ApplicationQueue>('/api/admin/creators?status=pending'),
      apiFetch<ApplicationQueue>('/api/admin/distributors?status=pending'),
      apiFetch<{records: {status: string}[]}>('/api/admin/partner-programmes'),
    ]).then(([creators, distributors, programmes]) => {
      if (!cancelled) { setPendingApplications({ creators: creators.counts.pending, distributors: distributors.counts.pending, programmes: programmes.records.filter(row => row.status === 'PENDING').length }); setApplicationsError(''); }
    }).catch(error => { if (!cancelled) setApplicationsError(error instanceof Error ? error.message : 'Could not load partner requests.'); });
    void load();
    window.addEventListener('focus', load);
    const timer = window.setInterval(load, 30000);
    return () => { cancelled = true; window.clearInterval(timer); window.removeEventListener('focus', load); };
  }, [isLiveBackend, authUser?.id, authUser?.permissions?.join('|'), refreshTick]);
  const pendingApplicationCount = pendingApplications.creators + pendingApplications.distributors + pendingApplications.programmes;

  useEffect(() => {
    if (!isLiveBackend) return;
    let cancelled = false;
    setLoadingLive(true);
    if (loadedOwner.current !== authUser?.id) {
      loadedOwner.current = authUser?.id;
    setOrders([]); setTransferClaims([]); setAuditLogs([]); setCreatorsList([]); setCreatorApps([]); setPrRequests([]); setUgcSubmissions([]); setCustomerReviews([]); setCustomersList([]); setSkinScanLogs([]); setInventoryItems([]);
      setWorkspaceRows([]);
    }
    if (!canOpen(activeTab)) setActiveTab((Object.keys(tabPermission).find(canOpen) || 'orders') as typeof activeTab);
    const neededPaths = ({ overview: ['/api/admin/orders', '/api/admin/transfer-claims', '/api/admin/inventory/overview', '/api/admin/crypto/transactions'], orders: ['/api/admin/orders'], claims: ['/api/admin/transfer-claims'], crypto: ['/api/admin/crypto/transactions'], audit: ['/api/admin/audit'], creators: ['/api/admin/creators', '/api/admin/workspace', '/api/admin/reviews'], customers: ['/api/admin/users'], products: [], cms: [], inventory: [], network: [] } as Record<string, string[]>)[activeTab] || [];
    const tasks: Promise<unknown>[] = [];
    const read = (permission: string, path: string, apply: (data: any) => void) => {
      if (can(permission) && neededPaths.some(prefix => path.startsWith(prefix))) tasks.push(apiFetch<any>(path).then(data => { if (!cancelled) apply(data); }));
    };
    if (can('products:write') && ['products', 'cms'].includes(activeTab)) tasks.push(refreshAdminCatalogue());
    read('orders:read:all', '/api/admin/orders?limit=100', data => setOrders(data.orders.map((o: any) => ({ ...o, totalNgn: o.totalKobo / 100, customerName: o.customerName || o.customerEmail || 'Customer', customerCity: o.shippingAddress?.city || '', itemsCount: o.itemsCount || 0, fulfillmentType: o.fulfillmentType }))));
    read('payments:confirm', '/api/admin/transfer-claims', data => setTransferClaims(data.claims.map((c: any) => ({ ...c, amountNgn: c.amountKobo / 100, orderNumber: c.orderId, status: c.status === 'confirmed' ? 'APPROVED' : c.status.toUpperCase() }))));
    read('audit:read', '/api/admin/audit?limit=100', data => setAuditLogs(data.audit.map((a: any) => ({ ...a, timestamp: a.createdAt, actor: a.actorId || 'System', role: '', details: JSON.stringify(a.after || {}), ipAddress: a.ip || '' }))));
    read('partners:review', '/api/admin/creators', data => {
      setCreatorApps(data.applications.map((a: any) => ({ ...a, status: a.status.toUpperCase(), followers: '—', city: '', appliedAt: a.createdAt })));
      setCreatorsList(data.creators.map((c: any) => ({ ...c, avatar: c.avatarUrl, totalSalesNgn: c.totalSalesKobo / 100, commissionEarnedNgn: c.commissionEarnedKobo / 100, totalSales: c.totalSalesKobo / 100, earnings: c.commissionEarnedKobo / 100, status: c.verified ? 'active' : 'pending' })));
    });
    read('users:read:all', '/api/admin/users?limit=100', data => setCustomersList(data.users.map((u: any) => ({ ...u, name: u.displayName || u.email, phone: u.phone || '—', city: u.city || '', totalSpentNgn: u.totalSpentNgn || 0, ordersCount: u.ordersCount || 0, skinType: u.skinType || '', concerns: u.concerns || [], loyaltyPoints: u.loyaltyPoints ?? 0, tier: u.tier || 'Member', lastActive: u.createdAt }))));
    read('inventory:write', '/api/admin/inventory/overview?limit=100', data => {
      const locations = data.locations || [];
      const matrix = data.matrix || [];
      const cityKey = (locationId: string) => {
        if (locationId === '00000000-0000-4000-8000-000000000001') return 'centralStock';
        const city = locations.find((l: any) => l.id === locationId)?.city?.toLowerCase();
        return ({ lagos: 'lagosHub', abuja: 'abujaHub', 'port harcourt': 'phHub', kano: 'kanoHub' } as Record<string,string>)[city] || 'centralStock';
      };
      const grouped = new Map<string, AdminInventoryItem>();
      for (const row of matrix) {
        const item = grouped.get(row.variantId) || { id: row.variantId, sku: row.sku, productName: row.productName, category: '', centralStock: 0, lagosHub: 0, abujaHub: 0, phHub: 0, kanoHub: 0, lowStockThreshold: 10, isLowStock: false };
        if (row.pool === 'PLATFORM') (item as any)[cityKey(row.locationId)] = ((item as any)[cityKey(row.locationId)] || 0) + (row.onHand || 0);
        item.isLowStock = item.centralStock + item.lagosHub + item.abujaHub + item.phHub + item.kanoHub <= 10;
        grouped.set(row.variantId, item);
      }
      setInventoryItems([...grouped.values()]);
    });
    read('orders:read', '/api/admin/crypto/transactions', data => setCryptoTransactions(data.transactions || []));
    read('reviews:moderate', '/api/admin/reviews', data => setCustomerReviews(data.reviews.map((r: any) => ({ ...r, date: r.createdAt }))));
    read('products:write', '/api/admin/workspace', data => {
      setWorkspaceRows(data.records);
      setPrRequests(data.records.filter((r: any) => r.kind === 'PR_REQUEST').map((r: any) => ({ ...r, creatorName: r.ownerId, creatorHandle: '', creatorTier: 'Verified', boxTitle: r.title, shippingAddress: r.body, requestedAt: r.createdAt, status: r.status === 'SUBMITTED' ? 'PENDING' : r.status, trackingNumber: r.data?.shipping?.trackingReference || (r.status === 'DISPATCHED' ? r.reviewNote : undefined) })));
      setUgcSubmissions(data.records.filter((r: any) => r.kind === 'CONTENT').map((r: any) => ({ ...r, creatorName: r.ownerId, creatorHandle: '', category: 'Creator content', thumbnail: '', duration: '', productsTagged: r.data?.productIds || [], submittedAt: r.createdAt, status: r.status === 'APPROVED' ? 'APPROVED' : r.status === 'REJECTED' ? 'FLAGGED' : 'PENDING', featuredOnPDP: false })));
      updatePRBoxes(data.records.filter((r: any) => r.kind === 'PR_BOX').map((r: any) => ({ id: r.id, title: r.title, category: 'PR Box', retailValue: '', openSpots: 'Subject to approval', spotsLeft: -1, thumbnail: r.url, description: r.body, includedProducts: r.data?.productIds || [], eligibleTiers: ['Rising', 'Verified', 'Icon'], ...r.data?.details, isActive: r.status === 'PUBLISHED' })));
      updateCreatorCampaigns(data.records.filter((r: any) => r.kind === 'CAMPAIGN').map((r: any) => ({ id: r.id, title: r.title, category: 'Campaign', commissionRate: '', bonus: '', deadline: '', description: r.body, heroImage: r.url, deliverables: [], slots: '', ...r.data?.details, status: r.status === 'PUBLISHED' ? 'ACTIVE' : 'DRAFT' })));
    });
    Promise.allSettled(tasks).then(results => { if (!cancelled) { const failed = results.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined; if (failed) setActionNotice(failed.reason?.message || 'Could not load admin data.'); setLoadingLive(false); } });
    return () => { cancelled = true; };
  }, [isLiveBackend, refreshAdminCatalogue, authUser?.id, authUser?.permissions?.join('|'), refreshTick, activeTab]);

  const pendingWrites = React.useRef(new Map<string, { key: string; busy: boolean }>());
  const persist = async (path: string, payload: unknown, message: string, method = 'POST') => {
    const body = JSON.stringify(payload), identity = method + ':' + path + ':' + body;
    let write = pendingWrites.current.get(identity);
    if (write?.busy) return false;
    if (!write) { write = { key: crypto.randomUUID(), busy: false }; pendingWrites.current.set(identity, write); }
    write.busy = true;
    try {
      await apiFetch(path, { method, body, headers: { 'Idempotency-Key': write.key } });
      pendingWrites.current.delete(identity);
      setActionNotice(message); setRefreshTick(value => value + 1); return true;
    } catch (error) { setActionNotice(error instanceof Error ? error.message : 'Could not save changes.'); return false; }
    finally { write.busy = false; }
  };
  const reviewWorkspace = (id: string, status: string, note: string) => {
    const record = workspaceRows.find(r => r.id === id);
    if (!record) { setActionNotice('Refresh the review queue before continuing.'); return; }
    return persist('/api/admin/workspace', { action: 'review', id, version: record.version, status, note }, 'Review saved.');
  };

  // --------------------------------------------------------------------------
  // PRODUCTS FILTERING & HANDLERS
  // --------------------------------------------------------------------------
  const productsList = isLiveBackend ? adminCatalogueProducts : appProducts;

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
      throw err;
    }
  };

  const handleToggleProductStock = async (id: string) => {
    try { await toggleProductStock(id); setActionNotice('Catalogue publication updated.'); }
    catch (error) { setActionNotice(error instanceof Error ? error.message : 'Could not update product.'); }
    setTimeout(() => setActionNotice(null), 2500);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to remove this formulation from the catalog?')) {
      try { await deleteProductFromAdmin(id); setActionNotice('Formulation removed from public catalogue.'); }
      catch (error) { setActionNotice(error instanceof Error ? error.message : 'Could not remove product.'); }
      setTimeout(() => setActionNotice(null), 2500);
    }
  };

  const exportOperationalLedgerCsv = () => {
    try {
      const headers = ['OrderNumber', 'CustomerName', 'CustomerCity', 'TotalNgn', 'Status', 'PaymentStatus', 'CreatedAt'];
      const rows = orders.map((o) => [
        o.orderNumber,
        `"${o.customerName || ''}"`,
        `"${o.customerCity || ''}"`,
        o.totalNgn,
        o.status,
        o.paymentStatus,
        `"${o.createdAt}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `delsla_operations_ledger_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setActionNotice('✓ Operational CSV ledger exported successfully.');
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      setActionNotice('Export failed. Please retry.');
      setTimeout(() => setActionNotice(null), 2500);
    }
  };

  // Add Category Handler
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatSlug.trim()) return;
    if (isLiveBackend) {
      if (await persist('/api/admin/categories', { name: newCatName.trim(), slug: newCatSlug.trim().toLowerCase().replace(/\s+/g, '-'), description: newCatDesc.trim() }, 'Category saved.')) { setIsCategoryModalOpen(false); setNewCatName(''); setNewCatSlug(''); }
      return;
    }
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      slug: newCatSlug.trim().toLowerCase().replace(/\s+/g, '-'),
      itemCount: 0,
      image: '/cat_skincare.jpg',
      description: newCatDesc.trim() || 'Natural formulation category.',
      isFeatured: true
    };
    try {
      await addCategory(newCat);
      setNewCatName('');
      setNewCatSlug('');
      setNewCatDesc('');
      setIsCategoryModalOpen(false);
      setActionNotice(`Category added: ${newCat.name}`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      setActionNotice(err?.message || 'Failed to create category on backend.');
    }
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
    setActiveTab('applications');
    setActionNotice('Select the application to review its details and set its actual promo code, discount and commission.');
  };

  const handlePayCreator = (creatorId: string) => {
    setActionNotice('Review the creator withdrawal request in the payment workflow. No funds have been sent.');
  };

  // Creator PR Package Dispatch
  const handleDispatchPRRequest = (reqId: string) => {
    const tracking = prTrackingInput[reqId]?.trim();
    if (!tracking) { setActionNotice('Enter the actual courier and tracking reference.'); return; }
    void reviewWorkspace(reqId, 'DISPATCHED', tracking);
  };

  // Create PR Box Offering Handler
  const handleCreatePRBox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPRBoxForm.title.trim()) return;
      const saved = await persist('/api/admin/workspace', { action: 'publish', type: 'PR_BOX', audience: newPRBoxForm.audience, active: true, title: newPRBoxForm.title.trim(), body: newPRBoxForm.description, url: newPRBoxForm.thumbnail || appProducts.find(product => newPRBoxForm.productIds.includes(product.id))?.image || '', details: { category: newPRBoxForm.category, retailValue: newPRBoxForm.retailValue, spotsLeft: Number(newPRBoxForm.spotsLeft), includedProducts: appProducts.filter(product => newPRBoxForm.productIds.includes(product.id)).map(product => product.name), eligibleTiers: newPRBoxForm.eligibleTiers }, productIds: newPRBoxForm.productIds }, 'Publication saved for creators.');
      if (saved) { setIsAddPRBoxModalOpen(false); setNewPRBoxForm(previous => ({ ...previous, title: '', description: '', thumbnail: '', productIds: [], spotsLeft: 0 })); }

  };

  // Create Creator Campaign Brief Handler
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignForm.title.trim()) return;
      const saved = await persist('/api/admin/workspace', { action: 'publish', type: 'CAMPAIGN', audience: 'CREATOR', active: newCampaignForm.status === 'ACTIVE', title: newCampaignForm.title.trim(), body: newCampaignForm.description, url: newCampaignForm.heroImage, details: { category: newCampaignForm.category, commissionRate: newCampaignForm.commissionRate, bonus: newCampaignForm.bonus, deadline: newCampaignForm.deadline, deliverables: newCampaignForm.deliverables.split('+').map(d => d.trim()), slots: newCampaignForm.slots }, productIds: [] }, 'Publication saved for creators.');
      if (saved) { setIsAddCampaignModalOpen(false); setNewCampaignForm(previous => ({ ...previous, title: '', description: '', heroImage: '' })); }

  };

  // Creator UGC Routine Moderation
  const handleModerateUGC = (id: string, action: 'approve' | 'flag') => {
    void reviewWorkspace(id, action === 'approve' ? 'APPROVED' : 'REJECTED', action === 'approve' ? 'Approved for the community feed.' : 'Please revise this submission.');
  };

  // Review Moderation
  const handleModerateReview = (reviewId: string, approve: boolean) => {
    void persist('/api/admin/reviews/' + reviewId, { status: approve ? 'approved' : 'rejected' }, 'Review moderation saved.', 'PATCH');
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

  if (loadingLive) return <div role="status" className="p-10 text-center">Loading your admin workspace…</div>;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F0F10] font-body flex selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      {/* ======================================================== */}
      {/* 1. LEFT MINIMALIST ICON DOCK                              */}
      {/* ======================================================== */}
      <aside className="hidden lg:flex sticky top-4 self-start h-[calc(100dvh-2rem)] shrink-0 flex-col items-center justify-between w-20 m-4 py-6 bg-white border border-[#EAE8E3] rounded-3xl shadow-[0_4px_24px_rgba(15,15,16,0.04)] z-20">
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
          <nav className="flex flex-col items-center gap-2.5 overflow-y-auto min-h-0 max-h-[calc(100dvh-15rem)] py-1 px-2">
            {[
              { id: 'overview', icon: LayoutGrid, label: 'Overview' },
              { id: 'products', icon: Package, label: 'Formulations & Taxonomy', badge: productsList.length },
              { id: 'cms', icon: Palette, label: 'Editorial CMS' },
              { id: 'orders', icon: ShoppingBag, label: 'Orders & Dispatch', badge: orders.filter((o) => o.status === 'PENDING').length },
              { id: 'applications', icon: UserCheck, label: 'Partner Applications', badge: pendingApplicationCount },
              { id: 'creators', icon: Award, label: 'Creator Press Room', badge: pendingCreatorAppsCount },
              { id: 'customers', icon: UserCheck, label: 'Customer Intelligence' },
              { id: 'inventory', icon: Boxes, label: 'Inventory Management', badge: inventoryItems.filter((i) => i.isLowStock).length || undefined },
              { id: 'network', icon: Building2, label: 'Distributor Hubs' },
              { id: 'claims', icon: CreditCard, label: 'NIP Claims', badge: pendingClaimsCount },
              { id: 'crypto', icon: Coins, label: 'Crypto Ledger', badge: pendingCryptoCount },
              { id: 'audit', icon: ShieldCheck, label: 'Security & Audit' }
            ].filter(tab => canOpen(tab.id)).map((tab) => {
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
      <div className="flex-1 min-w-0 flex flex-col p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
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
            {/* Direct Inventory Console Button */}
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2 rounded-full border text-xs font-bold shadow-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-[#0F0F10] text-[#D4AF37] border-[#0F0F10]'
                  : 'bg-white text-[#0F0F10] border-[#D4AF37]/50 hover:bg-[#FAF9F6]'
              }`}
            >
              <Boxes className="w-3.5 h-3.5 text-[#997A2E]" />
              <span>Inventory Management</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#FAF9F6] border border-[#EAE8E3] text-[#0F0F10]">
                5 Hubs
              </span>
            </button>

            {/* Quick Export CSV */}
            <button
              onClick={exportOperationalLedgerCsv}
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
            { id: 'inventory', label: 'Inventory Management' },
            { id: 'products', label: `Catalog (${productsList.length})` },
            { id: 'cms', label: 'Editorial CMS' },
            { id: 'orders', label: `Orders (${orders.length})` },
            { id: 'applications', label: `Partner Applications (${pendingApplicationCount})` },
            { id: 'creators', label: `Creators (${creatorsList.length})` },
            { id: 'customers', label: `Customers (${customersList.length})` },
            { id: 'claims', label: `Claims (${pendingClaimsCount})` },
            { id: 'crypto', label: `Crypto (${pendingCryptoCount})` },
            { id: 'network', label: 'Partner Network' },
            { id: 'audit', label: 'Security Audit' }
          ].filter(tab => canOpen(tab.id)).map((tab) => (
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
        {activeTab === 'applications' && <PartnerApplicationsPanel onReviewed={() => setRefreshTick(value => value + 1)} />}
        {activeTab === 'overview' && can('partners:review') && <section aria-label="Pending partner applications" className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[#EAE8E3] bg-white p-5">
          <div><h2 className="font-heading text-lg font-bold">Partner Applications</h2><p className="text-sm text-[#71717A]">{pendingApplications.creators} creator requests · {pendingApplications.distributors} distributor requests · {pendingApplications.programmes} programme requests awaiting review</p>{applicationsError && <p role="alert" className="text-sm text-rose-700">{applicationsError}</p>}</div>
          <button type="button" onClick={() => setActiveTab('applications')} className="rounded-full bg-[#0F0F10] px-5 py-3 text-sm text-white">Review partner applications</button>
        </section>}
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
                        DESLA!™ SALES
                      </span>
                      <span className="text-[9.5px] font-mono bg-white/10 px-2 py-0.5 rounded-full border border-white/10 text-white/90">
                        ORDER RECORDS
                      </span>
                    </div>
                    <span className="font-heading font-bold tracking-widest text-sm text-[#D4AF37]">
                      RESERVE
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-6 rounded bg-gradient-to-r from-[#D4AF37] to-[#E6CA65] border border-amber-300 shadow-xs" />
                    <span className="text-[11px] font-mono text-[#D4AF37]/90 tracking-wider">
                      RECENT PAID ORDER VOLUME
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <span className="block text-[10px] uppercase font-mono text-white/60">
                        Recent paid order volume
                      </span>
                      <span className="text-2xl font-mono font-bold tracking-tight text-white">
                        {isLiveBackend ? `₦${orders.filter(o => o.paymentStatus === 'PAID').reduce((sum, o) => sum + o.totalNgn, 0).toLocaleString()}` : '₦0'}
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
                  <span className="text-[10px] font-mono text-[#71717A]">Loaded operational records</span>
                </div>

                {(() => {
                  const cardInflow = orders
                    .filter(o => o.paymentStatus === 'PAID' && !(o.paymentMethod?.toLowerCase().includes('transfer') || o.paymentMethod?.toLowerCase().includes('crypto')))
                    .reduce((sum, o) => sum + (o.totalNgn || 0), 0);
                  const transferInflow = orders
                    .filter(o => o.paymentStatus === 'PAID' && (o.paymentMethod?.toLowerCase().includes('transfer') || o.paymentMethod?.toLowerCase().includes('nip')))
                    .reduce((sum, o) => sum + (o.totalNgn || 0), 0);
                  const cryptoInflow = cryptoTransactions
                    .filter(t => t.status === 'COMPLETED' || t.status === 'PAID')
                    .reduce((sum, t) => sum + (t.amountNgn || 0), 0);

                  return (
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3]">
                        <div className="flex items-center gap-2.5">
                          <CreditCard className="w-4 h-4 text-[#0F0F10]" />
                          <span className="font-medium text-[#0F0F10]">Hosted Gateway (Cards / Online)</span>
                        </div>
                        <span className="font-mono font-bold text-[#0F0F10]">₦{cardInflow.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3]">
                        <div className="flex items-center gap-2.5">
                          <Building2 className="w-4 h-4 text-[#0F0F10]" />
                          <span className="font-medium text-[#0F0F10]">NIP Bank Transfers</span>
                        </div>
                        <span className="font-mono font-bold text-[#0F0F10]">₦{transferInflow.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3]">
                        <div className="flex items-center gap-2.5">
                          <Coins className="w-4 h-4 text-[#D4AF37]" />
                          <span className="font-medium text-[#0F0F10]">Web3 Escrow (Crypto)</span>
                        </div>
                        <span className="font-mono font-bold text-[#0F0F10]">₦{cryptoInflow.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Right 8 Cols: Sales Velocity & Ledger */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Stat Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs">
                  <span className="text-[10px] font-mono uppercase text-[#71717A] block">Paid sales in loaded orders</span>
                  <span className="text-xl font-heading font-extrabold text-[#0F0F10] mt-1 block">
                    {isLiveBackend ? `₦${orders.filter(o => o.paymentStatus === 'PAID').reduce((sum, o) => sum + o.totalNgn, 0).toLocaleString()}` : '₦0'}
                  </span>
                  <span className="text-[10px] font-mono text-[#0F0F10] flex items-center gap-1 mt-0.5">
                    <TrendingUp className="w-3 h-3 text-[#D4AF37]" /> {isLiveBackend ? 'Latest 100 orders' : 'No historical comparison'}
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
                {(() => {
                  const now = Date.now();
                  const weekMs = (chartRange === 'annually' ? 91.3125 : 7) * 24 * 60 * 60 * 1000;
                  const paidOrders = orders.filter(order => order.paymentStatus === 'PAID');
                  const w1 = paidOrders.filter(o => now - new Date(o.createdAt || 0).getTime() <= weekMs);
                  const w2 = paidOrders.filter(o => { const d = now - new Date(o.createdAt || 0).getTime(); return d > weekMs && d <= 2 * weekMs; });
                  const w3 = paidOrders.filter(o => { const d = now - new Date(o.createdAt || 0).getTime(); return d > 2 * weekMs && d <= 3 * weekMs; });
                  const w4 = paidOrders.filter(o => { const d = now - new Date(o.createdAt || 0).getTime(); return d > 3 * weekMs && d <= 4 * weekMs; });

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                        {[
                          { label: (chartRange === 'annually' ? 'Q ' : 'WK ') + '1', count: w1.length, vol: w1.reduce((s, o) => s + (o.totalNgn || 0), 0) },
                          { label: (chartRange === 'annually' ? 'Q ' : 'WK ') + '2', count: w2.length, vol: w2.reduce((s, o) => s + (o.totalNgn || 0), 0) },
                          { label: (chartRange === 'annually' ? 'Q ' : 'WK ') + '3', count: w3.length, vol: w3.reduce((s, o) => s + (o.totalNgn || 0), 0) },
                          { label: (chartRange === 'annually' ? 'Q ' : 'WK ') + '4', count: w4.length, vol: w4.reduce((s, o) => s + (o.totalNgn || 0), 0) },
                        ].map((w) => (
                          <div key={w.label} className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3]">
                            <span className="text-[10px] font-mono text-[#71717A] block">{w.label}</span>
                            <span className="text-sm font-bold font-mono text-[#0F0F10] block mt-0.5">{w.count} orders</span>
                            <span className="text-[10px] font-mono text-[#D4AF37] block">₦{w.vol.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A] pt-2 border-t border-[#EAE8E3]">
                        <span>Multi-channel fulfillment</span>
                        <span className="font-bold text-[#0F0F10]">Active velocity tracked across {orders.length} orders</span>
                      </div>
                    </div>
                  );
                })()}
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

              {/* Regional Multi-Hub Inventory Health & Live Reorder Matrix */}
              <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#997A2E] font-bold">
                        Stock Telemetry
                      </span>
                      <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ● 5 Regional Hubs Operational
                      </span>
                    </div>
                    <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                      Multi-Hub Inventory Distribution &amp; Health
                    </h3>
                  </div>

                  <button
                    onClick={() => setActiveTab('inventory')}
                    className="px-4 py-2 rounded-full bg-[#0F0F10] text-[#D4AF37] hover:bg-[#27272A] text-xs font-bold font-mono flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs active:scale-95 transition-all"
                  >
                    <Boxes className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Open Full 5-Hub Matrix</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                  {[
                    { hub: 'Central Lab', units: inventoryItems.reduce((acc, i) => acc + i.centralStock, 0), badge: 'Master Lab' },
                    { hub: 'Lagos Hub', units: inventoryItems.reduce((acc, i) => acc + i.lagosHub, 0), badge: 'High Velocity' },
                    { hub: 'Abuja Wuse', units: inventoryItems.reduce((acc, i) => acc + i.abujaHub, 0), badge: 'Healthy' },
                    { hub: 'Port Harcourt', units: inventoryItems.reduce((acc, i) => acc + i.phHub, 0), badge: 'Low Buffer' },
                    { hub: 'Kano Hub', units: inventoryItems.reduce((acc, i) => acc + i.kanoHub, 0), badge: 'Reorder Due' }
                  ].map((h) => (
                    <div key={h.hub} className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-center">
                      <span className="text-[10px] font-mono text-[#71717A] block truncate">{h.hub}</span>
                      <span className="text-lg font-heading font-extrabold text-[#0F0F10] block mt-0.5">
                        {h.units}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full inline-block mt-1 ${
                        h.badge === 'Reorder Due' || h.badge === 'Low Buffer'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-white text-[#71717A] border border-[#EAE8E3]'
                      }`}>
                        {h.badge}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="divide-y divide-[#EAE8E3] pt-1">
                  {inventoryItems.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#0F0F10] block">{item.productName}</span>
                        <span className="font-mono text-[10px] text-[#71717A]">
                          SKU: {item.sku} • Central: {item.centralStock} • Lagos: {item.lagosHub} • Abuja: {item.abujaHub} • PH: {item.phHub} • Kano: {item.kanoHub}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-[#0F0F10] block">
                          {item.centralStock + item.lagosHub + item.abujaHub + item.phHub + item.kanoHub} Units Total
                        </span>
                        {item.isLowStock ? (
                          <span className="text-[9px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.2 rounded-full">
                            Low Buffer Warning
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full">
                            Optimal Stock
                          </span>
                        )}
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
                <span className="text-[10px] font-mono text-[#0F0F10]">Natural Formulations</span>
              </div>

              <div className="p-4 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs">
                <span className="text-[10px] font-mono text-[#71717A] block uppercase">Published Live</span>
                <span className="text-xl font-heading font-extrabold text-[#0F0F10] mt-1 block">
                  {productsList.filter((p) => isLiveBackend ? p.isActive : p.inStock).length}
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
                                {p.tagline || p.subCategory || 'Natural Formulation'}
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
                            {(isLiveBackend ? p.isActive : p.inStock) ? 'Published' : 'Draft'}
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
                  Edit your content, then publish all editorial changes to the storefront.
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-mono">
                {[
                  { id: 'hero', label: '1. Hero Slideshow' },
                  { id: 'routine', label: '2. 3-Chapter Ritual' },
                  { id: 'story', label: '3. Brand Story' },
                  { id: 'ticker', label: '4. Announcement Ticker' },
                  ...(can('reviews:moderate') ? [{ id: 'posts', label: '5. Posts & Videos' }] : [])
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

            <button type="button" onClick={async () => { try { await publishStorefront(); setActionNotice('Editorial changes published to the storefront.'); } catch (error) { setActionNotice(error instanceof Error ? error.message : 'Publication failed.'); } }} className="rounded-full bg-[#0F0F10] px-6 py-3 text-sm text-white">Publish editorial changes</button>

            {cmsSubTab === 'hero' && <HeroCmsEditor />}
            {cmsSubTab === 'posts' && <AdminContentComposer />}

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
                    Edit the formulation assignments, copy, and natural benefit bullets for the customer home ritual.
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
                            Natural Key Benefit &amp; Image
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
                      void publishStorefront().then(() => setActionNotice('Brand story published.')).catch(error => setActionNotice(error.message));
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
                            disabled={orderUpdatingId === order.id || !can('orders:update:status')}
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                            className="bg-[#FAF9F6] border border-[#EAE8E3] rounded-full px-3 py-1 text-xs font-mono font-bold text-[#0F0F10] outline-none cursor-pointer"
                          >
                            <option value={order.status}>{order.status}</option>
                            {(({ PENDING: ['CANCELLED'], PAID: ['FULFILLING'], FULFILLING: ['READY_PICKUP', 'SHIPPED'], READY_PICKUP: ['DELIVERED'], SHIPPED: ['DELIVERED'] } as Record<string, string[]>)[order.status] || []).map(status => <option key={status} value={status}>{status}</option>)}
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
            {isLiveBackend && <AdminReviewQueue records={workspaceRows} review={reviewWorkspace} />}
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
                  <Award className="w-3.5 h-3.5" /> Campaign Briefs ({creatorCampaigns.length})
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
                    <strong className="text-lg font-mono font-black text-[#0F0F10] mt-1 block">{`₦${creatorsList.reduce((sum, creator) => sum + (creator.totalSalesNgn || 0), 0).toLocaleString()}`}</strong>
                    <span className="text-[10px] text-[#997A2E] font-medium">Recorded attributed orders</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-[#EAE8E3] shadow-xs">
                    <span className="text-[10px] font-mono uppercase text-[#71717A] block font-bold">Commissions Settled</span>
                    <strong className="text-lg font-mono font-black text-[#0F0F10] mt-1 block">Ledger only</strong>
                    <span className="text-[10px] text-[#71717A]">No automated payout claimed</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-[#EAE8E3] shadow-xs">
                    <span className="text-[10px] font-mono uppercase text-[#71717A] block font-bold">Outstanding Balances</span>
                    <strong className="text-lg font-mono font-black text-[#997A2E] mt-1 block">Ledger only</strong>
                    <span className="text-[10px] text-[#71717A]">Pending withdrawal</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-[#EAE8E3] shadow-xs">
                    <span className="text-[10px] font-mono uppercase text-[#71717A] block font-bold">Active Roster Size</span>
                    <strong className="text-lg font-mono font-black text-[#0F0F10] mt-1 block">{creatorsList.length} Partners</strong>
                    <span className="text-[10px] text-[#71717A]">Approved partner roster</span>
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
                            Approve application
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
                <AdminReviewQueue records={workspaceRows.filter(record => record.kind === 'PR_REQUEST')} review={reviewWorkspace} />
                {/* 3A: PR Box Requests Queue */}
                <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4">
                  <div>
                    <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                      Partner PR Package Dispatch Queue ({prRequests.length})
                    </h3>
                    <p className="text-xs text-[#71717A]">
                      Review requests from approved creators and distributors, then record the actual dispatch reference.
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

                        {req.status === 'APPROVED' ? (
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
                            src={box.thumbnail || undefined}
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
                          src={camp.heroImage || undefined}
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
            {isLiveBackend && can('roles:grant') && <AdminAccessPanel />}
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
        {activeTab === 'inventory' && <AdminInventoryConsole />}

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
        {/* ======================================================== */}
        {/* WORKSPACE: CRYPTO OPERATIONS LEDGER                     */}
        {/* ======================================================== */}
        {activeTab === 'crypto' && (
          <div className="p-6 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-6 animate-in fade-in duration-200">
            {/* Header & Metrics */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE8E3]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                    Cryptocurrency Escrow &amp; On-Chain Ledger
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#997A2E] text-[11px] font-mono font-bold">
                    Web3 Settlement
                  </span>
                </div>
                <p className="text-xs text-[#71717A] mt-0.5">
                  Track, verify, and reconcile decentralized multi-chain customer payments in real-time.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (isLiveBackend) {
                      apiFetch<any>('/api/admin/crypto/transactions')
                        .then(d => setCryptoTransactions(d.transactions || []))
                        .catch(() => {});
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#FAF9F6] border border-[#EAE8E3] hover:bg-gray-100 text-xs font-semibold text-[#0F0F10] flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>Refresh Ledger</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3]">
                <span className="text-[11px] font-semibold text-[#71717A] block">Total Transactions</span>
                <span className="text-lg font-bold font-price text-[#0F0F10] mt-1 block">
                  {cryptoTransactions.length}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60">
                <span className="text-[11px] font-semibold text-amber-800 block">Pending Escrow</span>
                <span className="text-lg font-bold font-price text-amber-900 mt-1 block">
                  {cryptoTransactions.filter(t => t.status === 'PENDING').length}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
                <span className="text-[11px] font-semibold text-emerald-800 block">Settled On-Chain</span>
                <span className="text-lg font-bold font-price text-emerald-900 mt-1 block">
                  {cryptoTransactions.filter(t => t.status === 'COMPLETED').length}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3]">
                <span className="text-[11px] font-semibold text-[#71717A] block">Total Volume (NGN)</span>
                <span className="text-lg font-bold font-price text-[#0F0F10] mt-1 block">
                  ₦{cryptoTransactions.reduce((acc, t) => acc + (Number(t.amountNgn) || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Success / Error notification */}
            {adminCryptoSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{adminCryptoSuccess}</span>
              </div>
            )}
            {adminCryptoError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 font-medium">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{adminCryptoError}</span>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
                <input
                  type="text"
                  placeholder="Search by Order #, email, txHash, or address…"
                  value={cryptoSearch}
                  onChange={(e) => setCryptoSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#EAE8E3] text-xs focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37]/50"
                />
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
                {(['ALL', 'PENDING', 'COMPLETED', 'EXPIRED'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setCryptoFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      cryptoFilter === filter
                        ? 'bg-[#0F0F10] text-[#D4AF37]'
                        : 'bg-[#FAF9F6] text-[#71717A] hover:bg-gray-100'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#EAE8E3]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F6] border-b border-[#EAE8E3] text-[#71717A] uppercase text-[10px] font-mono tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Order / Time</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Asset &amp; Network</th>
                    <th className="py-3 px-4">Crypto Amount</th>
                    <th className="py-3 px-4">NGN Value</th>
                    <th className="py-3 px-4">TxHash / Explorer</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE8E3]">
                  {filteredCryptoTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-[#71717A]">
                        No cryptocurrency transactions match the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCryptoTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#FAF9F6]/60 transition-colors">
                        <td className="py-3 px-4 font-mono">
                          <span className="font-bold text-[#0F0F10] block">
                            #{tx.orderNumber || tx.orderId?.slice(0, 8)}
                          </span>
                          <span className="text-[10px] text-[#71717A]">
                            {new Date(tx.createdAt || Date.now()).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-[#0F0F10] block truncate max-w-[140px]">
                            {tx.customerEmail || 'Guest Buyer'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            tx.asset === 'USDT' ? 'bg-emerald-100 text-emerald-800' :
                            tx.asset === 'BTC' ? 'bg-amber-100 text-amber-800' :
                            tx.asset === 'ETH' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {tx.asset} • {tx.network}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#0F0F10]">
                          {tx.totalCrypto || tx.cryptoAmount} {tx.asset}
                        </td>
                        <td className="py-3 px-4 font-price font-semibold text-[#0F0F10]">
                          ₦{(Number(tx.amountNgn) || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {tx.txHash ? (
                            <a
                              href={
                                tx.network === 'TRC20' ? `https://tronscan.org/#/transaction/${tx.txHash}` :
                                tx.asset === 'BTC' ? `https://mempool.space/tx/${tx.txHash}` :
                                tx.asset === 'SOL' ? `https://solscan.io/tx/${tx.txHash}` :
                                `https://etherscan.io/tx/${tx.txHash}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#997A2E] hover:underline flex items-center gap-1"
                              title="View on block explorer"
                            >
                              <span>{tx.txHash.slice(0, 8)}…{tx.txHash.slice(-6)}</span>
                              <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span className="text-[#71717A] italic">Awaiting TXID</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                            tx.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              tx.status === 'COMPLETED' ? 'bg-emerald-500' :
                              tx.status === 'PENDING' ? 'bg-amber-500 animate-pulse' :
                              'bg-gray-400'
                            }`} />
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {tx.status === 'PENDING' ? (
                            <button
                              onClick={() => {
                                setManualVerifyPaymentId(tx.id);
                                setManualVerifyTxHash(tx.txHash || '');
                              }}
                              className="py-1 px-3 rounded-lg bg-[#0F0F10] text-[#D4AF37] hover:bg-[#27272A] text-xs font-semibold cursor-pointer"
                            >
                              Verify
                            </button>
                          ) : (
                            <span className="text-[#71717A] text-[11px] font-medium">Settled</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Manual Verify Modal */}
            {manualVerifyPaymentId && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-[#EAE8E3] animate-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-[#EAE8E3]">
                    <h4 className="font-heading font-bold text-sm text-[#0F0F10]">
                      Staff Manual On-Chain Verification
                    </h4>
                    <button
                      onClick={() => setManualVerifyPaymentId(null)}
                      className="text-[#71717A] hover:text-[#0F0F10] text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-xs text-[#71717A]">
                    Enter or confirm the blockchain transaction hash to mark this payment settled and unlock the order for fulfilment.
                  </p>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#0F0F10] block">
                      Transaction Hash (TxHash / TXID)
                    </label>
                    <input
                      type="text"
                      value={manualVerifyTxHash}
                      onChange={(e) => setManualVerifyTxHash(e.target.value)}
                      placeholder="e.g. 0xabc... or tron hash"
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE8E3] font-mono text-xs focus:ring-2 focus:ring-[#D4AF37]/50"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isVerifyingAdminCrypto}
                      onClick={() => handleManualVerifyCrypto(manualVerifyPaymentId, manualVerifyTxHash)}
                      className="flex-1 py-2.5 rounded-xl bg-[#0F0F10] hover:bg-[#27272A] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isVerifyingAdminCrypto ? <Loader2 size={14} className="animate-spin text-[#D4AF37]" /> : <CheckCircle2 size={14} className="text-[#D4AF37]" />}
                      <span>Confirm &amp; Settle Order</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualVerifyPaymentId(null)}
                      className="px-4 py-2.5 rounded-xl bg-white border border-[#EAE8E3] text-xs font-semibold text-[#71717A] hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
                        onClick={() => isLiveBackend ? void persist('/api/admin/categories', { id: cat.id }, 'Category deleted.', 'DELETE') : deleteCategory(cat.id)}
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
                  placeholder="e.g. Natural Climate Defense Press Kit"
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
                  Included catalogue products
                </label>
                <select multiple required aria-label="PR kit products" value={newPRBoxForm.productIds} onChange={event => setNewPRBoxForm(form => ({ ...form, productIds: Array.from(event.target.selectedOptions, option => option.value) }))} className="w-full rounded-xl border p-3 text-sm">
                  {appProducts.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}
                </select>
                <label className="mt-3 block text-xs font-semibold">Partner audience<select aria-label="PR kit audience" value={newPRBoxForm.audience} onChange={event => setNewPRBoxForm(form => ({ ...form, audience: event.target.value as 'CREATOR' | 'DISTRIBUTOR' | 'ALL' }))} className="mt-1 w-full rounded-xl border p-3"><option value="CREATOR">Creators</option><option value="DISTRIBUTOR">Distributors</option><option value="ALL">Creators and distributors</option></select></label>
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
                Publish PR kit
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
