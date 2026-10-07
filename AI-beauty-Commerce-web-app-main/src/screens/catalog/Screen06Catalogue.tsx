import React from 'react';
import { SlidersHorizontal, ArrowUpDown, MapPin, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useViewport } from '../../context/ViewportContext';
import { ProductCard } from '../../components/common/ProductCard';

export const Screen06Catalogue: React.FC = () => {
  const { isDesktop } = useViewport();
  const {
    products,
    selectedCategory,
    setSelectedCategory,
    sortOption,
    setSortOption,
    setIsFilterSheetOpen,
    navigateTo,
    selectedCity,
    preferredDistributor,
    setPreferredDistributor,
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

  return (
    <div className="min-h-screen bg-white text-[#0F0F10] pb-28 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-3 space-y-3.5">
        {/* City Fulfillment Callout & AI Diagnostic Routine Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs text-[#6B7280] shadow-2xs">
          <div className="flex items-center gap-2 truncate">
            <MapPin size={15} className="text-[#D4AF37] shrink-0" />
            <span className="truncate">
              {preferredDistributor ? 'Browsing platform stock at: ' : 'Shopping for: '}<strong className="text-[#0F0F10]">{preferredDistributor?.location?.name ?? selectedCity}</strong>
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigateTo('ai-scan')}
              className="text-xs font-mono font-bold text-[#997A2E] hover:underline flex items-center gap-1 active-press cursor-pointer"
            >
              <Sparkles size={12} className="text-[#D4AF37]" />
              <span>AI Skin Scan</span>
            </button>
            <span className="text-gray-300">•</span>
            <button
              onClick={() => preferredDistributor ? setPreferredDistributor(null) : setIsLocationModalOpen(true)}
              className="text-xs font-heading font-bold text-[#0F0F10] hover:text-[#997A2E] underline active-press cursor-pointer"
            >
              {preferredDistributor ? 'Browse all stock' : 'Change city'}
            </button>
          </div>
        </div>

        {preferredDistributor && (
          <p className="text-xs text-[#6B7280]">
            Availability for your chosen sizes and quantities is confirmed at checkout. This selection does not reserve stock.
          </p>
        )}

        {/* Category Filter Pills (Mobile / Tablet Only) */}
        {!isDesktop && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-0.5">
            {categoryPills.map((pill) => {
              const isActive = selectedCategory.toLowerCase() === pill.value.toLowerCase();
              return (
                <button
                  key={pill.value}
                  onClick={() => setSelectedCategory(pill.value)}
                  className={`px-4 py-2 rounded-full text-xs font-heading font-bold whitespace-nowrap transition-all active-press cursor-pointer ${
                    isActive
                      ? 'bg-[#0F0F10] text-white shadow-xs'
                      : 'bg-[#F6F5F2] hover:bg-gray-200 text-[#4B5563] border border-[#E5E7EB]'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        )}

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
