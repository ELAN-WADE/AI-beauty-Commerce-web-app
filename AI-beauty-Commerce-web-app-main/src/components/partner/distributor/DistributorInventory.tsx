import React, { useState } from 'react';
import {
  Layers,
  Search,
  Truck,
  AlertTriangle,
  RefreshCw,
  Plus,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { FilterTabs } from '../shared/FilterTabs';
import { StatusBadge } from '../shared/StatusBadge';
import { StatChip } from '../shared/StatChip';
import { ConfirmDialog } from '../shared/ConfirmDialog';

export interface DistributorInventoryProps {
  onRestockItem?: (sku: string) => void;
}

export const DistributorInventory: React.FC<DistributorInventoryProps> = ({
  onRestockItem
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [auditItem, setAuditItem] = useState<any | null>(null);

  const inventory = [
    {
      sku: 'DES-BO-01',
      name: 'Radiant Glow Oil 100ml',
      category: 'Treatment Oils',
      available: 8,
      reserved: 4,
      threshold: 20,
      cartonUnits: 24,
      wholesalePrice: 184000,
      status: 'low-stock' as const,
      image: 'https://images.unsplash.com/photo-1608248597359-0026e6328325?auto=format&fit=crop&w=300&q=80'
    },
    {
      sku: 'DES-SS-01',
      name: 'Sun Defense SPF50+ (Zero Cast)',
      category: 'UV Protection',
      available: 5,
      reserved: 2,
      threshold: 15,
      cartonUnits: 24,
      wholesalePrice: 144000,
      status: 'low-stock' as const,
      image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=300&q=80'
    },
    {
      sku: 'DES-HM-01',
      name: 'Hydrating Botanical Mist',
      category: 'Essence & Toners',
      available: 0,
      reserved: 3,
      threshold: 25,
      cartonUnits: 24,
      wholesalePrice: 120000,
      status: 'out-of-stock' as const,
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=300&q=80'
    },
    {
      sku: 'DES-BB-01',
      name: 'Nourishing Ceramide Body Butter',
      category: 'Body Care',
      available: 34,
      reserved: 6,
      threshold: 15,
      cartonUnits: 24,
      wholesalePrice: 156000,
      status: 'optimal' as const,
      image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=300&q=80'
    },
    {
      sku: 'DES-AC-01',
      name: 'Gentle Amino Acid Cleanser',
      category: 'Cleansers',
      available: 48,
      reserved: 5,
      threshold: 20,
      cartonUnits: 24,
      wholesalePrice: 132000,
      status: 'optimal' as const,
      image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=300&q=80'
    }
  ];

  const filtered = inventory.filter((item) => {
    if (activeTab === 'in-stock' && item.status !== 'optimal') return false;
    if (activeTab === 'low-stock' && item.status !== 'low-stock') return false;
    if (activeTab === 'out-of-stock' && item.status !== 'out-of-stock') return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && !item.sku.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-2 border-b border-[#E5E7EB]">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
          City Hub Warehousing
        </span>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
          Inventory &amp; SKU Stock Pools
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
          Monitor available shelf units, reserved order allocations, and physical stock thresholds.
        </p>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <StatChip label="Total Managed SKUs" value="18 SKUs" subtext="In active rotation" />
        <StatChip label="Available Units" value="95 Units" subtext="Ready to dispatch" badge="Optimal" badgeVariant="success" />
        <StatChip label="Reserved for Orders" value="20 Units" subtext="Allocated to queue" />
        <StatChip label="Low Stock Warnings" value="4 SKUs" subtext="Below min threshold" badge="Action Req." badgeVariant="warning" />
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <FilterTabs
          tabs={[
            { id: 'all', label: 'All Formulations', count: 5 },
            { id: 'low-stock', label: 'Low Stock', count: 2, badge: 'Low' },
            { id: 'out-of-stock', label: 'Out of Stock', count: 1 },
            { id: 'in-stock', label: 'Optimal Stock', count: 2 }
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
                <th className="pb-3 font-semibold text-right">Reserved (Open Orders)</th>
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
                    <button
                      onClick={() => onRestockItem && onRestockItem(item.sku)}
                      className="px-3.5 py-1.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Truck size={12} className="text-[#D4AF37]" />
                      <span>Restock</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
