import React, { useEffect, useState } from 'react';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ChevronDown,
  MapPin,
  ExternalLink,
  MessageCircle,
  Phone,
  ShieldCheck,
  Navigation,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { fetchServerOrder, guestOrderToken, mapServerOrder, requestPickupCode, serverOrderUuid, submitTransferClaim } from '../../lib/owned-api';
import { useCustomerOrders } from '../../lib/use-customer-orders';
import type { Order } from '../../types';
import { BotanicalSprig, ApothecaryPuritySeal } from '../../components/common/HandDrawnAccents';

const TransferClaimCard: React.FC<{ order: Order; email: string }> = ({ order, email }) => {
  const uuid = order.serverId || serverOrderUuid(order.id);
  const [senderName, setSenderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [narration, setNarration] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!uuid) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim()) {
      setMessage('Enter the sender account name.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await submitTransferClaim({
        orderId: uuid,
        guestEmail: email || undefined,
        senderName: senderName.trim(),
        amountKobo: Math.round(order.total * 100),
        bankName: bankName.trim(),
        narration: narration.trim(),
        transferDate: transferDate.trim(),
      });
      setDone(true);
      setMessage('Proof submitted. It is awaiting administrator review.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
        Transfer proof submitted for order #{order.id}. Payment remains pending until administrator review.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-[#D4AF37]/40 shadow-xs space-y-3">
      <div>
        <h3 className="font-heading font-bold text-sm text-[#0F0F10]">Submit transfer proof — #{order.id}</h3>
        <p className="text-[11px] text-[#6B7280] mt-0.5">
          Paid ₦{order.total.toLocaleString('en-NG')} by direct transfer? Send the details for confirmation.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Sender account name" className="px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs outline-none focus:border-[#D4AF37]/60" />
        <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bank (e.g. GTBank)" className="px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs outline-none focus:border-[#D4AF37]/60" />
        <input value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="Transfer reference / narration" className="px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs outline-none focus:border-[#D4AF37]/60" />
        <input value={transferDate} onChange={(e) => setTransferDate(e.target.value)} placeholder="Date (e.g. 28 Sep 2026)" className="px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs outline-none focus:border-[#D4AF37]/60" />
      </div>
      {message && <p className="text-[11px] text-[#6B7280]">{message}</p>}
      <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-full bg-[#0F0F10] text-[#D4AF37] text-xs font-bold active:scale-95 transition-all cursor-pointer disabled:opacity-60">
        {busy ? 'Submitting…' : 'Submit proof'}
      </button>
    </form>
  );
};

export const Screen13OrdersTracking: React.FC = () => {
  const { authUser, activeOrder, navigateTo } = useApp();
  const own = useCustomerOrders(authUser?.id);
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState<Order | null>(null);
  const [detailOwner, setDetailOwner] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [pickup, setPickup] = useState<{ code: string; expiresAt: string } | null>(null);
  const [pickupBusy, setPickupBusy] = useState(false);
  const [pickupError, setPickupError] = useState('');
  const owner = authUser?.id || 'guest';
  const shown = detailOwner === owner && detail?.serverId === selectedId ? detail : null;
  useEffect(() => {
    let requested = '';
    try { const intent = JSON.parse(sessionStorage.getItem('desla-selected-order') || 'null'); if (intent?.userId === authUser?.id && own.orders.some(order => order.id === intent.id)) { requested = intent.id; sessionStorage.removeItem('desla-selected-order'); } } catch {}
    if (authUser) setSelectedId(previous => requested || (own.orders.some(order => order.id === previous) ? previous : (own.orders.find(order => order.id === activeOrder?.serverId || order.orderNumber === activeOrder?.id)?.id || own.orders[0]?.id || '')));

    else setSelectedId(activeOrder?.serverId || '');
  }, [authUser?.id, own.orders, activeOrder?.serverId]);
  useEffect(() => { setPickup(null); setPickupError(''); }, [selectedId, owner]);
  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    let cancelled = false; setLoading(true); setError('');
    void fetchServerOrder(selectedId, guestOrderToken(selectedId) || undefined).then(order => {
      if (cancelled) return;
      if (!order) throw new Error('Could not load this order. Check access or retry.');
      setDetail(mapServerOrder(order, [], '')); setDetailOwner(owner);
    }).catch(cause => { if (!cancelled) { setDetail(null); setError(cause instanceof Error ? cause.message : 'Could not load this order.'); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId, revision, owner]);
  useEffect(() => {
    const check = () => { if (document.visibilityState === 'visible') { setRevision(value => value + 1); void own.refresh(); } };
    window.addEventListener('focus', check); const timer = window.setInterval(check, 30000);
    return () => { window.removeEventListener('focus', check); window.clearInterval(timer); };
  }, [own.refresh]);
  const issueCode = async () => {
    if (!shown?.serverId || pickupBusy) return; setPickupBusy(true); setPickupError('');
    try { const result = await requestPickupCode(shown.serverId); if (!result) throw new Error('The collection code could not be issued. Refresh the order and try again.'); setPickup(result); }
    catch (cause) { setPickupError(cause instanceof Error ? cause.message : 'Could not issue a collection code.'); }
    finally { setPickupBusy(false); }
  };
  const currentTrackingId = shown?.id || '—';
  const liveStatus = shown ? { orderNumber: shown.id, status: shown.serverStatus || shown.status, paymentStatus: shown.paymentStatus, total: shown.total, fulfilmentMethod: shown.fulfilmentMethod } : null;
  const trackingSteps = (shown?.trackingSteps || []).map(step => ({ title: step.title, time: step.timestamp, completed: step.status === 'completed', active: step.status === 'current', desc: step.description }));
  const transferPendingOrders = shown?.paymentStatus === 'UNPAID' && /transfer/i.test(shown.paymentMethod || '') ? [shown] : [];
  const handlePickupCode = issueCode;
  const pickupCode = pickup?.code;
  const pickupMessage = pickupError || (pickup ? 'Expires ' + new Date(pickup.expiresAt).toLocaleString() : '');
  const formatNaira = (amount: number) => amount.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F0F10] pb-28 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 space-y-6">
        {/* Header Title with Clinical Apothecary Accents */}
        <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]/80">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
                Local Partner Dispatch Telemetry
              </span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl text-[#0F0F10] tracking-tight mt-0.5 flex items-center gap-2">
              <span>My orders</span>
              <BotanicalSprig className="w-5 h-5 opacity-60 text-[#D4AF37]" color="#D4AF37" />
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-white border border-[#E5E7EB] text-xs font-mono font-bold text-[#0F0F10] shadow-2xs">
              Tracking: #{currentTrackingId}
            </span>
            <button type="button" onClick={() => { setRevision(value => value + 1); void own.refresh(); }} disabled={loading || own.loading} className="rounded-full border bg-white px-4 py-2 text-xs">Refresh orders</button>
          </div>
        </div>

        {/* Live server status (owned backend; hidden when unavailable) */}
        {liveStatus && (
          <div className="p-4 rounded-2xl bg-[#0F0F10] text-white flex flex-col gap-2 text-xs border border-[#D4AF37]/30 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                Order <strong className="font-mono text-[#D4AF37]">#{liveStatus.orderNumber}</strong>
                {' '}• {liveStatus.status} • {liveStatus.paymentStatus === 'PAID' ? 'Payment verified' : 'Payment pending'}
              </span>
              <span className="font-price font-bold text-[#D4AF37]">₦{liveStatus.total.toLocaleString('en-NG')}</span>
            </div>
            {liveStatus.fulfilmentMethod === 'PICKUP' && (liveStatus.status === 'READY_PICKUP' && liveStatus.paymentStatus === 'PAID') && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 border-t border-white/10">
                <button onClick={() => void handlePickupCode()} disabled={pickupBusy} className="px-4 py-2 rounded-full bg-[#D4AF37] text-[#0F0F10] font-bold cursor-pointer disabled:opacity-50">
                  {pickupBusy ? 'Issuing…' : 'Get pickup code'}
                </button>
                {pickupCode && <strong className="font-mono text-lg tracking-[0.3em] text-[#D4AF37]">{pickupCode}</strong>}
                {pickupMessage && <span className="text-white/70">{pickupMessage}</span>}
              </div>
            )}
          </div>
        )}
        {/* Pending bank-transfer proofs (owned backend only) */}
        {transferPendingOrders.map((o) => (
          <TransferClaimCard key={o.id} order={o} email={authUser?.email || ''} />
        ))}

        {own.loading && !own.orders.length && <p role="status">Loading your orders…</p>}
        {own.error && <p role="alert">{own.error} <button className="underline" onClick={() => void own.refresh()}>Retry orders</button></p>}
        {!authUser && !shown && <div className="p-5 rounded-2xl border bg-white"><p>Sign in to see your orders.</p><button className="underline" onClick={() => navigateTo('login')}>Sign in</button></div>}
        {!!own.orders.length && <label className="block text-xs font-semibold">Select an order<select aria-label="Select an order" className="block mt-2 p-3 rounded-xl border bg-white w-full" value={selectedId} onChange={event => setSelectedId(event.target.value)}>{own.orders.map(order => <option key={order.id} value={order.id}>{order.orderNumber} · {order.status}</option>)}</select></label>}
        {authUser && !own.loading && !own.orders.length && <div className="p-5 rounded-2xl bg-white border text-sm">No orders yet. <button className="underline" onClick={() => navigateTo('catalogue')}>Explore formulations</button></div>}
        {own.hasMore && <button className="underline text-xs" onClick={() => void own.loadMore()}>Load older orders</button>}
        {loading && <p role="status">Loading order details…</p>}
        {error && <p role="alert">{error} <button className="underline" onClick={() => setRevision(value => value + 1)}>Retry order</button></p>}
        {/* TWO-GRID TRACK ORDER SYSTEM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT GRID: Order Timeline, Milestones & Rider Details (6 cols) */}
          <div className="lg:col-span-6 space-y-5">
            {/* Status Summary Card */}
            <div className="p-5 rounded-2xl bg-white/90 backdrop-blur-xl border border-[#E5E7EB] space-y-3 shadow-xs relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 pointer-events-none opacity-5">
                <ApothecaryPuritySeal size={100} />
              </div>
              <div className="flex items-center justify-between relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EEE3] text-[#0F0F10] border border-[#E5E7EB] text-xs font-bold">
                  <Truck size={13} className="text-[#997A2E]" />
                  <span>{shown?.status || 'No active order'}</span>
                </span>
                <span className="text-xs font-mono font-bold text-[#0F0F10]">
                  {shown?.paymentStatus || ''}
                </span>
              </div>

              <h2 className="font-heading font-bold text-lg text-[#0F0F10] relative z-10">
                {shown ? (shown.fulfilmentMethod === 'PICKUP' ? 'Your collection order' : 'Your delivery order') : 'Your order journey'}
              </h2>
              <p className="text-xs text-[#6B7280] relative z-10">
                {shown ? 'Order updates below come from your recorded order history.' : 'Choose an order to view its recorded progress.'}
              </p>
            </div>

            {/* Step-by-Step Order Milestone Stepper */}
            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-5">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F0F10]">
                Delivery Journey Milestones
              </h3>

              <div className="space-y-5 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E7EB]">
                {trackingSteps.map((step, idx) => (
                  <div key={idx} className="relative flex items-start gap-4">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                      step.completed
                        ? 'bg-[#0F0F10] text-[#D4AF37]'
                        : step.active
                        ? 'bg-[#D4AF37] text-[#0F0F10] ring-4 ring-[#D4AF37]/20 animate-pulse'
                        : 'bg-white border-2 border-gray-300 text-gray-400'
                    }`}>
                      {step.completed ? <CheckCircle2 size={15} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                    </div>

                    <div className="flex-1 -mt-0.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${step.active ? 'text-[#0F0F10]' : 'text-[#4B5563]'}`}>
                          {step.title}
                        </span>
                        <span className="text-[10px] font-mono text-[#9CA3AF]">{step.time}</span>
                      </div>
                      <p className="text-[11px] text-[#6B7280] mt-0.5 leading-snug">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Courier details remain in their original card; no fabricated rider identity. */}
            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-[#FAF9F6] flex items-center justify-center"><Truck size={22} /></div>
                <div><span className="text-xs font-bold block">Dispatch details</span><span className="text-[11px] text-[#6B7280]">{shown?.shipment ? [shown.shipment.provider, shown.shipment.trackingReference, shown.shipment.status].filter(Boolean).join(' · ') : 'Courier details have not been recorded for this order.'}</span></div>
              </div>
            </div>
          </div>

          {/* RIGHT GRID: Visual Delivery Route Map (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation size={16} className="text-[#D4AF37]" />
                  <h3 className="font-heading font-bold text-sm text-[#0F0F10]">
                    Live Delivery Transit Map
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#997A2E] font-bold bg-[#FBF5E8] px-2 py-0.5 rounded-full">
                  Location unavailable
                </span>
              </div>

              <div className="relative w-full h-[360px] rounded-2xl overflow-hidden bg-[#F4F4F6] border border-[#E5E7EB] flex flex-col gap-3 items-center justify-center px-8 text-center">
                <Navigation size={36} className="text-[#997A2E]" />
                <p className="text-xs text-[#6B7280]">Live courier location is not available for this order.</p>
              </div>

              {/* Map Footer Metadata */}
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
                <div>
                  <span className="font-bold text-[#0F0F10] block">Destination:</span>
                  <span className="text-[11px] truncate">{[shown?.shippingAddress.street, shown?.shippingAddress.city, shown?.shippingAddress.state].filter(Boolean).join(', ') || 'No delivery address recorded'}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#0F0F10] block">Dispatch Type:</span>
                  <span className="text-emerald-700 font-semibold text-[11px]">{shown?.fulfilmentMethod === 'PICKUP' ? 'Collection' : shown ? 'Delivery' : '—'}</span>
                </div>
              </div>
            </div>

            {shown && <section className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-3"><h3 className="font-heading font-bold text-sm">Order items</h3>{shown.items.map((item, index) => <div key={index} className="flex justify-between gap-3 text-xs border-t pt-3"><span>{item.productName} · {item.size} × {item.quantity}</span><span>{formatNaira(item.price * item.quantity)}</span></div>)}</section>}
            {/* Need Assistance Card with Ask AI Concierge */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-[#0F0F10] block">Have questions about this package?</span>
                <span className="text-[11px] text-[#6B7280]">Ask our concierge about your order.</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => navigateTo('ask-ai')}
                  className="px-3.5 py-2 rounded-full bg-[#0F0F10] text-[#D4AF37] hover:bg-black font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <ShieldCheck size={14} />
                  <span>Ask AI Concierge</span>
                </button>

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
