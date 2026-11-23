import React from 'react';
import { toast } from 'sonner';
import { MapPin, X, Check, Truck, ShieldCheck, Clock } from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import { supportedCities } from '../../data/distributors';
import { DeslaMobileDrawer } from '../motion/DeslaMobileDrawer';

export const LocationSelector: React.FC = () => {
  const {
    selectedCity,
    setSelectedCity,
    isLocationModalOpen,
    setIsLocationModalOpen,
  } = useApp();

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    setIsLocationModalOpen(false);
    toast.success(`Delivery hub set to ${city}`);
  };

  return (
    <DeslaMobileDrawer
      open={isLocationModalOpen}
      onClose={() => setIsLocationModalOpen(false)}
      ariaLabel="Select your delivery city"
      desktopPanelClassName="w-full max-w-lg rounded-3xl bg-[#141316] border border-[#D4AF37]/30 shadow-2xl p-6 relative overflow-hidden"
      mobileContentClassName="bg-[#141316] rounded-t-[26px] border-t border-[#D4AF37]/35 shadow-2xl max-h-[88dvh] flex flex-col overflow-hidden"
    >
      <div className="relative px-5 pb-5 sm:p-0 overflow-hidden flex flex-col min-h-0">
        {/* Subtle Gold Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#D4AF37]/15 shrink-0">
          <div className="flex items-center gap-2.5">
            <MapPin size={20} weight="fill" className="text-[#D4AF37] shrink-0" aria-hidden="true" />
            <div>
              <h3 className="font-heading font-semibold tracking-tight text-base sm:text-lg text-[#FBF9F5]">
                Select Your Delivery City
              </h3>
              <p className="text-xs text-[#A19B96]">
                Connect with verified local partners to save on interstate shipping
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(false)}
            className="p-2 rounded-full text-[#A19B96] hover:text-[#FBF9F5] hover:bg-white/5 active-press transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>

        {/* City Grid */}
        <div className="py-4 space-y-2.5 max-h-[56dvh] overflow-y-auto overscroll-contain-y pr-1">
          {supportedCities.map((item) => {
            const isSelected = selectedCity.toLowerCase() === item.city.toLowerCase();
            return (
              <button
                type="button"
                key={item.city}
                onClick={() => handleSelectCity(item.city)}
                className={`w-full text-left p-3.5 rounded-xl border transition-[border-color,background-color] duration-150 cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#1F1D22] border-[#D4AF37] ring-1 ring-[#D4AF37]/40'
                    : 'bg-[#18171B] border-white/5 hover:border-[#D4AF37]/30 hover:bg-[#1E1C20]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-[#D4AF37] bg-[#D4AF37]'
                        : 'border-white/30'
                    }`}
                  >
                    {isSelected && <Check size={10} weight="bold" className="text-black" aria-hidden="true" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-semibold text-sm text-[#FBF9F5]">
                        {item.city}
                      </span>
                      <span className="text-[11px] text-[#A19B96]">
                        ({item.state})
                      </span>
                      {item.city === 'Lagos' && (
                        <span className="text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#F6E7C1]">
                          Central HQ
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 text-[11px] text-[#A19B96] mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <ShieldCheck size={13} weight="fill" aria-hidden="true" />
                        {item.distributorCount} Verified {item.distributorCount === 1 ? 'Partner' : 'Partners'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} weight="fill" aria-hidden="true" />
                        {item.estimatedDeliveryHours}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span className="text-xs font-mono font-semibold text-[#D4AF37] block">
                    ₦{(item.localFee || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#A19B96]">
                    Local Delivery
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Benefits Callout */}
        <div className="p-3 rounded-xl bg-[#09090B] border border-[#D4AF37]/20 flex items-center gap-3 text-xs text-[#A19B96] shrink-0">
          <Truck size={18} weight="fill" className="text-[#D4AF37] shrink-0" aria-hidden="true" />
          <span>
            Orders placed within your city are dispatched locally for fast arrival, saving up to ₦4,500 compared to Lagos-to-state courier fees.
          </span>
        </div>
      </div>
    </DeslaMobileDrawer>
  );
};
