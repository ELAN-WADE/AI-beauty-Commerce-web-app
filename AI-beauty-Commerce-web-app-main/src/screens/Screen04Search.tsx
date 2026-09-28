import React, { useState } from 'react';
import { Search as SearchIcon, X, Clock, TrendingUp, ChevronLeft, Sparkles, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/common/ProductCard';

export const Screen04Search: React.FC = () => {
  const { products, searchQuery, setSearchQuery, goBack, setSelectedCategory, navigateTo, selectedCity } = useApp();

  const [recentSearches, setRecentSearches] = useState([
    'Radiant Glow Oil',
    'Whipped Shea Butter',
    'Extrait Perfume',
    'Lip Glaze'
  ]);

  const popularSearches = [
    'Radiant Body Oil',
    'Whipped Butter',
    'Exfoliating Scrub',
    'Perfume Oil',
    'Lip Glaze',
    'SPF 50+ Sunscreen',
    'Body Wash'
  ];

  const categoryShortcuts = [
    { name: 'Body Care', slug: 'body-care' },
    { name: 'Skincare', slug: 'skincare' },
    { name: 'Haute Fragrance', slug: 'fragrance' },
    { name: 'Complexion & Lips', slug: 'makeup' },
    { name: 'Lifestyle', slug: 'lifestyle' }
  ];

  const searchResults = products.filter((p) => {
    if (!searchQuery.trim()) return false;
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      (p.sku && p.sku.toLowerCase().includes(query)) ||
      p.category.toLowerCase().includes(query) ||
      p.subCategory.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.keyIngredients?.some((i) => i.name.toLowerCase().includes(query))
    );
  });

  const handleClearRecent = () => {
    setRecentSearches([]);
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
  };

  const handleCategoryClick = (slug: string) => {
    setSelectedCategory(slug);
    navigateTo('catalogue');
  };

  return (
    <div className="min-h-screen bg-white text-[#0F0F10] pb-28 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      {/* Search Header Bar with Full Desktop Responsiveness */}
      <div className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 lg:px-8 py-3.5">
        <div className="flex items-center gap-3 max-w-7xl mx-auto">
          <button
            onClick={goBack}
            className="p-2 -ml-2 rounded-full text-[#0F0F10] hover:bg-gray-100 active:scale-95 transition-all shrink-0 cursor-pointer"
            aria-label="Go back"
          >
            <ChevronLeft size={22} strokeWidth={2.2} />
          </button>

          <div className="relative flex-1 flex items-center rounded-full bg-[#FAF9F6] border border-[#E5E7EB] focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/20 transition-all shadow-xs">
            <SearchIcon size={18} className="text-[#6B7280] ml-4 shrink-0" strokeWidth={2.2} />
            <input
              type="text"
              placeholder="Search formulations, SKUs (e.g. DES-BO-01), key actives, perfumes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-transparent px-3 py-3 text-xs sm:text-sm text-[#0F0F10] placeholder-[#9CA3AF] focus:outline-none font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1.5 mr-3 text-gray-400 hover:text-black rounded-full cursor-pointer"
                aria-label="Clear input"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-5 space-y-6">
        {/* If no search input is entered, display Discovery matrix */}
        {!searchQuery.trim() ? (
          <div className="space-y-6 max-w-3xl">
            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0F0F10] flex items-center gap-1.5">
                    <Clock size={13} className="text-[#997A2E]" />
                    <span>Recent Searches</span>
                  </span>
                  <button
                    onClick={handleClearRecent}
                    className="text-[11px] text-[#6B7280] hover:text-black font-semibold cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTagClick(term)}
                      className="px-3.5 py-1.5 rounded-full bg-[#F3EEE3] hover:bg-[#EAE4D7] text-[#0F0F10] text-xs font-medium active:scale-95 transition-all cursor-pointer shadow-xs"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular trending formulation tags */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#0F0F10] flex items-center gap-1.5">
                <TrendingUp size={13} className="text-[#D4AF37]" />
                <span>Trending Formulations</span>
              </span>

              <div className="flex flex-wrap gap-2">
                {popularSearches.map((tag, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTagClick(tag)}
                    className="px-3.5 py-1.5 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] hover:border-[#D4AF37] hover:bg-[#F3EEE3] text-[#0F0F10] text-xs font-medium active:scale-95 transition-all cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Shop by Desla Pillars */}
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-bold text-[#0F0F10] flex items-center gap-1.5">
                <Layers size={13} className="text-[#997A2E]" />
                <span>Explore by Taxonomy Pillar</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {categoryShortcuts.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCategoryClick(cat.slug)}
                    className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] hover:border-[#D4AF37] text-left active:scale-[0.98] transition-all cursor-pointer group"
                  >
                    <span className="font-heading font-bold text-xs text-[#0F0F10] block group-hover:text-[#997A2E] transition-colors">
                      {cat.name}
                    </span>
                    <span className="text-[10px] text-[#6B7280] mt-0.5 block">
                      Explore SKU catalogue →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Live Search Results */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
              <span className="text-xs text-[#6B7280]">
                Search results for <strong className="text-[#0F0F10]">"{searchQuery}"</strong> ({searchResults.length} {searchResults.length === 1 ? 'formulation' : 'formulations'})
              </span>
              <span className="text-xs font-mono font-bold text-[#997A2E]">
                Stock Checked in {selectedCity}
              </span>
            </div>

            {searchResults.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-center mx-auto text-[#6B7280]">
                  <SearchIcon size={24} />
                </div>
                <h3 className="font-heading font-extrabold tracking-tight text-xl text-[#0F0F10]">
                  No formulations found
                </h3>
                <p className="text-xs text-[#6B7280] max-w-sm mx-auto">
                  We couldn't find matches for "{searchQuery}". Try searching by category like "Body Oil", "Shea Butter", or "Perfume".
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-2.5 rounded-full bg-[#0F0F10] text-white font-bold text-xs active:scale-95 transition-all cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {searchResults.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
