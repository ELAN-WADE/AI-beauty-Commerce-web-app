import React, { useState } from 'react';
import {
  Link2,
  Copy,
  ExternalLink,
  Plus,
  TrendingUp,
  ShoppingBag,
  Eye,
  Check
} from 'lucide-react';
import { StatChip } from '../shared/StatChip';
import { useApp } from '../../../context/AppContext';

export const CreatorReferralLinks: React.FC = () => {
  const { products } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const links = [
    {
      id: 'l-1',
      title: 'General Storefront Link',
      url: 'https://delsla.com/@amara_glows',
      promoCode: 'AMARA10',
      clicks: 928,
      orders: 74,
      conversion: '7.9%',
      commissionEarned: '₦56,208'
    },
    {
      id: 'l-2',
      title: 'Radiant Glow Oil Deep Link',
      url: 'https://delsla.com/p/radiant-glow-oil?ref=amara',
      promoCode: 'AMARA10',
      clicks: 342,
      orders: 41,
      conversion: '11.9%',
      commissionEarned: '₦32,800'
    },
    {
      id: 'l-3',
      title: 'Glow Season 2026 Campaign Link',
      url: 'https://delsla.com/campaign/glow-season?c=amara',
      promoCode: 'AMARA15',
      clicks: 154,
      orders: 19,
      conversion: '12.3%',
      commissionEarned: '₦18,200'
    }
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
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
          onClick={() => alert('Custom deep link generator opened')}
          className="px-5 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold shadow-xs active:scale-[0.97] transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={14} className="text-[#D4AF37]" />
          <span>Create New Deep Link</span>
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatChip label="Total Link Clicks" value="1,424" change="+24%" trend="up" subtext="Across all platforms" />
        <StatChip label="Attributed Orders" value="134" change="+18%" trend="up" subtext="Verified orders" />
        <StatChip label="Average Conversion" value="9.4%" subtext="Industry avg: 2.5%" badge="High" badgeVariant="success" />
        <StatChip label="Total Commission" value="₦107,208" subtext="12% cash on orders" badge="Cash Earned" badgeVariant="gold" />
      </div>

      {/* Tracked Links Table */}
      <section className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
        <h2 className="font-heading font-bold text-lg text-[#0F0F10]">
          Active Attribution Links
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#9CA3AF] font-mono uppercase text-[10px]">
                <th className="pb-3 font-semibold">Link Name &amp; URL</th>
                <th className="pb-3 font-semibold">Promo Code</th>
                <th className="pb-3 font-semibold text-right">Clicks</th>
                <th className="pb-3 font-semibold text-right">Orders</th>
                <th className="pb-3 font-semibold text-right">Conv. Rate</th>
                <th className="pb-3 font-semibold text-right">Earned</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]/70">
              {links.map((link) => (
                <tr key={link.id} className="hover:bg-[#FAF9F6]/80 transition-colors">
                  <td className="py-4 pr-3">
                    <span className="font-bold text-[#0F0F10] block">{link.title}</span>
                    <span className="text-[11px] font-mono text-[#6B7280] block truncate max-w-xs">
                      {link.url}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="font-mono font-bold text-[#0F0F10] bg-[#FAF9F6] border border-[#E5E7EB] px-2 py-0.5 rounded-md">
                      {link.promoCode}
                    </span>
                  </td>
                  <td className="py-4 text-right font-mono text-[#6B7280]">{link.clicks}</td>
                  <td className="py-4 text-right font-bold text-[#0F0F10]">{link.orders}</td>
                  <td className="py-4 text-right font-bold text-emerald-700">{link.conversion}</td>
                  <td className="py-4 text-right font-extrabold text-[#0F0F10]">
                    {link.commissionEarned}
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => handleCopy(link.id, link.url)}
                      className="px-3 py-1 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copiedId === link.id ? (
                        <>
                          <Check size={11} className="text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} className="text-[#6B7280]" />
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
      </section>
    </div>
  );
};
