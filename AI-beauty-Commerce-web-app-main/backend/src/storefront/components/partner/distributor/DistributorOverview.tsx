import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  BarChart2,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  LayoutGrid,
  Package,
  Share2,
  Truck
} from '../../common/SolidIcons';
import {
  DistributorEditorialGrid,
  DistributorCategoryFilter,
  DistributorLayoutMode
} from './DistributorEditorialGrid';
import { ActionDrawer } from '../shared/ActionDrawer';
import { useIsMobilePartnerViewport } from '../shared/MobileRouteTransition';
import { useApp } from '../../../context/AppContext';
import { AnimatedMetricValue } from '../../motion/DeslaMotion';

export interface DistributorOverviewProps {
  onNavigate: (routeId: string) => void;
  onOpenOrder?: (orderId: string) => void;
  onRestockItem?: (sku: string) => void;
  onSwitchWorkspace?: (newKind: 'CREATOR' | 'DISTRIBUTOR') => void;
}

type MobileHubTab = 'fulfillment' | 'wholesale' | 'territory';

const HUB_TABS: { id: MobileHubTab; label: string }[] = [
  { id: 'fulfillment', label: 'Fulfillment' },
  { id: 'wholesale', label: 'Wholesale' },
  { id: 'territory', label: 'Territory' }
];

