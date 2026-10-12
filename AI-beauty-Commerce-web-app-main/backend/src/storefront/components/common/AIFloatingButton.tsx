import React, { useState, useEffect } from 'react';
import { Headset } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useViewport } from '../../context/ViewportContext';

export const AIFloatingButton: React.FC = () => {
  const { navigateTo, currentScreen } = useApp();
  const { isDesktop } = useViewport();

  const [isHovered, setIsHovered] = useState(false);
  const [isAutoExpanded, setIsAutoExpanded] = useState(true);

  // Auto-collapse after 3.5s initially, then periodically animate out and close back to sphere
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      setIsAutoExpanded(false);
    }, 3500);

    const interval = setInterval(() => {
      setIsAutoExpanded(true);
      setTimeout(() => {
        setIsAutoExpanded(false);
      }, 3500);
    }, 14000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  // Hide on splash, onboarding, checkout/payment/ask-ai (to prevent clutter)
  if (['splash', 'onboarding', 'checkout', 'payment', 'order-confirmed', 'ask-ai'].includes(currentScreen)) {
    return null;
  }

  const isExpanded = isHovered || isAutoExpanded;

  return (
    <div
      className={`pointer-events-auto transition-transform duration-300 hover:scale-105 ${
        isDesktop
          ? 'fixed bottom-8 right-8 z-[60]'
          : 'fixed bottom-[78px] right-3 z-[60]'
      }`}
    >
      <button
        onClick={() => navigateTo('ask-ai')}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`group relative flex items-center p-1.5 rounded-full bg-white border border-[#D4AF37]/60 shadow-[0_10px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_35px_rgba(212,175,55,0.35)] active:scale-95 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer text-[#0F0F10] ring-2 ring-[#D4AF37]/20 ${
          isExpanded ? 'pr-4' : 'pr-1.5'
        }`}
        aria-label="Ask Desla!™ AI"
        title="Open Dedicated Ask Desla!™ AI Concierge"
      >
        {/* Concierge Lady Avatar Container (Sphere) with Headset Badge */}
        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#D4AF37]/80 shadow-xs bg-[#F6F5F2] shrink-0">
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=240&q=80"
            alt="Desla Beauty Concierge"
            className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-300 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />

          {/* Headset Overlay Icon */}
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center shadow-xs pointer-events-none">
            <Headset size={8} strokeWidth={2.5} />
          </div>
        </div>

        {/* Animated Typography Badge: White bg, Black text, collapses to sphere */}
        <div
          className={`flex items-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap select-none ${
            isExpanded ? 'max-w-[160px] opacity-100 pl-2.5' : 'max-w-0 opacity-0 pl-0 pointer-events-none'
          }`}
        >
          <span className="font-heading font-extrabold text-xs text-[#0F0F10] tracking-tight">
            Ask Desla<span className="text-[#D4AF37]">!™</span> AI
          </span>
        </div>
      </button>
    </div>
  );
};
