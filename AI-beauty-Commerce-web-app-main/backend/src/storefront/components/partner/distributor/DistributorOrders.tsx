import React, { useState, useMemo, useEffect } from 'react';
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
  ArrowRight,
  ShieldCheck,
  Check
} from '../../common/SolidIcons';
import { FilterTabs } from '../shared/FilterTabs';
import { StatusBadge } from '../shared/StatusBadge';
import { StatChip } from '../shared/StatChip';
import { ActionDrawer } from '../shared/ActionDrawer';
import { useApp } from '../../../context/AppContext';
import { Order } from '../../../types';
import { nextPartnerOrderAction } from '../../../lib/order-journey';
import { partnerOrderTransition, mapServerOrder } from '../../../lib/owned-api';

export interface DistributorOrdersProps {
  initialSelectedOrderId?: string | null;
}

export const DistributorOrders: React.FC<DistributorOrdersProps> = ({
  initialSelectedOrderId
}) => {
  const { orders: appOrders, addLocalOrder, selectedCity } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'ready' | 'transit' | 'delivered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [handoffPinInput, setHandoffPinInput] = useState('');
  const [deliveryEvidence, setDeliveryEvidence] = useState('');
  const [savingOrder, setSavingOrder] = useState(false);
  useEffect(() => { setHandoffPinInput(''); setDeliveryEvidence(''); }, [selectedOrder?.id]);
  const nextAction = nextPartnerOrderAction(selectedOrder?.rawOrder);
  const [handoffSuccess, setHandoffSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Hydrate orders from AppContext, standardizing the format
  const mappedOrders = useMemo(() => {
    return appOrders.map((ord: Order) => {
      // Map OrderStatus to distributor portal status
      let mappedStatus: 'awaiting-packing' | 'ready' | 'in-transit' | 'delivered' = 'awaiting-packing';
      if (ord.status === 'Delivered') mappedStatus = 'delivered';
      else if (ord.status === 'In Transit' || ord.status === 'Shipped') mappedStatus = 'in-transit';
      else if (ord.status === 'Ready for Pickup') mappedStatus = 'ready';
      else if (ord.status === 'Processing' || ord.status === 'Awaiting Packing') mappedStatus = 'awaiting-packing';

      return {
        id: ord.id,
        rawOrder: ord,
        customer: ord.shippingAddress?.name || 'Valued Client',
        phone: ord.shippingAddress?.phone || '',
        address: ord.shippingAddress
          ? `${ord.shippingAddress.street}, ${ord.shippingAddress.city}, ${ord.shippingAddress.state}`
          : '',
        city: ord.shippingAddress?.city || 'Lagos',
        items: ord.items.map((it) => ({
          name: it.productName,
          sku: it.productId,
          qty: it.quantity,
          price: it.price
        })),
        total: ord.total,
        paymentMethod: ord.paymentMethod || ord.paymentStatus || 'Awaiting payment confirmation',
        status: mappedStatus,
        courier: ord.courierName || (mappedStatus === 'delivered' ? 'Delivered' : mappedStatus === 'in-transit' ? 'In transit' : mappedStatus === 'ready' ? 'Ready for pickup' : 'Awaiting hub processing'),
        courierPin: ord.courierPin || '',
        time: ord.date || 'Today'
      };
    });
  }, [appOrders]);

  const filteredOrders = useMemo(() => {
    return mappedOrders.filter((o) => {
      if (activeTab === 'new' && o.status !== 'awaiting-packing') return false;
      if (activeTab === 'ready' && o.status !== 'ready') return false;
      if (activeTab === 'transit' && o.status !== 'in-transit') return false;
      if (activeTab === 'delivered' && o.status !== 'delivered') return false;
      if (
        searchQuery &&
        !o.customer.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !o.id.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [mappedOrders, activeTab, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: mappedOrders.length,
      new: mappedOrders.filter((o) => o.status === 'awaiting-packing').length,
      ready: mappedOrders.filter((o) => o.status === 'ready').length,
      transit: mappedOrders.filter((o) => o.status === 'in-transit').length,
      delivered: mappedOrders.filter((o) => o.status === 'delivered').length
    };
  }, [mappedOrders]);

  const handleOrderAction = async () => {
    const order = selectedOrder?.rawOrder as Order | undefined;
    const action = nextPartnerOrderAction(order);
    if (!order?.serverId || !action || savingOrder) return;
    if (action === 'CONFIRM_PICKUP' && !/^\d{6}$/.test(handoffPinInput.trim())) { showToast('Enter the customer’s six-digit collection code.'); return; }
    if (action === 'COMPLETE_DELIVERY' && deliveryEvidence.trim().length < 6) { showToast('Enter the delivery evidence before completing this order.'); return; }
    setSavingOrder(true);
    try {
      const { result } = await partnerOrderTransition({ orderId: order.serverId, transition: action, ...(action === 'CONFIRM_PICKUP' ? { code: handoffPinInput.trim() } : {}), note: action === 'COMPLETE_DELIVERY' ? deliveryEvidence.trim() : '' });
      addLocalOrder(mapServerOrder(result, [], order.paymentMethod));
      showToast(`Order ${result.orderNumber} updated: ${result.status}.`);
      setSelectedOrder(null);
    } catch (error) { showToast(error instanceof Error ? error.message : 'The order could not be updated. Please try again.'); }
    finally { setSavingOrder(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast message */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 text-xs font-semibold flex items-center justify-between shadow-xl animate-in slide-in-from-top-2">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-[#D4AF37]" /> {toastMessage}
          </span>
          <button onClick={() => setToastMessage(null)} className="text-white hover:text-white/80 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="pb-2 border-b border-[#E5E7EB]">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
          Hub Fulfilment Management • {selectedCity || 'Lagos'} Central Hub
        </span>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
          Orders &amp; Fulfilment Queue
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
          Process local orders, generate shipping waybills, and coordinate courier handoffs with real-time customer tracking.
        </p>
      </div>

      {/* Minimalist Summary Cards with Status Stamps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatChip
          label="Awaiting Hub Packing"
          value={`${counts.new} Orders`}
          subtext="Lab tamper seals & cold packaging"
          badge={counts.new > 0 ? 'NEEDS ACTION' : 'CLEARED'}
        />
        <StatChip
          label="Ready for Courier Pickup"
          value={`${counts.ready} Orders`}
          subtext="Assigned riders on route to hub"
          badge="DISPATCH READY"
        />
        <StatChip
          label="In Transit / Out for Delivery"
          value={`${counts.transit} Orders`}
          change="+2.1%"
          trend="up"
          subtext="Real-time bike courier tracking"
          badge="EN ROUTE"
        />
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <FilterTabs
          tabs={[
            { id: 'all', label: 'All Orders', count: counts.all },
            { id: 'new', label: 'Awaiting Packing', count: counts.new, badge: counts.new > 0 ? 'Needs Action' : undefined },
            { id: 'ready', label: 'Ready for Courier', count: counts.ready },
            { id: 'transit', label: 'In Transit', count: counts.transit },
            { id: 'delivered', label: 'Delivered', count: counts.delivered }
          ]}
          activeTab={activeTab}
          onChange={(t) => setActiveTab(t as typeof activeTab)}
        />

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order # or client..."
            className="w-full pl-9 pr-4 py-2 rounded-full border border-[#E5E7EB] bg-white text-xs text-[#0F0F10] placeholder-[#9CA3AF] focus:outline-none focus:border-[#D4AF37]"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-3xl border border-[#E5E7EB] bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[10px] font-mono font-bold uppercase text-[#9CA3AF] tracking-wider bg-[#FAF9F6]">
                <th className="py-3 px-4 sm:px-6">Order ID &amp; Time</th>
                <th className="py-3 pr-3">Client &amp; Hub Route</th>
                <th className="py-3 pr-3">Formulations</th>
                <th className="py-3 text-right">Total (₦)</th>
                <th className="py-3 text-center">Status</th>
                <th className="py-3 pr-4 sm:pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#71717A] text-xs">
                    No orders match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className="hover:bg-[#FAF9F6]/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-4 sm:px-6 font-mono">
                      <span className="font-bold text-[#0F0F10] block group-hover:text-[#997A2E] transition-colors">
                        {ord.id}
                      </span>
                      <span className="text-[11px] text-[#9CA3AF] flex items-center gap-1 mt-0.5">
                        <Clock size={11} /> {ord.time}
                      </span>
                    </td>
                    <td className="py-4 pr-3">
                      <span className="font-bold text-[#0F0F10] block">{ord.customer}</span>
                      <span className="text-[11px] text-[#6B7280] line-clamp-1 max-w-[200px]">
                        {ord.address}
                      </span>
                    </td>
                    <td className="py-4 pr-3">
                      <span className="text-[#0F0F10] font-medium block">
                        {ord.items.map((i: any) => `${i.qty}x ${i.name}`).join(', ')}
                      </span>
                    </td>
                    <td className="py-4 text-right font-mono font-extrabold text-[#0F0F10]">
                      ₦{ord.total.toLocaleString('en-NG')}
                    </td>
                    <td className="py-4 text-center">
                      <StatusBadge status={ord.status} />
                    </td>
                    <td className="py-4 pr-4 sm:pr-6 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(ord);
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shadow-xs"
                      >
                        <span>Process</span>
                        <ArrowRight size={12} className="text-[#D4AF37]" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Action Drawer */}
      <ActionDrawer
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={`Order Fulfilment • ${selectedOrder?.id}`}
        subtitle={`Client: ${selectedOrder?.customer} (${selectedOrder?.phone})`}
        footer={
          <div className="w-full space-y-3">
            {nextAction === 'CONFIRM_PICKUP' && <label className="block text-xs font-bold">Customer collection code
              <input aria-label="Customer collection code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={handoffPinInput} onChange={event => setHandoffPinInput(event.target.value.replace(/[^0-9]/g, ''))} placeholder="Six-digit code from the customer's Orders page" className="mt-2 w-full rounded-xl border p-3 font-mono" />
            </label>}
            {nextAction === 'COMPLETE_DELIVERY' && <label className="block text-xs font-bold">Delivery evidence
              <textarea aria-label="Delivery evidence" required minLength={6} maxLength={500} value={deliveryEvidence} onChange={event => setDeliveryEvidence(event.target.value)} placeholder="Record who received the delivery and the handoff details." className="mt-2 w-full rounded-xl border p-3" />
            </label>}
            {nextAction ? <button type="button" disabled={savingOrder} onClick={() => void handleOrderAction()} className="w-full rounded-full bg-[#0F0F10] px-5 py-3 text-xs font-bold text-white disabled:opacity-50">
              {savingOrder ? 'Saving order…' : ({ ACCEPT: 'Accept order for preparation', READY_PICKUP: 'Mark ready for pickup', DISPATCH: 'Dispatch delivery', CONFIRM_PICKUP: 'Confirm customer pickup', COMPLETE_DELIVERY: 'Complete delivery' })[nextAction]}
            </button> : <p className="text-xs text-[#6B7280]">{selectedOrder?.rawOrder?.paymentStatus !== 'PAID' ? 'Payment confirmation is required before fulfilment.' : 'No further fulfilment action is available for this order.'}</p>}
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
                  Payment Method
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
              <h4 className="font-bold text-[#0F0F10]">Natural Formulations to Pack</h4>
              <div className="space-y-2">
                {selectedOrder.items.map((it: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl border border-[#E5E7EB] bg-white flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-[#0F0F10]">{it.name}</p>
                      <p className="text-[10px] font-mono text-[#6B7280]">
                        SKU: {it.sku} • Qty: {it.qty}
                      </p>
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
              {selectedOrder.courierPin && (
                <p className="text-[11px] text-[#4B5563]">
                  Rider Verification Code: <strong>{selectedOrder.courierPin}</strong>
                </p>
              )}
            </div>
          </div>
        )}
      </ActionDrawer>
    </div>
  );
};
