import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

export const InitialBrandLoader: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check user preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    // Fast, elegant luxury timing:
    // 1100ms display -> 350ms exit crossfade -> unmount
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1150);

    const unmountTimer = setTimeout(() => {
      setIsVisible(false);
    }, 1500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-label="Loading Desla"
      className={`fixed inset-0 z-[100] bg-[#0A0A0C] flex flex-col items-center justify-center pointer-events-none select-none transition-all duration-350 ease-out ${
        isFadingOut
          ? 'opacity-0 scale-[1.02] pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
      }}
    >
      {/* Subtle radial ambient golden glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08)_0%,transparent_65%)] pointer-events-none" />

      {/* Branded Logo Container */}
      <div
        className={`relative z-10 flex flex-col items-center text-center transition-all duration-500 ${
          prefersReducedMotion
            ? 'opacity-100'
            : isFadingOut
            ? 'opacity-80 scale-[1.01]'
            : 'animate-in fade-in zoom-in-[0.96] duration-500'
        }`}
      >
        {/* Subtle apothecary emblem star */}
        <div className="w-8 h-8 rounded-full bg-[#18181B] border border-[#D4AF37]/30 flex items-center justify-center mb-5 text-[#D4AF37] shadow-lg shadow-black/40">
          <Sparkles size={14} className="animate-pulse duration-1000" />
        </div>

        {/* Separated Delsla Wordmark + TM Badge */}
        <div className="flex items-baseline gap-1.5 justify-center">
          <span
            className="font-heading font-extrabold text-4xl sm:text-5xl md:text-6xl text-[#FAF9F5] tracking-tight"
            style={{ letterSpacing: '-0.04em' }}
          >
            Desla
            <span className="text-[#D4AF37] inline-block transition-transform hover:scale-110">
              !
            </span>
          </span>

          {/* Luxury TM Badge */}
          <span className="text-[9px] sm:text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-xs border border-[#D4AF37]/50 text-[#F6E7C1] tracking-widest bg-[#D4AF37]/10">
            TM
          </span>
        </div>

        {/* Tagline Reveal */}
        <p className="font-heading font-semibold text-[9.5px] sm:text-[11px] uppercase tracking-[0.28em] text-[#997A2E] mt-3 leading-none">
          Health Before Beauty • Intention Before Trend
        </p>

        {/* Delicate golden progress hairline */}
        <div className="w-28 h-[2px] bg-white/10 rounded-full mt-6 overflow-hidden relative">
          <div
            className={`h-full bg-gradient-to-r from-[#D4AF37] via-[#F6E7C1] to-[#AA8232] rounded-full ${
              prefersReducedMotion
                ? 'w-full'
                : 'w-full animate-in slide-in-from-left duration-1000 ease-out'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
