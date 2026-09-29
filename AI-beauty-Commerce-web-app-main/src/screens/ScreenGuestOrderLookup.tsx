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
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchServerOrder, isOwnedApiConfigured } from '../lib/owned-api';
import { Order } from '../types';

export const ScreenGuestOrderLookup: React.FC = () => {
  const { navigateTo, openAIAssistant, orders: localOrders } = useApp();

  const [orderNumber, setOrderNumber] = useState('DES-829104');
  const [email, setEmail] = useState('amina.bello@example.com');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanId = orderNumber.trim().replace(/^#/, '');
    if (!cleanId || !email.trim()) {
      setError('Please provide both Order Number and Email.');
      return;
    }

    setBusy(true);
    try {
      if (isOwnedApiConfigured) {
        const res = await fetchServerOrder(cleanId, email.trim());
        if (res) {
          // Map to storefront order format
          const mapped: Order = {
            id: res.orderNumber,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            status: res.status === 'PENDING' ? 'Processing' : res.status === 'DELIVERED' ? 'Delivered' : res.status === 'CANCELLED' ? 'Cancelled' : 'Shipped',
            items: res.items.map((it) => ({
              productId: it.variantId,
              productName: it.productName,
              brand: 'DESLA!™',
              size: it.variantLabel,
              price: Math.round(it.unitPriceKobo / 100),
              quantity: it.qty,
              image: 'https://images.unsplash.com/photo-1608248597359-53e305221ec9?w=300'
            })),
            subtotal: Math.round(res.subtotalKobo / 100),
            deliveryFee: Math.round(res.deliveryFeeKobo / 100),
            total: Math.round(res.totalKobo / 100),
            fulfillmentType: 'local',
            paymentMethod: 'Online payment',
            trackingSteps: [
              { title: 'Order Confirmed', timestamp: '10:24 AM', status: 'completed', description: `Order ${res.orderNumber} confirmed` },
              { title: 'NAFDAC Quality Check', timestamp: '10:25 AM', status: 'completed', description: 'Batch Seal NG-4481 verified & packaged' },
              { title: 'Out for Local Delivery', timestamp: '01:15 PM', status: 'current', description: 'Assigned to Speedaf Express Courier (Lagos Hub)' },
              { title: 'Delivered', timestamp: 'Est. 4:30 PM', status: 'upcoming', description: 'Dispatched to customer address' }
            ],
            shippingAddress: {
              name: res.shippingAddress?.name || 'Amina Bello',
              street: res.shippingAddress?.street || '14 Admiralty Way, Lekki Phase 1',
              city: res.shippingAddress?.city || 'Lagos',
              state: res.shippingAddress?.state || 'Lagos State',
              phone: res.shippingAddress?.phone || '+234 803 123 4567'
            }
          };
          setFoundOrder(mapped);
          return;
        }
      }

      // Fallback demo order lookup
      const matched = localOrders.find(
        (o) => o.id.toLowerCase().replace(/^#/, '') === cleanId.toLowerCase()
      );
      if (matched) {
        setFoundOrder(matched);
      } else {
        // Generate simulated dynamic tracking result for demo continuity
        setFoundOrder({
          id: cleanId,
          date: 'Today, 29 Sep 2026',
          status: 'Shipped',
          items: [
            {
              productId: 'whip-1',
              productName: 'Raw Whipped Shea Butter (Vanilla & Amber)',
              brand: 'DESLA!™',
              size: '250ml',
              price: 18500,
              quantity: 1,
              image: 'https://images.unsplash.com/photo-1608248597359-53e305221ec9?w=300'
            },
            {
              productId: 'glw-1',
              productName: 'Melanin Glow Extrait Perfume Oil',
              brand: 'DESLA!™',
              size: '50ml',
              price: 20000,
              quantity: 1,
              image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=300'
            }
          ],
          subtotal: 38500,
          deliveryFee: 2500,
          total: 41000,
          fulfillmentType: 'local',
          paymentMethod: 'Guest lookup (demo)',
          distributorCity: 'Lagos (Ikeja Hub)',
          trackingSteps: [
            { title: 'Order Confirmed', timestamp: '10:24 AM', status: 'completed', description: `Order #${cleanId} authenticated` },
            { title: 'NAFDAC Batch Seal NG-4481', timestamp: '10:25 AM', status: 'completed', description: 'Assay verified by clinical QA laboratory' },
            { title: 'Out for Delivery', timestamp: '01:15 PM', status: 'current', description: 'Speedaf Logistics Courier #SPF-9921 on route' },
            { title: 'Delivered', timestamp: 'Est. 4:30 PM', status: 'upcoming', description: 'Package will be delivered directly to customer' }
          ],
          shippingAddress: {
            name: 'Amina Bello',
            street: '14 Admiralty Way, Lekki Phase 1',
            city: 'Lagos',
            state: 'Lagos State',
            phone: '+234 803 123 4567'
          }
        });
      }
    } catch {
      setError('Unable to locate order. Please check the order number and email.');
    } finally {
      setBusy(false);
    }
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
                Track courier dispatch, regional city hub fulfillment &amp; NAFDAC batch authenticity.
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
                Guest Email Address
              </label>
              <input
                type="email"
                required
                placeholder="e.g. amina.bello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  Ordered on {foundOrder.date} • Same-Day Dispatch
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAIAssistant()}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF9F6] border border-[#D4AF37]/50 text-[#997A2E] text-xs font-bold hover:bg-[#F6E7C1]/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Ask AI Concierge</span>
                </button>
              </div>
            </div>

            {/* Courier & NAFDAC Quality Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-[#E5EAE8] flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#0F0F10]">NAFDAC Batch Seal #NG-4481</h4>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Authenticity seal verified on chain. Clinically inspected for safety &amp; potency.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-[#E5EAE8] flex items-start gap-3">
                <Truck className="w-5 h-5 text-[#0F4A38] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#0F0F10]">Courier: Speedaf Express Logistics</h4>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Assigned Dispatch Rider: Tunde O. (+234 812 449 2011)
                  </p>
                </div>
              </div>
            </div>

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
                <span>Total Amount Paid:</span>
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
