import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  BarChart2,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  LayoutGrid,
  Share2,
  Truck
} from '../../common/SolidIcons';
import {
  EditorialNavigationGrid,
  EditorialCategoryFilter,
  EditorialLayoutMode
} from './EditorialNavigationGrid';
import { ActionDrawer } from '../shared/ActionDrawer';
import { useIsMobilePartnerViewport } from '../shared/MobileRouteTransition';
import { useApp } from '../../../context/AppContext';

export interface CreatorOverviewProps {
  onNavigate: (routeId: string) => void;
  onOpenCreate: () => void;
  onSwitchWorkspace?: (newKind: 'CREATOR' | 'DISTRIBUTOR') => void;
}

type MobileStudioTab = 'production' | 'collaboration' | 'ledger';

const STUDIO_TABS: { id: MobileStudioTab; label: string }[] = [
  { id: 'production', label: 'Production' },
  { id: 'collaboration', label: 'Collaboration' },
  { id: 'ledger', label: 'Ledger Vault' }
];

export const CreatorOverview: React.FC<CreatorOverviewProps> = ({
  onNavigate
}) => {
  const { creatorLedger, creatorPRRequests, creatorLinks, authUser, creatorAvailableBalanceNgn } = useApp();
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [showExecutiveStrip, setShowExecutiveStrip] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<EditorialCategoryFilter>('all');
  const [layoutMode, setLayoutMode] = useState<EditorialLayoutMode>('bento');
  const [mobileTab, setMobileTab] = useState<MobileStudioTab>('production');
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobilePartnerViewport();
  const touchStartX = useRef<number | null>(null);

  // Compute live balances from creatorLedger
  const parseNgn = (str: string) => {
    const cleaned = str.replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
  };

  const clearedCommissions = creatorLedger
    .filter((tx) => tx.status === 'cleared' && tx.type !== 'PAYOUT')
    .reduce((acc, tx) => acc + parseNgn(tx.netPayout), 0);

  const totalPayouts = creatorLedger
    .filter((tx) => tx.type === 'PAYOUT')
    .reduce((acc, tx) => acc + Math.abs(parseNgn(tx.netPayout)), 0);

  const pendingClearance = creatorLedger
    .filter((tx) => tx.status === 'pending')
    .reduce((acc, tx) => acc + parseNgn(tx.netPayout), 0);

  const availableBalance = creatorAvailableBalanceNgn ?? Math.max(0, clearedCommissions - totalPayouts);

  const attributedOrdersCount = creatorLinks.reduce((acc, l) => acc + (l.orders || 0), 0);
  const activePR = creatorPRRequests.find((r) => r.status === 'DISPATCHED' || r.status === 'PENDING') || creatorPRRequests[0];

  const creatorName = authUser?.profile?.displayName || (authUser?.email ? authUser.email.split('@')[0] : 'Creator');

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = touchStartX.current - endX;
    touchStartX.current = null;
    if (Math.abs(delta) < 48) return;
    const idx = STUDIO_TABS.findIndex((t) => t.id === mobileTab);
    if (delta > 0 && idx < STUDIO_TABS.length - 1) {
      setMobileTab(STUDIO_TABS[idx + 1].id);
    } else if (delta < 0 && idx > 0) {
      setMobileTab(STUDIO_TABS[idx - 1].id);
    }
  };

  return (
    <div className="space-y-6">
      {/* =====================================================================
          DESKTOP VIEW (>= md): Restored Pre-Redesign Editorial Bento Dashboard
      ====================================================================== */}
      {!isMobile ? (
      <div className="hidden md:block space-y-5">
        {/* 1. Top Utility Action Header */}
        <div className="flex items-center justify-between gap-4 pb-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#997A2E] font-bold">
              Creator Office
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            <button
              type="button"
              onClick={() => setShowExecutiveStrip(!showExecutiveStrip)}
              className="font-mono text-[9.5px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF9F6] text-[#6B7280] hover:text-[#0F0F10] border border-[#E5E7EB] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Toggle live telemetry and courier overview"
            >
              <span>Good morning, {creatorName}</span>
              {showExecutiveStrip ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAnalyticsOpen(true)}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.97]"
              title="Inspect real-time telemetry and sales velocity"
            >
              <BarChart2 size={13} className="text-[#997A2E]" />
              <span>Pulse Telemetry</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('storefront')}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.97]"
              title="Preview your public shoppable storefront"
            >
              <Share2 size={13} className="text-[#6B7280]" />
              <span>Storefront</span>
            </button>
          </div>
        </div>

        {/* 2. Optional Expandable Executive Strip */}
        {showExecutiveStrip && (
          <div className="space-y-3 p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F0F10]" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#0F0F10] font-bold">
                  Live Studio Telemetry
                </span>
              </div>
              {activePR && (
                <span className="text-[11px] text-[#6B7280]">
                  {activePR.boxTitle}: <strong className="text-[#0F0F10]">{activePR.status}</strong> ({activePR.courier} #{activePR.trackingNumber})
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-[#6B7280] uppercase block">Available Balance</span>
                <span className="font-heading font-extrabold text-xl text-[#0F0F10]">
                  ₦{availableBalance.toLocaleString('en-NG')}
                </span>
                <span className="text-[9.5px] font-mono text-[#0F0F10] font-bold block">● CLEARED</span>
              </div>
              <div>
                <span className="text-[10px] text-[#6B7280] uppercase block">Pending Clearance</span>
                <span className="font-heading font-extrabold text-xl text-[#0F0F10]">
                  ₦{pendingClearance.toLocaleString('en-NG')}
                </span>
                <span className="text-[9.5px] font-mono text-[#6B7280] font-bold block">
                  {creatorLedger.filter((t) => t.status === 'pending').length} ORDERS
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#6B7280] uppercase block">Attributed Orders</span>
                <span className="font-heading font-extrabold text-xl text-[#0F0F10]">
                  {attributedOrdersCount.toLocaleString()}
                </span>
                <span className="text-[9.5px] font-mono text-[#0F0F10] font-bold block">Recorded activity</span>
              </div>
              <div>
                <span className="text-[10px] text-[#6B7280] uppercase block">Active Links</span>
                <span className="font-heading font-extrabold text-xl text-[#0F0F10]">
                  {creatorLinks.length}
                </span>
                <span className="text-[9.5px] text-[#6B7280] block">Tracked referral URLs</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Studio Navigation Workspace Header & Filter / Bento Controls */}
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
              <div className="flex items-center gap-1 p-1 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-xs">
                {[
                  { id: 'all', label: 'All Destinations' },
                  { id: 'production', label: 'Production & Media' },
                  { id: 'collaborations', label: 'Collaborations & PR' },
                  { id: 'commerce', label: 'Ledger & Vault' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
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

              <div className="flex items-center gap-1 p-1 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-xs">
                <button
                  type="button"
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
                  type="button"
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

          <EditorialNavigationGrid
            onNavigate={onNavigate}
            onOpenAnalytics={() => setAnalyticsOpen(true)}
            activeFilter={categoryFilter}
            layoutMode={layoutMode}
          />
        </section>

        {/* Bottom-left Creator Settings shortcut pill (Desktop only) */}
        <div className="fixed left-5 bottom-6 z-40">
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="px-4 py-2 rounded-full bg-[#0F0F10] hover:bg-black text-white text-[11px] font-bold shadow-md cursor-pointer tracking-tight transition-all active:scale-95 border border-white/10"
            title="Open Creator Settings"
          >
            Creator Settings
          </button>
        </div>
      </div>
      ) : (
      /* =====================================================================
          MOBILE VIEW (< md): Retained Native App-Inspired Interface
      ====================================================================== */
      <div className="md:hidden space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-heading font-semibold text-xl text-[#0F0F10] tracking-tight">
              Good morning, {creatorName}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowExecutiveStrip(!showExecutiveStrip)}
              className="min-h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-medium text-[#4B5563] hover:text-[#0F0F10] flex items-center gap-1.5 transition-colors cursor-pointer touch-manipulation"
            >
              <span>Summary</span>
              {showExecutiveStrip ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            <button
              type="button"
              onClick={() => setAnalyticsOpen(true)}
              className="min-h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-medium text-[#0F0F10] flex items-center gap-1.5 transition-colors cursor-pointer touch-manipulation"
            >
              <BarChart2 size={14} className="text-[#4B5563]" />
              <span>Pulse Telemetry</span>
            </button>
          </div>
        </div>

        {showExecutiveStrip && (
          <div className="space-y-3 p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB]">
            <div className="flex flex-col gap-1.5 pb-2 border-b border-[#E5E7EB]">
              <span className="text-xs font-medium text-[#0F0F10]">
                Live Studio Telemetry
              </span>
              {activePR && (
                <span className="text-xs text-[#6B7280]">
                  {activePR.boxTitle}: <strong className="font-medium text-[#0F0F10]">{activePR.status}</strong> ({activePR.courier} #{activePR.trackingNumber})
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-[#6B7280] block">Available Balance</span>
                <span className="font-heading font-semibold text-lg text-[#0F0F10] mt-0.5 block">
                  ₦{availableBalance.toLocaleString('en-NG')}
                </span>
                <span className="text-xs text-[#4B5563] block">Cleared</span>
              </div>
              <div>
                <span className="text-xs text-[#6B7280] block">Pending Clearance</span>
                <span className="font-heading font-semibold text-lg text-[#0F0F10] mt-0.5 block">
                  ₦{pendingClearance.toLocaleString('en-NG')}
                </span>
                <span className="text-xs text-[#6B7280] block">
                  {creatorLedger.filter((t) => t.status === 'pending').length} orders
                </span>
              </div>
              <div>
                <span className="text-xs text-[#6B7280] block">Attributed Orders</span>
                <span className="font-heading font-semibold text-lg text-[#0F0F10] mt-0.5 block">
                  {attributedOrdersCount.toLocaleString()}
                </span>
                <span className="text-xs text-[#6B7280] block">Recorded activity</span>
              </div>
              <div>
                <span className="text-xs text-[#6B7280] block">Active Links</span>
                <span className="font-heading font-semibold text-lg text-[#0F0F10] mt-0.5 block">
                  {creatorLinks.length}
                </span>
                <span className="text-xs text-[#6B7280] block">Tracked referral URLs</span>
              </div>
            </div>
          </div>
        )}

        <section className="space-y-5" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="space-y-3">
            <h2 className="font-heading font-medium text-lg text-[#0F0F10] tracking-tight">
              Studio Workspace
            </h2>

            <div
              role="tablist"
              aria-label="Studio Workspace sections"
              className="flex items-center gap-6 border-b border-[#E5E7EB] overflow-x-auto no-scrollbar touch-pan-x"
            >
              {STUDIO_TABS.map((tab) => {
                const isSelected = mobileTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setMobileTab(tab.id)}
                    className={`relative pb-3 pt-1 min-h-11 whitespace-nowrap text-sm transition-colors cursor-pointer touch-manipulation ${
                      isSelected
                        ? 'text-[#0F0F10] font-medium'
                        : 'text-[#6B7280] hover:text-[#0F0F10] font-normal'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {isSelected && (
                      <motion.span
                        layoutId="studio-workspace-tab-underline"
                        transition={
                          shouldReduceMotion
                            ? { duration: 0 }
                            : { duration: 0.24, ease: [0.23, 1, 0.32, 1] }
                        }
                        className="absolute bottom-0 inset-x-0 h-[1.5px] bg-[#0F0F10]"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <EditorialNavigationGrid
            onNavigate={onNavigate}
            onOpenAnalytics={() => setAnalyticsOpen(true)}
            activeFilter={mobileTab}
            layoutMode="matrix"
          />
        </section>
      </div>
      )}

      {/* Pulse Telemetry Slide-Out Drawer */}
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
              <span className="text-xs text-[#6B7280] block">Cleared Available Balance</span>
              <p className="font-heading font-semibold text-xl sm:text-2xl text-[#0F0F10] mt-1 font-digit">
                ₦{availableBalance.toLocaleString('en-NG')}
              </p>
              <span className="text-xs text-[#4B5563] block mt-1">Ready for payout</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB]">
              <span className="text-xs text-[#6B7280] block">Pending Settlement</span>
              <p className="font-heading font-semibold text-xl sm:text-2xl text-[#0F0F10] mt-1 font-digit">
                ₦{pendingClearance.toLocaleString('en-NG')}
              </p>
              <span className="text-xs text-[#6B7280] block mt-1">
                {creatorLedger.filter((t) => t.status === 'pending').length} client orders clearing
              </span>
            </div>
          </div>

          {/* Attributed GMV & Rates */}
          <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-white space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs text-[#6B7280] block">Attributed Sales GMV</span>
                <p className="font-heading font-semibold text-xl sm:text-2xl text-[#0F0F10]">
                  ₦{creatorLedger.reduce((sum, tx) => sum + parseNgn(tx.grossOrder), 0).toLocaleString('en-NG')}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#6B7280] block">Commission Rate</span>
                <span className="text-sm font-medium text-[#0F0F10]">Configured partner terms</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
              <span>{attributedOrdersCount.toLocaleString()} Attributed Orders</span>
              <span className="text-[#0F0F10] font-medium">Recorded totals</span>
            </div>
          </div>

          {/* Courier In Transit Tracking Card */}
          {activePR && (
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-white text-[#0F0F10] border border-[#E5E7EB] flex items-center justify-center shrink-0 mt-0.5">
                <Truck size={15} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[#0F0F10]">{activePR.boxTitle}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white text-[#0F0F10] border border-[#E5E7EB]">
                    {activePR.courier || 'Fleet Express'} #{activePR.trackingNumber}
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-1">
                  Destination: {activePR.shippingAddress} ({activePR.status})
                </p>
              </div>
            </div>
          )}

          {/* Quick Shortcuts */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setAnalyticsOpen(false);
                onNavigate('earnings');
              }}
              className="flex-1 min-h-11 rounded-full bg-[#0F0F10] text-white text-xs font-medium hover:bg-[#27272A] transition-colors cursor-pointer"
            >
              Open Full Earnings Ledger
            </button>
            <button
              type="button"
              onClick={() => {
                setAnalyticsOpen(false);
                onNavigate('pr-room');
              }}
              className="px-4 min-h-11 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-medium text-[#0F0F10] transition-colors cursor-pointer"
            >
              PR Room
            </button>
          </div>
        </div>
      </ActionDrawer>
    </div>
  );
};
