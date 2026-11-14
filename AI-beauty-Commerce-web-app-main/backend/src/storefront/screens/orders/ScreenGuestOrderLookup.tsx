import React, { useState } from 'react';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MapPin,
  ArrowLeft,
  MessageCircle,
  ExternalLink,
  AlertCircle
} from '../../components/common/SolidIcons';
import { useApp } from '../../context/AppContext';
import { fetchServerOrder, guestOrderToken, mapServerOrder } from '../../lib/owned-api';
import { Order } from '../../types';

export const ScreenGuestOrderLookup: React.FC = () => {
  const { navigateTo, openAIAssistant, authUser } = useApp();

  const [orderNumber, setOrderNumber] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);

  const handleLookup = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy) return;
    setError(''); setFoundOrder(null);
    const id = orderNumber.trim().replace(/^#/, '');
    if (!id) { setError('Enter your order number.'); return; }
    const token = accessToken.trim() || guestOrderToken(id) || undefined;
    if (!authUser && !token) { setError('Use the device where you checked out, or enter your private order access token. Contact support if you no longer have access.'); return; }
    setBusy(true);
    try {
      const order = await fetchServerOrder(id, token);
      if (!order) throw new Error('Order not found. Check the order number and access token.');
      setFoundOrder(mapServerOrder(order, [], ''));
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to locate the order. Try again.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F5] text-[#0F0F10] font-body flex flex-col justify-between selection:bg-[#D4AF37]/20 selection:text-[#997A2E] p-4 sm:p-6 lg:p-10">
      <main className="max-w-3xl w-full mx-auto">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateTo('home')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4B5563] hover:text-[#0F0F10] transition-colors cursor-pointer py-1.5 px-3 rounded-xl bg-white/70 border border-white/80 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Storefront</span>
          </button>
          <span className="text-[10px] font-mono tracking-widest text-[#997A2E] font-bold uppercase">
            DESLA!™ LIVE DISPATCH TELEMETRY
          </span>
        </div>

        {/* Lookup Header Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/90 rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.05)] mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0F4A38] text-white flex items-center justify-center shadow-sm">
              <Truck className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-[#0F0F10] tracking-tight">
                Guest Order &amp; Courier Tracking
              </h1>
              <p className="text-xs text-[#6B7280]">
                Look up recorded order status, payment confirmation and fulfilment updates.
              </p>
            </div>
          </div>

          <form onSubmit={handleLookup} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                Order Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. DES-829104"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] bg-white text-xs font-mono font-bold text-[#0F0F10] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0F0F10]"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                Private order access token (saved on this device)
              </label>
              <input
                type="text"
                autoComplete="off"
                placeholder="Leave blank for orders placed on this device"
                value={accessToken}
                onChange={event => setAccessToken(event.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D1D5DB] bg-white text-xs text-[#0F0F10] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0F0F10]"
              />
            </div>

            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold active:scale-[0.97] transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-sm"
              >
                {busy ? <Clock className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Track</span>
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* LIVE TRACKING RESULT VIEW                                */}
        {/* ======================================================== */}
        {foundOrder && (
          <div className="bg-white/85 backdrop-blur-xl border border-white/90 rounded-3xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)] animate-in fade-in duration-300">
            {/* Header with Status Pill */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-[#E5E7EB]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#0F0F10]">
                    Order #{foundOrder.id}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {foundOrder.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  {foundOrder.date ? `Ordered on ${foundOrder.date}` : 'Order details'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAIAssistant()}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF9F6] border border-[#D4AF37]/50 text-[#997A2E] text-xs font-bold hover:bg-[#F6E7C1]/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Ask AI Concierge</span>
                </button>
              </div>
            </div>

            <p className="my-6 rounded-2xl border p-4 text-sm">Payment: {foundOrder.paymentStatus || 'Awaiting confirmation'} · Fulfilment: {foundOrder.status}</p>

            {/* Step-by-Step Courier Timeline */}
            <div className="my-6">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#6B7280] font-bold mb-4">
                Live Courier Timeline
              </h3>
              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5E7EB]">
                {foundOrder.trackingSteps.map((step, idx) => (
                  <div key={idx} className="relative">
                    <div
                      className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                        step.status === 'completed'
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : step.status === 'current'
                          ? 'border-[#0F4A38] ring-4 ring-emerald-100'
                          : 'border-[#D1D5DB]'
                      }`}
                    >
                      {step.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#0F0F10]">{step.title}</h4>
                        <span className="text-[10px] font-mono text-[#9CA3AF]">{step.timestamp}</span>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-0.5">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Items Summary */}
            <div className="pt-6 border-t border-[#E5E7EB]">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#6B7280] font-bold mb-3">
                Items in This Dispatch ({foundOrder.items.length})
              </h3>
              <div className="space-y-2.5">
                {foundOrder.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white border border-[#E5E7EB]">
                    <div>
                      <p className="font-semibold text-[#0F0F10]">{item.productName}</p>
                      <span className="text-[10px] text-[#6B7280]">Size: {item.size} • Qty: {item.quantity}</span>
                    </div>
                    <span className="font-mono font-bold text-[#0F0F10]">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 text-xs font-bold text-[#0F0F10]">
                <span>{foundOrder.paymentStatus === 'PAID' ? 'Paid order total:' : 'Order total:'}</span>
                <span className="text-base font-mono font-extrabold text-[#0F4A38]">
                  ₦{foundOrder.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-3xl w-full mx-auto mt-8 text-center text-[11px] text-[#6B7280]">
        <p>🔒 End-to-End Encrypted Telemetry • Desla!™ Regional Fulfillment Logistics</p>
      </footer>
    </div>
  );
};
