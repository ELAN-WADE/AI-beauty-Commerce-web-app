import React, { useState } from 'react';
import {
  Package,
  Search,
  Printer,
  Truck,
  CheckCircle2,
  PhoneCall,
  Clock,
  AlertCircle,
  X,
  ArrowRight
} from 'lucide-react';
import { FilterTabs } from '../shared/FilterTabs';
import { StatusBadge } from '../shared/StatusBadge';
import { StatChip } from '../shared/StatChip';
import { ActionDrawer } from '../shared/ActionDrawer';

export interface DistributorOrdersProps {
  initialSelectedOrderId?: string | null;
}

export const DistributorOrders: React.FC<DistributorOrdersProps> = ({
  initialSelectedOrderId
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'ready' | 'transit' | 'delivered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const orders = [
    {
      id: 'ORD-LAG-7821',
      customer: 'Khadija Sanusi',
      phone: '+234 803 123 4567',
      address: 'Suite 12, Wuse 2 Crescent, Abuja (Dispatched from Central Hub)',
      items: [
        { name: 'Radiant Glow Oil 100ml', sku: 'DES-BO-01', qty: 2, price: 24000 }
      ],
      total: 48000,
      paymentMethod: 'Paystack Card Verified',
      status: 'ready' as const,
      courier: 'Gokada Express (Ibrahim Musa)',
      courierPin: '8204',
      time: '15 mins ago'
    },
    {
      id: 'ORD-LAG-7817',
      customer: 'Tonia Hassan',
      phone: '+234 814 987 6543',
      address: 'Plot 14 Admiralty Way, Lekki Phase 1, Lagos',
      items: [
        { name: 'Sun Defense SPF50+', sku: 'DES-SS-01', qty: 1, price: 14500 },
        { name: 'Hydrating Botanical Mist', sku: 'DES-HM-01', qty: 1, price: 7500 }
      ],
      total: 22000,
      paymentMethod: 'Direct Bank Transfer Claimed',
      status: 'awaiting-packing' as const,
      courier: 'Awaiting Hub Packing',
      courierPin: '—',
      time: '35 mins ago'
    },
    {
      id: 'ORD-LAG-7819',
      customer: 'Emeka Nwosu',
      phone: '+234 902 334 5566',
      address: 'Ahmadu Bello Way, Victoria Island, Lagos',
      items: [
        { name: 'Clinical Barrier Recovery Cream', sku: 'DES-BC-01', qty: 1, price: 39500 }
      ],
      total: 39500,
      paymentMethod: 'Paystack Card Verified',
      status: 'in-transit' as const,
      courier: 'Kwik Delivery (Chinedu)',
      courierPin: '4190',
      time: '1 hour ago'
    },
    {
      id: 'ORD-LAG-7810',
      customer: 'Funmi Pedro',
      phone: '+234 812 445 7788',
      address: 'Ikeja GRA, Lagos State',
      items: [
        { name: 'Gentle Amino Cleanser', sku: 'DES-AC-01', qty: 1, price: 11000 }
      ],
      total: 11000,
      paymentMethod: 'Paystack Card Verified',
      status: 'delivered' as const,
      courier: 'Delivered Successfully',
      courierPin: '—',
      time: 'Today, 9:30 AM'
    }
  ];

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'new' && o.status !== 'awaiting-packing') return false;
    if (activeTab === 'ready' && o.status !== 'ready') return false;
    if (activeTab === 'transit' && o.status !== 'in-transit') return false;
    if (activeTab === 'delivered' && o.status !== 'delivered') return false;
    if (searchQuery && !o.customer.toLowerCase().includes(searchQuery.toLowerCase()) && !o.id.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-2 border-b border-[#E5E7EB]">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
          Hub Fulfilment Management
        </span>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
          Orders &amp; Fulfilment Queue
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
          Process local orders, generate shipping waybills, and coordinate courier handoffs.
        </p>
      </div>

      {/* Minimalist Summary Cards with Status Stamps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatChip
          label="Awaiting Hub Packing"
          value="1 Order"
          subtext="Direct lab packaging required"
          badge="NEEDS ACTION"
        />
        <StatChip
          label="Ready for Courier Pickup"
          value="1 Order"
          subtext="Gokada Express assigned"
          badge="DISPATCH READY"
        />
        <StatChip
          label="Same-Day Delivery SLA"
          value="98.4%"
          change="+2.1%"
          trend="up"
          subtext="Turnaround under 3 hours"
          badge="ON-TIME"
        />
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <FilterTabs
          tabs={[
            { id: 'all', label: 'All Orders', count: 4 },
            { id: 'new', label: 'Awaiting Packing', count: 1, badge: 'Needs Action' },
            { id: 'ready', label: 'Ready for Courier', count: 1 },
            { id: 'transit', label: 'In Transit', count: 1 },
            { id: 'delivered', label: 'Delivered', count: 1 }
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
            placeholder="Search order ID or client…"
            className="w-full pl-8 pr-3 py-1.5 rounded-full border border-[#E5E7EB] bg-white text-xs focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
      </div>

      {/* Orders Table (Desktop) / Cards (Mobile) */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#9CA3AF] font-mono uppercase text-[10px]">
                <th className="pb-3 font-semibold">Order ID &amp; Time</th>
                <th className="pb-3 font-semibold">Client &amp; Destination</th>
                <th className="pb-3 font-semibold">Items</th>
                <th className="pb-3 font-semibold text-right">Total (₦)</th>
                <th className="pb-3 font-semibold text-center">Status</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]/70">
              {filteredOrders.map((ord) => (
                <tr
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className="hover:bg-[#FAF9F6] transition-colors cursor-pointer group"
                >
                  <td className="py-4 pr-3">
                    <span className="font-mono font-bold text-[#0F0F10] block group-hover:text-[#997A2E] transition-colors">
                      {ord.id}
                    </span>
                    <span className="text-[11px] text-[#9CA3AF] font-mono">{ord.time}</span>
                  </td>
                  <td className="py-4 pr-3">
                    <span className="font-bold text-[#0F0F10] block">{ord.customer}</span>
                    <span className="text-[11px] text-[#6B7280] block truncate max-w-xs">
                      {ord.address}
                    </span>
                  </td>
                  <td className="py-4 pr-3">
                    <span className="text-[#0F0F10] font-medium block">
                      {ord.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}
                    </span>
                  </td>
                  <td className="py-4 text-right font-mono font-extrabold text-[#0F0F10]">
                    ₦{ord.total.toLocaleString('en-NG')}
                  </td>
                  <td className="py-4 text-center">
                    <StatusBadge status={ord.status} />
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(ord);
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Process</span>
                      <ArrowRight size={12} className="text-[#D4AF37]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Action Drawer */}
      <ActionDrawer
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={`Order Details • ${selectedOrder?.id}`}
        subtitle={`Client: ${selectedOrder?.customer}`}
        footer={
          <div className="flex gap-2.5">
            {selectedOrder?.status === 'awaiting-packing' ? (
              <button
                onClick={() => {
                  alert(`Order ${selectedOrder.id} marked as packed and ready for courier pickup!`);
                  setSelectedOrder(null);
                }}
                className="flex-1 py-3 rounded-full bg-[#0F0F10] text-[#D4AF37] font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2 hover:bg-[#27272A]"
              >
                <Printer size={15} />
                <span>Print Waybill &amp; Mark Ready</span>
              </button>
            ) : selectedOrder?.status === 'ready' ? (
              <button
                onClick={() => {
                  alert(`Handoff verified with courier code ${selectedOrder.courierPin}! Order is now In Transit.`);
                  setSelectedOrder(null);
                }}
                className="flex-1 py-3 rounded-full bg-[#0F0F10] text-white font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2 hover:bg-[#27272A]"
              >
                <Truck size={15} className="text-[#D4AF37]" />
                <span>Verify Courier PIN ({selectedOrder?.courierPin}) &amp; Handoff</span>
              </button>
            ) : (
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-3 rounded-full border border-[#E5E7EB] bg-white text-xs font-semibold cursor-pointer"
              >
                Close Details
              </button>
            )}
          </div>
        }
      >
        {selectedOrder && (
          <div className="space-y-6 text-xs">
            {/* Status overview */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block">
                  Fulfilment State
                </span>
                <StatusBadge status={selectedOrder.status} size="md" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block">
                  Payment Status
                </span>
                <span className="font-bold text-[#0F0F10]">{selectedOrder.paymentMethod}</span>
              </div>
            </div>

            {/* Customer & Address */}
            <div className="space-y-2">
              <h4 className="font-bold text-[#0F0F10]">Client Delivery Details</h4>
              <div className="p-3.5 rounded-2xl border border-[#E5E7EB] bg-white space-y-1">
                <p className="font-bold text-[#0F0F10]">{selectedOrder.customer}</p>
                <p className="text-[#6B7280]">{selectedOrder.address}</p>
                <p className="font-mono text-[#997A2E] pt-1">
                  <a href={`tel:${selectedOrder.phone}`} className="hover:underline flex items-center gap-1">
                    <PhoneCall size={12} />
                    <span>{selectedOrder.phone}</span>
                  </a>
                </p>
              </div>
            </div>

            {/* Line items */}
            <div className="space-y-2">
              <h4 className="font-bold text-[#0F0F10]">Clinical Formulations to Pack</h4>
              <div className="space-y-2">
                {selectedOrder.items.map((it: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl border border-[#E5E7EB] bg-white flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-[#0F0F10]">{it.name}</p>
                      <p className="text-[10px] font-mono text-[#6B7280]">SKU: {it.sku} • Qty: {it.qty}</p>
                    </div>
                    <span className="font-mono font-bold text-[#0F0F10]">
                      ₦{it.price.toLocaleString('en-NG')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Courier info */}
            <div className="p-4 rounded-2xl bg-[#FBF5E8] border border-[#D4AF37]/30 space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-[#997A2E]">
                Assigned Logistics
              </span>
              <p className="font-bold text-[#0F0F10]">{selectedOrder.courier}</p>
              {selectedOrder.courierPin !== '—' && (
                <p className="text-[11px] text-[#4B5563]">
                  Handoff Security Verification PIN: <strong>{selectedOrder.courierPin}</strong>
                </p>
              )}
            </div>
          </div>
        )}
      </ActionDrawer>
    </div>
  );
};
