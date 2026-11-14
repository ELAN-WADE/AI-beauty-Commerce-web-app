import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  BarChart2,
  ChevronDown,
  ChevronUp,
  Truck
} from '../../common/SolidIcons';
import {
  EditorialNavigationGrid,
  EditorialCategoryFilter
} from './EditorialNavigationGrid';
import { ActionDrawer } from '../shared/ActionDrawer';
import { useApp } from '../../../context/AppContext';

export interface CreatorOverviewProps {
  onNavigate: (routeId: string) => void;
  onOpenCreate: () => void;
  onSwitchWorkspace?: (newKind: 'CREATOR' | 'DISTRIBUTOR') => void;
}

const STUDIO_TABS: { id: EditorialCategoryFilter; label: string }[] = [
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
  const [categoryFilter, setCategoryFilter] = useState<EditorialCategoryFilter>('production');
  const shouldReduceMotion = useReducedMotion();
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
    const idx = STUDIO_TABS.findIndex((t) => t.id === categoryFilter);
    if (delta > 0 && idx < STUDIO_TABS.length - 1) {
      setCategoryFilter(STUDIO_TABS[idx + 1].id);
    } else if (delta < 0 && idx > 0) {
      setCategoryFilter(STUDIO_TABS[idx - 1].id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Compact Personalized Greeting & Telemetry Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading font-semibold text-xl sm:text-2xl text-[#0F0F10] tracking-tight">
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

      {/* Expandable Summary Metrics Strip */}
      {showExecutiveStrip && (
        <div className="space-y-3 p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB]">
            <span className="text-xs font-medium text-[#0F0F10]">
              Live Studio Telemetry
            </span>
            {activePR && (
              <span className="text-xs text-[#6B7280]">
                {activePR.boxTitle}: <strong className="font-medium text-[#0F0F10]">{activePR.status}</strong> ({activePR.courier} #{activePR.trackingNumber})
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

      {/* Studio Workspace Minimal Underline Tabs */}
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
              const isSelected = categoryFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setCategoryFilter(tab.id)}
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

        {/* Destinations Grid */}
        <EditorialNavigationGrid
          onNavigate={onNavigate}
          onOpenAnalytics={() => setAnalyticsOpen(true)}
          activeFilter={categoryFilter}
        />
      </section>

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
