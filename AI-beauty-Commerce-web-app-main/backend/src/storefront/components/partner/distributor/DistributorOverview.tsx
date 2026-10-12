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
  const [telemetryOpen, setTelemetryOpen] = useState(false);
  const [showExecutiveStrip, setShowExecutiveStrip] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<DistributorCategoryFilter>('all');
  const [layoutMode, setLayoutMode] = useState<DistributorLayoutMode>('bento');

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
            <span>Lagos Central Hub • Silver Tier</span>
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
              window.open('/', '_blank');
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
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#6B7280]">
                Central Lab Restock #LAB-409: <strong className="text-[#0F0F10]">In Transit</strong> (Gokada Express)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-[10px] text-[#6B7280] uppercase block">Pending Dispatch</span>
              <span className="font-heading font-extrabold text-xl text-[#0F0F10]">7 Orders</span>
              <span className="text-[9.5px] font-mono text-[#0F0F10] font-bold block">● NEEDS PACKING</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B7280] uppercase block">Cleared Margin</span>
              <span className="font-heading font-extrabold text-xl text-[#0F0F10]">₦320,450</span>
              <span className="text-[9.5px] font-mono text-[#0F0F10] font-bold block">● 32% PARTNER CUT</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B7280] uppercase block">Stock Health</span>
              <span className="font-heading font-extrabold text-xl text-[#0F0F10]">86%</span>
              <span className="text-[9.5px] font-mono text-[#6B7280] block">4 SKUS LOW STOCK</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B7280] uppercase block">Fulfilment SLA</span>
              <span className="font-heading font-extrabold text-xl text-[#0F0F10]">98.4%</span>
              <span className="text-[9.5px] font-mono text-[#0F0F10] font-bold block">● SAME-DAY TARGET</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Hub Navigation Workspace Header & Controls */}
      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          <div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#0F0F10] tracking-tight">
              Hub Navigation Workspace
            </h1>
            <p className="text-xs text-[#6B7280]">
              9 Art-Directed Destinations • Tap to enter facility workspace
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 p-1 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-xs">
              {[
                { id: 'all', label: 'All Operations' },
                { id: 'fulfillment', label: 'Fulfillment & Stock' },
                { id: 'wholesale', label: 'Margins & Revenue' },
                { id: 'territory', label: 'Territory & Support' }
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

            {/* Layout Switcher (Matrix vs Bento) */}
            <div className="hidden sm:flex items-center gap-1 p-1 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-xs">
              <button
                onClick={() => setLayoutMode('matrix')}
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  layoutMode === 'matrix'
                    ? 'bg-[#0F0F10] text-white shadow-xs'
                    : 'text-[#6B7280] hover:text-[#0F0F10]'
                }`}
                title="3x3 Uniform Matrix Layout"
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
                title="Asymmetric Editorial Bento Layout"
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

      {/* 5. Floating Bottom-Left "Creator Studio" Switcher Pill */}
      <div className="fixed left-5 bottom-6 z-40">
        <button
          onClick={() => {
            if (onSwitchWorkspace) {
              onSwitchWorkspace('CREATOR');
            } else {
              onNavigate('settings');
            }
          }}
          className="px-4 py-2 rounded-full bg-[#0F0F10] hover:bg-black text-white text-[11px] font-bold shadow-md cursor-pointer tracking-tight transition-all active:scale-95 border border-white/10"
          title="Switch to Creator Studio"
        >
          Creator Studio
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
              <p className="font-heading font-extrabold text-2xl text-[#0F0F10] mt-1 font-digit">₦320,450</p>
              <span className="text-[10px] font-mono text-[#0F0F10] font-bold block mt-1">● CLEARED FOR PAYOUT</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB]">
              <span className="text-[10px] font-mono text-[#6B7280] uppercase block">Pending Customer Verification</span>
              <p className="font-heading font-extrabold text-2xl text-[#0F0F10] mt-1 font-digit">₦64,000</p>
              <span className="text-[10px] font-mono text-[#6B7280] font-bold block mt-1">● AWAITING CONFIRMATION</span>
            </div>
          </div>

          {/* Operational Turnover & Rates */}
          <div className="p-5 rounded-2xl border border-[#E5E7EB] bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F0F10]">Lagos Dispatch Velocity &amp; Turnaround</span>
              <span className="text-[10px] font-mono font-bold text-[#0F0F10] bg-[#FAF9F6] px-2.5 py-0.5 rounded-full border border-[#E5E7EB]">
                98.4% ON-TIME SLA
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
              <div className="flex items-center justify-between py-1.5 border-b border-[#E5E7EB]/70">
                <span className="text-[#0F0F10] font-medium">Radiant Glow Oil 100ml</span>
                <span className="font-mono text-[#0F0F10] font-bold">42% hub turnover (8 units left)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#E5E7EB]/70">
                <span className="text-[#0F0F10] font-medium">Clinical Barrier Cream SPF50+</span>
                <span className="font-mono text-[#0F0F10] font-semibold">28% turnover (18 units)</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[#0F0F10] font-medium">Gentle Amino Cleanser</span>
                <span className="font-mono text-[#0F0F10] font-semibold">16% turnover (48 units)</span>
              </div>
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
              <span>Open Orders Queue</span>
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
