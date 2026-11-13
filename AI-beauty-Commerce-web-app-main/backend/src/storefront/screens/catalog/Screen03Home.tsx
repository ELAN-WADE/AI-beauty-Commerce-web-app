import React from 'react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Product, ScreenId } from '../../types';
import { EditorialHero } from '../../components/home/EditorialHero';
import { CategoryMosaic } from '../../components/home/CategoryMosaic';
import { FormulationShowcase } from '../../components/home/FormulationShowcase';
import { DailyRitualShowcase } from '../../components/home/DailyRitualShowcase';
import { BiometricSkinAtelier } from '../../components/home/BiometricSkinAtelier';
import { AuthenticReviewsSection } from '../../components/home/AuthenticReviewsSection';
import { CreatorCommunitySection } from '../../components/home/CreatorCommunitySection';
import { EditorialBrandStory } from '../../components/home/EditorialBrandStory';
import { ClinicalFaqNewsletterSection } from '../../components/home/ClinicalFaqNewsletterSection';

export const Screen03Home: React.FC = () => {
  const {
    products,
    openQuickModal,
    routineSteps,
    announcementTicker,
    navigateTo,
    setSelectedCategory,
    selectedCity,
    loginAsDemoRole,
    addToCartBatch
  } = useApp();

  const handleOpenVariantModal = openQuickModal;

  const handleAddRoutineBundle = () => {
    const choices = routineSteps.filter(step => step.isActive !== false).flatMap(step => { const product = products.find(product => product.id === (step.associatedProductId || step.productId)); return product ? [{ product, size: product.sizes[0] || 'Standard', quantity: 1 }] : []; });
    return addToCartBatch(choices);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F0F10] pb-28 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      <main className="space-y-0">
        {announcementTicker.isActive && announcementTicker.text && <div className="hidden lg:block bg-[#0F0F10] px-4 py-3 text-center text-sm text-white">{announcementTicker.text} {announcementTicker.linkText && <button className="ml-3 underline" onClick={() => navigateTo((announcementTicker.linkRoute || 'catalogue') as ScreenId)}>{announcementTicker.linkText}</button>}</div>}
        {/* 1. Asymmetric Split Editorial Hero */}
        <EditorialHero
          onShopClick={() => {
            setSelectedCategory('All');
            navigateTo('catalogue');
          }}
          onScanClick={() => navigateTo('ai-scan')}
        />

        {/* 2. Curated Ecosystem Gateways (Connect with Desla: Sanctuary, Creator, Distributor) */}
        <CreatorCommunitySection
          selectedCity={selectedCity}
          onClientPortalClick={() => navigateTo('signup')}
          onCreatorPortalClick={() => navigateTo('creators')}
          onDistributorPortalClick={() => navigateTo('distributor-portal')}
        />

        {/* 3. Maison Editorial Bento Category Mosaic */}
        <CategoryMosaic
          onSelectCategory={(category) => {
            setSelectedCategory(category);
            navigateTo('catalogue');
          }}
          onViewAll={() => navigateTo('categories')}
        />

        {/* 4. Formulation Essentials (2-Column Mobile Grid) */}
        <FormulationShowcase
          products={products}
          onViewAll={() => {
            setSelectedCategory('All');
            navigateTo('catalogue');
          }}
          onOpenModal={handleOpenVariantModal}
        />

        {/* 5. 3-Chapter Interactive Daily Ritual */}
        <DailyRitualShowcase
          onAddCompleteRoutine={handleAddRoutineBundle}
          onExploreSkincare={() => {
            setSelectedCategory('skincare');
            navigateTo('catalogue');
          }}
        />

        {/* 6. Verified Customer Natural Experiences (Authentic Reviews) */}
        <AuthenticReviewsSection />

        {/* 8. Editorial Philosophy & Natural Standards Narrative */}
        <EditorialBrandStory
          onLearnMoreClick={() => navigateTo('categories')}
        />

        {/* 9. Natural FAQs & Formulation Journal */}
        <ClinicalFaqNewsletterSection />
      </main>

      {/* Mobile Footprint & Hub Assurance */}
      <footer className="mt-8 px-5 py-8 bg-white border-t border-[#E5E7EB] text-[#6B7280] space-y-4 text-center">
        <BrandLogo variant="dark" size="sm" showTagline={true} className="mx-auto" />
        <nav aria-label="Partner programmes" className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
          <button type="button" onClick={() => navigateTo('creators')} className="min-h-11 underline">Creator</button>
          <button type="button" onClick={() => navigateTo('partner-programme')} className="min-h-11 underline">Influencer / Ambassador</button>
          <button type="button" onClick={() => navigateTo('distributor-portal')} className="min-h-11 underline">Distributor</button>
        </nav>
        <p className="text-xs text-[#4B5563] leading-relaxed max-w-xs mx-auto">
          Dermatological formulations engineered for natural skin. 100% NAFDAC certified.
        </p>
        <div className="flex items-center justify-center gap-2 text-[11px] text-[#0F0F10] font-semibold flex-wrap">
          <span className="text-[#D4AF37]">Lagos Hub</span>
          <span>•</span>
          <span className="text-[#D4AF37]">Abuja</span>
          <span>•</span>
          <span className="text-[#D4AF37]">Port Harcourt</span>
          <span>•</span>
          <span className="text-[#D4AF37]">Ibadan</span>
        </div>
        <p className="text-[10px] text-[#9CA3AF] pt-2 border-t border-[#E5E7EB]">
          © {new Date().getFullYear()} Desla!™ Beauty &amp; Dermatologie.
        </p>
      </footer>

      {/* Variant Selection Modal */}
    </div>
  );
};
