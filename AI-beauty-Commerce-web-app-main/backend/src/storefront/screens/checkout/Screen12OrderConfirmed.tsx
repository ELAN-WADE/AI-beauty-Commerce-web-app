import React, { useEffect } from 'react';
import {
  CheckCircle2,
  Check,
  Package,
  Truck,
  MapPin,
  Award,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { useViewport } from '../../context/ViewportContext';

export const Screen12OrderConfirmed: React.FC = () => {
  const { isDesktop } = useViewport();
  const { activeOrder, navigateTo, goBack, selectedCity, checkoutAddress } = useApp();

  const hasOrder = !!activeOrder;

  useEffect(() => {
    // Celebrate only real purchases — never an empty direct visit.
    if (!hasOrder) return;
    // Launch celebratory confetti burst
    try {
      if (typeof window !== 'undefined' && confetti) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#F6E7C1', '#0F0F10', '#FB7701']
        });
      }
    } catch (e) {
      // Safe fallback
    }
  }, []);

  const orderId = activeOrder?.id || 'DES-829104';
  const formatNaira = (amt: number) => '₦' + (amt || 0).toLocaleString('en-NG');
  // Receipt names the actual rail (Stripe international, Flutterwave local,
  // bank transfer) instead of a hardcoded gateway.
  const paidVia = (() => {
    const m = activeOrder?.paymentMethod ?? '';
    if (/stripe/i.test(m)) return 'Stripe';
    if (/flutter/i.test(m)) return 'Flutterwave';
    if (/bank transfer/i.test(m)) return 'bank transfer';
    if (/opay/i.test(m)) return 'Opay';
    return 'secure checkout';
  })();

  const shippingInfo = activeOrder?.shippingAddress || checkoutAddress;

  // Truthful empty state: no invented order number, points, or delivery promises.
  if (!hasOrder) {
    return (
      <div className="min-h-screen bg-white text-[#0F0F10] pb-32 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
        <main className="max-w-md mx-auto px-4 pt-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FAF9F6] flex items-center justify-center mx-auto text-[#D4AF37]">
            <ShoppingBag size={26} strokeWidth={1.8} />
          </div>
          <h2 className="font-heading font-semibold text-2xl text-[#0F0F10] tracking-tight">
            No order here yet
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
            Complete checkout and your confirmed order, tracking reference, and delivery updates will appear on this page.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => navigateTo('catalogue')}
              className="py-3.5 px-6 rounded-full bg-[#0F0F10] hover:bg-[#252429] text-white font-semibold text-xs active:scale-[0.98] transition-all cursor-pointer"
            >
              Start Shopping
            </button>
            <button
              onClick={() => navigateTo('guest-order-lookup')}
              className="py-3.5 px-6 rounded-full bg-[#FAF9F6] hover:bg-[#F0EDE8] text-[#0F0F10] font-semibold text-xs active:scale-[0.98] transition-all cursor-pointer"
            >
              Look Up a Guest Order
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0F0F10] pb-32 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        {/* Celebration Header Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#FAF9F6] text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-white text-[#D4AF37] flex items-center justify-center mb-4 shadow-sm animate-in zoom-in-75 duration-300">
            <CheckCircle2 size={36} strokeWidth={2} />
          </div>

          <span className="text-[11px] font-mono font-semibold text-[#997A2E] uppercase tracking-wider px-3.5 py-1 rounded-full bg-white shadow-2xs mb-2.5">
            Order Confirmed #{orderId}
          </span>

          <h1 className="font-heading font-semibold text-2xl sm:text-3xl text-[#0F0F10] tracking-tight">
            Thank You for Your Order
          </h1>

          <p className="text-xs sm:text-sm text-[#6B7280] mt-2 leading-relaxed max-w-md">
            Your payment has been successfully authorized via {paidVia}. A digital formulation batch certificate and invoice receipt have been sent to your email.
          </p>

          {/* Loyalty points earned */}
          <div className="mt-5 px-4 py-2.5 rounded-full bg-white text-[#0F0F10] flex items-center gap-2 text-xs font-medium shadow-2xs">
            <Award size={15} className="text-[#D4AF37] shrink-0" />
            <span>+510 Desla!™ Club Loyalty Points credited to your account</span>
          </div>
        </div>

        {/* Bank-transfer next step (live orders placed without hosted checkout) */}
        {activeOrder?.paymentMethod?.startsWith('Bank transfer') && (
          <div className="p-5 rounded-3xl bg-[#FAF9F6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="text-[#0F0F10] leading-relaxed">
              Complete your transfer, then submit proof under <strong>Orders → Track</strong> for confirmation.
            </span>
            <button
              onClick={() => navigateTo('orders')}
              className="shrink-0 px-5 py-2.5 rounded-full bg-[#0F0F10] text-[#D4AF37] font-semibold active:scale-[0.98] transition-all cursor-pointer"
            >
              Submit proof
            </button>
          </div>
        )}

        {/* Real-time Order Status Milestone Tracker */}
        <div className="bg-[#FAF9F6] rounded-3xl p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]/50">
            <span className="font-heading font-semibold text-xs uppercase tracking-wider text-[#0F0F10]">
              Order Journey &amp; Fulfillment Milestones
            </span>
            <span className="text-[10px] font-mono font-semibold text-[#997A2E] bg-white px-2.5 py-1 rounded-full shadow-2xs">
              Live Progression
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
            <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white shadow-2xs space-y-1">
              <div className="w-6 h-6 rounded-full bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center text-xs font-bold">
                <Check size={13} strokeWidth={2.5} />
              </div>
              <span className="text-xs font-semibold text-[#0F0F10]">Placed</span>
              <span className="text-[10px] text-[#6B7280]">Received</span>
            </div>

            <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white shadow-2xs space-y-1">
              <div className="w-6 h-6 rounded-full bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center text-xs font-bold">
                <Check size={13} strokeWidth={2.5} />
              </div>
              <span className="text-xs font-semibold text-[#0F0F10]">Confirmed</span>
              <span className="text-[10px] text-[#6B7280]">{paidVia === 'secure checkout' ? 'Payment Paid' : `${paidVia} Paid`}</span>
            </div>

            <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white shadow-2xs space-y-1">
              <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-white flex items-center justify-center text-xs font-bold animate-pulse">
                3
              </div>
              <span className="text-xs font-semibold text-[#0F0F10]">Processing</span>
              <span className="text-[10px] text-[#997A2E] font-medium">Batch Verified</span>
            </div>

            <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/60 space-y-1">
              <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold">
                4
              </div>
              <span className="text-xs font-medium text-[#6B7280]">Dispatched</span>
              <span className="text-[10px] text-[#9CA3AF]">City Hub</span>
            </div>

            <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/60 space-y-1 col-span-2 sm:col-span-1">
              <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold">
                5
              </div>
              <span className="text-xs font-medium text-[#6B7280]">Delivered</span>
              <span className="text-[10px] text-[#9CA3AF]">Handover</span>
            </div>
          </div>
        </div>

        {/* Courier Dispatch & Delivery Timeline */}
        <div className="bg-[#FAF9F6] rounded-3xl p-6 sm:p-7 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]/50">
            <div className="flex items-center gap-2 font-heading font-semibold text-xs text-[#0F0F10]">
              <Truck size={16} className="text-[#D4AF37]" />
              <span>Fulfillment &amp; Courier Dispatch</span>
            </div>
            <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              Same-Day Dispatch
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-white shadow-2xs">
              <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block">Estimated Delivery</span>
              <strong className="text-xs text-[#0F0F10] font-semibold mt-0.5 block">Today, by 16:30</strong>
            </div>

            <div className="p-3.5 rounded-2xl bg-white shadow-2xs">
              <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block">Dispatch Partner</span>
              <span className="text-xs text-[#0F0F10] font-semibold mt-0.5 block">Verified {selectedCity} Hub Courier</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white shadow-2xs">
              <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block">Tracking Reference</span>
              <span className="text-xs font-mono font-semibold text-[#997A2E] mt-0.5 block">DES-{selectedCity.toUpperCase().slice(0, 3)}-{Math.floor(100000 + Math.random() * 900000)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E5E7EB]/50 flex items-start gap-2.5 text-[#4B5563]">
            <MapPin size={16} className="text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#0F0F10] block text-xs">
                {((shippingInfo as any)?.fullName || (shippingInfo as any)?.name || 'Valued Client')} • {shippingInfo?.phone || '+234 814 812 0642'}
              </strong>
              <span className="text-[11px] leading-snug">
                {shippingInfo?.street || 'Plot 742, Aminu Kano Crescent, Wuse 2'}, {shippingInfo?.city || selectedCity}, {shippingInfo?.state || 'Abuja FCT'}
              </span>
            </div>
          </div>
        </div>

        {/* Ordered Items Preview */}
        {activeOrder && activeOrder.items && activeOrder.items.length > 0 && (
          <div className="bg-[#FAF9F6] rounded-3xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-[#0F0F10] uppercase tracking-wider pb-2 border-b border-[#E5E7EB]/50">
              <span>Purchased Formulations ({activeOrder.items.length})</span>
              <span className="font-price font-semibold text-sm text-[#0F0F10]">{formatNaira(activeOrder.total)}</span>
            </div>

            <div className="space-y-3 pt-1">
              {activeOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 text-xs py-2 border-b border-[#E5E7EB]/40 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-12 h-12 rounded-xl object-cover bg-[#F0EDE8] shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-medium text-[#0F0F10] truncate text-xs">
                        {item.productName}
                      </h4>
                      <span className="text-[10px] text-[#6B7280]">
                        Qty: {item.quantity} • {item.size}
                      </span>
                    </div>
                  </div>
                  <span className="font-price font-semibold text-[#0F0F10] shrink-0">
                    {formatNaira(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clinical Sourcing & Batch Verification Reassurance */}
        <div className="p-4 rounded-2xl bg-[#FAF9F6] flex items-center gap-3.5 text-xs text-[#6B7280]">
          <ShieldCheck size={18} className="text-[#D4AF37] shrink-0" />
          <span className="text-[11px] leading-relaxed">
            100% NAFDAC certified formulation. Look for the sealed holographic batch QR sticker on your box upon delivery to verify lab authenticity.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => navigateTo('orders')}
            className="w-full py-4 rounded-full bg-[#0F0F10] hover:bg-[#252429] active:scale-[0.98] text-white font-heading font-medium text-xs tracking-wider uppercase shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Package size={15} />
            <span>Track Order Status</span>
          </button>

          <button
            onClick={() => navigateTo('home')}
            className="w-full py-4 rounded-full bg-[#FAF9F6] hover:bg-[#F0EDE8] active:scale-[0.98] text-[#0F0F10] font-heading font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ShoppingBag size={15} />
            <span>Continue Shopping</span>
          </button>
        </div>
      </main>
    </div>
  );
};
