import React from 'react';
import { CaretLeft, ArrowRight, StackSimple } from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';

export const Screen05Categories: React.FC = () => {
  const { categories: liveCategories, products, navigateTo, setSelectedCategory, goBack } = useApp();

  const categoryFallbackImages: Record<string, string> = {
    skincare: '/cat_skincare.jpg',
    'body-care': '/cat_bodycare.jpg',
    fragrance: '/cat_fragrance.jpg',
    makeup: '/cat_makeup.jpg',
    lifestyle: '/cat_lifestyle.jpg',
  };

  const baseCategories =
    liveCategories.length > 0
      ? liveCategories
      : Array.from(new Set(products.map((p) => p.category)))
          .filter(Boolean)
          .map((slug) => ({
            id: slug,
            name: slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            slug,
            description: 'Safe-conscious formulation crafted with natural intention.',
            image: categoryFallbackImages[slug.toLowerCase()] || '/cat_skincare.jpg',
            itemCount: 0,
            featured: true,
            subcategories: [] as string[],
          }));

  const categories = baseCategories.map((c) => {
    const matchingProduct = products.find(
      (p) => p.category.toLowerCase() === c.slug.toLowerCase()
    );
    const liveCount = products.filter(
      (p) => p.category.toLowerCase() === c.slug.toLowerCase()
    ).length;
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      image:
        c.image ||
        matchingProduct?.image ||
        categoryFallbackImages[c.slug.toLowerCase()] ||
        '/cat_skincare.jpg',
      itemCount: liveCount > 0 ? liveCount : c.itemCount ?? 0,
    };
  });

  const handleSelect = (slug: string) => {
    setSelectedCategory(slug);
    navigateTo('catalogue');
  };

  return (
    <div className="min-h-screen bg-white text-[#0F0F10] pb-28 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      {/* Top Header */}
      <div className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 py-3.5">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goBack}
              className="p-1.5 -ml-1 rounded-full text-[#0F0F10] hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
              aria-label="Go back"
            >
              <CaretLeft size={20} weight="bold" aria-hidden="true" />
            </button>
            <h1 className="font-heading font-semibold tracking-tight text-lg sm:text-xl text-[#0F0F10]">
              Collections &amp; Pillars
            </h1>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#997A2E]">
            <StackSimple size={14} weight="fill" aria-hidden="true" />
            <span>{categories.length} Taxonomy Pillars</span>
          </span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 space-y-6">
        {/* Featured Seasonal Collection Editorial Banner */}
        <section aria-label="Featured Collection" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center rounded-3xl overflow-hidden bg-[#FAF9F6] border border-[#E5E7EB]">
          <div className="lg:col-span-6 p-6 sm:p-8 lg:p-10 space-y-3">
            <span className="text-[11px] font-medium text-[#997A2E] uppercase tracking-[0.2em] block">
              Curated Formulations
            </span>
            <h2 className="font-heading font-semibold tracking-tight text-2xl sm:text-3xl text-[#0F0F10] leading-tight">
              Intentional care for every personal ritual.
            </h2>
            <p className="text-sm font-normal text-[#6B7280] leading-relaxed max-w-lg">
              From natural barrier body washes and whipped shea butters to extrait perfume oils and velvet lip glazes.
            </p>
          </div>
          <div className="lg:col-span-6 h-52 sm:h-64 lg:h-72 bg-[#F3EEE3]">
            <img
              src="/artwork/collection-seasonal-editorial.webp"
              alt="Desla Beauty skincare bottles and cream jars arranged on sunlit limestone plinths"
              width={1440}
              height={810}
              className="w-full h-full object-cover"
            />
          </div>
        </section>

        {categories.length === 0 ? (
          <div className="rounded-3xl bg-[#FAF9F6] border border-[#E5E7EB] p-8 text-center space-y-3">
            <p className="text-sm text-[#6B7280]">
              Collections are syncing with our catalog. Browse all formulations in the shop.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                navigateTo('catalogue');
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0F0F10] text-white px-5 py-2.5 text-xs font-semibold cursor-pointer"
            >
              <span>Browse Catalogue</span>
              <ArrowRight size={13} weight="bold" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelect(cat.slug)}
                className="group relative text-left rounded-3xl overflow-hidden border border-[#E5E7EB] bg-[#FAF9F6] shadow-xs hover:shadow-md hover:border-[#D4AF37] transition-all cursor-pointer active:scale-[0.98]"
              >
                <div className="relative h-48 sm:h-56 overflow-hidden bg-[#F6F5F2]">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10.5px] font-mono font-semibold text-[#0F0F10] shadow-sm">
                    {cat.itemCount} Formulations
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="font-heading font-semibold tracking-tight text-xl sm:text-2xl text-white drop-shadow-sm">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-white/80 line-clamp-1 mt-0.5">
                      {cat.description || 'Safe-conscious formulation crafted with natural intention.'}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white flex items-center justify-between">
                  <span className="text-xs font-medium text-[#0F0F10] group-hover:text-[#997A2E] transition-colors">
                    Explore {cat.name}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#FAF9F6] group-hover:bg-[#0F0F10] group-hover:text-white flex items-center justify-center transition-all text-[#0F0F10] shadow-xs">
                    <ArrowRight size={14} weight="bold" aria-hidden="true" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
