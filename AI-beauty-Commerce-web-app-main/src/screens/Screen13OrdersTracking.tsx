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
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Header } from '../components/common/Header';
import { fetchServerOrder, isOwnedApiConfigured, serverOrderUuid, submitTransferClaim } from '../lib/owned-api';
import type { Order } from '../types';

const TransferClaimCard: React.FC<{ order: Order; email: string }> = ({ order, email }) => {
  const uuid = serverOrderUuid(order.id);
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
      setMessage('Proof submitted. We confirm transfers within a few hours.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
        Transfer proof submitted for order #{order.id}. Confirmation follows shortly.
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
  const { orders, activeOrder, setActiveOrder, selectedCity, openAIAssistant, navigateTo, isLiveBackend, authUser, checkoutAddress } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Processing' | 'Shipped' | 'Delivered'>('All');
  const [currentTrackingId, setCurrentTrackingId] = useState<string>(activeOrder?.id || 'DES-98214');

  const transferPendingOrders = isLiveBackend
    ? orders.filter((o) => o.paymentMethod?.startsWith('Bank transfer') && serverOrderUuid(o.id))
    : [];

  // Live server status for mapped orders (owned backend; hidden when unavailable).
  const [liveStatus, setLiveStatus] = useState<{ orderNumber: string; status: string; paymentStatus: string; total: number } | null>(null);

  useEffect(() => {
    if (!isOwnedApiConfigured) return;
    const target = activeOrder ?? orders[0];
    if (!target) return;
    const uuid = serverOrderUuid(target.id);
    if (!uuid) return;
    let cancelled = false;
    fetchServerOrder(uuid, authUser?.email ?? checkoutAddress.email ?? undefined)
      .then((view) => {
        if (!cancelled && view) {
          setLiveStatus({ orderNumber: view.orderNumber, status: view.status, paymentStatus: view.paymentStatus, total: Math.round(view.totalKobo / 100) });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeOrder?.id]);

  const formatNaira = (amt: number) => '₦' + amt.toLocaleString('en-NG');

  const trackingSteps = [
    { title: 'Order Confirmed & Payment Verified', time: '10:15 AM, Today', completed: true, desc: 'Paystack transaction reference #PS-84920 verified.' },
    { title: `Packed at ${selectedCity} Distribution Hub`, time: '11:45 AM, Today', completed: true, desc: 'Batch tested with clinical authenticity seals applied.' },
    { title: 'Dispatched with Courier', time: '01:20 PM, Today', completed: true, desc: 'Assigned to verified local bike rider for same-day delivery.' },
    { title: 'Out for Local Delivery', time: '02:30 PM, Today', active: true, completed: false, desc: 'Rider is currently 2.4 km away from your address.' },
    { title: 'Delivered & Handed Over', time: 'Estimated 3:15 PM', completed: false, desc: 'Recipient signature and PIN verification required.' },
  ];

  return (
    <div className="min-h-screen bg-white text-[#0F0F10] pb-28">
      {/* Mobile Top Header */}
      <div className="lg:hidden">
        <Header title="Track Your Order" />
      </div>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 space-y-6">
        {/* Live server status (owned backend; hidden when unavailable) */}
        {liveStatus && (
          <div className="p-4 rounded-2xl bg-[#0F0F10] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span>
              Order <strong className="font-mono text-[#D4AF37]">#{liveStatus.orderNumber}</strong>
              {' '}• {liveStatus.status} • {liveStatus.paymentStatus === 'PAID' ? 'Payment verified' : 'Payment pending'}
            </span>
            <span className="font-price font-bold text-[#D4AF37]">₦{liveStatus.total.toLocaleString('en-NG')}</span>
          </div>
        )}
        {/* Pending bank-transfer proofs (owned backend only) */}
        {transferPendingOrders.map((o) => (
          <TransferClaimCard key={o.id} order={o} email={authUser?.email ?? checkoutAddress.email ?? ''} />
        ))}

        {/* TWO-GRID TRACK ORDER SYSTEM (Requested in User Audio) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT GRID: Order Timeline, Milestones & Rider Details (6 cols) */}
          <div className="lg:col-span-6 space-y-5">
            {/* Status Summary Card */}
            <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EEE3] text-[#0F0F10] border border-[#E5E7EB] text-xs font-bold">
                  <Truck size={13} className="text-[#997A2E]" />
                  <span>Out For Same-Day Delivery</span>
                </span>
                <span className="text-xs font-mono font-bold text-[#0F0F10]">
                  ETA: 15–20 Mins
                </span>
              </div>

              <h2 className="font-heading font-bold text-lg text-[#0F0F10]">
                Your formulations are arriving shortly
              </h2>
              <p className="text-xs text-[#6B7280]">
                Dispatched directly from the verified <strong>{selectedCity} Partner Hub</strong> to avoid interstate shipping delays.
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

            {/* Dispatch Rider Profile Card */}
            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=140&q=80"
                  alt="Courier Rider"
                  className="w-12 h-12 rounded-full object-cover border border-[#D4AF37]/50"
                />
                <div>
                  <span className="text-xs font-bold text-[#0F0F10] block">Emeka Okafor</span>
                  <span className="text-[10px] text-[#0F0F10] font-semibold">• Verified Desla Fleet Rider</span>
                  <span className="text-[10px] text-[#6B7280] block font-mono">Honda Ace 125 (ABJ-482-XY)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="tel:+2348148120642"
                  className="w-9 h-9 rounded-full border border-[#E5E7EB] hover:bg-[#FAF9F6] flex items-center justify-center text-[#0F0F10] active-press transition-colors cursor-pointer"
                  title="Call Rider"
                >
                  <Phone size={15} />
                </a>
                <a
                  href="https://wa.me/2348148120642?text=Hello%20Emeka,%20checking%20on%20my%20Desla%20order%20delivery."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 flex items-center justify-center text-emerald-800 active-press transition-colors cursor-pointer"
                  title="WhatsApp Rider"
                >
                  <MessageCircle size={15} />
                </a>
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
                  GPS Active • 32 km/h
                </span>
              </div>

              {/* Stylized Interactive Map Container */}
              <div className="relative w-full h-[360px] rounded-2xl overflow-hidden bg-[#F4F4F6] border border-[#E5E7EB] flex items-center justify-center">
                {/* Stylized Vector Map Grid Graphic */}
                <svg className="w-full h-full opacity-60" viewBox="0 0 400 300">
                  <defs>
                    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E5E7EB" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Road Network Lines */}
                  <path d="M 40 240 Q 120 180 200 170 T 360 80" fill="none" stroke="#D1D5DB" strokeWidth="6" strokeLinecap="round" />
                  <path d="M 100 280 L 160 190 L 260 160 L 320 40" fill="none" stroke="#E5E7EB" strokeWidth="4" />

                  {/* Active Transit Path (Gold) */}
                  <style>{`
                    @keyframes transitTrace {
                      0% { stroke-dashoffset: 40; }
                      100% { stroke-dashoffset: 0; }
                    }
                  `}</style>
                  <path
                    d="M 60 220 Q 140 180 220 160 T 340 90"
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth="4"
                    strokeDasharray="10,6"
                    strokeLinecap="round"
                    style={{ animation: 'transitTrace 1.6s linear infinite' }}
                  />
                </svg>

                {/* Origin Hub Pin (Maitama Hub) */}
                <div className="absolute top-[200px] left-[50px] flex flex-col items-center">
                  <div className="px-2.5 py-1 rounded-full bg-[#0F0F10] text-[#D4AF37] font-mono text-[9.5px] font-bold shadow-md">
                    {selectedCity} Hub
                  </div>
                  <div className="w-3 h-3 rounded-full bg-[#0F0F10] ring-4 ring-[#D4AF37]/30 mt-1" />
                </div>

                {/* Moving Rider Pin */}
                <div className="absolute top-[145px] left-[205px] flex flex-col items-center animate-bounce">
                  <div className="px-2.5 py-1 rounded-full bg-[#D4AF37] text-[#0F0F10] font-heading text-[10px] font-black shadow-lg flex items-center gap-1">
                    <Truck size={11} />
                    <span>Emeka (2.4 km)</span>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-[#0F0F10] border-2 border-white shadow-md mt-1" />
                </div>

                {/* Destination Address Pin */}
                <div className="absolute top-[65px] right-[45px] flex flex-col items-center">
                  <div className="px-2.5 py-1 rounded-full bg-[#0F0F10] text-[#D4AF37] font-heading text-[10px] font-bold shadow-md flex items-center gap-1">
                    <MapPin size={11} />
                    <span>Your Address</span>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-[#0F0F10] ring-4 ring-[#D4AF37]/30 mt-1" />
                </div>
              </div>

              {/* Map Footer Metadata */}
              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-between text-xs text-[#6B7280]">
                <div>
                  <span className="font-bold text-[#0F0F10] block">Destination:</span>
                  <span className="text-[11px] truncate">14 Aminu Kano Crescent, Wuse 2, Abuja</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#0F0F10] block">Dispatch Type:</span>
                  <span className="text-emerald-700 font-semibold text-[11px]">Same-Day Local Bike</span>
                </div>
              </div>
            </div>

            {/* Need Assistance Card with Ask AI Concierge */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-[#0F0F10] block">Have questions about this package?</span>
                <span className="text-[11px] text-[#6B7280]">Ask our AI Concierge or chat with our 24/7 VIP team on WhatsApp.</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => navigateTo('ask-ai')}
                  className="px-3.5 py-2 rounded-full bg-[#0F0F10] text-[#D4AF37] hover:bg-black font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <Sparkles size={13} />
                  <span>Ask AI Concierge</span>
                </button>
                <a
                  href="https://wa.me/2348148120642"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-full bg-white border border-[#E5E7EB] text-[#0F0F10] hover:bg-gray-100 font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
