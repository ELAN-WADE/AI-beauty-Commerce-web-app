import React from 'react';
import { CaretLeft, ArrowRight, StackSimple } from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import { DepthCard } from '../../components/ui/DepthCard';

export const Screen05Categories: React.FC = () => {
  const { categories: liveCategories, products, navigateTo, setSelectedCategory, goBack } = useApp();

  const categoryFallbackImages: Record<string, string> = {
    skincare: '/cat_skincare.jpg',
    'body-care': '/cat_bodycare.jpg',
    fragrance: '/cat_fragrance.jpg',
    makeup: '/cat_makeup.jpg',
    lifestyle: '/cat_lifestyle.jpg',
  };

  const categories =
    liveCategories.length > 0
      ? liveCategories.map((c) => {
          const matchingProduct = products.find(
            (p) => p.category.toLowerCase() === c.slug.toLowerCase()
          );
          return {
            id: c.id,
            name: c.name,
            slug: c.slug,
            subtitle: c.description || 'Explore Formulation Discipline',
            description: c.description || '',
            image:
              c.image ||
              matchingProduct?.image ||
              categoryFallbackImages[c.slug.toLowerCase()] ||
              '/cat_skincare.jpg',
            productCount: products.filter(
              (p) => p.category.toLowerCase() === c.slug.toLowerCase()
            ).length,
            subcategories: [] as string[],
          };
        })
      : [];

  const handleSelect = (slug: string) => {
    setSelectedCategory(slug);
    navigateTo('catalogue');
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F0F10] pb-24 lg:pb-16 font-body">
      {/* Editorial Page Header */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
          <div className="flex items-center gap-3 mb-2">
            <button
              type="button"
              onClick={goBack}
              className="lg:hidden p-2 -ml-2 text-[#6B7280] hover:text-[#0F0F10] cursor-pointer"
              aria-label="Back"
            >
              <CaretLeft size={20} weight="bold" aria-hidden="true" />
            </button>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#997A2E] font-semibold">
                Desla!™ Formulations
              </p>
              <h1 className="font-heading font-semibold text-xl sm:text-3xl text-[#0F0F10] tracking-tight">
                Curated Disciplines &amp; Categories
              </h1>
            </div>
          </div>
          <p className="text-[13px] sm:text-sm text-[#6B7280] max-w-2xl leading-relaxed">
            Explore our complete range of safe-conscious natural skincare, organic sunblocks, botanical body care, and luxury apothecary rituals.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-[#6B7280]">
            <StackSimple size={15} weight="fill" className="text-[#997A2E]" aria-hidden="true" />
            <span>{categories.length} Taxonomy Pillars</span>
          </div>
        </div>
      </div>

      {/* Category Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {categories.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-8 text-center space-y-3">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {categories.map((cat) => (
              <DepthCard
                key={cat.id}
                image={cat.image}
                eyebrow={cat.productCount > 0 ? `${cat.productCount} Formulations` : 'Collection'}
                title={cat.name}
                description={cat.description || cat.subtitle}
                maxRotation={8}
                maxTranslation={12}
                borderRadius="12px"
                spotlight={false}
                disableOnMobile
                respectReducedMotion
                onClick={() => handleSelect(cat.slug)}
                className="w-full h-[300px] sm:h-[360px]"
                footer={
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37]">
                    <span>Explore {cat.name}</span>
                    <ArrowRight size={12} weight="bold" aria-hidden="true" />
                  </span>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
