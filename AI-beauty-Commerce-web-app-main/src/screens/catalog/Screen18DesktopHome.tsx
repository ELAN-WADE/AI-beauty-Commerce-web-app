import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ChevronRight,
  Check,
  Star,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../../components/common/ProductCard';
import { ProductQuickModal } from '../../components/common/ProductQuickModal';
import { BrandLogo } from '../../components/common/BrandLogo';
import { FaceScanIcon } from '../../components/common/FaceScanIcon';
import { Product } from '../../types';

export const Screen18DesktopHome: React.FC = () => {
  const {
    products,
    navigateTo,
    setSelectedCategory,
    selectedCategory,
    selectedCity,
    loginAsDemoRole,
    heroSlides: appHeroSlides,
    routineSteps: appRoutineSteps,
    announcementTicker
  } = useApp();

  // 1. PRODUCT-FOCUSED HERO SLIDESHOW (Live from Admin CMS)
  const heroSlides = appHeroSlides && appHeroSlides.length > 0 ? appHeroSlides : [
    {
      id: 'routine',
      image: '/hero_slide_1.jpg',
      tag: 'Clinical Formulation',
      headline: 'Health Before Beauty. Intention Before Trend.',
      subtext: 'Bio-compatible shea, cold-pressed botanical oils, and active formulations engineered specifically for melanin-rich skin.',
      actionLabel: 'Shop Formulations',
      actionRoute: 'catalogue',
      secondaryActionText: 'AI Skin Analysis',
      secondaryRoute: 'ai-scan'
    },
    {
      id: 'body-care',
      image: '/hero_slide_2.jpg',
      tag: 'Nourishing Body Rituals',
      headline: 'Cold-Pressed Extrait Oils. Lasting Radiance.',
      subtext: 'Lightweight, rapidly absorbing botanical oils infused with indigenous botanicals to nourish and restore deep cellular radiance.',
      actionLabel: 'Explore Body Care',
      actionCategory: 'body-care',
      secondaryActionText: 'View Collections',
      secondaryRoute: 'categories'
    },
    {
      id: 'sun-defense',
      image: '/hero_slide_3.jpg',
      tag: 'Daily Shield SPF 50+',
      headline: 'Invisible Sun Defense. Tailored for Melanin.',
      subtext: 'No chalky residue, no pore congestion. Lightweight daily mineral protection engineered specifically for Fitzpatrick IV–VI skin tones.',
      actionLabel: 'Discover Sun Protection',
      actionCategory: 'skincare',
      secondaryActionText: 'Our Formulation Ethics',
      secondaryRoute: 'categories'
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  useEffect(() => {
    if (isHeroPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHeroPaused, heroSlides.length]);

  const activeSlide = heroSlides[currentSlide];

  // 2. CATEGORY DISCOVERY & FILTERING
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const categoryFilters = [
    { id: 'All', label: 'All Formulations' },
    { id: 'skincare', label: 'Skin Care' },
    { id: 'body-care', label: 'Body Rituals' },
    { id: 'fragrance', label: 'Haute Fragrance' },
    { id: 'makeup', label: 'Lip & Color' },
  ];

  const filteredProducts = products.filter((p) => {
    if (activeCategoryFilter === 'All') return true;
    return p.category === activeCategoryFilter;
  });

  // Exactly 5 products for 1 single uniform row on desktop (as requested)
  const displayedProducts = filteredProducts.slice(0, 5);

  // 3. CURATED CATEGORY STRIP IN CONTINUOUS MOTION
  const categoryStripItems = [
    {
      label: 'Body Care',
      category: 'body-care',
      image: '/cat_bodycare.jpg',
      desc: 'Radiant botanical oils & whipped butters'
    },
    {
      label: 'Skincare',
      category: 'skincare',
      image: '/cat_skincare.jpg',
      desc: 'pH 5.5 cleansers & invisible SPF 50+'
    },
    {
      label: 'Haute Fragrance',
      category: 'fragrance',
      image: '/cat_fragrance.jpg',
      desc: 'Artisanal extrait perfume oils'
    },
    {
      label: 'Makeup & Lips',
      category: 'makeup',
      image: '/cat_makeup.jpg',
      desc: 'Peptide glosses & velvet finishes'
    },
    {
      label: 'Lifestyle',
      category: 'lifestyle',
      image: '/cat_lifestyle.jpg',
      desc: 'Raw silk & minimal accessories'
    },
  ];

  // 4. EVERYDAY ROUTINE: 3-CHAPTER BEAUTY RITUAL (Live from Admin CMS)
  const [activeRoutineStep, setActiveRoutineStep] = useState(0);
  const routineSteps = appRoutineSteps && appRoutineSteps.length > 0 ? appRoutineSteps : [
    {
      number: '01',
      title: 'Cleanse',
      productName: 'Gentle Purifying Cleanser',
      image: '/routine_lady_cleanse.jpg',
      tagline: 'Acid Mantle Balancing',
      description: 'Preserves the delicate skin barrier while removing impurities. Formulated at pH 5.5 to prevent tightness and moisture loss.',
      keyBenefit: 'NAFDAC Certified • Zero Sulfates • Microbiome Safe'
    },
    {
      number: '02',
      title: 'Moisturize',
      productName: 'Bio-Active Barrier Cream',
      image: '/routine_lady_moisturize.jpg',
      tagline: 'Deep Cellular Lipids',
      description: 'Cold-pressed Nilotica shea and restorative niacinamide seal deep hydration to protect against harsh harmattan and dry climates.',
      keyBenefit: '48h Lipid Lock • Cold-Pressed Shea • 2% Niacinamide'
    },
    {
      number: '03',
      title: 'Protect',
      productName: 'Melanin Defense Sun Shield SPF 50+',
      image: '/routine_lady_protect.jpg',
      tagline: 'Invisible Broad Spectrum',
      description: 'Engineered specifically for Fitzpatrick IV–VI skin tones. Leaves zero white cast, absorbs in seconds, and protects against UVA/UVB and blue light.',
      keyBenefit: 'SPF 50+ PA++++ • 0% White Cast • Antioxidant Infused'
    }
  ];

  // 5. PRODUCT QUICK MODAL (Variant Selection)
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);

  const handleOpenVariantModal = (product: Product) => {
    setModalProduct(product);
    setIsQuickModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F0F10] font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      <main className="space-y-0">
        {/* ========================================================================= */}
        {/* 1. HERO SECTION: Clean, Spacious, Breathable Editorial                   */}
        {/* ========================================================================= */}
        <section
          aria-label="Editorial Brand Hero"
          className="relative bg-[#0F0F10] text-white min-h-[580px] lg:min-h-[640px] flex items-center overflow-hidden"
          onMouseEnter={() => setIsHeroPaused(true)}
          onMouseLeave={() => setIsHeroPaused(false)}
        >
          {/* Background Photographic Carousel with Smooth Crossfade */}
          {heroSlides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-out pointer-events-none ${
                idx === currentSlide ? 'opacity-90' : 'opacity-0'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.headline}
                className="w-full h-full object-cover object-center scale-102"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
            </div>
          ))}

          {/* Hero Content Stage */}
          <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 w-full">
            <div className="max-w-2xl space-y-6">
              {/* Editorial Sub-Label in Pure Serif Italics (Understated, Luxury Scale) */}
              <p className="font-serif italic text-sm sm:text-base text-[#D4AF37] tracking-wide">
                {activeSlide.tag}
              </p>

              {/* Expressive Editorial Headline (Refined, Confident Scale) */}
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl tracking-tight text-white leading-[1.2]">
                {activeSlide.headline}
              </h1>

              {/* Restrained Supporting Statement */}
              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed max-w-lg font-normal">
                {activeSlide.subtext}
              </p>

              {/* Intentional CTAs */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => {
                    if (activeSlide.actionCategory) {
                      setSelectedCategory(activeSlide.actionCategory);
                    } else {
                      setSelectedCategory('All');
                    }
                    navigateTo('catalogue');
                  }}
                  className="px-7 py-3.5 rounded-full bg-[#D4AF37] hover:bg-[#c49f2e] text-[#0F0F10] text-xs font-bold tracking-wide transition-all duration-200 active:scale-95 shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span>{activeSlide.actionLabel}</span>
                  <ArrowRight size={15} strokeWidth={2.2} />
                </button>

                <button
                  onClick={() => {
                    if (activeSlide.secondaryRoute) {
                      navigateTo(activeSlide.secondaryRoute as any);
                    } else {
                      navigateTo('ai-scan');
                    }
                  }}
                  className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/25 text-xs font-semibold backdrop-blur-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <FaceScanIcon size={14} className="text-[#D4AF37]" />
                  <span>{activeSlide.secondaryActionText || 'AI Skin Analysis'}</span>
                </button>
              </div>
            </div>

            {/* Slide Navigation Progress Lines */}
            <div className="mt-14 flex items-center gap-2.5">
              {heroSlides.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentSlide
                      ? 'w-8 bg-[#D4AF37]'
                      : 'w-2 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. CHOOSE YOUR PATHWAY: ASYMMETRIC BENTO WITH SCULPTED DIAGONAL CURVES    */}
        {/* ========================================================================= */}
        <section
          aria-label="Audience Pathways"
          className="relative py-10 lg:py-14 bg-[#FAF9F6] border-b border-[#E5E7EB] overflow-hidden"
        >
          {/* Ambient Flowing Golden Wave Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-35">
            <div
              className="absolute bottom-0 left-0 w-[200%] h-[260px] bg-repeat-x bg-bottom animate-wave-flow"
              style={{
                backgroundImage: `url('/wave_white_gold.svg')`,
                backgroundSize: '1200px 260px',
              }}
            />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-6">
            <div className="text-center max-w-xl mx-auto mb-9">
              <p className="font-serif italic text-base text-[#997A2E] mb-0.5">
                Curated Gateways
              </p>
              <h2 className="font-heading font-extrabold text-2xl lg:text-3xl text-[#0F0F10] tracking-tight">
                Connect with Delsla™
              </h2>
              <p className="text-xs sm:text-sm text-[#6B7280] mt-1.5 font-normal leading-relaxed">
                Dedicated portals for skincare clients, beauty educators, and commercial partners.
              </p>
            </div>

            {/* Asymmetrical Bento Grid with Sculpted Diagonal Curvatures & Lush Beauty Face */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Dominant Hero Bento: Customer Experience with Lush Cosmetic Beauty Face */}
              <article
                onClick={() => navigateTo('signup')}
                className="lg:col-span-7 group relative min-h-[420px] lg:min-h-[450px] rounded-tl-[3.5rem] rounded-br-[3.5rem] rounded-tr-2xl rounded-bl-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all duration-500 border border-[#E5E7EB] flex flex-col justify-end"
              >
                <img
                  src="/connect_customer_lush.jpg"
                  alt="Delsla Customer Skincare Experience"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                <div className="relative z-10 p-8 sm:p-10 text-white space-y-2.5">
                  <span className="font-serif italic text-sm text-[#D4AF37]">
                    Client Sanctuary
                  </span>
                  <h3 className="font-heading font-extrabold text-[20px] text-white">
                    Customer Experience
                  </h3>
                  <p className="text-[12px] text-gray-200 leading-relaxed max-w-lg">
                    Personalized formulation records, routine tracking, and white-glove concierge delivery across {selectedCity}.
                  </p>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-[#0F0F10] text-xs font-semibold group-hover:bg-[#D4AF37] transition-colors shadow-xs">
                      <span>Create Client Profile</span>
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </article>

              {/* Stacked Companion Bentos: Creator & Distributor with Matching Sculpted Curves */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                {/* Bento Card 2: Creator Collective (Top-Right Curved) */}
                <article
                  onClick={() => {
                    loginAsDemoRole('CREATOR');
                    navigateTo('creators');
                  }}
                  className="group relative flex-1 min-h-[210px] rounded-tr-[2.5rem] rounded-bl-[2.5rem] rounded-tl-xl rounded-br-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-500 border border-[#E5E7EB] flex flex-col justify-end p-6 sm:p-7"
                >
                  <img
                    src="/connect_creator.jpg"
                    alt="Delsla Beauty Creator Collective"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

                  <div className="relative z-10 text-white space-y-1">
                    <span className="font-serif italic text-xs text-[#D4AF37]">
                      Creative Studio
                    </span>
                    <h3 className="font-heading font-bold text-lg text-white">
                      Creator Collective
                    </h3>
                    <p className="text-[11px] text-gray-200 line-clamp-2 leading-relaxed">
                      Share authentic routines, test lab formulations, and earn transparent creator commissions.
                    </p>
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white group-hover:text-[#D4AF37] transition-colors">
                        <span>Explore Creator Hub</span>
                        <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </article>

                {/* Bento Card 3: Distribution Network (Top-Left Curved) */}
                <article
                  onClick={() => {
                    loginAsDemoRole('DISTRIBUTOR');
                    navigateTo('distributor-portal');
                  }}
                  className="group relative flex-1 min-h-[210px] rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-xl rounded-bl-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-500 border border-[#E5E7EB] flex flex-col justify-end p-6 sm:p-7"
                >
                  <img
                    src="/connect_distributor.jpg"
                    alt="Delsla Wholesale and Distribution"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

                  <div className="relative z-10 text-white space-y-1">
                    <span className="font-serif italic text-xs text-[#D4AF37]">
                      Prestige Commerce
                    </span>
                    <h3 className="font-heading font-bold text-lg text-white">
                      Distribution Network
                    </h3>
                    <p className="text-[11px] text-gray-200 line-clamp-2 leading-relaxed">
                      Direct dispensary inventory allocations, tier volume discounts, and regional distribution.
                    </p>
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white group-hover:text-[#D4AF37] transition-colors">
                        <span>Explore Distribution</span>
                        <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. CATEGORY DISCOVERY STRIP IN CONTINUOUS MOTION (No Media Controls)       */}
        {/* ========================================================================= */}
        <section
          aria-label="Curated Categories in Motion"
          className="relative py-8 lg:py-10 bg-white border-b border-[#E5E7EB] overflow-hidden select-none"
        >
          {/* Subtle Wave Backdrop */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div
              className="absolute top-0 left-0 w-[200%] h-full bg-repeat-x bg-center animate-wave-flow-slow"
              style={{
                backgroundImage: `url('/wave_white_gold.svg')`,
                backgroundSize: '1400px 100%',
              }}
            />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-6 mb-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="font-serif italic text-sm text-[#997A2E] mb-0.5">
                  Formulation Disciplines
                </p>
                <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0F0F10] tracking-tight">
                  Curated Categories
                </h2>
              </div>
              <button
                onClick={() => navigateTo('categories')}
                className="text-xs font-semibold text-[#0F0F10] hover:text-[#997A2E] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Continuous Motion Carousel Track (Confined within central grid with smooth side fade masks) */}
          <div className="relative max-w-6xl mx-auto px-6">
            <div className="relative overflow-hidden rounded-3xl">
              {/* Left and right elegant gradient edge masks */}
              <div
                className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white via-white/85 to-transparent z-10 pointer-events-none"
                aria-hidden="true"
              />
              <div
                className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white via-white/85 to-transparent z-10 pointer-events-none"
                aria-hidden="true"
              />

              <div className="animate-marquee-smooth flex items-center gap-6 w-max py-1">
                {/* Triplicated list for seamless continuous infinite motion within 6xl container */}
                {[...categoryStripItems, ...categoryStripItems, ...categoryStripItems].map((item, idx) => (
                  <button
                    key={`${item.category}-${idx}`}
                    onClick={() => {
                      setSelectedCategory(item.category);
                      navigateTo('catalogue');
                    }}
                    className="flex flex-col items-center text-center group cursor-pointer p-2.5 rounded-3xl hover:bg-[#FAF9F6] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] shrink-0"
                  >
                    <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-[1.75rem] overflow-hidden border-2 border-[#E5E7EB] group-hover:border-[#D4AF37] transition-all duration-400 bg-[#FAF9F6] shadow-2xs group-hover:scale-105 shrink-0">
                      <img
                        src={item.image}
                        alt={item.label}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <span className="font-heading font-semibold text-xs text-[#0F0F10] group-hover:text-[#997A2E] transition-colors mt-2.5">
                      {item.label}
                    </span>
                    <span className="text-[10.5px] text-[#6B7280] mt-0.5 max-w-[130px] truncate">
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. FORMULATION ESSENTIALS: 5 CLEAN PRODUCTS ON 1 SINGLE ROW (Desktop)     */}
        {/* ========================================================================= */}
        <section aria-label="Bestselling Formulations" className="py-12 lg:py-16 bg-[#FAF9F6] border-b border-[#E5E7EB]">
          <div className="max-w-6xl mx-auto px-6">
            {/* Header & Category Filter Tabs */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <p className="font-serif italic text-base text-[#997A2E] mb-0.5">
                  Bestselling Formulations
                </p>
                <h2 className="font-heading font-extrabold text-2xl lg:text-3xl text-[#0F0F10] tracking-tight">
                  Formulation Essentials
                </h2>
              </div>

              {/* Minimal Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {categoryFilters.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategoryFilter(tab.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-160 cursor-pointer ${
                      activeCategoryFilter === tab.id
                        ? 'bg-[#0F0F10] text-white shadow-xs'
                        : 'bg-white hover:bg-[#F3EEE3] text-[#4B5563] border border-[#E5E7EB]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Exactly 5 Product Cards on 1 Row Across Desktop (As Requested) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="grid"
                  onOpenModal={handleOpenVariantModal}
                />
              ))}
            </div>

            {/* View Full Catalogue Link */}
            <div className="mt-10 text-center">
              <button
                onClick={() => {
                  setSelectedCategory(activeCategoryFilter === 'All' ? 'All' : activeCategoryFilter);
                  navigateTo('catalogue');
                }}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-[#0F0F10] text-xs font-semibold text-[#0F0F10] hover:bg-[#0F0F10] hover:text-white transition-colors duration-200 active:scale-95 cursor-pointer"
              >
                <span>View Full Formulation Catalogue</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. YOUR EVERYDAY ROUTINE: SEAMLESS BACKGROUND, COMPACT & WELL-PADDED      */}
        {/* ========================================================================= */}
        <section
          aria-label="The Daily Ritual"
          className="relative py-12 lg:py-16 bg-[#FAF9F6] border-b border-[#E5E7EB] overflow-hidden"
        >
          {/* Ambient Wave Background Flow */}
          <div className="absolute inset-0 pointer-events-none opacity-25 select-none">
            <div
              className="absolute bottom-0 left-0 w-[200%] h-[240px] bg-repeat-x bg-bottom animate-wave-flow"
              style={{
                backgroundImage: `url('/wave_white_gold.svg')`,
                backgroundSize: '1200px 240px',
              }}
            />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-6">
            <div className="max-w-xl mb-9">
              <p className="font-serif italic text-base text-[#997A2E] mb-0.5">
                The Daily Ritual
              </p>
              <h2 className="font-heading font-extrabold text-2xl lg:text-3xl text-[#0F0F10] tracking-tight">
                Your Everyday Routine.
              </h2>
              <p className="text-xs sm:text-sm text-[#6B7280] mt-1.5 leading-relaxed">
                Formulations designed to compound together. Cleanse without stripping, lock deep cellular lipids, and defend against harsh environmental exposure.
              </p>
            </div>

            {/* Seamless, Well-Padded Dual Stage (No Jarring Box-in-a-Box Container) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Rich Editorial Photographic Stage with Sculpted Curvature */}
              <div className="lg:col-span-6">
                <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-[#F6F5F2] border border-[#E5E7EB] shadow-xs">
                  <img
                    src={routineSteps[activeRoutineStep].image}
                    alt={routineSteps[activeRoutineStep].title}
                    className="w-full h-full object-cover transition-opacity duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs">
                    <span className="font-serif italic text-sm text-[#D4AF37]">
                      {routineSteps[activeRoutineStep].tagline}
                    </span>
                    <span className="font-mono text-[10px] text-gray-200">
                      Step {routineSteps[activeRoutineStep].number} of 03
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Intentionally Well-Spaced & Padded Chapter Selectors */}
              <div className="lg:col-span-6 space-y-3.5">
                {routineSteps.map((step, idx) => {
                  const isActive = idx === activeRoutineStep;
                  return (
                    <div
                      key={step.number}
                      onClick={() => setActiveRoutineStep(idx)}
                      className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                        isActive
                          ? 'bg-white border-[#D4AF37] shadow-sm'
                          : 'bg-white/70 border-[#E5E7EB] hover:border-[#D4AF37]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-serif italic text-xs text-[#997A2E]">
                          Chapter {step.number}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-wider font-semibold">
                            Active Step
                          </span>
                        )}
                      </div>

                      <h3 className="font-heading font-bold text-base text-[#0F0F10] mt-1">
                        {step.number} / {step.title}
                      </h3>

                      <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                        {step.description}
                      </p>

                      <div className="mt-2 text-[10.5px] font-semibold text-[#0F0F10]">
                        {step.productName}
                      </div>
                    </div>
                  );
                })}

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedCategory('skincare');
                      navigateTo('catalogue');
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-semibold active:scale-95 transition-all cursor-pointer shadow-xs"
                  >
                    <span>Explore the Complete Ritual</span>
                    <ArrowRight size={14} className="text-[#D4AF37]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. BRAND STORY: CARE WITH INTENTION                                       */}
        {/* ========================================================================= */}
        <section aria-label="Brand Story" className="py-14 lg:py-18 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Tactile Editorial Image with Asymmetric Curvature */}
              <div className="lg:col-span-6">
                <div className="relative rounded-[2.5rem] overflow-hidden shadow-sm border border-[#E5E7EB] aspect-[4/3]">
                  <img
                    src="/hero_editorial.jpg"
                    alt="Delsla clinical formulations and indigenous botanicals"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs">
                    <span className="font-serif italic text-sm">Lagos Clinical Formulations</span>
                    <span className="font-serif italic text-sm text-[#D4AF37]">Bio-Compatible Shea</span>
                  </div>
                </div>
              </div>

              {/* Story Narrative */}
              <div className="lg:col-span-6 space-y-5">
                <div className="space-y-1.5">
                  <p className="font-serif italic text-base text-[#997A2E]">
                    Our Philosophy
                  </p>
                  <h2 className="font-heading font-extrabold text-2xl lg:text-3xl text-[#0F0F10] tracking-tight">
                    Care with intention.
                  </h2>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                  <p>
                    Formulated in Lagos in partnership with clinical dermatologists. Every batch of Delsla is cold-pressed, bio-compatible, and engineered specifically for the cellular density and melanin profile of African skin.
                  </p>
                  <p>
                    We reject harsh lightening agents and synthetic fragrances. Instead, we elevate indigenous botanicals — pure unrefined shea, cold-pressed moringa, and clinical niacinamide — to build barrier strength and sustained luminosity.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => navigateTo('categories')}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F0F10] hover:text-[#997A2E] transition-colors py-2.5 px-6 rounded-full border border-[#0F0F10] hover:bg-[#FAF9F6] active:scale-95 cursor-pointer"
                  >
                    <span>Our Story &amp; Pillars</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* LUXURY WHITE FOOTER */}
      <footer className="bg-white border-t border-[#E5E7EB] pt-12 pb-8 text-[#6B7280] text-xs">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-10">
          {/* Column 1: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo variant="dark" size="md" showTagline={true} />
            <p className="text-xs text-[#4B5563] max-w-sm leading-relaxed">
              Safe-conscious dermatological formulations and luxury lifestyle essentials engineered specifically for melanin-rich skin. 100% NAFDAC certified.
            </p>
            <div className="flex items-center gap-3 text-xs text-[#0F0F10]">
              <span className="font-semibold text-[#D4AF37]">Lagos</span>
              <span>•</span>
              <span className="font-semibold text-[#D4AF37]">Abuja</span>
              <span>•</span>
              <span className="font-semibold text-[#D4AF37]">Port Harcourt</span>
              <span>•</span>
              <span className="font-semibold text-[#D4AF37]">Ibadan</span>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F0F10]">
              Catalogue
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('skincare');
                    navigateTo('catalogue');
                  }}
                  className="hover:text-[#0F0F10] transition-colors cursor-pointer"
                >
                  Skin Care Formulations
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('body-care');
                    navigateTo('catalogue');
                  }}
                  className="hover:text-[#0F0F10] transition-colors cursor-pointer"
                >
                  Botanical Body Oils
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('fragrance');
                    navigateTo('catalogue');
                  }}
                  className="hover:text-[#0F0F10] transition-colors cursor-pointer"
                >
                  Haute Artisanal Fragrance
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedCategory('makeup');
                    navigateTo('catalogue');
                  }}
                  className="hover:text-[#0F0F10] transition-colors cursor-pointer"
                >
                  Peptide Lip Glosses
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Portals & Tracking */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F0F10]">
              Portals &amp; Orders
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => navigateTo('orders')}
                  className="hover:text-[#0F0F10] transition-colors cursor-pointer"
                >
                  Track Order
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('ai-scan')}
                  className="hover:text-[#0F0F10] transition-colors cursor-pointer"
                >
                  PIX AI Skin Scan
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    loginAsDemoRole('CREATOR');
                    navigateTo('creators');
                  }}
                  className="hover:text-[#0F0F10] transition-colors cursor-pointer"
                >
                  Creator Collective
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    loginAsDemoRole('DISTRIBUTOR');
                    navigateTo('distributor-portal');
                  }}
                  className="hover:text-[#0F0F10] transition-colors cursor-pointer"
                >
                  Distributor Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Client Services */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F0F10]">
              Client Services
            </h4>
            <p className="text-xs text-[#4B5563]">
              Need skincare consultation or regional fulfillment assistance?
            </p>
            <div className="pt-1">
              <a
                href="https://wa.me/2348148120642"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-[#0F0F10] font-semibold text-xs hover:border-[#D4AF37] transition-colors"
              >
                <span>WhatsApp VIP Concierge</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-6xl mx-auto px-6 pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#9CA3AF]">
          <p>© {new Date().getFullYear()} Delsla™ Beauty &amp; Dermatologie. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Clinical Dermatology</span>
            <span>•</span>
            <span>NAFDAC Compliant</span>
            <span>•</span>
            <span>Secure Checkout</span>
          </div>
        </div>
      </footer>

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
