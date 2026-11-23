import { animateToBag } from '../../lib/cart-motion';
import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { toast } from 'sonner';
import { useApp } from '../../context/AppContext';
import { ArrowRight, Check } from '@phosphor-icons/react';
import { ProductImage } from '../common/ProductImage';
import { DESLA_EASE_OUT } from '../motion/DeslaMotion';

interface DailyRitualShowcaseProps {
  onAddCompleteRoutine: () => boolean;
  onExploreSkincare: () => void;
}

export const DailyRitualShowcase: React.FC<DailyRitualShowcaseProps> = ({
  onAddCompleteRoutine,
  onExploreSkincare,
}) => {
  const { routineSteps, products, navigateTo } = useApp();
  const prefersReduced = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  const steps = routineSteps
    .filter((step) => step.isActive !== false)
    .flatMap((step, index) => {
      const product = products.find((product) => product.id === (step.associatedProductId || step.productId));
      return product
        ? [
            {
              number: step.number || String(index + 1).padStart(2, '0'),
              title: step.title,
              productName: product.name,
              price: product.variants?.find((variant) => variant.sizeLabel === product.sizes[0])?.priceNgn ?? product.price,
              image: step.image || product.image,
              discipline: step.tagline,
              description: step.description,
            },
          ]
        : [];
    });

  const handleAddBundle = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!onAddCompleteRoutine()) return;
    animateToBag(event.currentTarget);
    setJustAdded(true);
    toast.success('Complete routine added to bag', {
      description: `${steps.length} synergistic formulations`,
      action: {
        label: 'View Bag',
        onClick: () => navigateTo('cart'),
      },
    });
    setTimeout(() => setJustAdded(false), 2000);
  };

  if (!steps.length) return null;
  const selectedStep = steps[Math.min(activeStep, steps.length - 1)];
  const totalRoutinePrice = steps.reduce((total, step) => total + step.price, 0);

  return (
    <section
      aria-label="The Daily Ritual"
      className="py-10 sm:py-16 bg-[#FAF9F6] border-b border-[#E5E7EB]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Section Heading + Segmented Step Selector Pill Strip */}
        <div className="lg:hidden space-y-3 mb-4">
          <div className="space-y-0.5">
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#8C6D28] font-semibold">
              The Daily Ritual
            </p>
            <h2 className="font-heading font-semibold text-xl text-[#0F0F10] tracking-tight">
              Your Everyday Regimen.
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Daily ritual steps"
            className="grid grid-cols-3 gap-1 p-1 rounded-full bg-[#EFECE5] border border-[#E7E1D6]"
          >
            {steps.map((step, idx) => {
              const isActive = idx === activeStep;
              return (
                <button
                  key={step.number}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveStep(idx)}
                  className={`relative py-2 px-2 rounded-full text-[11px] font-medium transition-colors duration-150 cursor-pointer truncate ${
                    isActive ? 'text-white' : 'text-[#5C5850]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId={prefersReduced ? undefined : 'daily-ritual-mobile-pill'}
                      transition={prefersReduced ? { duration: 0 } : { duration: 0.2, ease: DESLA_EASE_OUT }}
                      className="absolute inset-0 rounded-full bg-[#111111]"
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10">
                    {step.number} · {step.title.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-12 items-center">
          {/* Left Column: Clean Lifestyle Frame with Blur-Masked Crossfade */}
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-white border border-[#E5E7EB] shadow-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedStep.image}
                  initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.985, filter: 'blur(2px)' }}
                  animate={prefersReduced ? { opacity: 1 } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.99, filter: 'blur(2px)' }}
                  transition={{ duration: 0.22, ease: DESLA_EASE_OUT }}
                  className="absolute inset-0"
                >
                  <ProductImage
                    src={selectedStep.image}
                    alt={selectedStep.title}
                    sizes="(max-width: 768px) 100vw, 550px"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Frosted Bottom Tag */}
              <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between text-white text-[10.5px] z-10">
                <span className="font-serif italic text-xs text-[#D4AF37]">
                  {selectedStep.discipline}
                </span>
                <span className="frosted-glass-scrim px-2.5 py-0.5 rounded-full font-mono text-[9.5px] text-gray-200">
                  Step {selectedStep.number} of {steps.length}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Active Card on Mobile, 3 Stacked Chapters on Desktop */}
          <div className="lg:col-span-6 space-y-4 lg:space-y-5">
            <div className="hidden lg:block space-y-0.5">
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8E8E93] font-semibold">
                The Daily Ritual
              </p>
              <h2 className="font-heading font-semibold text-section-fluid text-[#0F0F10] tracking-tight">
                Your Everyday Regimen.
              </h2>
              <p className="text-xs text-[#6B7280] max-w-md font-normal">
                Three synergistic formulations designed to compound together for lasting barrier resilience.
              </p>
            </div>

            {/* Mobile Active Step Card (compact & scannable) */}
            <div className="lg:hidden p-4 rounded-2xl bg-white border border-[#E7E1D6] shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#8C6D28] uppercase tracking-wider font-semibold">
                  {selectedStep.number} / {selectedStep.title}
                </span>
                <span className="font-price font-semibold text-xs text-[#0F0F10]">
                  ₦{selectedStep.price.toLocaleString('en-NG')}
                </span>
              </div>
              <h3 className="font-heading font-semibold text-sm text-[#0F0F10]">
                {selectedStep.productName}
              </h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                {selectedStep.description}
              </p>
            </div>

            {/* Desktop 3 Step Selectors preserved untouched */}
            <div className="hidden lg:block space-y-2.5">
              {steps.map((step, idx) => {
                const isActive = idx === activeStep;
                return (
                  <div
                    key={step.number}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveStep(idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveStep(idx);
                      }
                    }}
                    className={`p-4 rounded-xl transition-[transform,border-color,background-color,box-shadow] duration-150 cursor-pointer micro-press ${
                      isActive
                        ? 'frosted-glass-surface border-[#0F0F10] shadow-sm'
                        : 'bg-white/60 backdrop-blur-sm border border-[#E5E7EB] hover:border-[#0F0F10]/30 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#8E8E93] uppercase tracking-wider font-semibold">
                        {step.number} / {step.title}
                      </span>
                      <span className="font-price font-semibold text-xs text-[#0F0F10]">
                        ₦{step.price.toLocaleString('en-NG')}
                      </span>
                    </div>
                    <h3 className="font-heading font-semibold text-xs sm:text-[13px] text-[#0F0F10] mt-0.5">
                      {step.productName}
                    </h3>
                    <p className="text-[11px] text-[#6B7280] mt-0.5 leading-relaxed font-normal">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Restrained Bundle Action */}
            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                onClick={handleAddBundle}
                className="px-5 py-3 sm:py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-heading font-medium micro-press shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {justAdded ? (
                  <>
                    <Check size={13} weight="bold" className="text-[#D4AF37]" aria-hidden="true" />
                    <span>Added Complete Routine</span>
                  </>
                ) : (
                  <>
                    <span>Add complete routine · ₦{totalRoutinePrice.toLocaleString('en-NG')}</span>
                    <ArrowRight size={12} weight="bold" className="text-[#D4AF37]" aria-hidden="true" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onExploreSkincare}
                className="px-4 py-2.5 rounded-full frosted-glass-pill hover:bg-white text-[#0F0F10] text-xs font-heading font-medium transition-colors micro-press flex items-center justify-center cursor-pointer"
              >
                <span>View Skincare Formulations</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
