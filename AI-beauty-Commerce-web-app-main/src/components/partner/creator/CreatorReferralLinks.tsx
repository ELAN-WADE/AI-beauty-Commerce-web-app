import React, { useState } from 'react';
import {
  Link2,
  Copy,
  Check,
  Plus
} from 'lucide-react';
import { StatChip } from '../shared/StatChip';

export const CreatorReferralLinks: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const links = [
    {
      id: 'link-1',
      name: 'General Storefront Link',
      url: 'https://delsla.com/@amara_glows',
      promoCode: 'AMARA10',
      clicks: '928',
      orders: '74',
      conversion: '7.9%',
      earned: '₦56,208'
    },
    {
      id: 'link-2',
      name: 'Radiant Glow Oil Deep Link',
      url: 'https://delsla.com/p/radiant-glow-oil?ref=amara',
      promoCode: 'AMARA10',
      clicks: '342',
      orders: '41',
      conversion: '11.9%',
      earned: '₦32,800'
    },
    {
      id: 'link-3',
      name: 'Glow Season 2026 Campaign Link',
      url: 'https://delsla.com/campaign/glow-season?c=amara',
      promoCode: 'AMARA15',
      clicks: '154',
      orders: '19',
      conversion: '12.3%',
      earned: '₦18,200'
    }
  ];

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
            Attribution &amp; Tracking
          </span>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
            Referral Links &amp; Promo Codes
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Create deep links for specific routines, products, or campaigns and monitor real-time conversion.
          </p>
        </div>

        <button
          onClick={() => alert('Create new deep link')}
          className="px-5 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold shadow-xs active:scale-[0.97] transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus size={14} className="text-[#D4AF37]" />
          <span>Create New Deep Link</span>
        </button>
      </div>

      {/* 4 Metric Cards Matching Reference Screenshot 4 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatChip
          label="Total Link Clicks"
          value="1,424"
          change="+24%"
          trend="up"
          subtext="Across all platforms"
        />
        <StatChip
          label="Attributed Orders"
          value="134"
          change="+18%"
          trend="up"
          subtext="Verified orders"
        />
        <StatChip
          label="Average Conversion"
          value="9.4%"
          subtext="Industry avg: 2.5%"
          badge="HIGH"
        />
        <StatChip
          label="Total Commission"
          value="₦107,208"
          subtext="12% cash on orders"
          badge="CASH EARNED"
        />
      </div>

      {/* Active Attribution Links Table */}
      <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#E5E7EB] shadow-2xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E5E7EB]">
          <h2 className="font-heading font-extrabold text-lg sm:text-xl text-[#0F0F10] tracking-tight">
            Active Attribution Links
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[10px] font-mono font-bold uppercase text-[#9CA3AF] tracking-wider">
                <th className="py-3.5 px-6">Link Name &amp; URL</th>
                <th className="py-3.5 px-6">Promo Code</th>
                <th className="py-3.5 px-6">Clicks</th>
                <th className="py-3.5 px-6">Orders</th>
                <th className="py-3.5 px-6">Conv. Rate</th>
                <th className="py-3.5 px-6">Earned</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {links.map((link) => (
                <tr key={link.id} className="hover:bg-[#FAF9F6]/80 transition-colors">
                  <td className="py-4 px-6">
                    <span className="font-bold text-[#0F0F10] block">{link.name}</span>
                    <span className="text-[11px] text-[#6B7280] font-mono select-all">
                      {link.url}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono font-bold text-[#0F0F10]">
                    {link.promoCode}
                  </td>
                  <td className="py-4 px-6 font-mono text-[#0F0F10]">
                    {link.clicks}
                  </td>
                  <td className="py-4 px-6 font-mono text-[#0F0F10]">
                    {link.orders}
                  </td>
                  <td className="py-4 px-6 font-mono font-bold text-[#0F0F10]">
                    {link.conversion}
                  </td>
                  <td className="py-4 px-6 font-mono font-bold text-[#0F0F10]">
                    {link.earned}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleCopy(link.id, link.url)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] transition-colors cursor-pointer"
                    >
                      {copiedId === link.id ? (
                        <>
                          <Check size={12} className="text-[#0F0F10]" />
                          <span className="text-[#0F0F10] font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} className="text-[#6B7280]" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
