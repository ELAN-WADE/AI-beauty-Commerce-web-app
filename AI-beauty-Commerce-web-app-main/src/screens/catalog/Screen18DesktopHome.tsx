import React from 'react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { Product } from '../../types';
import { EditorialHero } from '../../components/home/EditorialHero';
import { CategoryMosaic } from '../../components/home/CategoryMosaic';
import { FormulationShowcase } from '../../components/home/FormulationShowcase';
import { DailyRitualShowcase } from '../../components/home/DailyRitualShowcase';
import { BiometricSkinAtelier } from '../../components/home/BiometricSkinAtelier';
import { AuthenticReviewsSection } from '../../components/home/AuthenticReviewsSection';
import { CreatorCommunitySection } from '../../components/home/CreatorCommunitySection';
import { EditorialBrandStory } from '../../components/home/EditorialBrandStory';
import { ClinicalFaqNewsletterSection } from '../../components/home/ClinicalFaqNewsletterSection';

export const Screen18DesktopHome: React.FC = () => {
  const {
    products,
    openQuickModal,
    routineSteps,
    navigateTo,
    setSelectedCategory,
    selectedCity,
    loginAsDemoRole,
    addToCartBatch
  } = useApp();

  // Variant & Quick View Modal State
  const handleOpenVariantModal = openQuickModal;

  const handleAddRoutineBundle = () => {
    const choices = routineSteps.filter(step => step.isActive !== false).flatMap(step => { const product = products.find(product => product.id === (step.associatedProductId || step.productId)); return product ? [{ product, size: product.sizes[0] || 'Standard', quantity: 1 }] : []; });
    return addToCartBatch(choices);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F0F10] font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      <main className="space-y-0">
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

        {/* 3. Maison Editorial Bento Category Mosaic (Focus Cards & Rotating Packshots) */}
        <CategoryMosaic
          onSelectCategory={(category) => {
            setSelectedCategory(category);
            navigateTo('catalogue');
          }}
          onViewAll={() => navigateTo('categories')}
        />

        {/* 4. Formulation Essentials Showcase (5 Balanced Columns) */}
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

        {/* 9. Natural FAQs (Accessible Accordion) & Formulation Journal */}
        <ClinicalFaqNewsletterSection />
      </main>

      {/* Luxury White & Charcoal Footer */}
      <footer className="bg-white border-t border-[#E5E7EB] pt-14 pb-10 text-[#6B7280] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Column 1: Brand Philosophy & Fulfillment Hubs */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo variant="dark" size="md" showTagline={true} />
            <p className="text-xs text-[#4B5563] max-w-sm leading-relaxed">
              Safe-conscious dermatological formulations and luxury lifestyle preparations engineered specifically for natural skin. 100% NAFDAC certified.
            </p>
            <div className="flex items-center gap-2.5 text-xs text-[#0F0F10] pt-1 flex-wrap">
              <span className="font-semibold text-[#D4AF37]">Lagos Dispatch Hub</span>
              <span>•</span>
              <span className="font-semibold text-[#D4AF37]">Abuja</span>
              <span>•</span>
              <span className="font-semibold text-[#D4AF37]">Port Harcourt</span>
              <span>•</span>
              <span className="font-semibold text-[#D4AF37]">Ibadan</span>
            </div>
          </div>

          {/* Column 2: Formulation Disciplines */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F0F10]">
              Formulations
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('skincare');
                    navigateTo('catalogue');
                  }}
                  className="hover:text-[#0F0F10] transition-colors cursor-pointer"
                >
                  Barrier Skincare
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('body-care');
                    navigateTo('catalogue');
                  }}
                  className="hover:text-[#0F0F10] transition-colors cursor-pointer"
                >
                  Nourishing Body Oils
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('fragrance');
                    navigateTo('catalogue');
                  }}
                  className="hover:text-[#0F0F10] transition-colors cursor-pointer"
                >
                  Haute Artisanal Extrait
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('makeup');
                    navigateTo('catalogue');
                  }}
                  className="hover:text-[#0F0F10] transition-colors cursor-pointer"
                >
                  Peptide Lip Elixirs
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Portals & Diagnostics */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F0F10]">
              Portals &amp; Orders
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('orders')}
                  className="hover:text-[#0F0F10] transition-colors cursor-pointer"
                >
                  Track Active Order
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('ai-scan')}
                  className="hover:text-[#0F0F10] transition-colors cursor-pointer"
                >
                  PIX™ AI Skin Scan
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('creators')}
                  className="hover:text-[#0F0F10] transition-colors cursor-pointer"
                >
                  Creator Collective
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('distributor-portal')}
                  className="hover:text-[#0F0F10] transition-colors cursor-pointer"
                >
                  Distributor Network
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Client Services & Concierge */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F0F10]">
              Client Services
            </h4>
            <p className="text-xs text-[#4B5563] leading-relaxed">
              Dermatological formulation consultations and urgent regional dispatch inquiries:
            </p>
            <div className="pt-1">
              <a
                href="https://wa.me/2348148120642"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-[#0F0F10] font-semibold text-xs hover:border-[#D4AF37] transition-colors"
              >
                <span>WhatsApp VIP Concierge</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#9CA3AF]">
          <p>© {new Date().getFullYear()} Desla!™ Beauty &amp; Dermatologie. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Natural Dermatology</span>
            <span>•</span>
            <span>100% NAFDAC Compliant</span>
            <span>•</span>
            <span>Zero Harsh Lighteners</span>
            <span>•</span>
            <span>Secure Regional Dispatch</span>
          </div>
        </div>
      </footer>

      {/* Product Variant / Quick View Modal */}
    </div>
  );
};
