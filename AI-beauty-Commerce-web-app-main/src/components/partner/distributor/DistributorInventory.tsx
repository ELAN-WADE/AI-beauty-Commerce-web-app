import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Truck,
  AlertTriangle,
  RefreshCw,
  Plus,
  CheckCircle2,
  SlidersHorizontal,
  X,
  TrendingDown,
  Building2
} from 'lucide-react';
import { FilterTabs } from '../shared/FilterTabs';
import { StatusBadge } from '../shared/StatusBadge';
import { StatChip } from '../shared/StatChip';
import { useApp } from '../../../context/AppContext';

export interface DistributorInventoryProps {
  onRestockItem?: (sku: string) => void;
}

export const DistributorInventory: React.FC<DistributorInventoryProps> = ({
  onRestockItem
}) => {
  const { inventoryItems, adjustStock, products, selectedCity } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [adjustingItem, setAdjustingItem] = useState<any | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('Local stock intake from regional transit');
  const [adjustNote, setAdjustNote] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Determine current hub key
  const hubCityKey = useMemo<'lagos' | 'abuja' | 'ph' | 'kano'>(() => {
    const city = (selectedCity || 'Lagos').toLowerCase();
    if (city.includes('abuja')) return 'abuja';
    if (city.includes('port')) return 'ph';
    if (city.includes('kano')) return 'kano';
    return 'lagos';
  }, [selectedCity]);

  // Hydrate local inventory from AppContext
  const localInventory = useMemo(() => {
    return inventoryItems.map((inv) => {
      const prod = products.find((p) => p.sku === inv.sku || p.name === inv.productName);
      const hubUnits =
        hubCityKey === 'abuja'
          ? inv.abujaHub
          : hubCityKey === 'ph'
          ? inv.phHub
          : hubCityKey === 'kano'
          ? inv.kanoHub
          : inv.lagosHub;

      const threshold = inv.lowStockThreshold || 15;
      const reserved = hubUnits > 0 ? Math.min(Math.floor(hubUnits * 0.15), 6) : 0;
      const available = Math.max(0, hubUnits - reserved);

      let status: 'optimal' | 'low-stock' | 'out-of-stock' = 'optimal';
      if (available === 0) status = 'out-of-stock';
      else if (available <= threshold) status = 'low-stock';

      return {
        sku: inv.sku,
        name: inv.productName,
        category: inv.category,
        hubUnits,
        available,
        reserved,
        threshold,
        cartonUnits: 24,
        wholesalePrice: prod?.price ? Math.round(prod.price * 24 * 0.68) : 180000,
        status,
        image: prod?.image || '/routine_01_cleanse.jpg'
      };
    });
  }, [inventoryItems, products, hubCityKey]);

  const filtered = useMemo(() => {
    return localInventory.filter((item) => {
      if (activeTab === 'in-stock' && item.status !== 'optimal') return false;
      if (activeTab === 'low-stock' && item.status !== 'low-stock') return false;
      if (activeTab === 'out-of-stock' && item.status !== 'out-of-stock') return false;
      if (
        searchQuery &&
        !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.sku.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [localInventory, activeTab, searchQuery]);

  const counts = useMemo(() => {
    let availableUnits = 0;
    let reservedUnits = 0;
    let lowStockCount = 0;

    localInventory.forEach((item) => {
      availableUnits += item.available;
      reservedUnits += item.reserved;
      if (item.status === 'low-stock' || item.status === 'out-of-stock') lowStockCount++;
    });

    return {
      total: localInventory.length,
      availableUnits,
      reservedUnits,
      lowStockCount,
      inStock: localInventory.filter((i) => i.status === 'optimal').length,
      outOfStock: localInventory.filter((i) => i.status === 'out-of-stock').length
    };
  }, [localInventory]);

  const handleExecuteAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;

    adjustStock(
      adjustingItem.sku,
      hubCityKey,
      Number(adjustDelta),
      adjustReason,
      adjustNote
    );
    showToast(`Updated ${adjustingItem.name} stock count by ${adjustDelta > 0 ? `+${adjustDelta}` : adjustDelta} units.`);
    setAdjustingItem(null);
    setAdjustNote('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast message */}
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

      {/* Header */}
      <div className="pb-2 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
            City Hub Warehousing • {selectedCity || 'Lagos'} Hub Depot
          </span>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
            Inventory &amp; SKU Stock Pools
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Monitor available shelf units, reserved order allocations, and physical stock thresholds.
          </p>
        </div>

        <button
          onClick={() => onRestockItem && onRestockItem(localInventory[0]?.sku || '')}
          className="px-5 py-2.5 rounded-full bg-[#0F0F10] text-[#D4AF37] text-xs font-bold flex items-center gap-2 self-start sm:self-auto hover:bg-[#27272A] shadow-xs cursor-pointer active:scale-95 transition-all"
        >
          <Truck size={14} />
          <span>Wholesale Master Cartons</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatChip
          label="Total Managed SKUs"
          value={`${counts.total} SKUs`}
          subtext="Active natural formulations"
        />
        <StatChip
          label="Available Units"
          value={`${counts.availableUnits} Units`}
          subtext="Ready to dispatch locally"
          badge="Ready"
          badgeVariant="success"
        />
        <StatChip
          label="Reserved for Orders"
          value={`${counts.reservedUnits} Units`}
          subtext="Allocated to pickup & delivery"
        />
        <StatChip
          label="Low Stock Warnings"
          value={`${counts.lowStockCount} SKUs`}
          subtext="Below min reorder threshold"
          badge={counts.lowStockCount > 0 ? 'Action Req.' : 'Optimal'}
          badgeVariant={counts.lowStockCount > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <FilterTabs
          tabs={[
            { id: 'all', label: 'All Formulations', count: counts.total },
            { id: 'low-stock', label: 'Low Stock', count: counts.lowStockCount, badge: counts.lowStockCount > 0 ? 'Low' : undefined },
            { id: 'out-of-stock', label: 'Out of Stock', count: counts.outOfStock },
            { id: 'in-stock', label: 'Optimal Stock', count: counts.inStock }
          ]}
          activeTab={activeTab}
          onChange={(t) => setActiveTab(t as typeof activeTab)}
        />

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU or formulation…"
            className="w-full pl-8 pr-3 py-1.5 rounded-full border border-[#E5E7EB] bg-white text-xs focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#9CA3AF] font-mono uppercase text-[10px]">
                <th className="pb-3 font-semibold">Formulation &amp; SKU</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold text-right">Available Units</th>
                <th className="pb-3 font-semibold text-right">Reserved (Queue)</th>
                <th className="pb-3 font-semibold text-right">Threshold</th>
                <th className="pb-3 font-semibold text-center">Status</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]/70">
              {filtered.map((item) => (
                <tr key={item.sku} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="py-4 pr-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 rounded-xl object-cover border border-[#E5E7EB] shrink-0"
                      />
                      <div>
                        <span className="font-bold text-[#0F0F10] block">{item.name}</span>
                        <span className="text-[11px] font-mono text-[#6B7280]">{item.sku}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-[#6B7280]">{item.category}</td>
                  <td className="py-4 text-right font-mono font-extrabold text-sm text-[#0F0F10]">
                    {item.available}
                  </td>
                  <td className="py-4 text-right font-mono text-[#6B7280] font-bold">
                    {item.reserved}
                  </td>
                  <td className="py-4 text-right font-mono text-[#9CA3AF]">
                    {item.threshold}
                  </td>
                  <td className="py-4 text-center">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setAdjustingItem(item);
                          setAdjustDelta(5);
                        }}
                        title="Adjust Hub Stock Count"
                        className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-[#FAF9F6] text-[#0F0F10] text-[11px] font-semibold cursor-pointer"
                      >
                        Adjust Count
                      </button>

                      <button
                        onClick={() => onRestockItem && onRestockItem(item.sku)}
                        className="px-3 py-1.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shadow-xs"
                      >
                        <Truck size={12} className="text-[#D4AF37]" />
                        <span>Restock</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Count Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 bg-[#0F0F10]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#EAE8E3] overflow-hidden">
            <div className="p-5 border-b border-[#EAE8E3] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
                  City Hub Reconciliation
                </span>
                <h3 className="font-heading font-extrabold text-lg text-[#0F0F10]">
                  Adjust Local Count • {adjustingItem.name}
                </h3>
              </div>
              <button
                onClick={() => setAdjustingItem(null)}
                className="p-1.5 rounded-full hover:bg-[#FAF9F6] text-[#71717A] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleExecuteAdjustment} className="p-5 space-y-4 text-xs">
              <div>
                <span className="text-[#71717A] block mb-1">Current Hub Available:</span>
                <p className="font-mono text-base font-bold text-[#0F0F10]">{adjustingItem.available} Units</p>
              </div>

              <div>
                <label className="block font-bold text-[#0F0F10] mb-1">Adjustment Quantity (+ / -)</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustDelta((d) => (d > 0 ? -Math.abs(d) : d))}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                      adjustDelta < 0 ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-white border-[#E5E7EB] text-[#71717A]'
                    }`}
                  >
                    Deduct (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustDelta((d) => Math.abs(d))}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                      adjustDelta > 0 ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-[#E5E7EB] text-[#71717A]'
                    }`}
                  >
                    Add (+)
                  </button>
                </div>
                <input
                  type="number"
                  value={Math.abs(adjustDelta)}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAdjustDelta(adjustDelta < 0 ? -val : val);
                  }}
                  className="w-full mt-2 p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs font-mono font-bold focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#0F0F10] mb-1">Reason</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs focus:outline-none"
                >
                  <option value="Local stock intake from regional transit">Intake from Regional Laboratory Batch</option>
                  <option value="Damaged packaging during local handling">Damaged Packaging / Seal Broken</option>
                  <option value="Physical shelf audit reconciliation">Physical Stock Count Reconciliation</option>
                  <option value="Customer direct walk-in purchase">Customer Walk-in Purchase</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0F0F10] mb-1">Note (Optional)</label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="Reference number or note..."
                  className="w-full p-2.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE8E3] text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#EAE8E3]">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="px-4 py-2 rounded-full border border-[#EAE8E3] text-xs font-semibold text-[#71717A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#0F0F10] text-[#D4AF37] font-bold text-xs shadow-md cursor-pointer"
                >
                  Save Count
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
