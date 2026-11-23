import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { SlidersHorizontal, ArrowUpDown } from '../../components/common/SolidIcons';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../../components/common/ProductCard';
import {
  CircularCategoryChip,
  SHOP_VISUAL_CATEGORIES,
} from '../../components/common/CircularCategoryStrip';
import { DESLA_EASE_OUT } from '../../components/motion/DeslaMotion';

export const Screen06Catalogue: React.FC = () => {
  const {
    products,
    routineSteps: publishedRoutineSteps,
    selectedCategory,
    setSelectedCategory,
    sortOption,
    setSortOption,
    setIsFilterSheetOpen,
    navigateTo,
    preferredDistributor,
    addToCartBatch
  } = useApp();

  const visualCategories = SHOP_VISUAL_CATEGORIES;

  const [activeRoutineIndex, setActiveRoutineIndex] = useState(1);
  const [showSynergyDetails, setShowSynergyDetails] = useState(false);

  const routineSteps = publishedRoutineSteps.filter(step => step.isActive !== false).flatMap((step, index) => { const product = products.find(product => product.id === (step.associatedProductId || step.productId)); return product ? [{ image: step.image || product.image, title: product.name, step: step.title, price: product.price, skinType: step.tagline, product }] : []; });

  const handleAddCompleteRoutine = () => { if (addToCartBatch(routineSteps.map(step => ({ product: step.product, size: step.product.sizes[0] || 'Standard', quantity: 1 })))) navigateTo('cart'); };

  // Filtering products
  const filtered = useMemo(() => {
    const matches = products.filter((p) => {
    if (preferredDistributor && !preferredDistributor.stock?.some(s => s.productId === p.id)) return false;
    if (selectedCategory !== 'All') {
      const target = selectedCategory.toLowerCase();
      const pCat = p.category.toLowerCase();
      const pSub = p.subCategory.toLowerCase();
      const match =
        pCat.includes(target) ||
        pSub.includes(target) ||
        (target === 'body-care' && (pCat.includes('body') || pSub.includes('wash') || pSub.includes('scrub') || pSub.includes('oil') || pSub.includes('butter') || pSub.includes('lotion'))) ||
        (target === 'skincare' && (pCat.includes('skin') || pSub.includes('cleanser') || pSub.includes('serum') || pSub.includes('toner') || pSub.includes('sunscreen'))) ||
        (target === 'fragrance' && (pCat.includes('fragrance') || pSub.includes('perfume') || pSub.includes('mist') || pSub.includes('oud'))) ||
        (target === 'makeup' && (pCat.includes('makeup') || pSub.includes('lip') || pSub.includes('gloss') || pSub.includes('complexion') || pSub.includes('lash')));
      if (!match) return false;
    }
    return true;
  });

  // Sorting
  return matches.sort((a, b) => {
    switch (sortOption) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
        return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      default:
        return (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0);
    }
  });
  }, [products, preferredDistributor, selectedCategory, sortOption]);

  return (
    <div className="min-h-[100dvh] bg-white text-[#0F0F10] pb-28 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-4 space-y-4">
        {/* DUAL TOP SHELF: Categories on the Left + Recommended Routine on the Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start border-b border-[#E5E7EB] pb-5">
          {/* Left Column (lg:col-span-6): Categories */}
          <div className="lg:col-span-6 space-y-3">
            <h1 className="font-heading font-semibold text-2xl text-[#0F0F10] tracking-tight">
              Categories
            </h1>

            {/* Circular Categories Strip with Traveling Highlight */}
            <div className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1.5">
              {visualCategories.map((cat) => (
                <CircularCategoryChip
                  key={cat.value}
                  item={cat}
                  isActive={selectedCategory.toLowerCase() === cat.value.toLowerCase()}
                  indicatorLayoutId="catalogue-category-indicator"
                  onClick={() => setSelectedCategory(cat.value)}
                />
              ))}
            </div>
          </div>

          {/* Right Column (lg:col-span-6): Recommended Routine: 3-Step Daily Ritual */}
          {routineSteps.length > 0 && (<div className="lg:col-span-6 space-y-3 lg:border-l lg:border-[#E5E7EB] lg:pl-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-heading font-semibold text-base text-[#0F0F10] tracking-tight">
                  Published Routine
                </h2>
                <div className="text-xs text-[#6B7280] mt-0.5">
                  <span>Formulations designed to compound together. </span>
                  {!showSynergyDetails ? (
                    <button
                      type="button"
                      onClick={() => setShowSynergyDetails(true)}
                      className="text-[#997A2E] hover:underline font-semibold cursor-pointer ml-0.5 inline-block"
                    >
                      See More
                    </button>
                  ) : (
                    <span className="inline">
                      <span>Cleanse micro-pollutants, lock 48h lipids, defend SPF 50+. </span>
                      <button
                        type="button"
                        onClick={() => setShowSynergyDetails(false)}
                        className="text-[#997A2E] hover:underline font-semibold cursor-pointer ml-0.5 inline-block"
                      >
                        See Less
                      </button>
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleAddCompleteRoutine}
                className="px-4 py-2 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-semibold shadow-xs whitespace-nowrap active:scale-95 transition-all cursor-pointer shrink-0"
              >
                Add Complete Routine
              </button>
            </div>

            {/* Active Routine Step Preview */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src={routineSteps[Math.min(activeRoutineIndex, routineSteps.length - 1)].image}
                  alt={routineSteps[Math.min(activeRoutineIndex, routineSteps.length - 1)].title}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/product_barrier_cream.jpg';
                  }}
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-[#997A2E] font-semibold tracking-wider block">
                    {routineSteps[Math.min(activeRoutineIndex, routineSteps.length - 1)].step}
                  </span>
                  <h3 className="font-heading font-medium text-xs sm:text-sm text-[#0F0F10] truncate mt-0.5">
                    {routineSteps[Math.min(activeRoutineIndex, routineSteps.length - 1)].title}
                  </h3>
                  <span className="text-xs font-semibold font-price text-[#0F0F10] block mt-0.5">
                    ₦{routineSteps[Math.min(activeRoutineIndex, routineSteps.length - 1)].price.toLocaleString('en-NG')}
                  </span>
                  <span className="text-[11px] text-[#6B7280] font-medium mt-0.5 truncate block max-w-xs">
                    {routineSteps[Math.min(activeRoutineIndex, routineSteps.length - 1)].skinType}
                  </span>
                </div>
              </div>

              {/* Step Navigation Dots / Indicators with Traveling Highlight */}
              <div className="flex flex-col gap-1 shrink-0 items-center p-1 rounded-full bg-[#F5F2EB] border border-[#EAE5DC]">
                {routineSteps.map((_, idx) => {
                  const active = activeRoutineIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setActiveRoutineIndex(idx)}
                      className={`relative w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-medium transition-colors duration-200 cursor-pointer ${
                        active ? 'text-white' : 'text-[#6E6A63] hover:text-[#111111]'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="catalogue-routine-step-pill"
                          transition={{ duration: 0.24, ease: DESLA_EASE_OUT }}
                          className="absolute inset-0 rounded-full bg-[#111111] ring-1 ring-[#B89248]/50"
                          aria-hidden="true"
                        />
                      )}
                      <span className="relative z-10">0{idx + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>)}
        </div>

        {/* Filter and Sort Toolbar — Compact non-clipping mobile bar + desktop select */}
        <div className="flex items-center justify-between gap-2 py-1">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 h-9 rounded-full sm:rounded-xl bg-[#FBF9F5] sm:bg-white border border-[#E7E1D6] sm:border-[#E5E7EB] text-xs font-medium text-[#111111] hover:bg-[#FAF9F6] active-press transition-colors shadow-sm cursor-pointer shrink-0"
            >
              <SlidersHorizontal size={14} className="text-[#997A2E]" />
              <span>Filters</span>
              {selectedCategory !== 'All' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#B89248]" aria-hidden="true" />
              )}
            </button>
            <span className="text-[11.5px] sm:text-xs text-[#6B7280] truncate">
              <strong className="font-semibold text-[#0F0F10] tabular-nums">{filtered.length}</strong>{' '}
              <span className="hidden xs:inline">formulations</span>
              <span className="xs:hidden">items</span>
            </span>
          </div>

          {/* Mobile Sort Trigger -> Opens Native Vaul FilterSortSheet (never clips off 390px edge) */}
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className="sm:hidden inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full bg-white border border-[#E7E1D6] text-xs font-medium text-[#111111] active-press shadow-sm cursor-pointer shrink-0"
            aria-label="Sort formulations"
          >
            <ArrowUpDown size={13} className="text-[#997A2E]" />
            <span>
              {sortOption === 'price-low'
                ? 'Price ↑'
                : sortOption === 'price-high'
                  ? 'Price ↓'
                  : sortOption === 'rating'
                    ? 'Top Rated'
                    : sortOption === 'newest'
                      ? 'Newest'
                      : 'Sort'}
            </span>
          </button>

          {/* Desktop Quick Sort Dropdown */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#6B7280]">
            <ArrowUpDown size={14} className="text-[#997A2E]" />
            <select
              aria-label="Sort formulations"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-white border border-[#E5E7EB] text-xs font-medium text-[#0F0F10] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#D4AF37] cursor-pointer shadow-sm"
            >
              <option value="recommended">Featured / Best Sellers</option>
              <option value="newest">Newest Formulations</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Customer Rating</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
            <img
              src="/artwork/empty-state-apothecary.webp"
              alt=""
              width={800}
              height={600}
              loading="lazy"
              className="w-40 h-32 object-cover rounded-2xl mx-auto border border-[#E5E7EB]/70"
            />
            <div className="space-y-1">
              <h3 className="font-heading font-semibold text-xl text-[#0F0F10]">No Formulations Found</h3>
              <p className="text-xs font-normal text-[#6B7280]">Try clearing or changing your filters to view available inventory.</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className="px-6 py-2.5 rounded-full bg-[#0F0F10] text-white hover:bg-[#27272A] font-heading font-semibold text-xs active-press transition-colors cursor-pointer shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <motion.div
            key={`${selectedCategory}:${sortOption}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: DESLA_EASE_OUT }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 md:gap-5 pt-1"
          >
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
};
