import React, { useState } from 'react';
import {
  Share2,
  BarChart2,
  Grid3X3,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import {
  DistributorEditorialGrid,
  DistributorCategoryFilter,
  DistributorLayoutMode
} from './DistributorEditorialGrid';
import { ActionDrawer } from '../shared/ActionDrawer';
import { useApp } from '../../../context/AppContext';

export interface DistributorOverviewProps {
  onNavigate: (routeId: string) => void;
  onOpenOrder?: (orderId: string) => void;
  onRestockItem?: (sku: string) => void;
  onSwitchWorkspace?: (newKind: 'CREATOR' | 'DISTRIBUTOR') => void;
}

export const DistributorOverview: React.FC<DistributorOverviewProps> = ({
  onNavigate,
  onOpenOrder,
  onRestockItem,
  onSwitchWorkspace
}) => {
  const { orders, inventoryItems, distributorLedger, labShipments, authUser, selectedCity, distributorAvailableBalanceNgn } = useApp();
  const [telemetryOpen, setTelemetryOpen] = useState(false);
  const [showExecutiveStrip, setShowExecutiveStrip] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<DistributorCategoryFilter>('all');
  const [layoutMode, setLayoutMode] = useState<DistributorLayoutMode>('bento');

  // Compute live operational telemetry
  const pendingOrders = orders.filter(
    (o) => o.status === 'Processing' || o.status === 'Awaiting Packing'
  );

  const lowStockItems = inventoryItems.filter((i) => (i.centralStock ?? i.lagosHub) <= (i.lowStockThreshold || 10));

  const clearedMargin = distributorLedger
    .filter((tx) => tx.status === 'cleared' && tx.type === 'WHOLESALE_MARGIN')
    .reduce((acc, tx) => acc + tx.amountNgn, 0);

  const totalMargin = distributorAvailableBalanceNgn ?? Math.max(0, clearedMargin);

  const inTransitLab = labShipments.find((s) => s.status === 'IN_TRANSIT') || labShipments[0];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Top Utility Action Header */}
      <div className="flex items-center justify-between gap-4 pb-1">
        {/* Subtle Hub Identity Stamp */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#997A2E] font-bold">
            Distributor Hub
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
          <button
            onClick={() => setShowExecutiveStrip(!showExecutiveStrip)}
            className="font-mono text-[9.5px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF9F6] text-[#6B7280] hover:text-[#0F0F10] border border-[#E5E7EB] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Toggle live telemetry and courier overview"
          >
            <span>{authUser?.profile?.displayName || (authUser?.email ? `${authUser.email.split('@')[0]}'s Hub` : `${selectedCity} Central Hub`)} </span>
            {showExecutiveStrip ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>

        {/* Top Right Utility Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTelemetryOpen(true)}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.97]"
            title="Inspect real-time facility telemetry and dispatch velocity"
          >
            <BarChart2 size={13} className="text-[#997A2E]" />
            <span>Hub Telemetry</span>
          </button>

          <button
            onClick={() => {
              window.open('/?screen=catalogue', '_blank');
            }}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.97]"
            title="Preview public shoppable storefront"
          >
            <Share2 size={13} className="text-[#6B7280]" />
            <span>Storefront</span>
          </button>
        </div>
      </div>

      {/* 2. Optional Expandable Executive Strip */}
      {showExecutiveStrip && (
        <div className="space-y-3 p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F0F10]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#0F0F10] font-bold">
                Live Hub Telemetry • October 2026
              </span>
            </div>
            {inTransitLab && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#6B7280]">
                  Lab Restock #{inTransitLab.batchNumber}: <strong className="text-[#0F0F10]">{inTransitLab.status}</strong> ({inTransitLab.courier})
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-[10px] text-[#6B7280] uppercase block">Pending Dispatch</span>
              <span className="font-heading font-extrabold text-xl text-[#0F0F10]">
                {pendingOrders.length} Orders
              </span>
              <span className="text-[9.5px] font-mono text-[#0F0F10] font-bold block">● NEEDS PACKING</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B7280] uppercase block">Cleared Margin</span>
              <span className="font-heading font-extrabold text-xl text-[#0F0F10]">
                ₦{totalMargin.toLocaleString('en-NG')}
              </span>
              <span className="text-[9.5px] font-mono text-[#0F0F10] font-bold block">● RECORDED BALANCE</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B7280] uppercase block">Stock Health</span>
              <span className="font-heading font-extrabold text-xl text-[#0F0F10]">
                {lowStockItems.length > 0 ? `${lowStockItems.length} LOW` : 'OPTIMAL'}
              </span>
              <span className="text-[9.5px] font-mono text-[#6B7280] block">
                {lowStockItems.length} SKUS BELOW THRESHOLD
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B7280] uppercase block">Fulfilment SLA</span>
              <span className="font-heading font-extrabold text-xl text-[#0F0F10]">Not measured</span>
              <span className="text-[9.5px] text-[#6B7280] block">SAME-DAY DISPATCH</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Hub Navigation Workspace Header & Controls */}
      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          <div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#0F0F10] tracking-tight">
              Distributor Operations Console
            </h1>
            <p className="text-xs text-[#6B7280]">
              9 Facility Operations Modules • Tap to inspect and dispatch
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 p-1 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-xs">
              {[
                { id: 'all', label: 'All Operations' },
                { id: 'fulfillment', label: 'Fulfillment & Orders' },
                { id: 'wholesale', label: 'Lab & Wholesale' },
                { id: 'territory', label: 'Territory & Hub' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setCategoryFilter(f.id as DistributorCategoryFilter)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    categoryFilter === f.id
                      ? 'bg-[#0F0F10] text-white shadow-xs'
                      : 'text-[#6B7280] hover:text-[#0F0F10]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Layout Switcher */}
            <div className="hidden sm:flex items-center gap-1 p-1 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-xs">
              <button
                onClick={() => setLayoutMode('matrix')}
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  layoutMode === 'matrix'
                    ? 'bg-[#0F0F10] text-white shadow-xs'
                    : 'text-[#6B7280] hover:text-[#0F0F10]'
                }`}
              >
                <Grid3X3 size={11} />
                <span>Matrix</span>
              </button>

              <button
                onClick={() => setLayoutMode('bento')}
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  layoutMode === 'bento'
                    ? 'bg-[#0F0F10] text-white shadow-xs'
                    : 'text-[#6B7280] hover:text-[#0F0F10]'
                }`}
              >
                <LayoutGrid size={11} />
                <span>Bento</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. The 9-Tile Navigation Grid */}
        <DistributorEditorialGrid
          onNavigate={onNavigate}
          onOpenAnalytics={() => setTelemetryOpen(true)}
          activeFilter={categoryFilter}
          layoutMode={layoutMode}
        />
      </section>

      {/* 5. Distributor-only settings shortcut in the original floating pill. */}
      <div className="fixed left-5 bottom-6 z-40">
        <button
          onClick={() => onNavigate('settings')}
          className="px-4 py-2 rounded-full bg-[#0F0F10] hover:bg-black text-white text-[11px] font-bold shadow-md cursor-pointer tracking-tight transition-all active:scale-95 border border-white/10"
          title="Open Hub Settings"
        >
          Hub Settings
        </button>
      </div>

      {/* 6. Hub Telemetry Slide-Out Drawer */}
      <ActionDrawer
        isOpen={telemetryOpen}
        onClose={() => setTelemetryOpen(false)}
        title="Hub Operations Telemetry"
        subtitle="Real-time fulfillment metrics, SLA benchmarks, and margin accounting"
        width="lg"
      >
        <div className="space-y-6">
          {/* Header Metric Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB]">
              <span className="text-[10px] font-mono text-[#6B7280] uppercase block">Cleared Wholesale Margin</span>
              <p className="font-heading font-extrabold text-2xl text-[#0F0F10] mt-1 font-digit">
                ₦{totalMargin.toLocaleString('en-NG')}
              </p>
              <span className="text-[10px] font-mono text-[#0F0F10] font-bold block mt-1">● CLEARED FOR PAYOUT</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB]">
              <span className="text-[10px] font-mono text-[#6B7280] uppercase block">Orders In Queue</span>
              <p className="font-heading font-extrabold text-2xl text-[#0F0F10] mt-1 font-digit">
                {pendingOrders.length}
              </p>
              <span className="text-[10px] font-mono text-[#6B7280] font-bold block mt-1">● AWAITING FULFILLMENT</span>
            </div>
          </div>

          {/* Operational Turnover & Rates */}
          <div className="p-5 rounded-2xl border border-[#E5E7EB] bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F0F10]">Lagos Dispatch Velocity &amp; Turnaround</span>
              <span className="text-[10px] font-mono font-bold text-[#0F0F10] bg-[#FAF9F6] px-2.5 py-0.5 rounded-full border border-[#E5E7EB]">
                Not measured ON-TIME SLA
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-center border-t border-[#E5E7EB]">
              <div className="p-2.5 rounded-xl bg-[#FAF9F6]">
                <span className="text-[10px] font-mono text-[#6B7280] block">Average Handoff</span>
                <span className="text-sm font-extrabold text-[#0F0F10]">1.8 hrs</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF9F6]">
                <span className="text-[10px] font-mono text-[#6B7280] block">Courier Fleet</span>
                <span className="text-sm font-extrabold text-[#0F0F10]">12 Couriers</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF9F6]">
                <span className="text-[10px] font-mono text-[#6B7280] block">Same-Day Rate</span>
                <span className="text-sm font-extrabold text-[#0F0F10]">96.8%</span>
              </div>
            </div>
          </div>

          {/* Top Formulations Movement */}
          <div className="p-5 rounded-2xl border border-[#E5E7EB] bg-white space-y-3">
            <h4 className="text-xs font-bold text-[#0F0F10]">Top Moving Skincare Formulations</h4>
            <div className="space-y-2 text-xs">
              {inventoryItems.slice(0, 3).map((item) => (
                <div key={item.sku} className="flex items-center justify-between py-1.5 border-b border-[#E5E7EB]/70">
                  <span className="text-[#0F0F10] font-medium">{item.productName}</span>
                  <span className="font-mono text-[#0F0F10] font-bold">
                    {item.lagosHub} units in Lagos Hub {item.lagosHub <= item.lowStockThreshold && '(Low Stock)'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => {
                setTelemetryOpen(false);
                onNavigate('orders');
              }}
              className="flex-1 py-2.5 rounded-full bg-[#0F0F10] text-white text-xs font-bold hover:bg-[#27272A] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Package size={14} className="text-[#D4AF37]" />
              <span>Open Orders Queue ({pendingOrders.length})</span>
            </button>
            <button
              onClick={() => {
                setTelemetryOpen(false);
                onNavigate('restock');
              }}
              className="flex-1 py-2.5 rounded-full border border-[#E5E7EB] bg-white text-xs font-bold text-[#0F0F10] hover:bg-[#FAF9F6] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Truck size={14} className="text-[#997A2E]" />
              <span>Order Bulk Restock</span>
            </button>
          </div>
        </div>
      </ActionDrawer>
    </div>
  );
};
