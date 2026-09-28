import React from 'react';
import { SlidersHorizontal, ArrowUpDown, ChevronLeft, ShoppingBag, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useViewport } from '../context/ViewportContext';
import { ProductCard } from '../components/common/ProductCard';

export const Screen06Catalogue: React.FC = () => {
  const { isDesktop } = useViewport();
  const {
    products,
    selectedCategory,
    setSelectedCategory,
    sortOption,
    setSortOption,
    setIsFilterSheetOpen,
    goBack,
    navigateTo,
    cartCount,
    selectedCity,
    setIsLocationModalOpen
  } = useApp();

  const categoryPills = [
    { label: 'All Range', value: 'All' },
    { label: 'Body Care', value: 'body-care' },
    { label: 'Skincare', value: 'skincare' },
    { label: 'Haute Fragrance', value: 'fragrance' },
    { label: 'Complexion & Lips', value: 'makeup' },
    { label: 'Lifestyle', value: 'lifestyle' }
  ];

  // Filtering products
  let filtered = products.filter((p) => {
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
  filtered = [...filtered].sort((a, b) => {
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

  const getCategoryTitle = () => {
    if (selectedCategory === 'All') return 'Desla!™ Full Catalogue';
    const found = categoryPills.find((p) => p.value.toLowerCase() === selectedCategory.toLowerCase());
    return found ? found.label : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
  };

  return (
    <div className="min-h-screen bg-white text-[#0F0F10] pb-28 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      {/* Mobile-Only Header Bar (Hidden on Desktop because DesktopNav is already present) */}
      {!isDesktop && (
        <div className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 py-3.5 shadow-xs">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={goBack}
                className="p-1.5 -ml-1 rounded-full text-[#0F0F10] hover:bg-gray-100 active:scale-[0.97] transition-all cursor-pointer"
                aria-label="Go back"
              >
                <ChevronLeft size={22} strokeWidth={2.2} />
              </button>
              <div>
                <h1 className="font-heading font-extrabold text-base text-[#0F0F10] tracking-tight">
                  {getCategoryTitle()}
                </h1>
                <span className="text-[11px] text-[#6B7280] font-mono block">
                  {filtered.length} authentic formulations in {selectedCity}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateTo('cart')}
                className="p-2 rounded-full text-[#0F0F10] hover:bg-gray-100 active:scale-[0.97] relative transition-all cursor-pointer"
                aria-label="Cart"
              >
                <ShoppingBag size={20} strokeWidth={1.75} />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#D4AF37] text-[#0F0F10] text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 space-y-5">
        {/* Desktop Editorial Page Header (Only rendered in desktop viewports) */}
        {isDesktop && (
          <div className="flex items-end justify-between border-b border-[#E5E7EB] pb-5">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E] block mb-1">
                Haute Apothecary &amp; Lifestyle Catalogue
              </span>
              <h1 className="font-heading font-extrabold text-3xl text-[#0F0F10] tracking-tight">
                {getCategoryTitle()}
              </h1>
              <p className="text-xs text-[#6B7280] mt-1">
                Showing {filtered.length} authentic formulations stocked and fulfilled locally in {selectedCity}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-xs font-mono font-bold text-[#0F0F10]">
                {filtered.length} SKUs Listed
              </span>
            </div>
          </div>
        )}

        {/* City Fulfillment Callout */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs text-[#6B7280] shadow-xs">
          <div className="flex items-center gap-2 truncate">
            <MapPin size={15} className="text-[#D4AF37] shrink-0" />
            <span className="truncate">
              Live stock availability verified for: <strong className="text-[#0F0F10]">{selectedCity} Regional Distribution Network</strong>
            </span>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="text-xs font-heading font-bold text-[#997A2E] hover:underline shrink-0 ml-2 cursor-pointer"
          >
            Change City
          </button>
        </div>

        {/* Category Filter Pills (Horizontal Scroller) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categoryPills.map((pill) => {
            const isActive = selectedCategory.toLowerCase() === pill.value.toLowerCase();
            return (
              <button
                key={pill.value}
                onClick={() => setSelectedCategory(pill.value)}
                className={`px-4 py-2 rounded-full text-xs font-heading font-bold whitespace-nowrap transition-all active:scale-[0.97] cursor-pointer ${
                  isActive
                    ? 'bg-[#0F0F10] text-white shadow-sm'
                    : 'bg-[#F6F5F2] hover:bg-gray-200 text-[#4B5563] border border-[#E5E7EB]'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* Filter and Sort Toolbar */}
        <div className="flex items-center justify-between gap-2 py-1">
          <button
            onClick={() => setIsFilterSheetOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs font-heading font-bold text-[#0F0F10] hover:bg-[#FAF9F6] active:scale-[0.97] transition-all shadow-xs cursor-pointer"
          >
            <SlidersHorizontal size={14} className="text-[#D4AF37]" />
            <span>Filters</span>
          </button>

          {/* Quick Sort Dropdown */}
          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
            <ArrowUpDown size={14} className="text-[#997A2E]" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-white border border-[#E5E7EB] text-xs font-heading font-bold text-[#0F0F10] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#D4AF37] cursor-pointer shadow-xs"
            >
              <option value="featured">Featured / Best Sellers</option>
              <option value="newest">Newest Formulations</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Customer Rating</option>
            </select>
          </div>
        </div>

        {/* High-Density 5-Column Product Grid (Wireframe 2) */}
        {filtered.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <h3 className="font-heading font-extrabold text-2xl text-[#0F0F10]">No Formulations Found</h3>
            <p className="text-xs text-[#6B7280]">Try clearing or changing your filters.</p>
            <button
              onClick={() => setSelectedCategory('All')}
              className="px-6 py-2.5 rounded-full bg-[#0F0F10] text-white hover:bg-[#D4AF37] hover:text-[#0F0F10] font-heading font-bold text-xs active:scale-[0.97] transition-all cursor-pointer shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 md:gap-5 pt-2">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
