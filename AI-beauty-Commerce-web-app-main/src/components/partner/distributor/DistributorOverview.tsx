import React from 'react';
import {
  Package,
  Layers,
  Truck,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Clock,
  Printer,
  MapPin,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';
import { StatChip } from '../shared/StatChip';
import { StatusBadge } from '../shared/StatusBadge';

export interface DistributorOverviewProps {
  onNavigate: (routeId: string) => void;
  onOpenOrder: (orderId: string) => void;
  onRestockItem: (sku: string) => void;
}

export const DistributorOverview: React.FC<DistributorOverviewProps> = ({
  onNavigate,
  onOpenOrder,
  onRestockItem
}) => {
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Operational Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10] tracking-tight">
              Good morning, Adewale ✦
            </h1>
            <span className="hidden sm:inline-block text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FBF5E8] text-[#997A2E] border border-[#D4AF37]/30">
              Lagos Central Hub • Silver
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1 font-medium">
            <strong>7 orders</strong> require immediate packing and courier handoff for same-day delivery today.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('orders')}
            className="px-4 py-2 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] transition-colors cursor-pointer"
          >
            All Orders (24)
          </button>
          <button
            onClick={() => onNavigate('restock')}
            className="px-5 py-2 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold shadow-xs active:scale-[0.97] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Truck size={14} className="text-[#D4AF37]" />
            <span>Wholesale Restock</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatChip
          label="Today's Hub Orders"
          value="24"
          change="7 Action Needed"
          trend="up"
          subtext="Same-day dispatch target"
          badge="7 Pending"
          badgeVariant="warning"
        />
        <StatChip
          label="Hub Inventory Health"
          value="86%"
          subtext="4 SKUs under reorder mark"
          badge="4 Low Stock"
          badgeVariant="warning"
        />
        <StatChip
          label="This Week Sales Volume"
          value="₦2,240,000"
          change="+18.2%"
          trend="up"
          subtext="Processed via Lagos Hub"
        />
        <StatChip
          label="Available Wholesale Margin"
          value="₦320,450"
          subtext="32% earned partner profit"
          badge="Cleared"
          badgeVariant="success"
        />
      </section>

      {/* Main Operational Split: Urgent Fulfilment Queue vs Low Stock Alerts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Urgent Fulfilment Queue */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#997A2E] block">
                Priority Action
              </span>
              <h2 className="font-heading font-bold text-lg text-[#0F0F10]">
                Urgent Fulfilment Queue (7)
              </h2>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-bold text-[#0F0F10] hover:text-[#997A2E] flex items-center gap-1 cursor-pointer"
            >
              <span>View All Queue</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="divide-y divide-[#E5E7EB]">
            {/* Order 1: Ready for pickup */}
            <div className="py-4 first:pt-2 last:pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-[#0F0F10]">
                    #ORD-LAG-7821
                  </span>
                  <StatusBadge status="ready" label="Ready for Courier" />
                  <span className="text-[10px] text-[#9CA3AF] font-mono">15m ago</span>
                </div>
                <p className="text-xs font-bold text-[#0F0F10]">
                  Khadija Sanusi • Wuse 2, Abuja Dispatch
                </p>
                <p className="text-xs text-[#6B7280]">
                  2x Radiant Glow Oil 100ml • Total: <strong>₦48,000</strong> (Paid Online ✓)
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onOpenOrder('ORD-LAG-7821')}
                  className="px-4 py-2 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
                >
                  <span>Handoff to Courier</span>
                  <ArrowRight size={13} className="text-[#D4AF37]" />
                </button>
              </div>
            </div>

            {/* Order 2: Awaiting Packing */}
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-[#0F0F10]">
                    #ORD-LAG-7817
                  </span>
                  <StatusBadge status="awaiting-packing" label="Needs Packing" />
                  <span className="text-[10px] text-[#9CA3AF] font-mono">35m ago</span>
                </div>
                <p className="text-xs font-bold text-[#0F0F10]">
                  Tonia Hassan • Lekki Phase 1, Lagos
                </p>
                <p className="text-xs text-[#6B7280]">
                  1x Sun Defense SPF50+, 1x Hydrating Mist • Total: <strong>₦22,000</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onOpenOrder('ORD-LAG-7817')}
                  className="px-4 py-2 rounded-full border border-[#D4AF37] bg-[#FBF5E8] hover:bg-[#F3EEE3] text-xs font-bold text-[#997A2E] flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={13} />
                  <span>Print Label &amp; Pack</span>
                </button>
              </div>
            </div>

            {/* Order 3: In Transit */}
            <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-[#0F0F10]">
                    #ORD-LAG-7819
                  </span>
                  <StatusBadge status="in-transit" label="With Courier" />
                  <span className="text-[10px] text-[#9CA3AF] font-mono">1h ago</span>
                </div>
                <p className="text-xs font-bold text-[#0F0F10]">
                  Emeka Nwosu • Victoria Island, Lagos
                </p>
                <p className="text-xs text-[#6B7280]">
                  1x Clinical Barrier Cream • Total: <strong>₦39,500</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => alert('Courier: Ibrahim Musa (Gokada) • +234 812 990 1234')}
                  className="px-4 py-2 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] cursor-pointer"
                >
                  Track Courier
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right (1 col): Low Stock Alerts */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-rose-600 block">
                  Action Required
                </span>
                <h3 className="font-heading font-bold text-base text-[#0F0F10]">
                  Low Stock Alerts (4)
                </h3>
              </div>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs font-bold text-[#997A2E] hover:underline cursor-pointer"
              >
                Inventory
              </button>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Radiant Glow Oil 50ml', sku: 'DES-BO-01', left: 8, min: 20, isOut: false },
                { name: 'Sun Defense SPF50+', sku: 'DES-SS-01', left: 5, min: 15, isOut: false },
                { name: 'Hydrating Botanical Mist', sku: 'DES-HM-01', left: 0, min: 25, isOut: true },
                { name: 'Nourishing Body Butter', sku: 'DES-BB-01', left: 12, min: 30, isOut: false }
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#0F0F10] line-clamp-1">{item.name}</p>
                    <p className="text-[10px] font-mono text-[#6B7280]">
                      {item.isOut ? (
                        <span className="text-rose-600 font-bold">OUT OF STOCK (0 units)</span>
                      ) : (
                        <span>{item.left} units left (Min: {item.min})</span>
                      )}
                    </p>
                  </div>

                  <button
                    onClick={() => onRestockItem(item.sku)}
                    className="px-3 py-1.5 rounded-full bg-white hover:bg-[#0F0F10] hover:text-white border border-[#E5E7EB] text-[11px] font-bold text-[#0F0F10] shrink-0 cursor-pointer transition-colors"
                  >
                    Restock
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('restock')}
            className="w-full mt-6 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Order Wholesale Cartons</span>
            <ArrowRight size={13} className="text-[#D4AF37]" />
          </button>
        </div>
      </section>
    </div>
  );
};
