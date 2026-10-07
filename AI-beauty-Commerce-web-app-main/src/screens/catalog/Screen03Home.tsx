import React from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  Store,
  MapPin,
  ChevronRight,
  PhoneCall,
  LogIn
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../../components/common/ProductCard';
import { BotanicalSprig, ApothecaryPuritySeal } from '../../components/common/HandDrawnAccents';

export const Screen03Home: React.FC = () => {
  const {
    products,
    navigateTo,
    setSelectedCategory,
    selectedCity,
    setIsLocationModalOpen,
    getDistributorsForCity,
    loginAsDemoRole
  } = useApp();

  const localDistributors = getDistributorsForCity(selectedCity);
  const bestsellers = products.filter((p) => p.isBestseller).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F0F10] pb-24 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      <main className="max-w-md mx-auto px-4 pt-3 space-y-5">
        {/* ========================================================================= */}
        {/* 1. RESTRAINED HERO                                                        */}
        {/* ========================================================================= */}
        <section
          aria-label="Welcome to Desla"
          className="bg-white rounded-3xl p-5 border border-[#E5E7EB] shadow-xs space-y-4"
        >
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E] bg-[#FBF5E8] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30 inline-block">
              Haute Dermatologie &amp; Lifestyle
            </span>
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0F0F10] tracking-tight leading-snug">
              Health Before Beauty.<br />
              <span className="text-[#997A2E]">Intention Before Trend.</span>
            </h1>
            <p className="text-xs text-[#6B7280] leading-relaxed pt-0.5">
              Bio-compatible shea, cold-pressed botanical oils, and active formulations engineered specifically for melanin-rich skin.
            </p>
          </div>

          {/* Single High-Contrast Thumb-Zone Action: Shop Now */}
          <button
            onClick={() => {
              setSelectedCategory('All');
              navigateTo('catalogue');
            }}
            className="w-full min-h-[48px] py-3.5 px-5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-semibold tracking-wide shadow-md active-press transition-colors flex items-center justify-center gap-2 cursor-pointer"
            aria-label="Shop skincare formulations now"
          >
            <span>Shop Now</span>
            <ArrowRight size={15} className="text-[#D4AF37]" />
          </button>

          {/* Compact Editorial Brand Photograph with Subtle Laboratory Seal */}
          <div className="relative rounded-2xl overflow-hidden border border-[#E5E7EB] bg-[#FAF9F6] aspect-[16/9]">
            <img
              src="/hero_slide_1.jpg"
              alt="Desla!™ Safe-Conscious Skincare Ritual"
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-[10px] backdrop-blur-md bg-black/65 px-3 py-1.5 rounded-xl border border-white/20">
              <span className="font-medium">Lagos Laboratory Verified</span>
              <span className="font-mono text-[#D4AF37] font-semibold">100% NAFDAC</span>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. THREE VERTICALLY STACKED REGISTRATION & PARTNERSHIP ENTRY POINTS        */}
        {/* ========================================================================= */}
        <section
          aria-label="Registration and Partnership Pathways"
          className="bg-white rounded-3xl p-5 border border-[#E5E7EB] shadow-xs space-y-3.5"
        >
          <div className="flex items-center justify-between px-1">
            <h2 className="font-heading font-extrabold text-xs text-[#0F0F10] uppercase tracking-wider">
              Get Started with Desla!™
            </h2>
            <span className="text-[10px] font-mono text-[#997A2E] font-semibold">
              3 Easy Pathways
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Pathway 1: First-Time Customer */}
            <div
              onClick={() => {
                loginAsDemoRole('CUSTOMER');
                navigateTo('signup');
              }}
              className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] hover:border-[#D4AF37]/50 active-press transition-all cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#FBF5E8] text-[#997A2E] flex items-center justify-center shrink-0">
                  <Sparkles size={18} className="text-[#D4AF37]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-bold text-xs text-[#0F0F10] truncate">
                    Register as a first-time customer
                  </h3>
                  <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                    Personalized routine dossier &amp; loyalty rewards
                  </p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#0F0F10] shrink-0 shadow-2xs">
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Pathway 2: Creator Partnership */}
            <div
              onClick={() => {
                loginAsDemoRole('CREATOR');
                navigateTo('creators');
              }}
              className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] hover:border-[#D4AF37]/50 active-press transition-all cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#FBF5E8] text-[#997A2E] flex items-center justify-center shrink-0">
                  <Users size={18} className="text-[#D4AF37]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-bold text-xs text-[#0F0F10] truncate">
                    Partner as a creator
                  </h3>
                  <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                    12% commission, personal codes &amp; PR box room
                  </p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#0F0F10] shrink-0 shadow-2xs">
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Pathway 3: Distributor Partnership */}
            <div
              onClick={() => {
                loginAsDemoRole('DISTRIBUTOR');
                navigateTo('distributor-portal');
              }}
              className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] hover:border-[#D4AF37]/50 active-press transition-all cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#FBF5E8] text-[#997A2E] flex items-center justify-center shrink-0">
                  <Store size={18} className="text-[#D4AF37]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-bold text-xs text-[#0F0F10] truncate">
                    Partner as a distributor
                  </h3>
                  <p className="text-[11px] text-[#6B7280] truncate mt-0.5">
                    32% wholesale margin &amp; regional city dispatch
                  </p>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#0F0F10] shrink-0 shadow-2xs">
                <ChevronRight size={14} />
              </div>
            </div>
          </div>

          {/* Returning Customer / Partner Sign In Access */}
          <div className="pt-2 border-t border-[#E5E7EB]/80 flex items-center justify-between text-xs px-1">
            <span className="text-[#6B7280]">Already have an account?</span>
            <button
              onClick={() => navigateTo('login')}
              className="font-bold text-[#0F0F10] hover:text-[#997A2E] flex items-center gap-1 active-press transition-colors cursor-pointer"
            >
              <LogIn size={13} className="text-[#D4AF37]" />
              <span>Sign In</span>
            </button>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. SUPPORTING CONTENT: BESTSELLING FORMULATIONS & BRAND PREVIEW           */}
        {/* ========================================================================= */}
        <section aria-label="Bestselling Formulations" className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="font-heading font-bold text-sm text-[#0F0F10]">
                Curated Formulations
              </h2>
              <p className="text-[11px] text-[#6B7280]">
                Clinically tested for melanin-rich skin
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCategory('All');
                navigateTo('catalogue');
              }}
              className="text-xs font-bold text-[#997A2E] hover:underline flex items-center gap-0.5 active-press cursor-pointer"
            >
              <span>See All ({products.length})</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {bestsellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. SUPPORTING CONTENT: LOCAL DISPATCH, VERIFICATION & QUIET SUPPORT      */}
        {/* ========================================================================= */}
        <section aria-label="Regional Sourcing Guarantee" className="space-y-3 pt-1">
          {/* Local Dispatch Card */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-xs text-[#0F0F10] flex items-center gap-1.5">
                <MapPin size={14} className="text-[#D4AF37]" />
                <span>Same-Day Dispatch in {selectedCity}</span>
              </span>
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="text-[10px] font-bold text-[#997A2E] hover:underline active-press cursor-pointer"
              >
                Change City
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-[#4B5563]">
              Authorized distributor hubs across {selectedCity} eliminate shipping delays. Orders dispatched via local courier.
            </p>
            <div className="pt-1 flex items-center justify-between border-t border-gray-100">
              <button
                onClick={() => navigateTo('distributors')}
                className="text-[11px] font-bold text-[#0F0F10] hover:text-[#997A2E] flex items-center gap-1 active-press cursor-pointer"
              >
                <span>View {selectedCity} Hubs ({localDistributors.length})</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>

          {/* Authenticity Guarantee & WhatsApp Concierge */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-[#0F0F10]">
                  <ShieldCheck size={15} className="text-[#D4AF37]" />
                  <span>100% NAFDAC Authentic Batch Formulations</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#4B5563]">
                  Zero harsh bleaching agents or toxic parabens. Formulated with clinical biocompatibility.
                </p>
              </div>
              <ApothecaryPuritySeal className="w-11 h-11 shrink-0 hidden xs:block" />
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <a
                href="https://wa.me/2348148120642"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0F0F10] hover:text-[#997A2E] font-bold flex items-center gap-1.5 text-[11px] transition-colors"
              >
                <PhoneCall size={12} className="text-emerald-600" />
                <span>VIP WhatsApp Concierge: 0814 812 0642</span>
              </a>
            </div>
          </div>
        </section>

        {/* Quiet Editorial Footer */}
        <footer className="text-center pt-3 pb-2 space-y-1">
          <div className="flex items-center justify-center gap-2">
            <BotanicalSprig className="w-3.5 h-3.5 text-[#D4AF37]" />
            <p className="text-[10px] font-mono text-[#6B7280]">
              © {new Date().getFullYear()} Desla!™ Beauty &amp; Lifestyle Limited.
            </p>
            <BotanicalSprig className="w-3.5 h-3.5 text-[#D4AF37] scale-x-[-1]" />
          </div>
          <p className="text-[9.5px] text-[#9CA3AF] tracking-wide uppercase font-mono">
            Health Before Beauty • Intention Before Trend
          </p>
        </footer>
      </main>
    </div>
  );
};
