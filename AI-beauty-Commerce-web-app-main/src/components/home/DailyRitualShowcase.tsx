import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowRight, Check } from 'lucide-react';
import { ProductImage } from '../common/ProductImage';

interface DailyRitualShowcaseProps {
  onAddCompleteRoutine: () => boolean;
  onExploreSkincare: () => void;
}

export const DailyRitualShowcase: React.FC<DailyRitualShowcaseProps> = ({
  onAddCompleteRoutine,
  onExploreSkincare
}) => {
  const { routineSteps, products } = useApp();
  const [activeStep, setActiveStep] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  const steps = routineSteps.filter(step => step.isActive !== false).flatMap((step, index) => { const product = products.find(product => product.id === (step.associatedProductId || step.productId)); return product ? [{ number: step.number || String(index + 1).padStart(2, '0'), title: step.title, productName: product.name, price: product.price, image: step.image || product.image, discipline: step.tagline, description: step.description }] : []; });

  const handleAddBundle = () => {
    if (!onAddCompleteRoutine()) return;
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  if (!steps.length) return null;
  const selectedStep = steps[Math.min(activeStep, steps.length - 1)];
  return (
    <section
      aria-label="The Daily Ritual"
      className="py-12 sm:py-16 bg-[#FAF9F6] border-b border-[#E5E7EB]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Clean Lifestyle Frame */}
          <div className="lg:col-span-6">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-white border border-[#E5E7EB] shadow-xs">
              <ProductImage
                key={selectedStep.image}
                src={selectedStep.image}
                alt={selectedStep.title}
                sizes="(max-width: 768px) 100vw, 550px"
                className="w-full h-full object-cover transition-opacity duration-300 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Frosted Bottom Tag */}
              <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between text-white text-[10.5px]">
                <span className="font-serif italic text-xs text-[#D4AF37]">
                  {selectedStep.discipline}
                </span>
                <span className="frosted-glass-scrim px-2.5 py-0.5 rounded-full font-mono text-[9.5px] text-gray-200">
                  Step {selectedStep.number} of 03
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: 3 Clean Chapter Steps & Quiet Bundle Action */}
          <div className="lg:col-span-6 space-y-5">
            <div className="space-y-0.5">
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#8E8E93] font-semibold">
                The Daily Ritual
              </p>
              <h2 className="font-heading font-extrabold text-section-fluid text-[#0F0F10] tracking-tight">
                Your Everyday Regimen.
              </h2>
              <p className="text-xs text-[#6B7280] max-w-md font-normal">
                Three synergistic formulations designed to compound together for lasting barrier resilience.
              </p>
            </div>

            {/* 3 Step Selectors with Restrained Frosted Finish */}
            <div className="space-y-2.5">
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
                    className={`p-4 rounded-xl transition-all duration-150 cursor-pointer micro-press ${
                      isActive
                        ? 'frosted-glass-surface border-[#0F0F10] shadow-xs'
                        : 'bg-white/60 backdrop-blur-xs border border-[#E5E7EB] hover:border-[#0F0F10]/30 hover:bg-white'
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
                    <h3 className="font-heading font-bold text-xs sm:text-[13px] text-[#0F0F10] mt-0.5">
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
                className="px-5 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-heading font-semibold micro-press shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {justAdded ? (
                  <>
                    <Check size={13} className="stroke-[2.5] text-[#D4AF37]" />
                    <span>Added Complete Routine</span>
                  </>
                ) : (
                  <>
                    <span>Add Complete Routine • ₦54,000</span>
                    <ArrowRight size={12} className="text-[#D4AF37]" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onExploreSkincare}
                className="px-4 py-2.5 rounded-full frosted-glass-pill hover:bg-white text-[#0F0F10] text-xs font-heading font-semibold transition-colors micro-press flex items-center justify-center cursor-pointer"
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
