import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  Search,
  Plus,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Building2,
  FileSpreadsheet,
  Truck,
  RotateCcw,
  SlidersHorizontal,
  Package,
  Layers,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  X,
  ExternalLink
} from 'lucide-react';
import { apiFetch } from '../../lib/owned-api';
import { useApp } from '../../context/AppContext';
import { AdminInventoryItem, LabRestockShipment, StockMovementLog } from '../../types';

export const AdminInventoryConsole: React.FC = () => {
  const {
    inventoryItems: previewInventoryItems,
    adjustStock: previewAdjustStock,
    transferStock: previewTransferStock,
    updateStockThreshold,
    stockMovementLogs: previewStockMovementLogs,
    labShipments: previewLabShipments,
    addLabShipment,
    updateShipmentStatus,
    wholesaleCartons,
    products,
    isLiveBackend,
    toggleProductStock
  } = useApp();

  const [liveInventory, setLiveInventory] = useState<any>(null);
  const [liveError, setLiveError] = useState('');
  const refreshInventory = async () => { setLiveInventory(await apiFetch('/api/admin/inventory/overview?limit=100')); };
  useEffect(() => { if (isLiveBackend) void refreshInventory().catch(error => setLiveError(error.message)); }, [isLiveBackend]);
  const locations: any[] = liveInventory?.locations || [];
  const matrix: any[] = liveInventory?.matrix || [];
  const cityKey = (locationId: string) => { if (locationId === '00000000-0000-4000-8000-000000000001') return 'centralStock'; const city = locations.find(l => l.id === locationId)?.city?.toLowerCase(); return ({ lagos: 'lagosHub', abuja: 'abujaHub', 'port harcourt': 'phHub', kano: 'kanoHub' } as Record<string,string>)[city] || 'centralStock'; };
  const grouped = new Map<string, AdminInventoryItem>();
  for (const row of matrix) {
    const item = grouped.get(row.variantId) || { id: row.variantId, sku: row.sku, productName: row.productName, category: '', centralStock: 0, lagosHub: 0, abujaHub: 0, phHub: 0, kanoHub: 0, lowStockThreshold: 10, isLowStock: false };
    if (row.pool === 'PLATFORM') (item as any)[cityKey(row.locationId)] += row.onHand || 0;
    item.isLowStock = item.centralStock + item.lagosHub + item.abujaHub + item.phHub + item.kanoHub <= 10;
    grouped.set(row.variantId, item);
  }
  const inventoryItems = isLiveBackend ? [...grouped.values()] : previewInventoryItems;
  const stockMovementLogs: StockMovementLog[] = isLiveBackend ? (liveInventory?.movements || []).map((m: any) => ({ id: m.id, sku: grouped.get(m.variantId)?.sku || m.variantId, productName: grouped.get(m.variantId)?.productName || '', action: m.delta > 0 ? 'STOCK_IN' : 'STOCK_OUT', quantity: Math.abs(m.delta), fromHub: m.delta < 0 ? locations.find(l => l.id === m.locationId)?.name : '', toHub: m.delta > 0 ? locations.find(l => l.id === m.locationId)?.name : '', actor: '', reason: m.reason, timestamp: m.createdAt })) : previewStockMovementLogs;
  const labShipments: LabRestockShipment[] = isLiveBackend ? (liveInventory?.transfers || []).map((t: any) => ({ id: t.id, batchNumber: t.id, courier: '', trackingNumber: '', destinationHub: locations.find(l => l.id === t.destinationLocationId)?.name || '', itemCount: 0, status: t.status === 'RECEIVED' ? 'DELIVERED' : 'IN_TRANSIT', dispatchedAt: t.dispatchedAt, estimatedArrival: '' })) : previewLabShipments;
  const resolveLocation = (hub: string) => {
    if (locations.some(location => location.id === hub)) return hub;
    if (hub === 'central') return '00000000-0000-4000-8000-000000000001';
    const city = ({ lagos: 'lagos', abuja: 'abuja', ph: 'port harcourt', kano: 'kano' } as Record<string,string>)[hub];
    const matches = locations.filter(l => l.city?.toLowerCase() === city && l.id !== '00000000-0000-4000-8000-000000000001');
    if (matches.length !== 1) throw new Error('Select an exact location in Distributor Hubs; this city has zero or multiple locations.');
    return matches[0].id;
  };
  const adjustStock: typeof previewAdjustStock = async (sku, hub, delta, reason, notes) => {
    if (!isLiveBackend) return previewAdjustStock(sku, hub, delta, reason, notes);
    const item = inventoryItems.find(i => i.sku === sku || i.id === sku);
    if (!item) throw new Error('Select a live SKU.');
    await apiFetch('/api/admin/inventory', { method: 'POST', body: JSON.stringify({ variantId: item.id, locationId: resolveLocation(hub), delta, reason: `${reason} ${notes || ''}`.trim().slice(0,200) }) });
    await refreshInventory();
  };
  const transferStock: typeof previewTransferStock = async (sku, fromHub, toHub, quantity, notes) => {
    if (!isLiveBackend) return previewTransferStock(sku, fromHub, toHub, quantity, notes);
    const item = inventoryItems.find(i => i.sku === sku || i.id === sku);
    if (!item) throw new Error('Select a live SKU.');
    await apiFetch('/api/admin/inventory/transfers', { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ action: 'transfer', sourceLocationId: resolveLocation(fromHub), destinationLocationId: resolveLocation(toHub), items: [{ variantId: item.id, qty: quantity }], note: notes || '' }) });
    await refreshInventory();
  };

  // Sub-tabs
  const [subTab, setSubTab] = useState<'matrix' | 'movements' | 'lab' | 'pricebook'>('matrix');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOW' | 'OPTIMAL' | 'DEPLETED'>('ALL');
  const [selectedHub, setSelectedHub] = useState<'all' | 'central' | 'lagos' | 'abuja' | 'ph' | 'kano'>('all');

  // Modals state
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isNewLabShipmentModalOpen, setIsNewLabShipmentModalOpen] = useState(false);

  // Selected item for modals
  const [activeItem, setActiveItem] = useState<AdminInventoryItem | null>(null);

  // Form states
  const [stockInForm, setStockInForm] = useState({
    sku: '',
    hub: 'central' as 'central' | 'lagos' | 'abuja' | 'ph' | 'kano',
    quantity: 50,
    batchNumber: 'BATCH-2026-05A',
    expiryDate: '2028-10-31',
    note: 'Factory intake from certified natural lab'
  });

  const [transferForm, setTransferForm] = useState({
    sku: '',
    fromHub: 'central' as 'central' | 'lagos' | 'abuja' | 'ph' | 'kano',
    toHub: 'lagos' as 'central' | 'lagos' | 'abuja' | 'ph' | 'kano',
    quantity: 25,
    courier: 'Cold-Chain Logistics Fleet',
    note: 'Routine regional allocation restock'
  });

  const [adjustForm, setAdjustForm] = useState({
    sku: '',
    hub: 'lagos' as 'central' | 'lagos' | 'abuja' | 'ph' | 'kano',
    delta: -2,
    reason: 'Damaged packaging during regional transit',
    notes: 'Seal broke in outer carton; discarded safely.'
  });

  const [newShipmentForm, setNewShipmentForm] = useState({
    destinationHub: 'Lagos Victoria Island Central Hub',
    itemCount: 300,
    batchNumber: 'BATCH-2026-06L',
    courier: 'GIG Cold-Chain Logistics',
    trackingNumber: 'GIG-NG-991204',
    eta: 'Tomorrow, within 24 hours'
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Metrics Calculations
  const metrics = useMemo(() => {
    let totalUnits = 0;
    let lowStockCount = 0;
    let depletedCount = 0;
    let totalValuation = 0;

    inventoryItems.forEach((item) => {
      const itemTotal = item.centralStock + item.lagosHub + item.abujaHub + item.phHub + item.kanoHub;
      totalUnits += itemTotal;
      if (itemTotal === 0) depletedCount++;
      else if (item.isLowStock || itemTotal <= item.lowStockThreshold) lowStockCount++;

      // Approximate wholesale valuation at ₦16,000 per unit average
      totalValuation += itemTotal * 16000;
    });

    return { totalUnits, lowStockCount, depletedCount, totalValuation };
  }, [inventoryItems]);

  // Filtered inventory list
  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const match =
          item.productName.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query);
        if (!match) return false;
      }
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }
      const itemTotal = item.centralStock + item.lagosHub + item.abujaHub + item.phHub + item.kanoHub;
      if (statusFilter === 'DEPLETED' && itemTotal > 0) return false;
      if (statusFilter === 'LOW' && (!item.isLowStock || itemTotal === 0)) return false;
      if (statusFilter === 'OPTIMAL' && (item.isLowStock || itemTotal <= item.lowStockThreshold)) return false;
      return true;
    });
  }, [inventoryItems, searchQuery, categoryFilter, statusFilter]);

  // Unique categories for filter dropdown
  const categories = useMemo(() => {
    return Array.from(new Set(inventoryItems.map((i) => i.category)));
  }, [inventoryItems]);

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = [
      'SKU',
      'Product Name',
      'Category',
      'Central Stock',
      'Lagos Hub',
      'Abuja Hub',
      'PH Hub',
      'Kano Hub',
      'Total Stock',
      'Low Stock Threshold',
      'Status'
    ];
    const rows = inventoryItems.map((item) => {
      const total = item.centralStock + item.lagosHub + item.abujaHub + item.phHub + item.kanoHub;
      const status = total === 0 ? 'Out of Stock' : item.isLowStock ? 'Low Stock' : 'Optimal';
      return [
        `"${item.sku}"`,
        `"${item.productName}"`,
        `"${item.category}"`,
        item.centralStock,
        item.lagosHub,
        item.abujaHub,
        item.phHub,
        item.kanoHub,
        total,
        item.lowStockThreshold,
        status
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Desla_Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Inventory report exported as CSV successfully.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {liveError && <p role="alert">{liveError}</p>}
      {isLiveBackend && <p className="text-xs text-gray-600">Platform stock only. Regional columns group locations by city; other locations are included in Central. Wholesale stock is managed separately in Distributor Hubs.</p>}
      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-semibold flex items-center justify-between shadow-xl animate-in slide-in-from-top-2">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#D4AF37]" /> {toastMessage}
          </span>
          <button onClick={() => setToastMessage(null)} className="text-white hover:text-white/80 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* 1. Executive Operations Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs">
          <div className="flex items-center justify-between text-[#71717A] mb-2">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Total Active Units</span>
            <Boxes size={18} className="text-[#0F0F10]" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0F0F10]">
            {metrics.totalUnits.toLocaleString('en-NG')}
          </div>
          <p className="text-[11px] text-[#71717A] mt-1 font-mono">{isLiveBackend ? `Across ${locations.length} inventory locations` : 'Across 5 Nationwide Depots'}</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs">
          <div className="flex items-center justify-between text-[#71717A] mb-2">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Wholesale Inventory GMV</span>
            <Building2 size={18} className="text-[#997A2E]" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0F0F10]">
            {isLiveBackend ? 'Not reconciled' : `₦${(metrics.totalValuation / 1_000_000).toFixed(1)}M`}
          </div>
          <p className="text-[11px] text-[#71717A] mt-1 font-mono">{isLiveBackend ? 'Cost basis is not configured' : 'Cost Basis @ ₦16K/unit avg'}</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs">
          <div className="flex items-center justify-between text-[#71717A] mb-2">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Low Stock Warnings</span>
            <AlertTriangle size={18} className="text-[#D4AF37]" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0F0F10] flex items-center gap-2">
            <span>{metrics.lowStockCount}</span>
            {metrics.lowStockCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#FBF5E8] text-[#997A2E] font-mono font-bold">
                Action Required
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#71717A] mt-1 font-mono">Under minimum reserve threshold</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs">
          <div className="flex items-center justify-between text-[#71717A] mb-2">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider">Lab Shipments In Transit</span>
            <Truck size={18} className="text-[#0F0F10]" />
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-[#0F0F10]">
            {labShipments.filter((s) => s.status === 'IN_TRANSIT').length}
          </div>
          <p className="text-[11px] text-[#71717A] mt-1 font-mono">Cold-chain tracked batches</p>
        </div>
      </div>

      {/* 2. Top Action Controls & Sub-Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'matrix', label: `Master SKU Matrix (${inventoryItems.length})`, icon: Boxes },
            { id: 'movements', label: `Stock Movement Logs (${stockMovementLogs.length})`, icon: Clock },
            { id: 'lab', label: `Lab Restock Batches (${labShipments.length})`, icon: Truck },
            { id: 'pricebook', label: `Carton Price Book (${wholesaleCartons.length})`, icon: Layers }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0F0F10] text-[#D4AF37] shadow-xs'
                    : 'text-[#71717A] hover:bg-[#FAF9F6] hover:text-[#0F0F10]'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Operations Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => {
              setStockInForm((prev) => ({
                ...prev,
                sku: inventoryItems[0]?.sku || ''
              }));
              setIsStockInModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-[#D4AF37] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={14} className="text-[#D4AF37]" />
            <span>+ Stock In</span>
          </button>

          <button
            onClick={() => {
              setTransferForm((prev) => ({
                ...prev,
                sku: inventoryItems[0]?.sku || ''
              }));
              setIsTransferModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-full bg-white hover:bg-[#FAF9F6] text-[#0F0F10] border border-[#EAE8E3] text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <ArrowRightLeft size={13} className="text-[#997A2E]" />
            <span>Transfer Hubs</span>
          </button>

          <button
            onClick={() => setIsNewLabShipmentModalOpen(true)}
            className="px-3.5 py-2 rounded-full bg-white hover:bg-[#FAF9F6] text-[#0F0F10] border border-[#EAE8E3] text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Truck size={13} className="text-[#71717A]" />
            <span>Dispatch Lab Batch</span>
          </button>

          <button
            onClick={handleExportCSV}
            title="Download CSV Inventory Report"
            className="p-2 rounded-full bg-white hover:bg-[#FAF9F6] text-[#71717A] hover:text-[#0F0F10] border border-[#EAE8E3] shadow-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet size={15} />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: MASTER SKU INVENTORY MATRIX                      */}
      {/* ======================================================== */}
      {subTab === 'matrix' && (
        <div className="space-y-4">
          {/* Search, Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search formulations by SKU, name, or category..."
                className="w-full pl-9 pr-4 py-2 rounded-full bg-[#FAF9F6] border border-[#EAE8E3] text-xs text-[#0F0F10] placeholder-[#71717A] focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-full bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-medium text-[#0F0F10] focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Stock Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-full bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-medium text-[#0F0F10] focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Stock Levels</option>
                <option value="LOW">Low Stock Alert (&le; Threshold)</option>
                <option value="OPTIMAL">Optimal Health</option>
                <option value="DEPLETED">Depleted (0 Units)</option>
              </select>

              {/* Hub Highlight */}
              <select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value as any)}
                className="px-3 py-1.5 rounded-full bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-medium text-[#0F0F10] focus:outline-none cursor-pointer"
              >
                <option value="all">View All 5 Depots</option>
                <option value="central">Central Laboratory</option>
                <option value="lagos">Lagos Central Hub</option>
                <option value="abuja">Abuja Wuse Hub</option>
                <option value="ph">Port Harcourt GRA Hub</option>
                <option value="kano">Kano City Hub</option>
              </select>
            </div>
          </div>

          {/* Master Table */}
          <div className="rounded-3xl bg-white border border-[#EAE8E3] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAF9F6] text-[#71717A] font-mono text-[10px] uppercase border-b border-[#EAE8E3]">
                  <tr>
                    <th className="py-3 px-4">Formulation / SKU</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-3 text-center">Central Lab</th>
                    <th className="py-3 px-3 text-center">Lagos Hub</th>
                    <th className="py-3 px-3 text-center">Abuja Hub</th>
                    <th className="py-3 px-3 text-center">PH Hub</th>
                    <th className="py-3 px-3 text-center">Kano Hub</th>
                    <th className="py-3 px-3 text-center font-bold">Total Stock</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE8E3]">
                  {filteredItems.map((item) => {
                    const totalUnits =
                      item.centralStock + item.lagosHub + item.abujaHub + item.phHub + item.kanoHub;
                    const isDepleted = totalUnits === 0;
                    const isLow = item.isLowStock || totalUnits <= item.lowStockThreshold;

                    return (
                      <tr key={item.id} className="hover:bg-[#FAF9F6]/60 transition-colors">
                        {/* Formulation & SKU */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-[#0F0F10] block">{item.productName}</span>
                            <span className="font-mono text-[10px] text-[#71717A]">SKU: {item.sku}</span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 text-[#71717A]">
                          <span className="px-2 py-0.5 rounded-full bg-[#FAF9F6] border border-[#EAE8E3] text-[10px] font-mono">
                            {item.category}
                          </span>
                        </td>

                        {/* Central Lab */}
                        <td className={`py-3.5 px-3 text-center font-mono ${selectedHub === 'central' ? 'bg-[#FBF5E8] font-bold text-[#997A2E]' : 'text-[#0F0F10]'}`}>
                          {item.centralStock}
                        </td>

                        {/* Lagos */}
                        <td className={`py-3.5 px-3 text-center font-mono ${selectedHub === 'lagos' ? 'bg-[#FBF5E8] font-bold text-[#997A2E]' : 'text-[#0F0F10]'}`}>
                          <span className={item.lagosHub <= 15 ? 'text-rose-600 font-bold' : ''}>
                            {item.lagosHub}
                          </span>
                        </td>

                        {/* Abuja */}
                        <td className={`py-3.5 px-3 text-center font-mono ${selectedHub === 'abuja' ? 'bg-[#FBF5E8] font-bold text-[#997A2E]' : 'text-[#0F0F10]'}`}>
                          <span className={item.abujaHub <= 15 ? 'text-rose-600 font-bold' : ''}>
                            {item.abujaHub}
                          </span>
                        </td>

                        {/* PH */}
                        <td className={`py-3.5 px-3 text-center font-mono ${selectedHub === 'ph' ? 'bg-[#FBF5E8] font-bold text-[#997A2E]' : 'text-[#0F0F10]'}`}>
                          <span className={item.phHub <= 10 ? 'text-rose-600 font-bold' : ''}>
                            {item.phHub}
                          </span>
                        </td>

                        {/* Kano */}
                        <td className={`py-3.5 px-3 text-center font-mono ${selectedHub === 'kano' ? 'bg-[#FBF5E8] font-bold text-[#997A2E]' : 'text-[#0F0F10]'}`}>
                          <span className={item.kanoHub <= 10 ? 'text-rose-600 font-bold' : ''}>
                            {item.kanoHub}
                          </span>
                        </td>

                        {/* Total Units */}
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-[#0F0F10]">
                          {totalUnits}
                        </td>

                        {/* Health Status */}
                        <td className="py-3.5 px-3 text-center">
                          {isDepleted ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-mono font-bold">
                              Depleted
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-mono font-bold flex items-center justify-center gap-1">
                              <AlertTriangle size={10} /> Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
                              Optimal
                            </span>
                          )}
                        </td>

                        {/* Quick Action Buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setActiveItem(item);
                                setStockInForm((prev) => ({ ...prev, sku: item.sku }));
                                setIsStockInModalOpen(true);
                              }}
                              title="Restock / Add Stock"
                              className="p-1.5 rounded-lg text-[#0F0F10] hover:bg-[#FAF9F6] border border-transparent hover:border-[#EAE8E3] transition-colors cursor-pointer"
                            >
                              <Plus size={13} />
                            </button>

                            <button
                              onClick={() => {
                                setActiveItem(item);
                                setTransferForm((prev) => ({ ...prev, sku: item.sku }));
                                setIsTransferModalOpen(true);
                              }}
                              title="Transfer to another Regional Hub"
                              className="p-1.5 rounded-lg text-[#997A2E] hover:bg-[#FAF9F6] border border-transparent hover:border-[#EAE8E3] transition-colors cursor-pointer"
                            >
                              <ArrowRightLeft size={13} />
                            </button>

                            <button
                              onClick={() => {
                                setActiveItem(item);
                                setAdjustForm((prev) => ({ ...prev, sku: item.sku }));
                                setIsAdjustModalOpen(true);
                              }}
                              title="Damage Write-off / Audit Adjustment"
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                            >
                              <TrendingDown size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: STOCK MOVEMENT AUDIT LEDGER                      */}
      {/* ======================================================== */}
      {subTab === 'movements' && (
        <div className="rounded-3xl bg-white border border-[#EAE8E3] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#EAE8E3] flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-[#0F0F10]">
                Stock Movement &amp; Intake Audit Ledger
              </h3>
              <p className="text-xs text-[#71717A] mt-0.5">
                Cryptographically tracked record of factory intakes, regional hub dispatches, and damaged write-offs.
              </p>
            </div>
            <span className="text-xs font-mono text-[#997A2E] font-bold">
              {stockMovementLogs.length} Logged Entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] text-[#71717A] font-mono text-[10px] uppercase border-b border-[#EAE8E3]">
                <tr>
                  <th className="py-3 px-4">Timestamp &amp; Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">SKU / Item</th>
                  <th className="py-3 px-3 text-center">Quantity</th>
                  <th className="py-3 px-4">Origin Hub</th>
                  <th className="py-3 px-4">Destination Hub</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE8E3]">
                {stockMovementLogs.map((log) => {
                  const isPositive = log.action === 'STOCK_IN' || log.action === 'RESTOCK_RECEIVED';
                  const isNegative = log.action === 'STOCK_OUT' || log.action === 'DAMAGE_WRITE_OFF';

                  return (
                    <tr key={log.id} className="hover:bg-[#FAF9F6]/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-[#0F0F10] block">{log.timestamp}</span>
                        <span className="text-[11px] text-[#71717A]">{log.actor}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isNegative
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-[#FAF9F6] text-[#0F0F10] border border-[#EAE8E3]'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-[#0F0F10] block">{log.productName}</span>
                        <span className="text-[10px] text-[#71717A]">{log.sku}</span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-bold">
                        <span className={isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-600' : 'text-[#0F0F10]'}>
                          {isPositive ? `+${log.quantity}` : isNegative ? `-${log.quantity}` : log.quantity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#71717A] text-[11px]">{log.fromHub || '—'}</td>
                      <td className="py-3.5 px-4 text-[#0F0F10] font-semibold text-[11px]">{log.toHub || '—'}</td>
                      <td className="py-3.5 px-4 text-[#71717A] max-w-xs truncate">{log.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 3: CENTRAL LAB BATCH SHIPMENTS                      */}
      {/* ======================================================== */}
      {subTab === 'lab' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-[#0F0F10]">
                Central Laboratory Batch Shipments (#LAB-409)
              </h3>
              <p className="text-xs text-[#71717A] mt-0.5">
                Active natural restock batches in transit to Nigerian regional hubs. Marking a batch &quot;Delivered&quot; automatically integrates units into destination hub stock.
              </p>
            </div>
            <button
              onClick={() => setIsNewLabShipmentModalOpen(true)}
              className="px-4 py-2 rounded-full bg-[#0F0F10] text-[#D4AF37] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={14} />
              <span>Dispatch New Batch</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {labShipments.map((ship) => (
              <div
                key={ship.id}
                className="p-5 rounded-3xl bg-white border border-[#EAE8E3] shadow-xs space-y-4 hover:border-[#D4AF37] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-[#997A2E] tracking-wider">
                      Batch Restock Shipment
                    </span>
                    <h4 className="font-heading font-extrabold text-lg text-[#0F0F10] mt-0.5 font-mono">
                      {ship.batchNumber}
                    </h4>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                      ship.status === 'DELIVERED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : ship.status === 'IN_TRANSIT'
                        ? 'bg-[#0F0F10] text-[#D4AF37]'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {ship.status}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">Destination Hub:</span>
                    <strong className="text-[#0F0F10]">{ship.destinationHub}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">Carton Payload:</span>
                    <strong className="font-mono text-[#0F0F10]">{ship.itemCount} Formulations</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#71717A]">Courier Assigned:</span>
                    <span className="text-[#0F0F10]">{ship.courier}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#EAE8E3] pt-2 font-mono">
                    <span className="text-[#71717A]">Tracking Code:</span>
                    <strong className="text-[#997A2E]">{ship.trackingNumber}</strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#71717A]">
                    <span>ETA: {ship.estimatedArrival}</span>
                    <span>Dispatched: {ship.dispatchedAt}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#EAE8E3]">
                  {ship.status === 'IN_TRANSIT' ? (
                    <button
                      onClick={async () => {
                        if (isLiveBackend) { try { await apiFetch('/api/admin/inventory/transfers', { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ action: 'receive', transferId: ship.id }) }); await refreshInventory(); showToast('Transfer received. Stock is available at the destination.'); } catch (error) { showToast(error instanceof Error ? error.message : 'Receipt failed.'); } return; }
                        updateShipmentStatus(ship.id, 'DELIVERED');
                        showToast(`Batch ${ship.batchNumber} marked DELIVERED. Units integrated into ${ship.destinationHub}!`);
                      }}
                      className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <CheckCircle2 size={14} />
                      <span>Confirm Hub Arrival (Deliver)</span>
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-700 font-mono font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} /> Stock Integrated
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 4: MASTER CARTON PRICE BOOK & MARGINS               */}
      {/* ======================================================== */}
      {subTab === 'pricebook' && isLiveBackend && <p className="rounded-2xl border p-5 text-sm">Manage persisted wholesale prices and invoices in Distributor Hubs → Network settings.</p>}
      {subTab === 'pricebook' && !isLiveBackend && (
        <div className="rounded-3xl bg-white border border-[#EAE8E3] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#EAE8E3] flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-[#0F0F10]">
                Wholesale Master Carton Price Book
              </h3>
              <p className="text-xs text-[#71717A] mt-0.5">
                Official Tier-1 &amp; Tier-2 wholesale distributor prices (configured wholesale price books).
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] text-[#71717A] font-mono text-[10px] uppercase border-b border-[#EAE8E3]">
                <tr>
                  <th className="py-3 px-4">Master Carton Formulation</th>
                  <th className="py-3 px-4 font-mono">SKU</th>
                  <th className="py-3 px-4 text-center">Units per Carton</th>
                  <th className="py-3 px-4 text-right">Wholesale Price</th>
                  <th className="py-3 px-4 text-right">Retail Carton Value</th>
                  <th className="py-3 px-4 text-center">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE8E3]">
                {wholesaleCartons.map((wc) => (
                  <tr key={wc.id} className="hover:bg-[#FAF9F6]/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#0F0F10]">{wc.name}</td>
                    <td className="py-3.5 px-4 font-mono text-[#71717A]">{wc.sku}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-[#0F0F10]">
                      {wc.cartonUnits} Units
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0F0F10]">
                      ₦{wc.wholesalePrice.toLocaleString('en-NG')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#71717A]">
                      ₦{wc.retailCartonValue.toLocaleString('en-NG')}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-[#997A2E]">
                      {wc.marginPercent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: STOCK IN / INTAKE FORMULATION                   */}
      {/* ======================================================== */}
      {isStockInModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F0F10]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#EAE8E3] overflow-hidden">
            <div className="p-6 border-b border-[#EAE8E3] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
                  Factory Intake Protocol
                </span>
                <h3 className="font-heading font-extrabold text-xl text-[#0F0F10]">Stock In / Add Batch</h3>
              </div>
              <button
                onClick={() => setIsStockInModalOpen(false)}
                className="p-2 rounded-full hover:bg-[#FAF9F6] text-[#71717A] hover:text-[#0F0F10] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try { await adjustStock(
                  stockInForm.sku,
                  stockInForm.hub,
                  Number(stockInForm.quantity),
                  'Factory Batch Intake',
                  `Lot #${stockInForm.batchNumber}`
                ); } catch (error) { showToast(error instanceof Error ? error.message : "Stock update failed."); return; }
                setIsStockInModalOpen(false);
                showToast(`Successfully added ${stockInForm.quantity} units to ${stockInForm.hub.toUpperCase()} Hub!`);
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-[#0F0F10] mb-1">Select Formulation SKU</label>
                <select
                  value={stockInForm.sku}
                  onChange={(e) => setStockInForm({ ...stockInForm, sku: e.target.value })}
                  className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-mono font-bold focus:outline-none focus:border-[#D4AF37]"
                  required
                >
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.sku}>
                      {item.productName} ({item.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0F0F10] mb-1">Target Depot / Hub</label>
                  <select
                    value={stockInForm.hub}
                    onChange={(e) => setStockInForm({ ...stockInForm, hub: e.target.value as any })}
                    className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-bold focus:outline-none focus:border-[#D4AF37]"
                  >
                    {isLiveBackend ? <><option value="">Select location</option>{locations.map(location => <option key={location.id} value={location.id === '00000000-0000-4000-8000-000000000001' ? 'central' : location.id}>{location.name} ({location.code})</option>)}</> : <><option value="central">Central Laboratory</option>
                    <option value="lagos">Lagos Central Hub</option>
                    <option value="abuja">Abuja Wuse Hub</option>
                    <option value="ph">Port Harcourt Hub</option>
                    <option value="kano">Kano City Hub</option>
                  </>}</select>
                </div>

                <div>
                  <label className="block font-bold text-[#0F0F10] mb-1">Units Quantity (+)</label>
                  <input
                    type="number"
                    min="1"
                    value={stockInForm.quantity}
                    onChange={(e) => setStockInForm({ ...stockInForm, quantity: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-mono font-bold focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0F0F10] mb-1">Batch / Lot Number</label>
                  <input
                    type="text"
                    value={stockInForm.batchNumber}
                    onChange={(e) => setStockInForm({ ...stockInForm, batchNumber: e.target.value })}
                    className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-mono focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F0F10] mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={stockInForm.expiryDate}
                    onChange={(e) => setStockInForm({ ...stockInForm, expiryDate: e.target.value })}
                    className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0F0F10] mb-1">Audit Ledger Note</label>
                <input
                  type="text"
                  value={stockInForm.note}
                  onChange={(e) => setStockInForm({ ...stockInForm, note: e.target.value })}
                  className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setIsStockInModalOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-[#EAE8E3] text-xs font-semibold text-[#71717A] hover:bg-[#FAF9F6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#0F0F10] text-[#D4AF37] font-bold text-xs shadow-md hover:bg-[#27272A] cursor-pointer"
                >
                  Confirm Stock Intake
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: INTER-HUB STOCK TRANSFER                        */}
      {/* ======================================================== */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F0F10]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#EAE8E3] overflow-hidden">
            <div className="p-6 border-b border-[#EAE8E3] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
                  Regional Redistribution
                </span>
                <h3 className="font-heading font-extrabold text-xl text-[#0F0F10]">Inter-Hub Stock Transfer</h3>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-2 rounded-full hover:bg-[#FAF9F6] text-[#71717A] hover:text-[#0F0F10] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try { await transferStock(
                  transferForm.sku,
                  transferForm.fromHub,
                  transferForm.toHub,
                  Number(transferForm.quantity),
                  transferForm.note
                ); } catch (error) { showToast(error instanceof Error ? error.message : "Stock update failed."); return; }
                setIsTransferModalOpen(false);
                showToast(`Transferred ${transferForm.quantity} units from ${transferForm.fromHub.toUpperCase()} to ${transferForm.toHub.toUpperCase()} Hub!`);
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-[#0F0F10] mb-1">Select Formulation SKU</label>
                <select
                  value={transferForm.sku}
                  onChange={(e) => setTransferForm({ ...transferForm, sku: e.target.value })}
                  className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-mono font-bold focus:outline-none focus:border-[#D4AF37]"
                  required
                >
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.sku}>
                      {item.productName} ({item.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0F0F10] mb-1">Origin (From Hub)</label>
                  <select
                    value={transferForm.fromHub}
                    onChange={(e) => setTransferForm({ ...transferForm, fromHub: e.target.value as any })}
                    className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-bold focus:outline-none focus:border-[#D4AF37]"
                  >
                    {isLiveBackend ? <><option value="">Select location</option>{locations.map(location => <option key={location.id} value={location.id === '00000000-0000-4000-8000-000000000001' ? 'central' : location.id}>{location.name} ({location.code})</option>)}</> : <><option value="central">Central Laboratory</option>
                    <option value="lagos">Lagos Central Hub</option>
                    <option value="abuja">Abuja Wuse Hub</option>
                    <option value="ph">Port Harcourt Hub</option>
                    <option value="kano">Kano City Hub</option>
                  </>}</select>
                </div>

                <div>
                  <label className="block font-bold text-[#0F0F10] mb-1">Destination (To Hub)</label>
                  <select
                    value={transferForm.toHub}
                    onChange={(e) => setTransferForm({ ...transferForm, toHub: e.target.value as any })}
                    className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-bold focus:outline-none focus:border-[#D4AF37]"
                  >
                    {isLiveBackend ? <><option value="">Select location</option>{locations.map(location => <option key={location.id} value={location.id === '00000000-0000-4000-8000-000000000001' ? 'central' : location.id}>{location.name} ({location.code})</option>)}</> : <><option value="lagos">Lagos Central Hub</option>
                    <option value="abuja">Abuja Wuse Hub</option>
                    <option value="ph">Port Harcourt Hub</option>
                    <option value="kano">Kano City Hub</option>
                    <option value="central">Central Laboratory</option>
                  </>}</select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0F0F10] mb-1">Transfer Units</label>
                  <input
                    type="number"
                    min="1"
                    value={transferForm.quantity}
                    onChange={(e) => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-mono font-bold focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F0F10] mb-1">Courier / Carrier</label>
                  <input
                    type="text"
                    value={transferForm.courier}
                    onChange={(e) => setTransferForm({ ...transferForm, courier: e.target.value })}
                    className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0F0F10] mb-1">Transfer Reference / Manifest Note</label>
                <input
                  type="text"
                  value={transferForm.note}
                  onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
                  className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-[#EAE8E3] text-xs font-semibold text-[#71717A] hover:bg-[#FAF9F6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#0F0F10] text-[#D4AF37] font-bold text-xs shadow-md hover:bg-[#27272A] cursor-pointer"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: AUDIT ADJUSTMENT / DAMAGE WRITE-OFF             */}
      {/* ======================================================== */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F0F10]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#EAE8E3] overflow-hidden">
            <div className="p-6 border-b border-[#EAE8E3] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600">
                  Write-off &amp; Reconciliation
                </span>
                <h3 className="font-heading font-extrabold text-xl text-[#0F0F10]">Stock Deduction / Adjustment</h3>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-2 rounded-full hover:bg-[#FAF9F6] text-[#71717A] hover:text-[#0F0F10] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try { await adjustStock(
                  adjustForm.sku,
                  adjustForm.hub,
                  Number(adjustForm.delta),
                  adjustForm.reason,
                  adjustForm.notes
                ); } catch (error) { showToast(error instanceof Error ? error.message : "Stock update failed."); return; }
                setIsAdjustModalOpen(false);
                showToast(`Logged adjustment of ${adjustForm.delta} units in ${adjustForm.hub.toUpperCase()} Hub.`);
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-[#0F0F10] mb-1">Select Formulation SKU</label>
                <select
                  value={adjustForm.sku}
                  onChange={(e) => setAdjustForm({ ...adjustForm, sku: e.target.value })}
                  className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-mono font-bold focus:outline-none focus:border-[#D4AF37]"
                  required
                >
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.sku}>
                      {item.productName} ({item.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0F0F10] mb-1">Depot Location</label>
                  <select
                    value={adjustForm.hub}
                    onChange={(e) => setAdjustForm({ ...adjustForm, hub: e.target.value as any })}
                    className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-bold focus:outline-none focus:border-[#D4AF37]"
                  >
                    {isLiveBackend ? <><option value="">Select location</option>{locations.map(location => <option key={location.id} value={location.id === '00000000-0000-4000-8000-000000000001' ? 'central' : location.id}>{location.name} ({location.code})</option>)}</> : <><option value="lagos">Lagos Central Hub</option>
                    <option value="abuja">Abuja Wuse Hub</option>
                    <option value="ph">Port Harcourt Hub</option>
                    <option value="kano">Kano City Hub</option>
                    <option value="central">Central Laboratory</option>
                  </>}</select>
                </div>

                <div>
                  <label className="block font-bold text-[#0F0F10] mb-1">Units Adjustment (Negative)</label>
                  <input
                    type="number"
                    max="-1"
                    value={adjustForm.delta}
                    onChange={(e) => setAdjustForm({ ...adjustForm, delta: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-mono font-bold text-rose-600 focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0F0F10] mb-1">Reason Classification</label>
                <select
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="Damaged packaging during regional transit">Transit Damage (Broken Bottle / Compromised Seal)</option>
                  <option value="Natural laboratory QC sample dispatch">QC Laboratory Re-testing Sample</option>
                  <option value="Expired shelf-life stock disposal">Expired Shelf-Life Disposal</option>
                  <option value="Inventory cycle count discrepancy reconciliation">Inventory Count Audit Discrepancy</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0F0F10] mb-1">Mandatory Audit Note</label>
                <textarea
                  rows={2}
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs focus:outline-none focus:border-[#D4AF37]"
                  placeholder="Detail the root cause or ticket number..."
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-[#EAE8E3] text-xs font-semibold text-[#71717A] hover:bg-[#FAF9F6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Confirm Deduction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: DISPATCH NEW CENTRAL LAB SHIPMENT               */}
      {/* ======================================================== */}
      {isNewLabShipmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F0F10]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#EAE8E3] overflow-hidden">
            <div className="p-6 border-b border-[#EAE8E3] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
                  Cold-Chain Logistics
                </span>
                <h3 className="font-heading font-extrabold text-xl text-[#0F0F10]">Dispatch Central Lab Batch</h3>
              </div>
              <button
                onClick={() => setIsNewLabShipmentModalOpen(false)}
                className="p-2 rounded-full hover:bg-[#FAF9F6] text-[#71717A] hover:text-[#0F0F10] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const newShipment: LabRestockShipment = {
                  id: `lab-${Date.now()}`,
                  batchNumber: newShipmentForm.batchNumber,
                  courier: newShipmentForm.courier,
                  trackingNumber: newShipmentForm.trackingNumber,
                  destinationHub: newShipmentForm.destinationHub,
                  itemCount: Number(newShipmentForm.itemCount),
                  status: 'IN_TRANSIT',
                  dispatchedAt: 'Just now',
                  estimatedArrival: newShipmentForm.eta
                };
                if (isLiveBackend) { showToast('Use Move Stock to dispatch a transfer with actual SKUs and quantities.'); return; }
                addLabShipment(newShipment);
                setIsNewLabShipmentModalOpen(false);
                showToast(`Batch ${newShipmentForm.batchNumber} dispatched to ${newShipmentForm.destinationHub}!`);
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-[#0F0F10] mb-1">Destination Regional Hub</label>
                <select
                  value={newShipmentForm.destinationHub}
                  onChange={(e) => setNewShipmentForm({ ...newShipmentForm, destinationHub: e.target.value })}
                  className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-bold focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="Lagos Victoria Island Central Hub">Lagos Victoria Island Central Hub</option>
                  <option value="Abuja Wuse 2 Distribution Hub">Abuja Wuse 2 Distribution Hub</option>
                  <option value="Port Harcourt GRA Regional Hub">Port Harcourt GRA Regional Hub</option>
                  <option value="Kano City Distribution Depot">Kano City Distribution Depot</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0F0F10] mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={newShipmentForm.batchNumber}
                    onChange={(e) => setNewShipmentForm({ ...newShipmentForm, batchNumber: e.target.value })}
                    className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-mono font-bold focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F0F10] mb-1">Total Units Count</label>
                  <input
                    type="number"
                    min="1"
                    value={newShipmentForm.itemCount}
                    onChange={(e) => setNewShipmentForm({ ...newShipmentForm, itemCount: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-mono font-bold focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0F0F10] mb-1">Courier Service</label>
                  <input
                    type="text"
                    value={newShipmentForm.courier}
                    onChange={(e) => setNewShipmentForm({ ...newShipmentForm, courier: e.target.value })}
                    className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F0F10] mb-1">Tracking Code</label>
                  <input
                    type="text"
                    value={newShipmentForm.trackingNumber}
                    onChange={(e) => setNewShipmentForm({ ...newShipmentForm, trackingNumber: e.target.value })}
                    className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-mono focus:outline-none focus:border-[#D4AF37]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0F0F10] mb-1">Estimated Arrival ETA</label>
                <input
                  type="text"
                  value={newShipmentForm.eta}
                  onChange={(e) => setNewShipmentForm({ ...newShipmentForm, eta: e.target.value })}
                  className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setIsNewLabShipmentModalOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-[#EAE8E3] text-xs font-semibold text-[#71717A] hover:bg-[#FAF9F6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#0F0F10] text-[#D4AF37] font-bold text-xs shadow-md hover:bg-[#27272A] cursor-pointer"
                >
                  Dispatch Cold-Chain Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
