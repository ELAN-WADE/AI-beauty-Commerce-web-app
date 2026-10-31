import React, { useState } from 'react';
import { Headphones, MessageCircle, ShieldCheck, X, ExternalLink } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useViewport } from '../../context/ViewportContext';

export const CustomerCareFloatingBar: React.FC = () => {
  const { authUser, currentScreen } = useApp();
  const { isDesktop } = useViewport();
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Only show when user is logged in as a customer
  if (!authUser || isDismissed) {
    return null;
  }

  // Hide on checkout, payment, scan, splash, onboarding
  if (['splash', 'onboarding', 'checkout', 'payment', 'order-confirmed'].includes(currentScreen)) {
    return null;
  }

  return (
    <>
      {/* Floating Bar Button */}
      <aside
        aria-label="VIP Customer Care"
        className={`fixed z-40 transition-all duration-300 ${
          isDesktop
            ? 'bottom-8 left-8'
            : 'bottom-[74px] left-3 sm:left-4'
        }`}
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#0F0F10] text-white border border-[#D4AF37]/50 shadow-[0_8px_25px_rgba(0,0,0,0.25)] hover:shadow-[0_10px_30px_rgba(212,175,55,0.3)] active:scale-95 transition-all cursor-pointer backdrop-blur-md"
          aria-label="Open VIP Customer Care Concierge"
          title="VIP Customer Care • Dedicated Support"
        >
          {/* Animated Glowing Status Dot + Headset */}
          <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-[#1A1A1E] text-[#D4AF37] border border-[#D4AF37]/30">
            <Headphones size={13} strokeWidth={2.2} />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-black animate-pulse" />
          </div>

          <div className="flex flex-col text-left">
            <span className="text-[11px] font-heading font-bold text-white tracking-wide flex items-center gap-1">
              <span>Customer Care</span>
              <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded-xs bg-[#D4AF37]/20 text-[#D4AF37] font-semibold">
                VIP
              </span>
            </span>
            <span className="text-[9px] text-[#A1A1AA] font-sans -mt-0.5">
              Direct Specialist Support
            </span>
          </div>
        </button>
      </aside>

      {/* Customer Care Modal / Sheet */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="customer-care-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in-subtle"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-[#E5E7EB] relative animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#FAF9F6] border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37]">
                  <Headphones size={18} strokeWidth={2} />
                </div>
                <div>
                  <h3 id="customer-care-title" className="font-heading font-extrabold text-sm text-[#0F0F10] tracking-tight">
                    Desla!™ VIP Customer Care
                  </h3>
                  <p className="text-[11px] text-[#6B7280]">
                    Dedicated Natural Skincare & Order Support
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full text-[#6B7280] hover:text-[#0F0F10] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                aria-label="Close Customer Care dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content & Direct Channels */}
            <div className="py-5 space-y-3.5">
              <div className="bg-[#FAF9F6] rounded-xl p-3.5 border border-[#E5E7EB] flex items-start gap-3">
                <ShieldCheck size={18} className="text-[#D4AF37] shrink-0 mt-0.5" />
                <div className="text-xs text-[#374151] leading-relaxed">
                  <p className="font-semibold text-[#0F0F10]">NAFDAC Verified Natural Guarantee</p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Logged in as <strong className="text-[#0F0F10]">{authUser.email}</strong>. Our Lagos formulation desk and natural pharmacologists are at your service.
                  </p>
                </div>
              </div>

              {/* Channel 1: WhatsApp VIP Concierge */}
              <a
                href="https://wa.me/2348148120642?text=Hello%20Desla%20Customer%20Care,%20I%20am%20a%20registered%20client%20requesting%20assistance."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <MessageCircle size={16} />
                  </div>
                  <div>
                    <span className="font-heading font-bold text-xs text-[#0F0F10] block">
                      Direct WhatsApp Specialist
                    </span>
                    <span className="text-[10px] text-emerald-800">
                      Average response time: &lt; 5 minutes
                    </span>
                  </div>
                </div>
                <ExternalLink size={14} className="text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* Channel 2: Telephone Direct */}
              <a
                href="tel:+2348148120642"
                className="flex items-center justify-between p-3.5 rounded-xl border border-[#E5E7EB] bg-[#FAF9F6] hover:bg-[#F3F4F6] transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center shrink-0">
                    <Headphones size={16} />
                  </div>
                  <div>
                    <span className="font-heading font-bold text-xs text-[#0F0F10] block">
                      Priority Telephone Line
                    </span>
                    <span className="text-[10px] text-[#6B7280]">
                      +234 814 812 0642 (9AM - 8PM WAT)
                    </span>
                  </div>
                </div>
                <ExternalLink size={14} className="text-[#6B7280] group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>

            {/* Footer */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-[#9CA3AF]">
              <span className="flex items-center gap-1">
                <ShieldCheck size={12} className="text-[#D4AF37]" />
                <span>Health Before Beauty</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsDismissed(true);
                }}
                className="text-[10px] text-[#6B7280] hover:text-[#0F0F10] underline cursor-pointer"
              >
                Dismiss Bar for this session
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
