import React from 'react';
import { MapPin, Clock, Phone, CheckCircle2, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '../shared/StatusBadge';

export const DistributorTerritory: React.FC = () => {
  const zones = [
    { name: 'Lekki Phase 1 & Oniru', deliverySla: 'Same-day (< 3 hours)', status: 'active' as const, fee: '₦1,800' },
    { name: 'Victoria Island & Ikoyi', deliverySla: 'Same-day (< 3 hours)', status: 'active' as const, fee: '₦2,000' },
    { name: 'Ikeja GRA & Maryland', deliverySla: 'Same-day (< 4 hours)', status: 'active' as const, fee: '₦2,500' },
    { name: 'Ajah & Sangotedo', deliverySla: 'Next-day Dispatch', status: 'pending' as const, fee: '₦3,000' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="pb-2 border-b border-[#E5E7EB]">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
          Geographic Coverage
        </span>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
          City Hub Territory &amp; Zones
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
          Configured service zones, same-day delivery SLAs, and customer pickup point details.
        </p>
      </div>

      {/* Hub Location Card */}
      <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FBF5E8] text-[#997A2E] flex items-center justify-center shrink-0">
              <MapPin size={24} />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-[#0F0F10]">
                Lagos Central Laboratory City Hub
              </h2>
              <p className="text-xs text-[#6B7280]">
                Plot 14 Admiralty Way, Lekki Phase 1, Lagos State, Nigeria
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-[#FAF9F6] border border-[#E5E7EB] px-3 py-1 rounded-full text-[#0F0F10] self-start sm:self-auto">
            Hub Code: HUB-LOS-01
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E5E7EB] text-xs">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-[#997A2E]" />
            <span>Operating Hours: <strong>Mon - Sat (8:00 AM - 6:00 PM)</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={15} className="text-[#997A2E]" />
            <span>Direct Dispatch Phone: <strong>+234 814 812 0642</strong></span>
          </div>
        </div>
      </div>

      {/* Coverage Zones Table */}
      <section className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
        <h3 className="font-heading font-bold text-base text-[#0F0F10]">
          Authorized Service Zones
        </h3>

        <div className="divide-y divide-[#E5E7EB]">
          {zones.map((z, i) => (
            <div key={i} className="py-3.5 flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-[#0F0F10] block">{z.name}</span>
                <span className="text-[11px] text-[#6B7280]">{z.deliverySla}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[#6B7280]">{z.fee}</span>
                <StatusBadge status={z.status} label={z.status === 'active' ? 'Active Zone' : 'Expanding Soon'} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
