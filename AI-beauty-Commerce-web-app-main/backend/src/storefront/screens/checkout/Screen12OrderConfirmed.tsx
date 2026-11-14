import React, { useEffect, useState } from 'react';
import { CheckCircle2, Package, MapPin, ShoppingBag } from '../../components/common/SolidIcons';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { fetchServerOrder, lastPaymentReference, mapServerOrder, paymentStatus, paymentTokenFor } from '../../lib/owned-api';

export const Screen12OrderConfirmed: React.FC = () => {
  const { activeOrder, setActiveOrder, authUser, navigateTo, isLiveBackend } = useApp();
  const [restoring, setRestoring] = useState(!activeOrder);
  const [restoreError, setRestoreError] = useState('');
  useEffect(() => {
    if (activeOrder || !isLiveBackend) { setRestoring(false); return; }
    let cancelled = false;
    const reference = lastPaymentReference();
    if (!reference) { setRestoring(false); return; }
    setRestoring(true); setRestoreError('');
    void paymentStatus(reference).then(async payment => {
      const order = await fetchServerOrder(payment.orderId, paymentTokenFor(reference) || undefined);
      if (!order) throw new Error('The order could not be restored. Open your orders or use guest order lookup.');
      if (!cancelled) setActiveOrder(mapServerOrder(order, [], payment.provider));
    }).catch(() => { if (!cancelled) setRestoreError('The order could not be restored. Open your orders or use guest order lookup.'); })
      .finally(() => { if (!cancelled) setRestoring(false); });
    return () => { cancelled = true; };
  }, [activeOrder, isLiveBackend, setActiveOrder]);
  useEffect(() => {
    if (activeOrder?.paymentStatus !== 'PAID') return;
    try { confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#D4AF37', '#F6E7C1', '#0F0F10'] }); } catch { /* Motion is optional. */ }
  }, [activeOrder?.serverId, activeOrder?.paymentStatus]);
  const openOrders = () => navigateTo(authUser ? 'orders' : 'guest-order-lookup');
  if (restoring && !activeOrder) return <section role="status" className="mx-auto max-w-3xl p-8">Loading your order…</section>;
  if (!activeOrder) return <section className="mx-auto max-w-xl space-y-5 p-8"><h1 className="text-2xl font-bold">No order to display</h1><p>{restoreError || 'Open your orders or use guest order lookup to view a placed order.'}</p><button onClick={openOrders} className="rounded-full bg-black px-6 py-3 text-white">{authUser ? 'Open my orders' : 'Look up a guest order'}</button><button onClick={() => navigateTo('catalogue')} className="ml-4 underline">Continue shopping</button></section>;
  const paid = activeOrder.paymentStatus === 'PAID';
  const closed = ['CANCELLED', 'REFUNDED'].includes(activeOrder.serverStatus || '');
  const pickup = activeOrder.fulfilmentMethod === 'PICKUP';
  const address = activeOrder.shippingAddress;
  const money = (amount: number) => amount.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
  return <div className="min-h-screen bg-white pb-32 font-body text-[#0F0F10]">
    <main className="mx-auto max-w-3xl space-y-6 px-4 pt-6 sm:px-6 sm:pt-10">
      <section className="flex flex-col items-center rounded-3xl border border-[#E5E7EB] bg-white p-8 text-center shadow-lg">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#D4AF37]/40 bg-[#FAF9F6] text-[#D4AF37]">{paid ? <CheckCircle2 size={40} /> : <Package size={40} />}</div>
        <p className="mb-2 rounded-full border border-[#D4AF37]/30 bg-[#FAF9F6] px-3 py-1 font-mono text-xs text-[#997A2E]">Order #{activeOrder.id}</p>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">{closed ? 'Order update' : paid ? 'Payment confirmed' : 'Order received — payment pending'}</h1>
        <p className="mt-2 text-sm text-[#6B7280]">{closed ? 'Check the recorded order and payment status below.' : paid ? 'The server has confirmed payment. Fulfilment updates will appear in your order history.' : 'Your order is recorded. Fulfilment begins after payment is confirmed.'}</p>
        <p className="mt-4 text-sm">Payment: {activeOrder.paymentStatus || 'Not confirmed'} · Order: {activeOrder.status}</p>
      </section>
      {!closed && !paid && activeOrder.paymentMethod.startsWith('Bank transfer') && <p className="rounded-2xl border border-[#D4AF37]/40 bg-[#FBF5E8] p-4 text-sm">Complete your transfer, then submit proof from Orders. A submitted transfer is reviewed before payment is confirmed.</p>}
      <section className="space-y-4 rounded-3xl border border-[#E5E7EB] p-6 shadow-xs">
        <h2 className="font-heading font-bold">Order history</h2>
        {activeOrder.trackingSteps.length ? <ol className="space-y-3">{activeOrder.trackingSteps.map((step, index) => <li key={index} className="rounded-xl border border-[#E5E7EB] bg-[#FAF9F6] p-3"><p className="text-sm font-semibold">{step.title}</p><p className="mt-1 text-xs text-[#6B7280]">{step.timestamp}</p></li>)}</ol> : <p className="text-sm text-[#6B7280]">No shipment updates have been recorded yet.</p>}
      </section>
      <section className="space-y-3 rounded-3xl border border-[#E5E7EB] p-6 shadow-xs">
        <h2 className="flex items-center gap-2 font-bold"><MapPin size={18} />{pickup ? 'Pickup order contact' : 'Delivery address'}</h2>
        <p className="text-sm">{[address.name, address.phone].filter(Boolean).join(' · ') || 'Contact details are available in your order record.'}</p>
        {!pickup && <p className="text-sm text-[#6B7280]">{[address.street, address.city, address.state].filter(Boolean).join(', ') || 'No address is recorded.'}</p>}
        {pickup && <p className="text-sm text-[#6B7280]">Open Orders for the selected pickup location. When the order is ready, request your six-digit collection code there.</p>}
      </section>
      <section className="space-y-3 rounded-3xl border border-[#E5E7EB] p-6 shadow-xs">
        <div className="flex items-center justify-between"><h2 className="font-bold">Order items ({activeOrder.items.length})</h2><p className="font-bold">{money(activeOrder.total)}</p></div>
        {activeOrder.items.map((item, index) => <div key={index} className="flex items-center justify-between gap-3 border-t border-[#E5E7EB] py-3 text-sm"><div className="flex items-center gap-3">{item.image && <img src={item.image} alt={item.productName} className="h-12 w-12 rounded-xl object-cover" />}<div><p className="font-semibold">{item.productName}</p><p className="text-xs text-[#6B7280]">Qty: {item.quantity} · {item.size}</p></div></div><span>{money(item.price * item.quantity)}</span></div>)}
      </section>
      <div className="grid gap-3 sm:grid-cols-2"><button onClick={openOrders} className="flex items-center justify-center gap-2 rounded-full bg-[#0F0F10] p-4 text-sm font-bold text-white"><Package size={16} />Track order status</button><button onClick={() => navigateTo('home')} className="flex items-center justify-center gap-2 rounded-full border border-[#E5E7EB] p-4 text-sm"><ShoppingBag size={16} />Continue shopping</button></div>
    </main>
  </div>;
};
