import React, { useState, useEffect } from 'react';
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
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  AdminOrder,
  AdminTransferClaim,
  AdminInventoryItem,
  AdminAuditLog
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

export const ScreenAdminConsole: React.FC = () => {
  const { authUser, navigateTo, logout, isLiveBackend, isPreviewMode } = useApp();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'claims' | 'inventory' | 'audit' | 'network'>('overview');

  // Chart time range toggle
  const [chartRange, setChartRange] = useState<'monthly' | 'annually'>('monthly');

  // Live or fallback admin datasets
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
      totalKobo: 5200000,
      totalNgn: 52000,
      customerEmail: 'zara.ibrahim@example.com',
      customerName: 'Zara Ibrahim',
      customerCity: 'Kano (Nassarawa Hub)',
      itemsCount: 4,
      fulfillmentType: 'local'
    },
    {
      id: 'ord-105',
      orderNumber: 'DES-829098',
      createdAt: '4 hrs ago',
      status: 'PROCESSING',
      paymentStatus: 'PAID',
      totalKobo: 1980000,
      totalNgn: 19800,
      customerEmail: 'folake.ade@example.com',
      customerName: 'Folake Adeleke',
      customerCity: 'Port Harcourt Hub',
      itemsCount: 2,
      fulfillmentType: 'local'
    }
  ]);

  const [transferClaims, setTransferClaims] = useState<AdminTransferClaim[]>([
    {
      id: 'clm-001',
      orderId: 'ord-102',
      orderNumber: 'DES-829103',
      senderName: 'Emeka Okafor',
      bankName: 'GTBank Nigeria',
      amountKobo: 1420000,
      amountNgn: 14200,
      narration: 'DESLA 829103 Emeka',
      status: 'PENDING',
      createdAt: '24 mins ago'
    },
    {
      id: 'clm-002',
      orderId: 'ord-099',
      orderNumber: 'DES-829089',
      senderName: 'Chidinma Eze',
      bankName: 'Access Bank',
      amountKobo: 4850000,
      amountNgn: 48500,
      narration: 'Order 829089 Ekene',
      status: 'PENDING',
      createdAt: '1 hr ago'
    },
    {
      id: 'clm-003',
      orderId: 'ord-095',
      orderNumber: 'DES-829074',
      senderName: 'Fatima Sanusi',
      bankName: 'Zenith Bank',
      amountKobo: 2150000,
      amountNgn: 21500,
      narration: 'Apothecary butter',
      status: 'APPROVED',
      createdAt: 'Yesterday',
      reviewedBy: 'Selena Thorne'
    }
  ]);

  const [inventoryItems] = useState<AdminInventoryItem[]>([
    {
      id: 'inv-1',
      sku: 'DES-WHIP-250',
      productName: 'Raw Whipped Shea Butter (Vanilla & Amber)',
      category: 'Body Care',
      centralStock: 1250,
      lagosHub: 480,
      abujaHub: 120,
      phHub: 45,
      kanoHub: 80,
      lowStockThreshold: 50,
      isLowStock: false
    },
    {
      id: 'inv-2',
      sku: 'DES-EXT-50',
      productName: 'Extrait Perfume Oil (Oud & Spiced Cardamom)',
      category: 'Fine Fragrance',
      centralStock: 450,
      lagosHub: 320,
      abujaHub: 95,
      phHub: 12,
      kanoHub: 28,
      lowStockThreshold: 30,
      isLowStock: true
    },
    {
      id: 'inv-3',
      sku: 'DES-LIP-MCH',
      productName: 'Botanical Velvet Lip Glaze (Warm Mocha)',
      category: 'Lip Care',
      centralStock: 1800,
      lagosHub: 850,
      abujaHub: 240,
      phHub: 190,
      kanoHub: 140,
      lowStockThreshold: 100,
      isLowStock: false
    },
    {
      id: 'inv-4',
      sku: 'DES-GLW-SRM',
      productName: 'Clinical Hyperpigmentation 10% Azelaic Elixir',
      category: 'Facial Care',
      centralStock: 620,
      lagosHub: 210,
      abujaHub: 40,
      phHub: 8,
      kanoHub: 15,
      lowStockThreshold: 25,
      isLowStock: true
    }
  ]);

  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([
    {
      id: 'aud-1',
      timestamp: '09:12 AM',
      action: 'ROLE_GRANT',
      actor: 'Selena Thorne',
      role: 'SUPER_ADMIN',
      details: 'Elevated Dr. Adebayo to STAFF role for Lagos Island hub inspection.'
    },
    {
      id: 'aud-2',
      timestamp: '08:45 AM',
      action: 'INVENTORY_ADJUST',
      actor: 'Lagos Hub Dispatch',
      role: 'STAFF',
      details: 'Stock delta +250 units allocated to Ikeja distribution hub.'
    },
    {
      id: 'aud-3',
      timestamp: '07:30 AM',
      action: 'CLAIM_CONFIRMED',
      actor: 'Selena Thorne',
      role: 'SUPER_ADMIN',
      details: 'Approved manual bank transfer claim CLM-003 (₦21,500 Zenith Bank).'
    },
    {
      id: 'aud-4',
      timestamp: 'Yesterday',
      action: 'NAFDAC_BATCH_SEAL',
      actor: 'Quality Assurance',
      role: 'SYSTEM',
      details: 'Batch NG-4481 authenticated with 100% assay integrity.'
    }
  ]);

  // Loading & Action states
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [orderUpdatingId, setOrderUpdatingId] = useState<string | null>(null);
  const [claimProcessingId, setClaimProcessingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  // Data provenance: mock literals until the live backend answers (honest badge in header).
  const [dataSource, setDataSource] = useState<'live' | 'preview'>('preview');

  // Live central stock (owned backend inventory overview, flattened per variant).
  const [liveInventory, setLiveInventory] = useState<{ sku: string; productName: string; variantId: string; available: number }[] | null>(null);
  const [adjustInputs, setAdjustInputs] = useState<Record<string, string>>({});
  const [adjustingSku, setAdjustingSku] = useState<string | null>(null);
  const [adjustMessage, setAdjustMessage] = useState('');

  const flattenOverview = (items: { slug: string; name: string; variants: { id: string; sku: string; sizeLabel: string; available: number }[] }[]) =>
    items.flatMap((p) => p.variants.map((v) => ({ sku: v.sku, productName: `${p.name} (${v.sizeLabel})`, variantId: v.id, available: v.available })));

  const handleStockAdjust = async (variantId: string, sku: string) => {
    if (isPreviewMode) { setAdjustMessage('Preview data cannot change live stock.'); return; }
    const delta = Number.parseInt(adjustInputs[sku] ?? '', 10);
    if (!Number.isFinite(delta) || delta === 0) {
      setAdjustMessage('Enter a non-zero quantity (use a negative number to deduct).');
      return;
    }
    setAdjustingSku(sku);
    setAdjustMessage('');
    try {
      await adjustStockApi(variantId, delta, 'console adjustment');
      const items = await fetchInventoryOverview();
      if (items) setLiveInventory(flattenOverview(items));
      setAdjustInputs((prev) => ({ ...prev, [sku]: '' }));
      setAdjustMessage(`Stock updated for ${sku}.`);
    } catch {
      setAdjustMessage('Adjustment failed (staff permission required).');
    } finally {
      setAdjustingSku(null);
    }
  };

  // Fetch real admin data if backend is live
  useEffect(() => {
    if (!isOwnedApiConfigured || isPreviewMode) return;
    fetchAdminOrders()
      .then((res) => {
        if (res?.orders && res.orders.length > 0) {
          setOrders(res.orders);
          setDataSource('live');
        }
      })
      .catch(() => {});

    fetchAdminTransferClaims()
      .then((res) => {
        if (res?.claims && res.claims.length > 0) {
          setTransferClaims(res.claims);
          setDataSource('live');
        }
      })
      .catch(() => {});

    fetchAdminAudits(50)
      .then((res) => {
        if (res?.audit && res.audit.length > 0) {
          setAuditLogs(res.audit);
          setDataSource('live');
        }
      })
      .catch(() => {});

    fetchInventoryOverview()
      .then((items) => {
        if (items && items.length > 0) {
          setLiveInventory(flattenOverview(items));
          setDataSource('live');
        }
      })
      .catch(() => {});
  }, [isPreviewMode]);

  // Update order status live
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
      setTimeout(() => setActionNotice(null), 3500);
    } catch {
      setActionNotice('Failed to update status on server.');
    } finally {
      setOrderUpdatingId(null);
    }
  };

  // Review bank transfer claim live
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
      setTimeout(() => setActionNotice(null), 4000);
    } catch {
      setActionNotice('Failed to process claim.');
    } finally {
      setClaimProcessingId(null);
    }
  };

  // Filtered orders
  const displayedOrders = orders.filter((o) => {
    if (filterStatus === 'ALL') return true;
    return o.status === filterStatus;
  });

  const pendingClaimsCount = transferClaims.filter((c) => c.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-[#F4F6F5] text-[#0F0F10] font-body flex selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      {/* ======================================================== */}
      {/* 1. LEFT FLOATING VERTICAL ICON DOCK (Quixotic Aesthetic)  */}
      {/* ======================================================== */}
      <aside className="hidden lg:flex flex-col items-center justify-between w-20 m-4 py-7 bg-white/75 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_8px_32px_rgba(15,23,42,0.05)] z-20">
        <div className="flex flex-col items-center gap-6">
          {/* Brand Monogram */}
          <button
            onClick={() => navigateTo('home')}
            title="Go to Storefront"
            className="w-11 h-11 rounded-2xl bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center font-heading font-black text-lg shadow-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            D!
          </button>

          {/* Navigation Icon List */}
          <nav className="flex flex-col items-center gap-3">
            {[
              { id: 'overview', icon: LayoutGrid, label: 'Overview' },
              { id: 'orders', icon: ShoppingBag, label: 'Orders Queue' },
              { id: 'claims', icon: CreditCard, label: 'Transfer Claims', badge: pendingClaimsCount },
              { id: 'inventory', icon: Boxes, label: 'Inventory' },
              { id: 'network', icon: Building2, label: 'Partner Network' },
              { id: 'audit', icon: ShieldCheck, label: 'Audit Log' }
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
                      ? 'bg-[#0F4A38] text-white shadow-md shadow-[#0F4A38]/20'
                      : 'text-[#6B7280] hover:bg-white/80 hover:text-[#0F0F10]'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[1.8]" />
                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center">
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
            onClick={() => navigateTo('account')}
            title="Account Dossier"
            className="w-10 h-10 rounded-2xl text-[#6B7280] hover:text-[#0F0F10] hover:bg-white/80 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              logout();
              navigateTo('home');
            }}
            title="Sign Out"
            className="w-10 h-10 rounded-2xl text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MAIN CONTENT AREA                                     */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
        {/* TOP HEADER BAR */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#997A2E] bg-[#D4AF37]/10 px-2.5 py-0.5 rounded-full">
                Clinical Enterprise Operations
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> NAFDAC Portal Live
              </span>
              <span
                title={dataSource === 'live' ? 'Rows came from the owned backend just now' : 'Showing built-in preview rows — connect the backend or sign in as staff for live data'}
                className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  dataSource === 'live'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-amber-700 bg-amber-50 border-amber-200'
                }`}
              >
                {dataSource === 'live' ? '● LIVE DATA' : '○ PREVIEW DATA'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0F0F10] tracking-tight">
              Welcome Back, {authUser?.profile?.displayName || 'Selena Thorne'}
            </h1>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Managing real-time stock allocation &amp; dispatch queues across 14 African City Hubs.
            </p>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Range Pill */}
            <div className="px-3.5 py-2 rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 text-xs font-medium text-[#4B5563] shadow-xs flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
              <span>29 Sep, 2026 - 29 Oct, 2026</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
            </div>

            {/* Quick Export CSV */}
            <button
              onClick={() => alert('Exporting live operational ledger to CSV…')}
              className="px-4 py-2 rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 hover:bg-white text-xs font-semibold text-[#0F0F10] shadow-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Export CSV</span>
            </button>

            {/* Primary Action Button */}
            <button
              onClick={() => setActiveTab('inventory')}
              className="px-4 py-2 rounded-2xl bg-[#0F4A38] hover:bg-[#0B382A] text-white text-xs font-bold shadow-md shadow-[#0F4A38]/20 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>+ Allocate Stock</span>
            </button>
          </div>
        </header>

        {/* Global Toast Action Notice */}
        {actionNotice && (
          <div className="mb-5 p-3 rounded-2xl bg-[#0F0F10] text-white text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in duration-200">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {actionNotice}
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
            { id: 'orders', label: `Orders (${orders.length})` },
            { id: 'claims', label: `Claims (${pendingClaimsCount} Pending)` },
            { id: 'inventory', label: 'Inventory Matrix' },
            { id: 'network', label: 'Partner Network' },
            { id: 'audit', label: 'Security Audit' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#0F4A38] text-white shadow-xs'
                  : 'bg-white/80 text-[#6B7280] border border-white/90'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'network' && (
          <div className="mb-6 p-5 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
            {isPreviewMode ? <p className="rounded-2xl border bg-white p-6 text-sm">Network management is unavailable in preview mode. Sign in with an approved admin account for live operations.</p> : <NetworkPanel />}
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. ASYMMETRICAL 3-COLUMN GLASSMORPHISM GRID               */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ------------------------------------------------------ */}
          {/* COLUMN 1: EXECUTIVE & CASH FLOW (4 COLS)               */}
          {/* ------------------------------------------------------ */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* The Quixotic Emerald Green VISA / Vault Card */}
            <div className="relative rounded-3xl p-6 bg-gradient-to-br from-[#0F4A38] via-[#14532D] to-[#0A2E22] text-white shadow-xl shadow-[#0F4A38]/20 overflow-hidden border border-emerald-500/20">
              {/* Background Glows & Glass Texture */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#D4AF37]/15 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col justify-between h-48">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-heading font-black tracking-wider text-[#D4AF37]">
                      DESLA!™ VAULT
                    </span>
                    <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                      NAFDAC Tier-1
                    </span>
                  </div>
                  <span className="font-heading font-black tracking-widest text-lg opacity-90">
                    VISA
                  </span>
                </div>

                {/* EMV Contactless Chip Visual */}
                <div className="flex items-center gap-2">
                  <div className="w-9 h-7 rounded-md bg-gradient-to-r from-amber-200 to-amber-400 border border-amber-300 shadow-inner" />
                  <span className="text-[11px] font-mono text-emerald-200 tracking-wider">
                    •••• 909090
                  </span>
                </div>

                {/* Balance & Subtext */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">
                    NAFDAC Operating Reserves
                  </span>
                  <div className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight mt-0.5">
                    ₦78,989,090<span className="text-xs text-emerald-300 font-normal">.00</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-emerald-200/80 mt-1">
                    <span>Cardholder: CENTRAL OPS</span>
                    <span>EXP: 09/28</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Revenue Mini Glass Card */}
            <div className="p-5 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(15,23,42,0.04)] flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#6B7280]">
                  Weekly Dispatch Volume
                </span>
                <p className="text-2xl font-heading font-bold text-[#0F0F10] mt-1 tracking-tight">
                  +₦3,945,000
                </p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">Avg order value: ₦28,400</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +12.8%
                </span>
                <span className="text-[10px] text-[#9CA3AF]">vs previous week</span>
              </div>
            </div>

            {/* Quick Pending Claims Alert Banner */}
            <div className="p-5 rounded-3xl bg-amber-50/80 backdrop-blur-xl border border-amber-200/80 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-900">
                    {pendingClaimsCount} Transfer Claims Pending
                  </span>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Total unverified: ₦62,700 awaiting admin proof review.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('claims')}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
              >
                Review
              </button>
            </div>
          </div>

          {/* ------------------------------------------------------ */}
          {/* COLUMN 2: ANALYTICS & BAR CHART (5 COLS)               */}
          {/* ------------------------------------------------------ */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Quixotic Volume & Fulfillment Bar Chart */}
            <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(15,23,42,0.04)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00A86B]" />
                    <h3 className="text-sm font-heading font-bold text-[#0F0F10]">
                      Dispatch Volume &amp; Demand
                    </h3>
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Monthly localized delivery units fulfilled across regional cities.
                  </p>
                </div>

                {/* Monthly / Annually Pill Switcher */}
                <div className="flex bg-[#F3F4F6] p-1 rounded-full text-[11px] font-semibold">
                  <button
                    onClick={() => setChartRange('monthly')}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                      chartRange === 'monthly' ? 'bg-[#0F4A38] text-white shadow-xs' : 'text-[#6B7280]'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setChartRange('annually')}
                    className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                      chartRange === 'annually' ? 'bg-[#0F4A38] text-white shadow-xs' : 'text-[#6B7280]'
                    }`}
                  >
                    Annually
                  </button>
                </div>
              </div>

              {/* The Rounded Bar Chart Visualization */}
              <div className="h-52 flex items-end justify-between gap-2 pt-8 pb-2 px-2 relative">
                {[
                  { month: 'Jan', height: '42%', value: '1,240' },
                  { month: 'Feb', height: '55%', value: '1,890' },
                  { month: 'Mar', height: '48%', value: '1,520' },
                  { month: 'Apr', height: '95%', value: '4,820', active: true, tag: '+17.8%' },
                  { month: 'May', height: '68%', value: '2,400' },
                  { month: 'Jun', height: '60%', value: '2,150' },
                  { month: 'Jul', height: '72%', value: '2,890' },
                  { month: 'Aug', height: '58%', value: '2,020' },
                  { month: 'Sep', height: '84%', value: '3,750' }
                ].map((bar, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                    {/* Active Bar Floating Tooltip Badge */}
                    {bar.active && (
                      <div className="absolute -top-7 px-2 py-0.5 rounded-full bg-[#0F4A38] text-white text-[10px] font-bold shadow-md tracking-wider">
                        {bar.tag}
                      </div>
                    )}
                    <div
                      style={{ height: bar.height }}
                      className={`w-full max-w-[32px] rounded-full transition-all duration-300 ${
                        bar.active
                          ? 'bg-[#00A86B] shadow-md shadow-[#00A86B]/30'
                          : 'bg-[#A7F3D0] hover:bg-[#6EE7B7]'
                      }`}
                    />
                    <span className="text-[11px] font-medium text-[#6B7280]">
                      {bar.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hub Stock Matrix (Low Stock Cues) */}
            <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-heading font-bold text-[#0F0F10]">
                    Hub Inventory Allocation
                  </h3>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">Real-time stock across regional fulfilment centers</p>
                </div>
                <span className="text-[11px] font-mono text-[#D4AF37] font-bold">
                  4 Active SKUs
                </span>
              </div>

              {liveInventory ? (
                <div className="space-y-3">
                  {liveInventory.map((row) => (
                    <div key={row.sku} className="p-3 rounded-2xl bg-white/60 border border-white/80">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono text-[#9CA3AF] font-bold">{row.sku}</span>
                          <h4 className="text-xs font-bold text-[#0F0F10] leading-snug">{row.productName}</h4>
                        </div>
                        {row.available < 20 ? (
                          <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">Low stock</span>
                        ) : (
                          <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">Optimal</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E5E7EB]/60 text-[11px]">
                        <span className="font-mono">Available: <strong className="text-[#0F0F10]">{row.available}</strong></span>
                        <span className="flex items-center gap-1.5">
                          <input
                            value={adjustInputs[row.sku] ?? ''}
                            onChange={(e) => setAdjustInputs((prev) => ({ ...prev, [row.sku]: e.target.value }))}
                            placeholder="±qty"
                            inputMode="numeric"
                            aria-label={`Adjust stock for ${row.sku}`}
                            className="w-16 px-2 py-1 rounded-lg bg-white border border-[#E5E7EB] font-mono text-[11px] outline-none focus:border-[#D4AF37]"
                          />
                          <button
                            onClick={() => handleStockAdjust(row.variantId, row.sku)}
                            disabled={adjustingSku === row.sku}
                            className="px-2.5 py-1 rounded-lg bg-[#0F0F10] text-white text-[10px] font-bold active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {adjustingSku === row.sku ? '…' : 'Adjust'}
                          </button>
                        </span>
                      </div>
                    </div>
                  ))}
                  {adjustMessage && <p className="text-[11px] text-[#6B7280]">{adjustMessage}</p>}
                </div>
              ) : (
              <div className="space-y-3">
                {inventoryItems.map((item) => (
                  <div key={item.id} className="p-3 rounded-2xl bg-white/60 border border-white/80 hover:bg-white transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-[#9CA3AF] font-bold">{item.sku}</span>
                        <h4 className="text-xs font-bold text-[#0F0F10] leading-snug">{item.productName}</h4>
                      </div>
                      {item.isLowStock ? (
                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Low PH Hub
                        </span>
                      ) : (
                        <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          Optimal
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-[#E5E7EB]/60 text-[11px] font-mono text-center">
                      <div>
                        <span className="block text-[9px] text-[#9CA3AF] uppercase">Lagos</span>
                        <span className="font-bold text-[#0F0F10]">{item.lagosHub}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-[#9CA3AF] uppercase">Abuja</span>
                        <span className="font-bold text-[#0F0F10]">{item.abujaHub}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-[#9CA3AF] uppercase">PH Hub</span>
                        <span className={`font-bold ${item.phHub < 20 ? 'text-red-600' : 'text-[#0F0F10]'}`}>
                          {item.phHub}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-[#9CA3AF] uppercase">Kano</span>
                        <span className="font-bold text-[#0F0F10]">{item.kanoHub}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          </div>

          {/* ------------------------------------------------------ */}
          {/* COLUMN 3: CASH HEALTH & AUDIT STREAM (3 COLS)          */}
          {/* ------------------------------------------------------ */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Total Balance Curve & Actions */}
            <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
              <span className="text-xs font-semibold text-[#6B7280]">
                Total Available Cash Flow
              </span>
              <div className="text-2xl font-heading font-extrabold text-[#0F0F10] mt-1">
                ₦32,678,900
              </div>

              {/* Sparkline Curve Graphic */}
              <div className="h-20 my-3">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 200 60">
                  <defs>
                    <linearGradient id="curveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#00A86B" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#00A86B" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,45 Q30,10 60,35 T120,20 T180,40 T200,15 L200,60 L0,60 Z"
                    fill="url(#curveGrad)"
                  />
                  <path
                    d="M0,45 Q30,10 60,35 T120,20 T180,40 T200,15"
                    fill="none"
                    stroke="#00A86B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => setActiveTab('claims')}
                  className="py-2 px-3 rounded-xl bg-[#0F4A38] text-white text-xs font-bold hover:bg-[#0B382A] active:scale-95 transition-all text-center cursor-pointer"
                >
                  Claims ({pendingClaimsCount})
                </button>
                <button
                  onClick={() => alert('Generating financial statement…')}
                  className="py-2 px-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-[#0F0F10] text-xs font-semibold hover:bg-white active:scale-95 transition-all text-center cursor-pointer"
                >
                  Download
                </button>
              </div>
            </div>

            {/* Tamper-Evident Security Audit Stream */}
            <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                  <h3 className="text-sm font-heading font-bold text-[#0F0F10]">
                    Security Audit
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#16A34A] font-bold">Immutable</span>
              </div>

              <div className="space-y-3.5">
                {auditLogs.map((log) => (
                  <div key={log.id} className="text-xs border-l-2 border-[#D4AF37] pl-3 py-0.5">
                    <div className="flex items-center justify-between text-[10px] text-[#6B7280]">
                      <span className="font-mono font-bold text-[#0F0F10]">{log.action}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-[#4B5563] mt-1 leading-snug">
                      {log.details}
                    </p>
                    <span className="text-[9px] font-mono text-[#9CA3AF] mt-0.5 block">
                      Actor: {log.actor} ({log.role})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. FULL-WIDTH LIVE ORDERS & CLAIMS QUEUE TABLES           */}
        {/* ======================================================== */}
        <section className="mt-8 grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* LIVE REGIONAL ORDERS QUEUE (8 COLS) */}
          <div className="xl:col-span-8 p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                  Live Orders Queue (19 Backend Endpoints Wired)
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Real-time order statuses, courier assignments, and dispatch confirmation.
                </p>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
                      filterStatus === st
                        ? 'bg-[#0F0F10] text-[#D4AF37] font-bold shadow-xs'
                        : 'bg-[#F3F4F6] text-[#4B5563] hover:text-[#0F0F10]'
                    }`}
                  >
                    {st.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[11px] font-mono text-[#6B7280] uppercase tracking-wider">
                    <th className="py-3 px-3">Order #</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Hub City</th>
                    <th className="py-3 px-3 text-right">Total</th>
                    <th className="py-3 px-3">Payment</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]/70 text-xs">
                  {displayedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/80 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-[#0F0F10]">
                        #{order.orderNumber}
                        <span className="block text-[10px] font-normal text-[#9CA3AF] font-sans">
                          {order.createdAt}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-[#0F0F10] block">{order.customerName}</span>
                        <span className="text-[11px] text-[#6B7280]">{order.customerEmail}</span>
                      </td>
                      <td className="py-3.5 px-3 text-[#4B5563]">
                        {order.customerCity}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-[#0F0F10]">
                        ₦{order.totalNgn.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            order.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'SHIPPED'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'PROCESSING'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <select
                          disabled={orderUpdatingId === order.id}
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                          className="bg-white border border-[#D1D5DB] rounded-xl px-2.5 py-1 text-xs font-semibold text-[#0F0F10] outline-none focus:border-[#0F0F10] cursor-pointer"
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

          {/* BANK TRANSFER CLAIMS APPROVAL LIST (4 COLS) */}
          <div className="xl:col-span-4 p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-heading font-bold text-[#0F0F10]">
                  Transfer Claims Review
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Evidence on record for manual bank transfers.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                {pendingClaimsCount} Pending
              </span>
            </div>

            <div className="space-y-4">
              {transferClaims.map((claim) => (
                <div
                  key={claim.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    claim.status === 'PENDING'
                      ? 'bg-amber-50/60 border-amber-200'
                      : claim.status === 'APPROVED'
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-red-50/40 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[#0F0F10]">#{claim.orderNumber}</span>
                    <span className="font-extrabold text-[#0F4A38] text-sm">
                      ₦{claim.amountNgn.toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-2 text-xs">
                    <p className="font-semibold text-[#0F0F10]">{claim.senderName}</p>
                    <p className="text-[11px] text-[#6B7280]">{claim.bankName} • {claim.narration}</p>
                    <span className="text-[10px] text-[#9CA3AF] mt-0.5 block">{claim.createdAt}</span>
                  </div>

                  {claim.status === 'PENDING' ? (
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-amber-200/80">
                      <button
                        disabled={claimProcessingId === claim.id}
                        onClick={() => handleReviewClaim(claim.id, true)}
                        className="py-1.5 px-3 rounded-xl bg-[#00A86B] hover:bg-[#008F5B] text-white text-xs font-bold active:scale-95 transition-all text-center cursor-pointer flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        disabled={claimProcessingId === claim.id}
                        onClick={() => handleReviewClaim(claim.id, false)}
                        className="py-1.5 px-3 rounded-xl bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold active:scale-95 transition-all text-center cursor-pointer flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2.5 pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-[11px]">
                      <span className={`font-bold ${claim.status === 'APPROVED' ? 'text-emerald-700' : 'text-red-700'}`}>
                        {claim.status}
                      </span>
                      <span className="text-[#9CA3AF]">By {claim.reviewedBy || 'Admin'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
