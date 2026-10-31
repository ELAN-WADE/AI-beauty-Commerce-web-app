import React, { useState, useMemo } from 'react';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../../components/common/ProductCard';

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

  const visualCategories = [
    { label: 'All Range', value: 'All', image: 'https://images.unsplash.com/photo-1608248597359-0c679234b4c7?auto=format&fit=crop&w=400&q=80' },
    { label: 'Skin Care', value: 'skincare', image: '/cat_skincare.jpg' },
    { label: 'Body Rituals', value: 'body-care', image: '/cat_bodycare.jpg' },
    { label: 'Haute Fragrance', value: 'fragrance', image: '/cat_fragrance.jpg' },
    { label: 'Lip & Color', value: 'makeup', image: '/cat_makeup.jpg' },
    { label: 'Lifestyle', value: 'lifestyle', image: '/cat_lifestyle.jpg' },
    { label: 'Sun Defense', value: 'suncare', image: '/product_sunscreen.jpg' },
    { label: 'Bath & Body', value: 'bath', image: '/routine_01_cleanse.jpg' }
  ];

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
    <div className="min-h-screen bg-white text-[#0F0F10] pb-28 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-4 space-y-4">
        {/* DUAL TOP SHELF: Categories on the Left + Recommended Routine on the Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start border-b border-[#E5E7EB] pb-5">
          {/* Left Column (lg:col-span-6): Categories */}
          <div className="lg:col-span-6 space-y-3">
            <h1 className="font-heading font-extrabold text-2xl text-[#0F0F10] tracking-tight">
              Categories
            </h1>

            {/* Circular Categories Strip */}
            <div className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1">
              {visualCategories.map((cat) => {
                const isActive = selectedCategory.toLowerCase() === cat.value.toLowerCase();
                return (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none transition-transform active:scale-95 shrink-0"
                  >
                    <div
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden p-0.5 transition-all duration-300 ${
                        isActive
                          ? 'ring-2 ring-[#D4AF37] ring-offset-2 scale-105 shadow-xs'
                          : 'border border-[#E5E7EB] hover:border-[#D4AF37]/60 opacity-80 group-hover:opacity-100 group-hover:scale-105'
                      }`}
                    >
                      <img
                        src={cat.image}
                        alt={cat.label}
                        className="w-full h-full object-cover rounded-full"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/product_barrier_cream.jpg';
                        }}
                      />
                    </div>
                    <span
                      className={`text-[11px] whitespace-nowrap transition-colors ${
                        isActive
                          ? 'font-bold text-[#0F0F10]'
                          : 'font-medium text-[#6B7280] group-hover:text-[#0F0F10]'
                      }`}
                    >
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column (lg:col-span-6): Recommended Routine: 3-Step Daily Ritual */}
          {routineSteps.length > 0 && (<div className="lg:col-span-6 space-y-3 lg:border-l lg:border-[#E5E7EB] lg:pl-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-heading font-bold text-base text-[#0F0F10] tracking-tight">
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
                  <span className="text-[10px] font-mono text-[#997A2E] font-bold tracking-wider block">
                    {routineSteps[Math.min(activeRoutineIndex, routineSteps.length - 1)].step}
                  </span>
                  <h3 className="font-heading font-bold text-xs sm:text-sm text-[#0F0F10] truncate mt-0.5">
                    {routineSteps[Math.min(activeRoutineIndex, routineSteps.length - 1)].title}
                  </h3>
                  <span className="text-xs font-bold font-price text-[#0F0F10] block mt-0.5">
                    ₦{routineSteps[Math.min(activeRoutineIndex, routineSteps.length - 1)].price.toLocaleString('en-NG')}
                  </span>
                  <span className="text-[11px] text-[#6B7280] font-medium mt-0.5 truncate block max-w-xs">
                    {routineSteps[Math.min(activeRoutineIndex, routineSteps.length - 1)].skinType}
                  </span>
                </div>
              </div>

              {/* Step Navigation Dots / Indicators */}
              <div className="flex flex-col gap-1.5 shrink-0 items-center">
                {routineSteps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveRoutineIndex(idx)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      activeRoutineIndex === idx
                        ? 'bg-[#0F0F10] text-white shadow-xs'
                        : 'text-[#6B7280] hover:text-[#0F0F10]'
                    }`}
                  >
                    0{idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>)}
        </div>

        {/* Filter and Sort Toolbar */}
        <div className="flex items-center justify-between gap-2 py-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFilterSheetOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs font-heading font-bold text-[#0F0F10] hover:bg-[#FAF9F6] active-press transition-colors shadow-2xs cursor-pointer"
            >
              <SlidersHorizontal size={14} className="text-[#D4AF37]" />
              <span>Filters</span>
            </button>
            <span className="text-xs text-[#6B7280]">
              Showing <strong className="text-[#0F0F10]">{filtered.length}</strong> formulations
            </span>
          </div>

          {/* Quick Sort Dropdown */}
          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            <ArrowUpDown size={14} className="text-[#997A2E]" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-white border border-[#E5E7EB] text-xs font-heading font-bold text-[#0F0F10] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#D4AF37] cursor-pointer shadow-2xs"
            >
              <option value="featured">Featured / Best Sellers</option>
              <option value="newest">Newest Formulations</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Customer Rating</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <h3 className="font-heading font-extrabold text-xl text-[#0F0F10]">No Formulations Found</h3>
            <p className="text-xs text-[#6B7280]">Try clearing or changing your filters.</p>
            <button
              onClick={() => setSelectedCategory('All')}
              className="px-6 py-2.5 rounded-full bg-[#0F0F10] text-white hover:bg-[#D4AF37] hover:text-[#0F0F10] font-heading font-bold text-xs active-press transition-colors cursor-pointer shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 md:gap-5 pt-1">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
