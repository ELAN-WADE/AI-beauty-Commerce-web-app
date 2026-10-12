import React, { useState } from 'react';
import {
  ArrowRight,
  ChevronRight,
  Star,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../../components/common/ProductCard';
import { ProductQuickModal } from '../../components/common/ProductQuickModal';
import { FaceScanIcon } from '../../components/common/FaceScanIcon';
import { Product } from '../../types';

export const Screen03Home: React.FC = () => {
  const {
    products,
    navigateTo,
    setSelectedCategory,
    selectedCity,
    loginAsDemoRole,
    routineSteps: appRoutineSteps
  } = useApp();

  // Curated 5 products for mobile
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All');
  const categoryFilters = [
    { id: 'All', label: 'All' },
    { id: 'skincare', label: 'Skin Care' },
    { id: 'body-care', label: 'Body Care' },
    { id: 'fragrance', label: 'Fragrance' },
    { id: 'makeup', label: 'Lip & Color' },
  ];

  const filteredProducts = activeCategoryFilter === 'All'
    ? products.filter((p) => p.isBestseller || p.rating >= 4.7).slice(0, 5)
    : products.filter((p) => p.category.toLowerCase().includes(activeCategoryFilter.toLowerCase())).slice(0, 5);

  const displayedProducts = filteredProducts.length > 0 ? filteredProducts : products.slice(0, 5);

  // Category Discovery in Motion
  const categoryItems = [
    { label: 'Body Care', image: '/cat_bodycare.jpg', category: 'body-care' },
    { label: 'Skincare', image: '/cat_skincare.jpg', category: 'skincare' },
    { label: 'Fragrance', image: '/cat_fragrance.jpg', category: 'fragrance' },
    { label: 'Makeup', image: '/cat_makeup.jpg', category: 'makeup' },
    { label: 'Lifestyle', image: '/cat_lifestyle.jpg', category: 'lifestyle' },
  ];

  // Routine Steps (Visual 3-Chapter Ritual - Live from CMS)
  const routineSteps = (appRoutineSteps && appRoutineSteps.length > 0 ? appRoutineSteps : [
    {
      id: 'step-01',
      number: '01',
      title: 'Cleanse',
      productName: 'Gentle Purifying Cleanser',
      description: 'Purifies at pH 5.5 without stripping the delicate moisture barrier.',
      image: '/routine_lady_cleanse.jpg'
    },
    {
      id: 'step-02',
      number: '02',
      title: 'Moisturize',
      productName: 'Bio-Active Barrier Cream',
      description: 'Cold-pressed Nilotica shea and restorative niacinamide lock 48h lipids.',
      image: '/routine_lady_moisturize.jpg'
    },
    {
      id: 'step-03',
      number: '03',
      title: 'Protect',
      productName: 'Melanin Defense SPF 50+',
      description: 'Broad spectrum PA++++ protection with sheer finish and zero white cast.',
      image: '/routine_lady_protect.jpg'
    }
  ]).map((s) => ({
    step: s.number,
    title: s.title,
    product: s.productName,
    desc: s.description,
    image: s.image
  }));

  // Variant Selection Modal
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);

  const handleOpenVariantModal = (product: Product) => {
    setModalProduct(product);
    setIsQuickModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F0F10] pb-24 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      <main className="max-w-md mx-auto px-4 pt-2.5 space-y-4">
        {/* ========================================================================= */}
        {/* 1. PRODUCT-FOCUSED HERO (Mobile Editorial)                                */}
        {/* ========================================================================= */}
        <section
          aria-label="Welcome to Delsla"
          className="bg-white rounded-3xl p-5 border border-[#E5E7EB] shadow-xs space-y-3.5"
        >
          <div className="space-y-1">
            <p className="font-serif italic text-[11px] sm:text-xs text-[#997A2E]">
              Clinical Formulations • Lagos
            </p>
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0F0F10] tracking-tight leading-snug">
              Health Before Beauty.<br />
              <span className="text-[#997A2E]">Intention Before Trend.</span>
            </h1>
            <p className="text-[11px] sm:text-xs text-[#6B7280] leading-relaxed">
              Bio-compatible shea, cold-pressed botanical oils, and active formulations engineered specifically for melanin-rich skin.
            </p>
          </div>

          {/* High-Contrast Action: Shop Now */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setSelectedCategory('All');
                navigateTo('catalogue');
              }}
              className="w-full min-h-[46px] py-3 px-5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-semibold tracking-wide shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              aria-label="Shop skincare formulations now"
            >
              <span>Shop Formulations</span>
              <ArrowRight size={15} className="text-[#D4AF37]" />
            </button>

            <button
              onClick={() => navigateTo('ai-scan')}
              className="w-full min-h-[44px] py-2.5 px-5 rounded-full bg-[#FAF9F6] hover:bg-[#F3EEE3] text-[#0F0F10] border border-[#E5E7EB] text-xs font-semibold active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FaceScanIcon size={14} className="text-[#D4AF37]" />
              <span>Biometric Skin Analysis</span>
            </button>
          </div>

          {/* Editorial Brand Photograph */}
          <div className="relative rounded-2xl overflow-hidden border border-[#E5E7EB] bg-[#FAF9F6] aspect-[16/10]">
            <img
              src="/hero_slide_1.jpg"
              alt="Delsla Safe-Conscious Skincare Ritual"
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white text-[10px] backdrop-blur-md bg-black/65 px-3 py-1.5 rounded-xl border border-white/20">
              <span className="font-serif italic text-[#D4AF37]">Lagos Laboratory Verified</span>
              <span className="font-mono text-white font-semibold">100% NAFDAC</span>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. CHOOSE YOUR PATHWAY: SCULPTED DIAGONAL CURVES & LUSH BEAUTY FACE       */}
        {/* ========================================================================= */}
        <section
          aria-label="Audience Pathways"
          className="relative bg-white rounded-3xl p-4.5 border border-[#E5E7EB] shadow-xs space-y-3.5 overflow-hidden"
        >
          {/* Ambient Wave Background */}
          <div className="absolute inset-0 pointer-events-none opacity-25 select-none">
            <div
              className="absolute bottom-0 left-0 w-[200%] h-[140px] bg-repeat-x bg-bottom animate-wave-flow"
              style={{
                backgroundImage: `url('/wave_white_gold.svg')`,
                backgroundSize: '500px 140px',
              }}
            />
          </div>

          <div className="relative z-10">
            <p className="font-serif italic text-xs text-[#997A2E]">
              Curated Gateways
            </p>
            <h2 className="font-heading font-extrabold text-lg text-[#0F0F10] tracking-tight">
              Connect with Delsla™
            </h2>
          </div>

          <div className="relative z-10 space-y-3">
            {/* Customer Card with Lush Beauty Face and Sculpted Asymmetric Curvature */}
            <article
              onClick={() => navigateTo('signup')}
              className="relative rounded-tl-3xl rounded-br-3xl rounded-tr-xl rounded-bl-xl overflow-hidden h-36 flex flex-col justify-end p-4 border border-[#E5E7EB] cursor-pointer group active:scale-[0.98] transition-all"
            >
              <img
                src="/connect_customer_lush.jpg"
                alt="Client Experience"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <div className="relative z-10 text-white space-y-0.5">
                <span className="font-serif italic text-xs text-[#D4AF37] block">
                  Client Sanctuary
                </span>
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-sm text-white">Customer Experience</h3>
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <ArrowRight size={12} className="text-white" />
                  </span>
                </div>
                <p className="text-[11px] text-gray-200 line-clamp-1">
                  Routine tracking &amp; concierge delivery across {selectedCity}.
                </p>
              </div>
            </article>

            {/* Creator Card (Sculpted Top-Right Curvature) */}
            <article
              onClick={() => {
                loginAsDemoRole('CREATOR');
                navigateTo('creators');
              }}
              className="relative rounded-tr-3xl rounded-bl-3xl rounded-tl-xl rounded-br-xl overflow-hidden h-32 flex flex-col justify-end p-4 border border-[#E5E7EB] cursor-pointer group active:scale-[0.98] transition-all"
            >
              <img
                src="/connect_creator.jpg"
                alt="Creator Collective"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <div className="relative z-10 text-white space-y-0.5">
                <span className="font-serif italic text-xs text-[#D4AF37] block">
                  Creative Studio
                </span>
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-sm text-white">Creator Collective</h3>
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <ArrowRight size={12} className="text-white" />
                  </span>
                </div>
                <p className="text-[11px] text-gray-200 line-clamp-1">
                  Share verified routines &amp; earn creator commissions.
                </p>
              </div>
            </article>

            {/* Distributor Card (Sculpted Top-Left Curvature) */}
            <article
              onClick={() => {
                loginAsDemoRole('DISTRIBUTOR');
                navigateTo('distributor-portal');
              }}
              className="relative rounded-tl-3xl rounded-br-3xl rounded-tr-xl rounded-bl-xl overflow-hidden h-32 flex flex-col justify-end p-4 border border-[#E5E7EB] cursor-pointer group active:scale-[0.98] transition-all"
            >
              <img
                src="/connect_distributor.jpg"
                alt="Distributor Network"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <div className="relative z-10 text-white space-y-0.5">
                <span className="font-serif italic text-xs text-[#D4AF37] block">
                  Prestige Commerce
                </span>
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-sm text-white">Distribution Network</h3>
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <ArrowRight size={12} className="text-white" />
                  </span>
                </div>
                <p className="text-[11px] text-gray-200 line-clamp-1">
                  Dispensary inventory allocations &amp; margin support.
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. CATEGORY DISCOVERY IN CONTINUOUS MOTION                                */}
        {/* ========================================================================= */}
        <section
          aria-label="Category Discovery in Motion"
          className="bg-white rounded-3xl p-4 border border-[#E5E7EB] shadow-xs space-y-2.5 overflow-hidden select-none"
        >
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="font-serif italic text-[11px] text-[#997A2E]">Disciplines</p>
              <h2 className="font-heading font-bold text-xs text-[#0F0F10] uppercase tracking-wider">
                Explore Categories
              </h2>
            </div>
            <button
              onClick={() => navigateTo('categories')}
              className="text-[11px] font-semibold text-[#997A2E] hover:underline"
            >
              View All
            </button>
          </div>

          {/* Continuous Motion Carousel Track */}
          <div className="relative w-full overflow-hidden rounded-2xl">
            <div
              className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"
              aria-hidden="true"
            />
            <div className="animate-marquee-smooth flex items-center gap-4 w-max">
              {[...categoryItems, ...categoryItems, ...categoryItems].map((item, idx) => (
                <button
                  key={`${item.category}-${idx}`}
                  onClick={() => {
                    setSelectedCategory(item.category);
                    navigateTo('catalogue');
                  }}
                  className="flex flex-col items-center gap-1.5 focus:outline-none shrink-0"
                >
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#E5E7EB] bg-[#FAF9F6]">
                    <img src={item.image} alt={item.label} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <span className="text-[10px] font-semibold text-[#0F0F10] whitespace-nowrap">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. SHOP ESSENTIALS: 5 FEATURED PRODUCTS IN 2-COL MOBILE GRID              */}
        {/* ========================================================================= */}
        <section aria-label="Bestselling Formulations" className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="font-serif italic text-xs text-[#997A2E]">Essentials</p>
              <h2 className="font-heading font-bold text-base text-[#0F0F10]">
                Bestselling Formulations
              </h2>
            </div>
            <button
              onClick={() => {
                setSelectedCategory('All');
                navigateTo('catalogue');
              }}
              className="text-xs font-semibold text-[#997A2E] flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar px-1">
            {categoryFilters.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategoryFilter(tab.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  activeCategoryFilter === tab.id
                    ? 'bg-[#0F0F10] text-white shadow-2xs'
                    : 'bg-white text-[#4B5563] border border-[#E5E7EB]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 2-Column Product Cards (Exactly 5 Products) */}
          <div className="grid grid-cols-2 gap-3">
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant="grid"
                onOpenModal={handleOpenVariantModal}
              />
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. YOUR EVERYDAY ROUTINE: SEAMLESS BACKGROUND, WELL-PADDED CARDS          */}
        {/* ========================================================================= */}
        <section
          aria-label="The Daily Ritual"
          className="bg-white rounded-3xl p-5 border border-[#E5E7EB] shadow-xs space-y-3.5"
        >
          <div className="space-y-0.5">
            <p className="font-serif italic text-xs text-[#997A2E]">
              The Daily Ritual
            </p>
            <h2 className="font-heading font-extrabold text-lg text-[#0F0F10] tracking-tight">
              Your Everyday Routine
            </h2>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Formulations designed to compound together for melanin barrier defense.
            </p>
          </div>

          <div className="space-y-2.5">
            {routineSteps.map((step) => (
              <div
                key={step.step}
                className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center gap-3.5"
              >
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white shrink-0 border border-[#E5E7EB]">
                  <img src={step.image} alt={step.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-serif italic text-[11px] text-[#997A2E]">
                    Chapter {step.step} / {step.title}
                  </span>
                  <h3 className="font-heading font-bold text-xs text-[#0F0F10] truncate mt-0.5">
                    {step.product}
                  </h3>
                  <p className="text-[11px] text-[#6B7280] line-clamp-2 mt-0.5 leading-snug">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setSelectedCategory('skincare');
              navigateTo('catalogue');
            }}
            className="w-full py-3 rounded-full bg-[#0F0F10] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <span>Explore the Complete Ritual</span>
            <ArrowRight size={13} className="text-[#D4AF37]" />
          </button>
        </section>

        {/* ========================================================================= */}
        {/* 6. BRAND STORY: CARE WITH INTENTION                                       */}
        {/* ========================================================================= */}
        <section
          aria-label="Brand Story"
          className="bg-white rounded-3xl p-5 border border-[#E5E7EB] shadow-xs space-y-3.5"
        >
          <div className="relative rounded-2xl overflow-hidden aspect-[16/10] border border-[#E5E7EB]">
            <img
              src="/hero_editorial.jpg"
              alt="Delsla clinical formulations"
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[10px]">
              <span className="font-serif italic text-[#D4AF37]">Lagos Clinical Formulation</span>
              <span className="font-mono text-white font-semibold">Bio-Compatible Shea</span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="font-serif italic text-xs text-[#997A2E]">
              Our Philosophy
            </p>
            <h2 className="font-heading font-extrabold text-base text-[#0F0F10]">
              Care with intention.
            </h2>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Formulated in Lagos with clinical dermatologists. We elevate indigenous African botanicals — cold-pressed shea, moringa, and active niacinamide — to nourish melanin barrier health.
            </p>
          </div>

          <button
            onClick={() => navigateTo('categories')}
            className="w-full py-2.5 rounded-full border border-[#0F0F10] text-[#0F0F10] text-xs font-semibold hover:bg-[#FAF9F6] active:scale-[0.98] transition-transform cursor-pointer"
          >
            Our Story &amp; Pillars
          </button>
        </section>
      </main>

      {/* Variant Selection Modal */}
      <ProductQuickModal
        product={modalProduct}
        isOpen={isQuickModalOpen}
        onClose={() => {
          setIsQuickModalOpen(false);
          setModalProduct(null);
        }}
      />
    </div>
  );
};
