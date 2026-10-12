import React from 'react';
import { MapPin, X, Check, Truck, ShieldCheck, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supportedCities } from '../../data/distributors';

export const LocationSelector: React.FC = () => {
  const {
    selectedCity,
    setSelectedCity,
    isLocationModalOpen,
    setIsLocationModalOpen,
    getDistributorsForCity
  } = useApp();

  if (!isLocationModalOpen) return null;

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    setIsLocationModalOpen(false);
  };

  const activeDistributors = getDistributorsForCity(selectedCity);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-card bg-[#141316] border border-[#D4AF37]/30 shadow-2xl p-6 relative overflow-hidden">
        {/* Subtle Gold Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#D4AF37]/15">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37]">
              <MapPin size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="font-heading font-extrabold tracking-tight text-lg text-[#FBF9F5]">
                Select Your Delivery City
              </h3>
              <p className="text-xs text-[#A19B96]">
                Connect with verified local partners to save on interstate shipping
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(false)}
            className="p-2 rounded-full text-[#A19B96] hover:text-[#FBF9F5] hover:bg-white/5 active-press transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* City Grid */}
        <div className="py-5 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {supportedCities.map((item) => {
            const isSelected = selectedCity.toLowerCase() === item.city.toLowerCase();
            return (
              <div
                key={item.city}
                onClick={() => handleSelectCity(item.city)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#1F1D22] border-[#D4AF37] ring-1 ring-[#D4AF37]/40'
                    : 'bg-[#18171B] border-white/5 hover:border-[#D4AF37]/30 hover:bg-[#1E1C20]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-[#D4AF37] bg-[#D4AF37]'
                        : 'border-white/30'
                    }`}
                  >
                    {isSelected && <Check size={10} className="text-black stroke-[3]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-sm text-[#FBF9F5]">
                        {item.city}
                      </span>
                      <span className="text-[11px] text-[#A19B96]">
                        ({item.state})
                      </span>
                      {item.city === 'Lagos' && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-xs bg-[#D4AF37]/20 text-[#F6E7C1]">
                          Central HQ
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#A19B96] mt-0.5">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <ShieldCheck size={12} />
                        {item.distributorCount} Verified {item.distributorCount === 1 ? 'Partner' : 'Partners'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {item.estimatedDeliveryHours}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-semibold text-[#D4AF37] block">
                    ₦{(item.localFee || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#A19B96]">
                    Local Delivery
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefits Callout */}
        <div className="p-3 rounded-xl bg-[#09090B] border border-[#D4AF37]/20 flex items-center gap-3 text-xs text-[#A19B96]">
          <Truck size={18} className="text-[#D4AF37] shrink-0" />
          <span>
            Orders placed within your city are dispatched locally for fast arrival, saving up to ₦4,500 compared to Lagos-to-state courier fees.
          </span>
        </div>
      </div>
    </div>
  );
};
