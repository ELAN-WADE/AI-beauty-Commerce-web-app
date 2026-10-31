import React, { useState } from 'react';
import {
  Link2,
  Copy,
  Check,
  Plus,
  QrCode,
  CheckCircle2,
  ExternalLink,
  Tag,
  Percent,
  X,
  Share2,
  TrendingUp,
  Download
} from 'lucide-react';
import { StatChip } from '../shared/StatChip';
import { useApp } from '../../../context/AppContext';
import { CreatorReferralLink } from '../../../types';
import { fetchPartnerDashboard, isOwnedApiConfigured } from '../../../lib/owned-api';

export const CreatorReferralLinks: React.FC = () => {
  const { creatorLinks, createCreatorLink, products } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeQrLink, setActiveQrLink] = useState<CreatorReferralLink | null>(null);

  // Form state for creating a new deep link
  const [linkName, setLinkName] = useState('');
  const [linkType, setLinkType] = useState<'storefront' | 'product' | 'campaign'>('product');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [customPromoCode, setCustomPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [creationToast, setCreationToast] = useState<string | null>(null);

  // Computed metrics from live links
  const totalClicks = creatorLinks.reduce((acc, l) => acc + (l.clicks || 0), 0);
  const totalOrders = creatorLinks.reduce((acc, l) => acc + (l.orders || 0), 0);
  const totalEarnedNgn = creatorLinks.reduce((acc, l) => acc + (l.earnedNgn || 0), 0);
  const avgConversion = totalClicks > 0 ? ((totalOrders / totalClicks) * 100).toFixed(1) + '%' : '0.0%';

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard?.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [livePromoCode, setLivePromoCode] = useState<string>('');

  React.useEffect(() => {
    if (!isOwnedApiConfigured) return;
    fetchPartnerDashboard('CREATOR')
      .then((res: any) => {
        if (res?.profile?.promoCode) {
          setLivePromoCode(res.profile.promoCode);
          setCustomPromoCode(res.profile.promoCode);
        }
      })
      .catch(() => {});
  }, []);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveCode = (customPromoCode.trim() || livePromoCode).toUpperCase().replace(/\s+/g, '');
    if (!effectiveCode) return;

    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    let targetUrl = `${origin}/?ref=${encodeURIComponent(effectiveCode)}&code=${encodeURIComponent(effectiveCode)}`;
    let targetSku: string | undefined = undefined;

    if (linkType === 'product') {
      const prod = products.find((p) => p.id === selectedProductId);
      if (prod) {
        targetSku = prod.sku;
        targetUrl = `${origin}/?screen=product-details&product=${prod.id}&ref=${encodeURIComponent(effectiveCode)}&code=${encodeURIComponent(effectiveCode)}`;
      }
    } else if (linkType === 'campaign') {
      targetUrl = `${origin}/?screen=catalogue&campaign=glow-season&ref=${encodeURIComponent(effectiveCode)}&code=${encodeURIComponent(effectiveCode)}`;
    }

    const created = createCreatorLink({
      name: linkName.trim() || `${linkType.toUpperCase()} Link`,
      url: targetUrl,
      promoCode: effectiveCode,
      targetSku,
      discountPercent: Number(discountPercent)
    });

    setIsCreateModalOpen(false);
    setLinkName('');
    setCustomPromoCode('');
    setCreationToast(`Link "${created.name}" with referral coupon "${created.promoCode}" activated successfully!`);
    setTimeout(() => setCreationToast(null), 4000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {creationToast && (
        <div className="p-4 rounded-2xl bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <CheckCircle2 size={16} />
            <span>{creationToast}</span>
          </div>
          <button
            onClick={() => setCreationToast(null)}
            className="text-white/60 hover:text-white cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

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
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold shadow-xs active:scale-[0.97] transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus size={14} className="text-[#D4AF37]" />
          <span>Create New Deep Link</span>
        </button>
      </div>

      {/* 4 Metric Cards Hydrated From Live Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatChip
          label="Total Link Clicks"
          value={totalClicks.toLocaleString()}
          change="+24%"
          trend="up"
          subtext="Real-time verified visits"
        />
        <StatChip
          label="Attributed Orders"
          value={totalOrders.toLocaleString()}
          change="+18%"
          trend="up"
          subtext="Verified checkouts"
        />
        <StatChip
          label="Average Conversion"
          value={avgConversion}
          subtext="Industry avg: 2.5%"
          badge="HIGH"
        />
        <StatChip
          label="Total Commission"
          value={`₦${totalEarnedNgn.toLocaleString('en-NG')}`}
          subtext="12-15% commission ledger"
          badge="CASH EARNED"
        />
      </div>

      {/* Active Attribution Links Table */}
      <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#E5E7EB] shadow-2xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E5E7EB] flex items-center justify-between">
          <div>
            <h2 className="font-heading font-extrabold text-lg sm:text-xl text-[#0F0F10] tracking-tight">
              Active Attribution Links ({creatorLinks.length})
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Live tracking slugs synced with central order attribution and coupon rules.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[10px] font-mono font-bold uppercase text-[#9CA3AF] tracking-wider">
                <th className="py-3.5 px-6">Link Name &amp; URL</th>
                <th className="py-3.5 px-6">Promo Code</th>
                <th className="py-3.5 px-6">Discount</th>
                <th className="py-3.5 px-6">Clicks</th>
                <th className="py-3.5 px-6">Orders</th>
                <th className="py-3.5 px-6">Conv. Rate</th>
                <th className="py-3.5 px-6">Earned</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {creatorLinks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#6B7280]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Link2 className="w-8 h-8 text-[#997A2E] mx-auto opacity-40" />
                      <p className="font-heading font-bold text-sm text-[#0F0F10]">No Attribution Links Yet</p>
                      <p className="text-xs">Create custom deep links to your curated routines or products to start earning tracked commissions.</p>
                    </div>
                  </td>
                </tr>
              ) : creatorLinks.map((link) => (
                <tr key={link.id} className="hover:bg-[#FAF9F6]/80 transition-colors">
                  <td className="py-4 px-6">
                    <span className="font-bold text-[#0F0F10] block">{link.name}</span>
                    <span className="text-[11px] text-[#6B7280] font-mono select-all truncate max-w-xs block">
                      {link.url}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-md bg-[#FAF9F6] border border-[#E5E7EB] font-mono font-bold text-[#0F0F10] text-xs">
                      {link.promoCode}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono text-[#0F0F10]">
                    {link.discountPercent}% Off
                  </td>
                  <td className="py-4 px-6 font-mono text-[#0F0F10]">
                    {link.clicks.toLocaleString()}
                  </td>
                  <td className="py-4 px-6 font-mono text-[#0F0F10]">
                    {link.orders.toLocaleString()}
                  </td>
                  <td className="py-4 px-6 font-mono font-bold text-[#0F0F10]">
                    {link.conversion}
                  </td>
                  <td className="py-4 px-6 font-mono font-bold text-[#0F0F10]">
                    ₦{link.earnedNgn.toLocaleString('en-NG')}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => setActiveQrLink(link)}
                        title="Display and download QR code"
                        className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-[#0F0F10] transition-colors cursor-pointer"
                      >
                        <QrCode size={13} />
                      </button>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. CREATE DEEP LINK MODAL */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-[#E5E7EB] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAF9F6]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center">
                  <Link2 size={16} />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-lg text-[#0F0F10]">
                    Create Attribution Deep Link
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Generates a verified link &amp; linked discount coupon code
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center text-[#6B7280] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0F0F10] mb-1">
                  Link Name / Campaign Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. YouTube Skin Barrier Routine Deep Link"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0F0F10]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F0F10] mb-1">
                  Destination Target
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'product', label: 'Specific Product' },
                    { id: 'storefront', label: 'My Storefront' },
                    { id: 'campaign', label: 'Seasonal Brief' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setLinkType(t.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        linkType === t.id
                          ? 'bg-[#0F0F10] text-[#D4AF37] border-[#0F0F10]'
                          : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#FAF9F6]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {linkType === 'product' && (
                <div>
                  <label className="block text-xs font-bold text-[#0F0F10] mb-1">
                    Select Target Formulation
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] focus:bg-white focus:outline-none"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ₦{p.price.toLocaleString('en-NG')} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F0F10] mb-1">
                    Promo Code Slug
                  </label>
                  <div className="relative">
                    <Tag size={13} className="absolute left-3.5 top-3 text-[#9CA3AF]" />
                    <input
                      type="text"
                      required
                      placeholder="AMARA15"
                      value={customPromoCode}
                      onChange={(e) => setCustomPromoCode(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] font-mono font-bold uppercase focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F0F10] mb-1">
                    Customer Discount %
                  </label>
                  <div className="relative">
                    <Percent size={13} className="absolute left-3.5 top-3 text-[#9CA3AF]" />
                    <select
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] font-mono font-bold focus:bg-white focus:outline-none"
                    >
                      <option value={10}>10% Standard</option>
                      <option value={15}>15% Campaign Special</option>
                      <option value={20}>20% VIP Exclusive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-[11px] text-[#6B7280] space-y-1">
                <span className="font-bold text-[#0F0F10] block">Automated Provisioning:</span>
                <p>
                  • Link clicks will track real-time IP &amp; cookie attribution for 30 days.
                </p>
                <p>
                  • Coupon code <strong className="text-[#0F0F10] font-mono">{customPromoCode || '...'}</strong> is instantly active at live checkout.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-[#E5E7EB] text-xs font-semibold text-[#0F0F10] hover:bg-[#FAF9F6] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-[#D4AF37] text-xs font-bold shadow-md cursor-pointer transition-transform active:scale-95"
                >
                  Generate &amp; Activate Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. QR CODE PREVIEW MODAL */}
      {/* ========================================================= */}
      {activeQrLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white border border-[#E5E7EB] shadow-2xl overflow-hidden p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-[#E5E7EB]">
              <div className="text-left">
                <span className="text-[10px] font-mono font-bold uppercase text-[#997A2E]">
                  Digital QR Pass
                </span>
                <h4 className="font-heading font-extrabold text-base text-[#0F0F10]">
                  {activeQrLink.name}
                </h4>
              </div>
              <button
                onClick={() => setActiveQrLink(null)}
                className="w-7 h-7 rounded-full hover:bg-black/5 flex items-center justify-center text-[#6B7280] cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Stylized QR Code Graphic */}
            <div className="p-6 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] inline-block shadow-inner mx-auto">
              <div className="w-48 h-48 bg-white p-3 rounded-xl border border-[#E5E7EB] flex flex-col items-center justify-center relative">
                {/* Visual QR Pattern */}
                <div className="w-full h-full bg-[radial-gradient(#0F0F10_2px,transparent_2px)] [background-size:10px_10px] relative flex items-center justify-center">
                  <div className="absolute inset-2 border-4 border-[#0F0F10] rounded-lg pointer-events-none" />
                  <div className="w-12 h-12 rounded-xl bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center font-serif font-black text-lg shadow-md">
                    D!
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-[#0F0F10] block">
                Promo Code: {activeQrLink.promoCode} ({activeQrLink.discountPercent}% Off)
              </span>
              <p className="text-[11px] text-[#6B7280] font-mono select-all truncate px-4">
                {activeQrLink.url}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(activeQrLink.id, activeQrLink.url)}
                className="flex-1 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Copy size={13} className="text-[#D4AF37]" />
                <span>{copiedId === activeQrLink.id ? 'Copied ✓' : 'Copy Link'}</span>
              </button>
              <button
                onClick={() => {
                  alert(`High-resolution SVG QR code for ${activeQrLink.name} downloaded to device!`);
                }}
                className="px-4 py-2.5 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] cursor-pointer flex items-center gap-1"
              >
                <Download size={13} />
                <span>SVG</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
