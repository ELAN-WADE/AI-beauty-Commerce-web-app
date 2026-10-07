import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  Users,
  Store,
  MapPin,
  Star,
  Package
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../../components/common/ProductCard';
import { BrandLogo } from '../../components/common/BrandLogo';
import { BotanicalSprig, ApothecaryPuritySeal } from '../../components/common/HandDrawnAccents';

export const Screen18DesktopHome: React.FC = () => {
  const {
    products,
    navigateTo,
    setSelectedCategory,
    selectedCity,
    setIsLocationModalOpen,
    getDistributorsForCity,
    authUser,
    loginAsDemoRole
  } = useApp();

  const localDistributors = getDistributorsForCity(selectedCity);
  const bestsellers = products.filter((p) => p.isBestseller).slice(0, 4);



  // 3-Slide Dynamic Crossfading Slideshow Definitions
  const heroSlides = [
    {
      id: 'routine',
      image: '/hero_slide_1.jpg',
      tag: 'Safe-Conscious Routine',
      card1: {
        stat: '100% NAFDAC',
        label: 'Clinical authentic formulation',
      },
      card2: {
        stat: 'pH 5.5',
        label: 'Biocompatible Shea & Niacinamide',
      },
      card3: {
        rating: '4.9 ★',
        label: '1,420+ verified clinical reviews',
        actionText: 'Start 30s Scan',
        actionRoute: 'ai-scan',
      },
    },
    {
      id: 'distributor',
      image: '/hero_slide_2.jpg',
      tag: 'Regional Distributor Network',
      card1: {
        stat: '14 Hubs',
        label: 'Lagos · Abuja · Accra · PH',
      },
      card2: {
        stat: '32% Net',
        label: 'Wholesale B2B distributor margin',
      },
      card3: {
        rating: '100%',
        label: 'Same-day city hub dispatch',
        actionText: 'Partner Workspace',
        actionRoute: 'distributor-portal',
      },
    },
    {
      id: 'creator',
      image: '/hero_slide_3.jpg',
      tag: 'Creator & MUA Collective',
      card1: {
        stat: '12% Cash',
        label: 'Direct commission on orders',
      },
      card2: {
        stat: '12h Sillage',
        label: 'Cold-pressed extrait oils',
      },
      card3: {
        rating: '850+',
        label: 'Melanin shade testing kits',
        actionText: 'Claim Creator Kit',
        actionRoute: 'creators',
      },
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  useEffect(() => {
    if (isHeroPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isHeroPaused, heroSlides.length]);

  const activeSlide = heroSlides[currentSlide];

  return (
    <div className="min-h-screen bg-white text-[#0F0F10] flex flex-col font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      <main className="flex-1">
        {/* ========================================================================= */}
        {/* LEVEL 1: RESTORED EDITORIAL HERO WITH GRID TELEMETRY CARDS (BG-WHITE)    */}
        {/* ========================================================================= */}
        <section className="relative w-full bg-white pt-2 sm:pt-4 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-8 border-b border-[#E5E7EB]">
          <div className="w-full max-w-5xl mx-auto relative">
            {/* Central Asymmetric Photographic Composition & Floating Information Cards */}
            <div
              className="relative w-full max-w-[800px] mx-auto select-none"
              onMouseEnter={() => setIsHeroPaused(true)}
              onMouseLeave={() => setIsHeroPaused(false)}
            >
              {/* Asymmetric Masked Photograph */}
              <div className="relative w-full">
                <svg
                  viewBox="0 0 960 480"
                  className="w-full h-auto block select-none drop-shadow-[0_16px_36px_rgba(0,0,0,0.07)] overflow-visible"
                >
                  <defs>
                    <clipPath id="hero-asymmetric-silhouette">
                      <path d="M 280 16 H 740 A 32 32 0 0 1 772 48 V 160 A 24 24 0 0 0 796 184 H 840 A 28 28 0 0 1 868 212 V 320 A 32 32 0 0 1 836 352 H 760 A 24 24 0 0 0 736 328 H 530 A 28 28 0 0 0 502 356 V 432 A 32 32 0 0 1 470 464 H 120 A 32 32 0 0 1 88 432 V 220 A 28 28 0 0 1 116 192 H 220 A 28 28 0 0 0 248 164 V 48 A 32 32 0 0 1 280 16 Z" />
                    </clipPath>
                  </defs>
                  {heroSlides.map((slide, idx) => (
                    <image
                      key={slide.id}
                      href={slide.image}
                      x="0"
                      y="0"
                      width="960"
                      height="480"
                      preserveAspectRatio="xMidYMid slice"
                      clipPath="url(#hero-asymmetric-silhouette)"
                      style={{
                        opacity: currentSlide === idx ? 1 : 0,
                        transition: 'opacity 700ms cubic-bezier(0.77, 0, 0.175, 1)',
                        pointerEvents: currentSlide === idx ? 'auto' : 'none'
                      }}
                    />
                  ))}
                </svg>
              </div>

              {/* Floating Card 01 — Upper Left (Obsidian dark minimalist surface) */}
              <div className="absolute top-[4%] sm:top-[5%] left-[1%] sm:left-[2%] bg-[#0F1117] text-white px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl shadow-xl shadow-black/25 z-20 transition-all duration-300 hover:scale-[1.02] border border-white/15">
                <span className="font-heading font-bold text-[15px] leading-tight text-white block tracking-tight">
                  {activeSlide.card1.stat}
                </span>
                <p className="text-[10px] text-gray-300 font-normal leading-snug mt-0.5 max-w-[110px] sm:max-w-[125px]">
                  {activeSlide.card1.label}
                </p>
              </div>

              {/* Floating Card 02 — Lower Left (Crisp white minimalist surface) */}
              <div className="absolute bottom-[6%] sm:bottom-[7%] left-[0%] sm:left-[1%] bg-white text-[#0F0F10] px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl shadow-lg shadow-black/8 z-20 transition-all duration-300 hover:scale-[1.02] border border-[#E5E7EB]">
                <span className="font-heading font-bold text-[15px] leading-tight text-[#0F1123] block tracking-tight">
                  {activeSlide.card2.stat}
                </span>
                <p className="text-[10px] text-[#6B7280] font-normal leading-snug mt-0.5 max-w-[105px] sm:max-w-[120px]">
                  {activeSlide.card2.label}
                </p>
              </div>

              {/* Floating Card 03 — Upper Right (Crisp white rating card) */}
              <div className="absolute top-[8%] sm:top-[10%] right-[1%] sm:right-[2%] bg-white text-[#0F0F10] px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl shadow-lg shadow-black/8 z-20 transition-all duration-300 hover:scale-[1.02] border border-[#E5E7EB]">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-bold text-[15px] leading-tight text-[#0F1123] tracking-tight">
                    {activeSlide.card3.rating}
                  </span>
                  <div className="w-4 h-4 rounded-full bg-[#111315] text-[#D4AF37] flex items-center justify-center text-[8px]">
                    <Star size={8} fill="currentColor" />
                  </div>
                </div>
                <p className="text-[10px] text-[#6B7280] font-normal leading-snug mt-0.5 max-w-[100px] sm:max-w-[115px]">
                  {activeSlide.card3.label}
                </p>
                <button
                  onClick={() => navigateTo(activeSlide.card3.actionRoute as any)}
                  className="mt-1 text-[10px] font-semibold text-[#0F0F10] hover:text-[#997A2E] flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                >
                  <span>{activeSlide.card3.actionText}</span>
                  <ArrowRight size={9} />
                </button>
              </div>

              {/* Floating Card 04 — Lower Right Notch Category Links */}
              <div className="absolute bottom-[6%] sm:bottom-[7%] right-[2%] sm:right-[4%] z-20 flex flex-col gap-1 select-none bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-[#E5E7EB] shadow-xs">
                <div className="flex items-center gap-2 text-[10px] font-medium text-[#2D2A26]">
                  <button
                    onClick={() => { setSelectedCategory('body-care'); navigateTo('catalogue'); }}
                    className="hover:text-[#997A2E] transition-colors cursor-pointer"
                  >
                    Whipped Shea
                  </button>
                  <span className="text-[#2D2A26]/30 text-[8px]">•</span>
                  <button
                    onClick={() => { setSelectedCategory('body-care'); navigateTo('catalogue'); }}
                    className="hover:text-[#997A2E] transition-colors cursor-pointer"
                  >
                    Radiant Oils
                  </button>
                  <span className="text-[#2D2A26]/30 text-[8px]">•</span>
                  <button
                    onClick={() => { setSelectedCategory('fragrance'); navigateTo('catalogue'); }}
                    className="hover:text-[#997A2E] transition-colors cursor-pointer"
                  >
                    Parfums
                  </button>
                </div>
              </div>
            </div>

            {/* Slide Navigation Controls */}
            <div className="flex items-center justify-center gap-2 mt-5">
              {heroSlides.map((slide, idx) => {
                const isActive = currentSlide === idx;
                return (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`Go to slide ${idx + 1}: ${slide.tag}`}
                    className={`h-2 transition-all duration-300 rounded-full cursor-pointer ${
                      isActive
                        ? 'w-6 bg-[#0F0F10]'
                        : 'w-2 bg-[#0F0F10]/20 hover:bg-[#0F0F10]/40'
                    }`}
                  />
                );
              })}
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap justify-center items-center gap-3.5 mt-5">
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  navigateTo('catalogue');
                }}
                className="bg-[#0F0F10] hover:bg-[#27272A] text-white px-8 py-3.5 rounded-full text-xs sm:text-sm font-semibold shadow-md flex items-center gap-2.5 active:scale-[0.98] transition-transform duration-160 ease-out cursor-pointer group"
                aria-label="Shop now"
              >
                <span>Shop Now</span>
                <ArrowRight size={14} className="text-[#D4AF37] group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => navigateTo('categories')}
                className="bg-[#FAF9F6] hover:bg-[#F3EEE3] border border-[#E5E7EB] text-[#0F0F10] px-6 py-3.5 rounded-full text-xs sm:text-sm font-semibold active:scale-[0.98] transition-transform duration-160 ease-out cursor-pointer"
                aria-label="Explore collections"
              >
                Explore Collections
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* LEVEL 2: THREE BALANCED ENTRY DOORS WITH 1-CLICK INSTANT DEMO ACCESS       */}
        {/* WHITE BACKGROUND WITH GOLD WAVES ACCENT                                   */}
        {/* ========================================================================= */}
        <section
          aria-label="Customer and Partner Entry Points"
          className="relative py-14 lg:py-20 border-b border-[#E5E7EB] bg-white bg-cover bg-bottom overflow-hidden"
          style={{ backgroundImage: `url('/wave_white_gold.svg')`, backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'bottom' }}
        >
          <div className="relative z-10 max-w-6xl mx-auto px-6">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#997A2E] block mb-1">
                Choose Your Pathway
              </span>
              <h2 className="font-heading font-extrabold text-2xl lg:text-3xl text-[#0F0F10] tracking-tight">
                How would you like to connect with Desla!™?
              </h2>
              <p className="text-xs sm:text-sm text-[#6B7280] mt-2 font-medium">
                Instant access for customers, creators, and regional wholesale partners.
              </p>
            </div>

            {/* 3 Balanced Cards in a Structured Horizontal Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: First-Time Customer */}
              <article className="p-7 rounded-3xl bg-white border border-[#E5E7EB] hover:border-[#D4AF37] shadow-sm hover:shadow-md flex flex-col justify-between transition-all duration-200 group">
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#FBF5E8] text-[#997A2E] flex items-center justify-center shadow-2xs">
                    <Sparkles size={20} className="text-[#D4AF37]" />
                  </div>
                  <div>
                    <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#997A2E] block">
                      Client Access
                    </span>
                    <h3 className="font-heading font-bold text-lg text-[#0F0F10] mt-0.5">
                      Register as a Customer
                    </h3>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    Create your client dossier for clinical routine tracking, member reward points, and expedited same-day local dispatch.
                  </p>
                </div>

                <div className="pt-6 space-y-2.5 border-t border-[#E5E7EB]/70 mt-6">
                  <button
                    onClick={() => {
                      loginAsDemoRole('CUSTOMER');
                      navigateTo('account');
                    }}
                    className="w-full py-3 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-semibold shadow-xs active:scale-[0.97] transition-transform duration-160 ease-out flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Instant Customer Access</span>
                    <ArrowRight size={14} />
                  </button>
                  <p className="text-center text-[11px] text-[#6B7280]">
                    Need custom profile?{' '}
                    <button
                      onClick={() => navigateTo('signup')}
                      className="font-semibold text-[#0F0F10] hover:text-[#997A2E] underline cursor-pointer"
                    >
                      Create Account
                    </button>
                    {' • '}
                    <button
                      onClick={() => navigateTo('login')}
                      className="font-semibold text-[#0F0F10] hover:text-[#997A2E] underline cursor-pointer"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </article>

              {/* Card 2: Creator Partnership */}
              <article className="p-7 rounded-3xl bg-white border border-[#E5E7EB] hover:border-[#D4AF37] shadow-sm hover:shadow-md flex flex-col justify-between transition-all duration-200 group">
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#FBF5E8] text-[#997A2E] flex items-center justify-center shadow-2xs">
                    <Users size={20} className="text-[#D4AF37]" />
                  </div>
                  <div>
                    <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#997A2E] block">
                      MUA &amp; Content Collective
                    </span>
                    <h3 className="font-heading font-bold text-lg text-[#0F0F10] mt-0.5">
                      Partner as a Creator
                    </h3>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    Join verified MUAs &amp; dermatologists. Share your 10% discount promo code with followers and earn 12% cash on every verified order.
                  </p>
                </div>

                <div className="pt-6 space-y-2.5 border-t border-[#E5E7EB]/70 mt-6">
                  <button
                    onClick={() => {
                      loginAsDemoRole('CREATOR');
                      navigateTo('creators');
                    }}
                    className="w-full py-3 rounded-full bg-[#FAF9F6] hover:bg-[#F3EEE3] border border-[#E5E7EB] text-[#0F0F10] text-xs font-semibold active:scale-[0.97] transition-transform duration-160 ease-out flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Access Creator Studio</span>
                    <ArrowRight size={14} />
                  </button>
                  <p className="text-center text-[11px] text-[#6B7280]">
                    Returning creator?{' '}
                    <button
                      onClick={() => {
                        loginAsDemoRole('CREATOR');
                        navigateTo('creators');
                      }}
                      className="font-semibold text-[#0F0F10] hover:text-[#997A2E] underline cursor-pointer"
                    >
                      Studio Sign-In
                    </button>
                  </p>
                </div>
              </article>

              {/* Card 3: Distributor Partnership */}
              <article className="p-7 rounded-3xl bg-white border border-[#E5E7EB] hover:border-[#D4AF37] shadow-sm hover:shadow-md flex flex-col justify-between transition-all duration-200 group">
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#FBF5E8] text-[#997A2E] flex items-center justify-center shadow-2xs">
                    <Store size={20} className="text-[#D4AF37]" />
                  </div>
                  <div>
                    <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#997A2E] block">
                      Regional Commerce Network
                    </span>
                    <h3 className="font-heading font-bold text-lg text-[#0F0F10] mt-0.5">
                      Partner as a Distributor
                    </h3>
                  </div>
                  <p className="text-xs text-[#6B7280] leading-relaxed">
                    Power same-day delivery in your city. Stock authentic laboratory formulations locally, eliminate shipping delays &amp; capture 32% wholesale margin.
                  </p>
                </div>

                <div className="pt-6 space-y-2.5 border-t border-[#E5E7EB]/70 mt-6">
                  <button
                    onClick={() => {
                      loginAsDemoRole('DISTRIBUTOR');
                      navigateTo('distributor-portal');
                    }}
                    className="w-full py-3 rounded-full bg-[#FAF9F6] hover:bg-[#F3EEE3] border border-[#E5E7EB] text-[#0F0F10] text-xs font-semibold active:scale-[0.97] transition-transform duration-160 ease-out flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Access Distributor Hub</span>
                    <ArrowRight size={14} />
                  </button>
                  <p className="text-center text-[11px] text-[#6B7280]">
                    Looking for local stock?{' '}
                    <button
                      onClick={() => navigateTo('distributors')}
                      className="font-semibold text-[#0F0F10] hover:text-[#997A2E] underline cursor-pointer"
                    >
                      Find City Hubs
                    </button>
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SUPPORTING SECTION: BEST-SELLING FORMULATIONS                             */}
        {/* ========================================================================= */}
        <section aria-label="Best-selling formulations" className="py-14 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#997A2E] block mb-1">
                  Apothecary Staples
                </span>
                <h2 className="font-heading font-extrabold text-2xl lg:text-3xl text-[#0F0F10] tracking-tight">
                  Best-Selling Formulations
                </h2>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  navigateTo('catalogue');
                }}
                className="text-xs font-bold text-[#0F0F10] hover:text-[#997A2E] flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>View All Skincare</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Clean 4-Column Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {bestsellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SUPPORTING SECTION: REGIONAL SOURCING & CONCIERGE BANNER                  */}
        {/* ========================================================================= */}
        <section aria-label="Regional sourcing guarantee" className="py-10 bg-[#FAF9F6] border-t border-[#E5E7EB]">
          <div className="max-w-6xl mx-auto px-6">
            <div className="p-8 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-[#0F0F10] text-[11px] font-semibold">
                  <MapPin size={13} className="text-[#D4AF37]" />
                  <span>Verified Regional Fulfillment Node</span>
                </div>
                <h3 className="font-heading font-bold text-xl text-[#0F0F10]">
                  Same-Day Courier Delivery Active in {selectedCity}
                </h3>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Authorized local partner hubs in {selectedCity} keep authentic stock on hand. Eliminate interstate transit delays with verified local bike courier dispatch.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
                <button
                  onClick={() => navigateTo('distributors')}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-semibold active:scale-[0.97] transition-transform duration-160 ease-out cursor-pointer"
                >
                  View {selectedCity} Hubs ({localDistributors.length})
                </button>
                <button
                  onClick={() => setIsLocationModalOpen(true)}
                  className="w-full sm:w-auto px-5 py-3 rounded-full bg-[#FAF9F6] hover:bg-gray-100 border border-[#E5E7EB] text-[#0F0F10] text-xs font-semibold active:scale-[0.97] transition-transform duration-160 ease-out cursor-pointer"
                >
                  Change City
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* LUXURY WHITE FOOTER */}
      <footer className="bg-white border-t border-[#E5E7EB] pt-14 pb-8 text-[#6B7280] text-xs">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Column 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <BrandLogo variant="dark" size="md" showTagline={true} />
              <ApothecaryPuritySeal className="w-14 h-14 shrink-0 hidden sm:block" />
            </div>
            <p className="text-xs leading-relaxed max-w-sm text-[#4B5563]">
              Desla Beauty and Lifestyle Limited. Unisex luxury skincare, artisanal body oils, and concentrated extrait perfumes formulated specifically for melanin-rich skin.
            </p>
            <div className="flex items-center gap-3 pt-2 text-[#0F0F10]">
              <span className="text-[11px] font-mono text-[#997A2E] font-bold">Lagos HQ • Abuja • Port Harcourt • Kano</span>
            </div>
          </div>

          {/* Column 2: Pillars */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F0F10]">
              Formulations
            </h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => { setSelectedCategory('body-care'); navigateTo('catalogue'); }} className="hover:text-[#0F0F10] cursor-pointer">Body Oils &amp; Butters</button></li>
              <li><button onClick={() => { setSelectedCategory('skincare'); navigateTo('catalogue'); }} className="hover:text-[#0F0F10] cursor-pointer">Barrier Cleansers</button></li>
              <li><button onClick={() => { setSelectedCategory('fragrance'); navigateTo('catalogue'); }} className="hover:text-[#0F0F10] cursor-pointer">Extrait de Parfum</button></li>
              <li><button onClick={() => { setSelectedCategory('makeup'); navigateTo('catalogue'); }} className="hover:text-[#0F0F10] cursor-pointer">Lip Glazes &amp; Lashes</button></li>
            </ul>
          </div>

          {/* Column 3: Partner Network */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F0F10]">
              Partners &amp; Creators
            </h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => navigateTo('distributors')} className="hover:text-[#0F0F10] cursor-pointer">Find Local Distributor</button></li>
              <li><button onClick={() => { loginAsDemoRole('DISTRIBUTOR'); navigateTo('distributor-portal'); }} className="hover:text-[#0F0F10] cursor-pointer">Distributor Portal</button></li>
              <li><button onClick={() => { loginAsDemoRole('CREATOR'); navigateTo('creators'); }} className="hover:text-[#0F0F10] cursor-pointer">Creator Affiliate Hub</button></li>
              <li><button onClick={() => navigateTo('community')} className="hover:text-[#0F0F10] cursor-pointer">Desla Collective</button></li>
            </ul>
          </div>

          {/* Column 4: Orders & Support */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F0F10]">
              Assistance
            </h4>
            <ul className="space-y-2 text-xs">
              <li><button onClick={() => navigateTo('orders')} className="hover:text-[#0F0F10] cursor-pointer">Track Your Order</button></li>
              <li><button onClick={() => navigateTo('ai-scan')} className="hover:text-[#0F0F10] cursor-pointer">AI Skin Diagnostic</button></li>
              <li><a href="https://wa.me/2348148120642" target="_blank" rel="noopener noreferrer" className="hover:text-[#0F0F10]">WhatsApp Support</a></li>
              <li><span className="text-[#0F0F10] font-medium">NAFDAC Clinical Quality</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#9CA3AF]">
          <span>&copy; {new Date().getFullYear()} Desla Beauty and Lifestyle Limited. All rights reserved.</span>
          <div className="flex items-center gap-2">
            <BotanicalSprig className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-[#0F0F10] font-medium tracking-wide uppercase font-mono text-[10px]">
              Health before beauty • Intention before trend
            </span>
            <BotanicalSprig className="w-3.5 h-3.5 text-[#D4AF37] scale-x-[-1]" />
          </div>
        </div>
      </footer>
    </div>
  );
};
