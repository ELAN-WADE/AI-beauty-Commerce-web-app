import React from 'react';
import { ArrowRight, ShieldCheck } from '@phosphor-icons/react';
import { FaceScanIcon } from '../common/FaceScanIcon';
import { ProductImage } from '../common/ProductImage';

interface BiometricSkinAtelierProps {
  onStartScan: () => void;
}

export const BiometricSkinAtelier: React.FC<BiometricSkinAtelierProps> = ({
  onStartScan
}) => {
  return (
    <section
      aria-label="AI Biometric Skin Diagnosis"
      className="py-12 sm:py-16 bg-white border-b border-[#E5E7EB]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl overflow-hidden frosted-glass-noir text-white p-7 sm:p-10 lg:p-12 border border-white/10 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Natural Value & Privacy-First Consent */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full frosted-glass-scrim text-[10px] font-mono uppercase tracking-[0.22em] text-[#D4AF37] font-semibold border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                <span>Biometric Dermatology • PIX™ AI</span>
              </div>

              <div className="space-y-0.5">
                <h2 className="font-heading font-extrabold text-section-fluid text-white tracking-tight leading-tight">
                  Precision Natural Skin Analysis.<br />
                  <span className="font-serif italic font-normal text-amber-100/90">
                    Formulated for your cellular density.
                  </span>
                </h2>
              </div>

              <p className="text-xs text-gray-300 leading-relaxed max-w-lg font-normal">
                Engineered specifically for Fitzpatrick IV–VI skin phototypes. Our proprietary computer vision evaluates moisture retention, barrier lipid balance, and environmental photoprotection requirements in under 30 seconds.
              </p>

              {/* Privacy Safeguard (Restrained single line) */}
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <ShieldCheck size={15} weight="fill" className="text-[#D4AF37] shrink-0" aria-hidden="true" />
                <span className="font-normal">
                  100% On-Device Privacy • No camera photos are stored or transmitted.
                </span>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={onStartScan}
                  className="px-6 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#C29B2D] text-[#0F0F10] text-xs font-heading font-semibold tracking-wide micro-press transition-all cursor-pointer shadow-2xs flex items-center gap-2"
                >
                  <FaceScanIcon size={14} className="text-[#0F0F10]" />
                  <span>Begin Complimentary Skin Scan</span>
                  <ArrowRight size={13} weight="bold" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Right Column: Clean Telemetry Art Stage */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-xs sm:max-w-sm aspect-[4/3] rounded-xl overflow-hidden border border-white/15 bg-black/60 shadow-lg">
                <ProductImage
                  src="/beauty_face_3d.png"
                  alt="Biometric facial skin telemetry"
                  sizes="(max-width: 768px) 100vw, 340px"
                  className="w-full h-full object-cover opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[9.5px] font-mono text-gray-300 frosted-glass-scrim px-3 py-1.5 rounded-lg border border-white/10 shadow-xs">
                  <span className="text-[#D4AF37]">Fitzpatrick IV–VI Protocol</span>
                  <span className="text-gray-400">On-Device Vision</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
