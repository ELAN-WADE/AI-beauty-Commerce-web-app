import React, { useEffect } from 'react';
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Sparkles,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { useViewport } from '../context/ViewportContext';

export const Screen12OrderConfirmed: React.FC = () => {
  const { isDesktop } = useViewport();
  const { activeOrder, navigateTo, goBack, selectedCity, checkoutAddress } = useApp();

  useEffect(() => {
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

  const shippingInfo = activeOrder?.shippingAddress || checkoutAddress;

  return (
    <div className="min-h-screen bg-white text-[#0F0F10] pb-32 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      {/* Mobile Top Header (Desktop already has DesktopNav) */}
      {!isDesktop && (
        <div className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 py-3.5">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <h1 className="font-heading font-extrabold tracking-tight text-base text-[#0F0F10]">
              Order Confirmed
            </h1>
            <span className="text-xs font-mono font-bold text-emerald-600">
              Payment Authorized
            </span>
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-6">
        {/* Celebration Header Card */}
        <div className="p-8 rounded-3xl bg-white border border-[#E5E7EB] shadow-lg text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-[#FAF9F6] border-2 border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center mb-4 shadow-sm animate-in zoom-in-75 duration-300">
            <CheckCircle2 size={40} strokeWidth={2.2} />
          </div>

          <span className="text-[11px] font-mono font-bold text-[#997A2E] uppercase tracking-widest px-3 py-1 rounded-full bg-[#FAF9F6] border border-[#D4AF37]/30 mb-2">
            Order Confirmed #{orderId}
          </span>

          <h2 className="font-heading font-semibold text-2xl sm:text-3xl text-[#0F0F10] tracking-tight">
            Thank You for Your Order
          </h2>

          <p className="text-xs sm:text-sm text-[#6B7280] mt-1.5 leading-relaxed max-w-md">
            Your payment has been successfully authorized via Paystack. A digital formulation batch certificate and invoice receipt have been sent to your email.
          </p>

          {/* Loyalty points earned */}
          <div className="mt-5 p-3 rounded-2xl bg-[#FAF9F6] border border-[#D4AF37]/30 text-[#0F0F10] flex items-center gap-2.5 text-xs font-semibold">
            <Sparkles size={16} className="text-[#D4AF37] shrink-0" />
            <span>+510 Desla!™ Club Loyalty Points credited to your account!</span>
          </div>
        </div>

        {/* Courier Dispatch & Delivery Timeline */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2 font-heading font-semibold text-sm text-[#0F0F10]">
              <Truck size={17} className="text-[#D4AF37]" />
              <span>Fulfillment &amp; Courier Dispatch</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              Same-Day Dispatch
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB]">
              <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block">Estimated Delivery</span>
              <strong className="text-xs text-[#0F0F10] font-semibold mt-0.5 block">Today, by 16:30</strong>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB]">
              <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block">Dispatch Partner</span>
              <span className="text-xs text-[#0F0F10] font-semibold mt-0.5 block">Verified {selectedCity} Hub Courier</span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB]">
              <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block">Tracking Reference</span>
              <span className="text-xs font-mono font-bold text-[#997A2E] mt-0.5 block">DES-{selectedCity.toUpperCase().slice(0, 3)}-{Math.floor(100000 + Math.random() * 900000)}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E5E7EB] flex items-start gap-2.5 text-[#4B5563]">
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
          <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-[#0F0F10] uppercase tracking-wider pb-2 border-b border-[#E5E7EB]">
              <span>Purchased Formulations ({activeOrder.items.length})</span>
              <span className="font-price font-semibold text-sm text-[#FB7701]">{formatNaira(activeOrder.total)}</span>
            </div>

            <div className="space-y-3 pt-1">
              {activeOrder.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 text-xs py-1.5 border-b border-[#E5E7EB]/50 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-12 h-12 rounded-xl object-cover bg-[#F6F5F2] border border-[#E5E7EB] shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-[#0F0F10] truncate text-xs">
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

        {/* Clinical Sourcing & Batch Verification Badge */}
        <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center gap-3 text-xs text-[#6B7280]">
          <ShieldCheck size={20} className="text-[#D4AF37] shrink-0" />
          <span className="text-[11px] leading-relaxed">
            100% NAFDAC certified formulation. Look for the sealed holographic batch QR sticker on your box upon delivery to verify lab authenticity.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => navigateTo('orders')}
            className="w-full py-4 rounded-full bg-[#0F0F10] hover:bg-[#1F1D22] active:scale-[0.98] text-white font-heading font-semibold text-xs tracking-wide shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Package size={16} />
            <span>Track Order Status</span>
          </button>

          <button
            onClick={() => navigateTo('home')}
            className="w-full py-4 rounded-full bg-white hover:bg-[#FAF9F6] active:scale-[0.98] text-[#0F0F10] font-heading font-semibold text-xs border border-[#E5E7EB] shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <ShoppingBag size={16} />
            <span>Continue Shopping</span>
          </button>
        </div>
      </main>
    </div>
  );
};