export const DistributorOverview: React.FC<DistributorOverviewProps> = ({
  onNavigate
}) => {
  const { orders, inventoryItems, distributorLedger, labShipments, authUser, selectedCity, distributorAvailableBalanceNgn, navigateTo } = useApp();
  const [telemetryOpen, setTelemetryOpen] = useState(false);
  const [showExecutiveStrip, setShowExecutiveStrip] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<DistributorCategoryFilter>('all');
  const [layoutMode, setLayoutMode] = useState<DistributorLayoutMode>('bento');
  const [mobileTab, setMobileTab] = useState<MobileHubTab>('fulfillment');
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobilePartnerViewport();
  const touchStartX = useRef<number | null>(null);

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

  const hubDisplayName = authUser?.profile?.displayName || (authUser?.email ? `${authUser.email.split('@')[0]}'s Hub` : `${selectedCity} Central Hub`);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = touchStartX.current - endX;
    touchStartX.current = null;
    if (Math.abs(delta) < 48) return;
    const idx = HUB_TABS.findIndex((t) => t.id === mobileTab);
    if (delta > 0 && idx < HUB_TABS.length - 1) {
      setMobileTab(HUB_TABS[idx + 1].id);
    } else if (delta < 0 && idx > 0) {
      setMobileTab(HUB_TABS[idx - 1].id);
    }
  };

  return (
    <div className="space-y-6">
      {/* =====================================================================
          DESKTOP VIEW (>= md): Restored Pre-Redesign Editorial Bento Console
      ====================================================================== */}
      {!isMobile ? (
      <div className="hidden md:block space-y-5">
        {/* 1. Top Utility Action Header */}
        <div className="flex items-center justify-between gap-4 pb-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#997A2E] font-medium">
              Distributor Hub
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            <button
              type="button"
              onClick={() => setShowExecutiveStrip(!showExecutiveStrip)}
              className="font-mono text-[9.5px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF9F6] text-[#6B7280] hover:text-[#0F0F10] border border-[#E5E7EB] font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="Toggle live telemetry and courier overview"
            >
              <span>{hubDisplayName}</span>
              {showExecutiveStrip ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTelemetryOpen(true)}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-medium text-[#0F0F10] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.97]"
              title="Inspect real-time facility telemetry and dispatch velocity"
            >
              <BarChart2 size={13} className="text-[#997A2E]" />
              <span>Hub Telemetry</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('catalogue')}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-medium text-[#0F0F10] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.97]"
              title="Preview public shoppable storefront"
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
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#0F0F10] font-semibold">
                  Live Hub Telemetry
                </span>
              </div>
              {inTransitLab && (
                <span className="text-[11px] text-[#6B7280]">
                  Lab Restock #{inTransitLab.batchNumber}: <strong className="font-semibold text-[#0F0F10]">{inTransitLab.status}</strong> ({inTransitLab.courier})
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-[#6B7280] uppercase block">Pending Dispatch</span>
                <AnimatedMetricValue
                  value={pendingOrders.length}
                  format={(n) => `${Math.round(n)} Orders`}
                  className="font-heading font-semibold text-xl text-[#0F0F10] block"
                />
                <span className="text-[9.5px] font-mono text-[#0F0F10] font-medium block">● NEEDS PACKING</span>
              </div>
              <div>
                <span className="text-[10px] text-[#6B7280] uppercase block">Cleared Margin</span>
                <AnimatedMetricValue
                  value={totalMargin}
                  format={(n) => `₦${Math.round(n).toLocaleString('en-NG')}`}
                  className="font-heading font-semibold text-xl text-[#0F0F10] block"
                />
                <span className="text-[9.5px] font-mono text-[#0F0F10] font-medium block">● RECORDED BALANCE</span>
              </div>
              <div>
                <span className="text-[10px] text-[#6B7280] uppercase block">Stock Health</span>
                <span className="font-heading font-semibold text-xl text-[#0F0F10]">
                  {lowStockItems.length > 0 ? `${lowStockItems.length} LOW` : 'OPTIMAL'}
                </span>
                <span className="text-[9.5px] font-mono text-[#6B7280] block">
                  {lowStockItems.length} SKUS BELOW THRESHOLD
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#6B7280] uppercase block">Fulfilment SLA</span>
                <span className="font-heading font-semibold text-xl text-[#0F0F10]">Not measured</span>
                <span className="text-[9.5px] text-[#6B7280] block">SAME-DAY DISPATCH</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Hub Navigation Workspace Header & Filter / Bento Controls */}
        <section className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
            <div>
              <h1 className="font-heading font-semibold text-xl sm:text-2xl text-[#0F0F10] tracking-tight">
                Distributor Operations Console
              </h1>
              <p className="text-xs text-[#6B7280]">
                9 Facility Operations Modules • Tap to inspect and dispatch
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-1 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-xs">
                {[
                  { id: 'all', label: 'All Operations' },
                  { id: 'fulfillment', label: 'Fulfillment & Orders' },
                  { id: 'wholesale', label: 'Lab & Wholesale' },
                  { id: 'territory', label: 'Territory & Hub' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setCategoryFilter(f.id as DistributorCategoryFilter)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
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
                  className={`px-2.5 py-1 rounded-full text-[10.5px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                    layoutMode === 'matrix'
                      ? 'bg-[#0F0F10] text-white shadow-xs'
                      : 'text-[#6B7280] hover:text-[#0F0F10]'
                  }`}
                >
                  <Grid3X3 size={11} />
                  <span>Matrix</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutMode('bento')}
                  className={`px-2.5 py-1 rounded-full text-[10.5px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
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

          <DistributorEditorialGrid
            onNavigate={onNavigate}
            onOpenAnalytics={() => setTelemetryOpen(true)}
            activeFilter={categoryFilter}
            layoutMode={layoutMode}
          />
        </section>

        {/* Bottom-left Hub Settings shortcut pill (Desktop only) */}
        <div className="fixed left-5 bottom-6 z-40">
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="px-4 py-2 rounded-full bg-[#0F0F10] hover:bg-black text-white text-[11px] font-medium shadow-md cursor-pointer tracking-tight transition-all active:scale-95 border border-white/10"
            title="Open Hub Settings"
          >
            Hub Settings
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
              {hubDisplayName}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
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
              onClick={() => setTelemetryOpen(true)}
              className="min-h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-medium text-[#0F0F10] flex items-center gap-1.5 transition-colors cursor-pointer touch-manipulation"
            >
              <BarChart2 size={14} className="text-[#4B5563]" />
              <span>Hub Telemetry</span>
            </button>
          </div>
        </div>

        {showExecutiveStrip && (
          <div className="space-y-3 p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB]">
            <div className="flex flex-col gap-1.5 pb-2 border-b border-[#E5E7EB]">
              <span className="text-xs font-medium text-[#0F0F10]">
                Live Hub Telemetry
              </span>
              {inTransitLab && (
                <span className="text-xs text-[#6B7280]">
                  Lab Restock #{inTransitLab.batchNumber}: <strong className="font-medium text-[#0F0F10]">{inTransitLab.status}</strong> ({inTransitLab.courier})
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-[#6B7280] block">Pending Dispatch</span>
                <span className="font-heading font-semibold text-lg text-[#0F0F10] mt-0.5 block">
                  {pendingOrders.length} Orders
                </span>
                <span className="text-xs text-[#4B5563] block">Needs packing</span>
              </div>
              <div>
                <span className="text-xs text-[#6B7280] block">Cleared Margin</span>
                <span className="font-heading font-semibold text-lg text-[#0F0F10] mt-0.5 block">
                  ₦{totalMargin.toLocaleString('en-NG')}
                </span>
                <span className="text-xs text-[#4B5563] block">Recorded balance</span>
              </div>
              <div>
                <span className="text-xs text-[#6B7280] block">Stock Health</span>
                <span className="font-heading font-semibold text-lg text-[#0F0F10] mt-0.5 block">
                  {lowStockItems.length > 0 ? `${lowStockItems.length} Low` : 'Optimal'}
                </span>
                <span className="text-xs text-[#6B7280] block">
                  {lowStockItems.length} SKUs below threshold
                </span>
              </div>
              <div>
                <span className="text-xs text-[#6B7280] block">Fulfilment SLA</span>
                <span className="font-heading font-semibold text-lg text-[#0F0F10] mt-0.5 block">Not measured</span>
                <span className="text-xs text-[#6B7280] block">Same-day dispatch</span>
              </div>
            </div>
          </div>
        )}

        <section className="space-y-5" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <div className="space-y-3">
            <h2 className="font-heading font-medium text-lg text-[#0F0F10] tracking-tight">
              Operations Workspace
            </h2>

            <div
              role="tablist"
              aria-label="Operations Workspace sections"
              className="flex items-center gap-6 border-b border-[#E5E7EB] overflow-x-auto no-scrollbar touch-pan-x"
            >
              {HUB_TABS.map((tab) => {
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
                        layoutId="distributor-workspace-tab-underline"
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

          <DistributorEditorialGrid
            onNavigate={onNavigate}
            onOpenAnalytics={() => setTelemetryOpen(true)}
            activeFilter={mobileTab}
            layoutMode="matrix"
          />
        </section>
      </div>
      )}

      {/* Hub Telemetry Slide-Out Drawer */}
      <ActionDrawer
        isOpen={telemetryOpen}
        onClose={() => setTelemetryOpen(false)}
        title="Hub Operations Telemetry"
        subtitle="Fulfillment metrics and margin accounting"
        width="lg"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB]">
              <span className="text-xs text-[#6B7280] block">Cleared Wholesale Margin</span>
              <p className="font-heading font-semibold text-xl sm:text-2xl text-[#0F0F10] mt-1 font-digit">
                <AnimatedMetricValue
                  value={totalMargin}
                  format={(n) => `₦${Math.round(n).toLocaleString('en-NG')}`}
                />
              </p>
              <span className="text-xs text-[#4B5563] block mt-1">Cleared for payout</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB]">
              <span className="text-xs text-[#6B7280] block">Orders In Queue</span>
              <p className="font-heading font-semibold text-xl sm:text-2xl text-[#0F0F10] mt-1 font-digit">
                <AnimatedMetricValue value={pendingOrders.length} />
              </p>
              <span className="text-xs text-[#6B7280] block mt-1">Awaiting fulfillment</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-white space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[#0F0F10]">Hub Operations Snapshot</span>
              <span className="text-xs font-mono text-[#4B5563]">Live recorded totals</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-center border-t border-[#E5E7EB]">
              <div className="p-2.5 rounded-xl bg-[#FAF9F6]">
                <span className="text-xs text-[#6B7280] block">Tracked SKUs</span>
                <AnimatedMetricValue value={inventoryItems.length} className="text-sm font-semibold text-[#0F0F10]" />
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF9F6]">
                <span className="text-xs text-[#6B7280] block">Low-Stock Alerts</span>
                <AnimatedMetricValue value={lowStockItems.length} className="text-sm font-semibold text-[#0F0F10]" />
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF9F6]">
                <span className="text-xs text-[#6B7280] block">Lab Shipments</span>
                <AnimatedMetricValue value={labShipments.length} className="text-sm font-semibold text-[#0F0F10]" />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-white space-y-3">
            <h4 className="text-xs font-medium text-[#0F0F10]">Top Moving Skincare Formulations</h4>
            <div className="space-y-2 text-xs">
              {inventoryItems.slice(0, 3).map((item) => (
                <div key={item.sku} className="flex items-center justify-between py-1.5 border-b border-[#E5E7EB]/70">
                  <span className="text-[#0F0F10] font-medium">{item.productName}</span>
                  <span className="font-mono text-[#0F0F10] font-medium">
                    {item.lagosHub} units {item.lagosHub <= item.lowStockThreshold && '(Low Stock)'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => {
                setTelemetryOpen(false);
                onNavigate('orders');
              }}
              className="flex-1 min-h-11 rounded-xl bg-[#0F0F10] text-white text-xs font-medium hover:bg-[#27272A] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Package size={14} />
              <span>Open Orders Queue ({pendingOrders.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTelemetryOpen(false);
                onNavigate('restock');
              }}
              className="flex-1 min-h-11 rounded-xl border border-[#E5E7EB] bg-white text-xs font-medium text-[#0F0F10] hover:bg-[#FAF9F6] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Truck size={14} />
              <span>Order Bulk Restock</span>
            </button>
          </div>
        </div>
      </ActionDrawer>
    </div>
  );
};
