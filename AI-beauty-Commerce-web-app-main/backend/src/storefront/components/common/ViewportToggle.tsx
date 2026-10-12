import React, { useState } from 'react';
import { Smartphone, Monitor, Layers, ChevronDown, Check, Sparkles } from 'lucide-react';
import { useViewport } from '../../context/ViewportContext';
import { useApp } from '../../context/AppContext';
import { ScreenId } from '../../types';

export const ViewportToggle: React.FC = () => {
  const { viewportMode, toggleViewportMode } = useViewport();
  const {
    currentScreen,
    navigateTo,
    addToCart,
    products,
    openAIAssistant
  } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const screens: { id: ScreenId | 'add-to-cart-sheet' | 'ai-assistant-drawer'; label: string; number: string }[] = [
    { id: 'splash', label: 'Desla! Splash Launch', number: '01' },
    { id: 'onboarding', label: 'Onboarding Carousel', number: '02' },
    { id: 'home', label: 'Storefront Home', number: '03' },
    { id: 'search', label: 'Live Search & Tags', number: '04' },
    { id: 'categories', label: 'Categories Taxonomy', number: '05' },
    { id: 'catalogue', label: 'Product Catalogue', number: '06' },
    { id: 'product-details', label: 'Product Details & Reviews', number: '07' },
    { id: 'distributors', label: 'Local City Distributors', number: '08' },
    { id: 'distributor-portal', label: 'Distributor Partner Portal', number: '09' },
    { id: 'creators', label: 'Creators & Influencer Hub', number: '10' },
    { id: 'community', label: 'Desla Collective Social', number: '11' },
    { id: 'cart', label: 'Shopping Bag', number: '12' },
    { id: 'checkout', label: 'Fulfillment & Checkout', number: '13' },
    { id: 'payment', label: 'Payment & Authorization', number: '14' },
    { id: 'order-confirmed', label: 'Order Confirmed', number: '15' },
    { id: 'orders', label: 'Orders & Tracking Hub', number: '16' },
    { id: 'ai-scan', label: 'AI Skin Scan Diagnostic', number: '17' },
    { id: 'rewards', label: 'Desla Club Rewards', number: '18' },
    { id: 'account', label: 'Account Profile', number: '19' },
    { id: 'desktop-home', label: 'Desktop Storefront', number: '20' }
  ];

  return (
    <aside aria-label="Device & Screen Switcher" className="fixed top-3 right-3 z-50 flex items-center gap-2">
      {/* Viewport Mode Switcher Button */}
      <button
        onClick={toggleViewportMode}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#141316]/90 text-[#FBF9F5] backdrop-blur-md shadow-2xl hover:bg-black active:scale-95 transition-all text-xs font-semibold border border-[#D4AF37]/30"
        title="Toggle Mobile vs Desktop Viewport"
      >
        {viewportMode === 'mobile' ? (
          <>
            <Monitor size={15} className="text-[#D4AF37]" />
            <span className="hidden sm:inline">Desktop View</span>
            <span className="sm:hidden">Desktop</span>
          </>
        ) : (
          <>
            <Smartphone size={15} className="text-[#D4AF37]" />
            <span className="hidden sm:inline">Mobile View</span>
            <span className="sm:hidden">Mobile</span>
          </>
        )}
      </button>

      {/* Screen Navigator Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#141316]/95 text-[#FBF9F5] backdrop-blur-md shadow-2xl border border-[#D4AF37]/30 hover:bg-[#1F1D22] active:scale-95 transition-all text-xs font-semibold"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <Layers size={15} className="text-[#D4AF37]" />
          <span className="hidden sm:inline">Screen: </span>
          <span className="text-[#D4AF37] font-bold">
            {screens.find((s) => s.id === currentScreen)?.number || '03'}
          </span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-80 max-h-[75vh] overflow-y-auto bg-[#141316] rounded-card shadow-2xl border border-[#D4AF37]/30 p-2 z-50 text-xs animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                <span className="font-heading font-bold text-[#F6E7C1] uppercase tracking-wider text-[10px]">
                  Desla!™ Screen Navigator
                </span>
                <span className="text-[10px] text-[#A19B96]">20 Screens</span>
              </div>
              <div className="py-1 space-y-0.5">
                {screens.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (s.id === 'desktop-home') {
                        navigateTo('desktop-home');
                      } else {
                        navigateTo(s.id as ScreenId);
                      }
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${
                      currentScreen === s.id
                        ? 'bg-[#D4AF37]/20 text-[#D4AF37] font-bold border border-[#D4AF37]/40'
                        : 'hover:bg-white/5 text-[#E4DFDA]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-[#D4AF37] border border-[#D4AF37]/20">
                        {s.number}
                      </span>
                      <span className="truncate">{s.label}</span>
                    </div>
                    {currentScreen === s.id && <Check size={14} className="text-[#D4AF37] shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
