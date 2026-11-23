import React from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { Product } from '../../types';
import { ProductCard } from '../common/ProductCard';

interface FormulationShowcaseProps {
  products: Product[];
  onViewAll: () => void;
  onOpenModal: (product: Product) => void;
}

export const FormulationShowcase: React.FC<FormulationShowcaseProps> = ({
  products,
  onViewAll,
  onOpenModal
}) => {
  const displayedProducts = products.slice(0, 5);

  return (
    <section
      aria-label="Bestselling Formulations"
      className="py-8 sm:py-10 bg-white border-b border-[#E5E7EB]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Clean Frosted Category Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 sm:mb-6 gap-3">
          <div>
            <h2 className="font-heading font-semibold text-xl sm:text-2xl text-[#0F0F10] tracking-tight">
              Formulation Essentials
            </h2>
          </div>


        </div>

        {/* Mobile (< 640px): Edge-peeking horizontal snap rail (zero orphan 5th card) */}
        {/* Desktop (>= 640px): Original 3-col / 5-col grid preserved untouched */}
        {displayedProducts.length > 0 ? (
          <>
            <div
              className="sm:hidden flex gap-3.5 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-1"
              style={{ touchAction: 'pan-x pan-y' }}
            >
              {displayedProducts.map((product) => (
                <div key={product.id} className="snap-start shrink-0 w-[45vw] min-w-[166px] max-w-[196px]">
                  <ProductCard
                    product={product}
                    variant="grid"
                    onOpenModal={onOpenModal}
                  />
                </div>
              ))}
            </div>

            <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-5">
              {displayedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="grid"
                  onOpenModal={onOpenModal}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-xs text-[#6B7280]">
            No formulations currently published under this discipline.
          </div>
        )}

        {/* Minimal Bottom Action */}
        <div className="mt-7 text-center">
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1.5 text-xs font-heading font-medium text-[#0F0F10] hover:text-[#997A2E] transition-colors cursor-pointer group py-1.5 hover-underline-minimal"
          >
            <span>Explore Entire Formulation Catalogue</span>
            <ArrowRight size={13} weight="bold" className="text-[#0F0F10] group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
};
