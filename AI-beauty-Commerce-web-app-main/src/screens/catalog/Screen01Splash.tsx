import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../../components/common/BrandLogo';

export const Screen01Splash: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#09090B] text-[#FBF9F5]">
      {/* Full-bleed high-fashion luxury beauty imagery */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1400&q=85"
          alt="Desla! Radiant Skin"
          className="w-full h-full object-cover object-center filter brightness-[0.75]"
        />
        {/* Obsidian Glass Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090B] via-[#09090B]/60 to-black/30" />
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Top Navigation */}
      <div className="relative z-10 pt-10 px-6 sm:px-10 flex items-center justify-between">
        <BrandLogo variant="gold" size="md" />

        <button
          onClick={() => navigateTo('home')}
          className="text-xs font-semibold text-[#F6E7C1] hover:text-[#D4AF37] px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-[#D4AF37]/30 active-press transition-colors"
        >
          Skip to Store
        </button>
      </div>

      {/* Brand Identity & Value Proposition */}
      <div className="relative z-10 pb-12 px-6 sm:px-10 max-w-lg mx-auto w-full text-center space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-mono font-bold tracking-widest uppercase">
            <ShieldCheck size={14} />
            <span>Desla Beauty &amp; Lifestyle Limited</span>
          </div>

          <h1 className="font-heading font-extrabold text-3xl sm:text-5xl text-[#FBF9F5] tracking-tight leading-tight">
            Health Before Beauty.<br />
            <span className="text-[#D4AF37]">Intention Before Trend.</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#A19B96] max-w-md mx-auto leading-relaxed">
            Clinical formulations, luxury body care, and verified city-level distributor sourcing across Nigeria.
          </p>
        </div>

        {/* Primary CTA Button */}
        <div className="pt-2">
          <button
            onClick={() => navigateTo('home')}
            className="w-full py-4 px-8 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F6E7C1] to-[#D4AF37] text-[#09090B] font-heading font-extrabold text-sm sm:text-base tracking-wide shadow-2xl active:scale-[0.98] flex items-center justify-center gap-2.5 transition-all hover:brightness-105 border border-[#F6E7C1]/50 cursor-pointer"
          >
            <span>Begin Consultation</span>
            <ArrowRight size={18} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
};

