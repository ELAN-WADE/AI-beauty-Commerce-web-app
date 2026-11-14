import React, { useState } from 'react';
import {
  BarChart2,
  ChevronDown,
  ChevronUp,
  Package,
  Truck
} from '../../common/SolidIcons';
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

  const hubDisplayName = authUser?.profile?.displayName || (authUser?.email ? `${authUser.email.split('@')[0]} Hub` : `${selectedCity} Central Hub`);

  return (
    <div className="space-y-6">
      {/* Compact Hub Greeting & Telemetry Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading font-semibold text-xl sm:text-2xl text-[#0F0F10] tracking-tight">
            {hubDisplayName}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowExecutiveStrip(!showExecutiveStrip)}
            className="min-h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-medium text-[#4B5563] hover:text-[#0F0F10] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Summary</span>
            {showExecutiveStrip ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          <button
            type="button"
            onClick={() => setTelemetryOpen(true)}
            className="min-h-10 px-3 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-medium text-[#0F0F10] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BarChart2 size={14} className="text-[#4B5563]" />
            <span>Hub Telemetry</span>
          </button>
        </div>
      </div>

      {/* Expandable Summary Metrics Strip */}
      {showExecutiveStrip && (
        <div className="space-y-3 p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5E7EB]">
            <span className="text-xs font-medium text-[#0F0F10]">
              Live Hub Telemetry
            </span>
            {inTransitLab && (
              <span className="text-xs text-[#6B7280]">
                Lab Restock #{inTransitLab.batchNumber}: <strong className="font-medium text-[#0F0F10]">{inTransitLab.status}</strong> ({inTransitLab.courier})
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

      {/* Hub Operations Workspace Header & Underline Filter Tabs */}
      <section className="space-y-5">
        <div className="space-y-3">
          <h2 className="font-heading font-medium text-lg text-[#0F0F10] tracking-tight">
            Operations Workspace
          </h2>

          <div className="flex items-center gap-6 border-b border-[#E5E7EB] overflow-x-auto no-scrollbar touch-pan-x">
            {[
              { id: 'all', label: 'All Operations' },
              { id: 'fulfillment', label: 'Fulfillment' },
              { id: 'wholesale', label: 'Wholesale' },
              { id: 'territory', label: 'Territory' }
            ].map((f) => {
              const isSelected = categoryFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setCategoryFilter(f.id as DistributorCategoryFilter)}
                  className={`relative pb-3 pt-1 min-h-11 whitespace-nowrap text-sm transition-colors cursor-pointer touch-manipulation ${
                    isSelected
                      ? 'text-[#0F0F10] font-medium'
                      : 'text-[#6B7280] hover:text-[#0F0F10] font-normal'
                  }`}
                >
                  <span>{f.label}</span>
                  {isSelected && (
                    <span className="absolute bottom-0 inset-x-0 h-[1.5px] bg-[#0F0F10]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <DistributorEditorialGrid
          onNavigate={onNavigate}
          onOpenAnalytics={() => setTelemetryOpen(true)}
          activeFilter={categoryFilter}
          layoutMode="matrix"
        />
      </section>

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
                ₦{totalMargin.toLocaleString('en-NG')}
              </p>
              <span className="text-xs text-[#4B5563] block mt-1">Cleared for payout</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB]">
              <span className="text-xs text-[#6B7280] block">Orders In Queue</span>
              <p className="font-heading font-semibold text-xl sm:text-2xl text-[#0F0F10] mt-1 font-digit">
                {pendingOrders.length}
              </p>
              <span className="text-xs text-[#6B7280] block mt-1">Awaiting fulfillment</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-[#E5E7EB] bg-white space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[#0F0F10]">Lagos Dispatch Turnaround</span>
              <span className="text-xs font-mono text-[#4B5563]">On-time SLA pending</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 text-center border-t border-[#E5E7EB]">
              <div className="p-2.5 rounded-xl bg-[#FAF9F6]">
                <span className="text-xs text-[#6B7280] block">Average Handoff</span>
                <span className="text-sm font-semibold text-[#0F0F10]">1.8 hrs</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF9F6]">
                <span className="text-xs text-[#6B7280] block">Courier Fleet</span>
                <span className="text-sm font-semibold text-[#0F0F10]">12 Couriers</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF9F6]">
                <span className="text-xs text-[#6B7280] block">Same-Day Rate</span>
                <span className="text-sm font-semibold text-[#0F0F10]">96.8%</span>
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
