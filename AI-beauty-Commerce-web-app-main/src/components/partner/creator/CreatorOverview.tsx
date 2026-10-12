import React, { useState } from 'react';
import {
  Share2,
  ArrowRight,
  TrendingUp,
  BarChart2,
  Truck,
  Grid3X3,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import {
  EditorialNavigationGrid,
  EditorialCategoryFilter,
  EditorialLayoutMode
} from './EditorialNavigationGrid';
import { ActionDrawer } from '../shared/ActionDrawer';

export interface CreatorOverviewProps {
  onNavigate: (routeId: string) => void;
  onOpenCreate: () => void;
  onSwitchWorkspace?: (newKind: 'CREATOR' | 'DISTRIBUTOR') => void;
}

export const CreatorOverview: React.FC<CreatorOverviewProps> = ({
  onNavigate,
  onOpenCreate,
  onSwitchWorkspace
}) => {
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [showExecutiveStrip, setShowExecutiveStrip] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<EditorialCategoryFilter>('all');
  const [layoutMode, setLayoutMode] = useState<EditorialLayoutMode>('bento');

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Top Utility Action Header Matching User Reference Screenshot */}
      <div className="flex items-center justify-between gap-4 pb-1">
        {/* Subtle Creator Identity Stamp */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#997A2E] font-bold">
            Creator Office
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
          <button
            onClick={() => setShowExecutiveStrip(!showExecutiveStrip)}
            className="font-mono text-[9.5px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF9F6] text-[#6B7280] hover:text-[#0F0F10] border border-[#E5E7EB] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="Toggle live telemetry and courier overview"
          >
            <span>Good morning, Amara</span>
            {showExecutiveStrip ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>

        {/* Top Right Utility Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAnalyticsOpen(true)}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.97]"
            title="Inspect real-time telemetry and sales velocity"
          >
            <BarChart2 size={13} className="text-[#997A2E]" />
            <span>Pulse Telemetry</span>
          </button>

          <button
            onClick={() => onNavigate('storefront')}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.97]"
            title="Preview your public shoppable storefront"
          >
            <Share2 size={13} className="text-[#6B7280]" />
            <span>Storefront</span>
          </button>
        </div>
      </div>

      {/* 2. Optional Expandable Executive Strip (When creator wants to inspect live ledger inline) */}
      {showExecutiveStrip && (
        <div className="space-y-3 p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F0F10]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#0F0F10] font-bold">
                Live Studio Telemetry • October 2026
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#6B7280]">
                Hydration Essentials PR Box: <strong className="text-[#0F0F10]">In Transit</strong> (Gokada #GOK-8104)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-[10px] text-[#6B7280] uppercase block">Available Balance</span>
              <span className="font-heading font-extrabold text-xl text-[#0F0F10]">₦84,620</span>
              <span className="text-[9.5px] font-mono text-[#0F0F10] font-bold block">● CLEARED</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B7280] uppercase block">Pending Clearance</span>
              <span className="font-heading font-extrabold text-xl text-[#0F0F10]">₦21,300</span>
              <span className="text-[9.5px] font-mono text-[#6B7280] font-bold block">2 ORDERS</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B7280] uppercase block">Attributed Orders</span>
              <span className="font-heading font-extrabold text-xl text-[#0F0F10]">148</span>
              <span className="text-[9.5px] font-mono text-[#0F0F10] font-bold block">+18.4% VELOCITY</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6B7280] uppercase block">Tier Progression</span>
              <span className="font-heading font-extrabold text-xl text-[#0F0F10]">72%</span>
              <span className="text-[9.5px] text-[#6B7280] block">To Icon Tier</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Studio Navigation Workspace Header & Controls Matching Screenshot */}
      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
          <div>
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-[#0F0F10] tracking-tight">
              Studio Navigation Workspace
            </h1>
            <p className="text-xs text-[#6B7280]">
              9 Art-Directed Destinations • Tap to enter workspace
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter Pills Matching Screenshot */}
            <div className="flex items-center gap-1 p-1 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-xs">
              {[
                { id: 'all', label: 'All Destinations' },
                { id: 'production', label: 'Production & Media' },
                { id: 'collaborations', label: 'Collaborations & PR' },
                { id: 'commerce', label: 'Ledger & Vault' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setCategoryFilter(f.id as EditorialCategoryFilter)}
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

            {/* Advanced Luxury Layout Switcher (3x3 Matrix vs Staggered Bento) */}
            <div className="hidden sm:flex items-center gap-1 p-1 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-xs">
              <button
                onClick={() => setLayoutMode('matrix')}
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  layoutMode === 'matrix'
                    ? 'bg-[#0F0F10] text-white shadow-xs'
                    : 'text-[#6B7280] hover:text-[#0F0F10]'
                }`}
                title="3x3 Uniform Matrix Layout (as shown in reference screenshot)"
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
                title="Asymmetric Editorial Bento Layout (rhythmic luxury spreads)"
              >
                <LayoutGrid size={11} />
                <span>Bento</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. The 9-Tile Navigation Grid */}
        <EditorialNavigationGrid
          onNavigate={onNavigate}
          onOpenAnalytics={() => setAnalyticsOpen(true)}
          activeFilter={categoryFilter}
          layoutMode={layoutMode}
        />
      </section>

      {/* 5. Floating Bottom-Left "Admin Portal" Pill Matching Screenshot */}
      <div className="fixed left-5 bottom-6 z-40">
        <button
          onClick={() => {
            if (onSwitchWorkspace) {
              onSwitchWorkspace('DISTRIBUTOR');
            } else {
              onNavigate('settings');
            }
          }}
          className="px-4 py-2 rounded-full bg-[#0F0F10] hover:bg-black text-white text-[11px] font-bold shadow-md cursor-pointer tracking-tight transition-all active:scale-95 border border-white/10"
          title="Switch to Distributor & Admin Operations"
        >
          Admin Portal
        </button>
      </div>

      {/* 6. Pulse Telemetry Slide-Out Drawer */}
      <ActionDrawer
        isOpen={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        title="Performance Telemetry"
        subtitle="Real-time conversions, GMV, and attribution pulse"
        width="lg"
      >
        <div className="space-y-6">
          {/* Header Metric Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB]">
              <span className="text-[10px] font-mono text-[#6B7280] uppercase block">Cleared Available Balance</span>
              <p className="font-heading font-extrabold text-2xl text-[#0F0F10] mt-1 font-digit">₦84,620</p>
              <span className="text-[10px] font-mono text-[#0F0F10] font-bold block mt-1">● READY FOR PAYOUT</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB]">
              <span className="text-[10px] font-mono text-[#6B7280] uppercase block">Pending Settlement</span>
              <p className="font-heading font-extrabold text-2xl text-[#0F0F10] mt-1 font-digit">₦21,300</p>
              <span className="text-[10px] font-mono text-[#6B7280] font-bold block mt-1">● 2 CLIENT ORDERS CLEARING</span>
            </div>
          </div>

          {/* Attributed GMV & Rates */}
          <div className="p-5 rounded-2xl border border-[#E5E7EB] bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#6B7280] uppercase block">Attributed Sales GMV</span>
                <p className="font-heading font-extrabold text-2xl text-[#0F0F10]">₦684,400</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-[#6B7280] uppercase block">Commission Rate</span>
                <span className="font-mono font-bold text-base text-[#0F0F10]">12% Base</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs font-mono text-[#6B7280]">
              <span>148 Attributed Orders</span>
              <span className="text-[#0F0F10] font-mono font-bold">+18.4% MoM</span>
            </div>
          </div>

          {/* Courier In Transit Tracking Card */}
          <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-white text-[#0F0F10] border border-[#E5E7EB] flex items-center justify-center shrink-0 mt-0.5">
              <Truck size={15} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#0F0F10]">Hydration Essentials PR Box</span>
                <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-white text-[#0F0F10] border border-[#E5E7EB] font-bold uppercase">
                  Gokada #GOK-8104
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280] mt-1">
                Out for delivery to Lekki Phase 1 • Unboxing footage tagged in routine creator drafts.
              </p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setAnalyticsOpen(false);
                onNavigate('earnings');
              }}
              className="flex-1 py-2.5 rounded-full bg-[#0F0F10] text-white text-xs font-bold hover:bg-[#27272A] transition-colors"
            >
              Open Full Earnings Ledger
            </button>
            <button
              onClick={() => {
                setAnalyticsOpen(false);
                onNavigate('pr-room');
              }}
              className="px-4 py-2.5 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] transition-colors"
            >
              PR Room
            </button>
          </div>
        </div>
      </ActionDrawer>
    </div>
  );
};
