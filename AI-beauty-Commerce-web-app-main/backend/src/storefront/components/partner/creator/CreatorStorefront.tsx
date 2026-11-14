import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Share2,
  Copy,
  ExternalLink,
  Edit2,
  Check,
  Eye,
  Instagram,
  Video,
  ArrowRight,
  TrendingUp,
  Sliders,
  CheckCircle2,
  Save,
  X,
  Package
} from '../../common/SolidIcons';
import { fetchPartnerDashboard, fetchPartnerWorkspace, writePartnerWorkspace } from '../../../lib/owned-api';
import { useApp } from '../../../context/AppContext';

export const CreatorStorefront: React.FC = () => {
  const {
    isLiveBackend,
    products,
    addToCart,
    creatorStorefrontProducts: previewProducts,
    toggleCreatorStorefrontProduct: previewToggle
  } = useApp();

  const [loading, setLoading] = useState(isLiveBackend);
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [discount, setDiscount] = useState(0);
  const creatorStorefrontProducts = isLiveBackend ? selectedProducts : previewProducts;
  const toggleCreatorStorefrontProduct = (id: string) => isLiveBackend ? setSelectedProducts(prev => prev.includes(id) ? prev.filter(value => value !== id) : [...prev, id]) : previewToggle(id);
  const [viewMode, setViewMode] = useState<'preview' | 'editor'>('preview');
  const [creatorName, setCreatorName] = useState('');
  const [creatorHandle, setCreatorHandle] = useState('');
  const [creatorHeadline, setCreatorHeadline] = useState('');
  const [creatorBio, setCreatorBio] = useState(
    ''
  );
  const [promoCode, setPromoCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(promoCode);
    setCopiedCode(true);
    showToast(`Promo code ${promoCode} copied to clipboard.`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const storefrontLink = typeof window === 'undefined' ? '' : `${window.location.origin}/?screen=creator-storefront&ref=${encodeURIComponent(promoCode)}`;
  const handleShareStorefront = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function' && storefrontLink) {
      try {
        await navigator.share({
          title: creatorName ? `${creatorName} — Delsla!™ Storefront` : 'Delsla!™ Creator Storefront',
          text: promoCode ? `Use my Delsla!™ code ${promoCode}` : creatorHeadline || 'Explore my Delsla!™ curation',
          url: storefrontLink
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    navigator.clipboard?.writeText(storefrontLink);
    setCopiedLink(true); showToast('Creator storefront link copied.');
    setTimeout(() => setCopiedLink(false), 2000);
  };
  useEffect(() => {
    if (!isLiveBackend) return;
    let cancelled = false;
    Promise.all([fetchPartnerDashboard('CREATOR'), fetchPartnerWorkspace('CREATOR')]).then(([dashboard, workspace]) => {
      if (cancelled) return;
      setCreatorName(dashboard.profile.name); setCreatorHandle(dashboard.profile.handle); setPromoCode(dashboard.profile.promoCode); setDiscount(dashboard.profile.discountPercent);
      const collection = workspace.records.find((r: any) => r.kind === 'STOREFRONT');
      setRecord(collection || null); setSelectedProducts(collection?.data?.productIds || []);
      setCreatorHeadline(collection?.title || `Natural picks by ${dashboard.profile.name}`); setCreatorBio(collection?.body || '');
    }).catch(error => { if (!cancelled) showToast(error.message); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isLiveBackend]);
  const handleSaveEditor = async (e: React.FormEvent) => {
    e.preventDefault(); if (saving) return;
    if (!isLiveBackend) { showToast('Storefront settings saved in preview.'); setViewMode('preview'); return; }
    setSaving(true);
    try {
      const editable = record && ['DRAFT', 'REJECTED'].includes(record.status);
      const { result } = await writePartnerWorkspace({ action: 'save', kind: 'CREATOR', type: 'STOREFRONT', ...(editable ? { id: record.id, version: record.version } : {}), status: 'SUBMITTED', title: creatorHeadline, body: creatorBio, url: '', productIds: selectedProducts });
      setRecord(result); showToast('Collection submitted for admin review. It becomes public after approval.'); setViewMode('preview');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Could not submit collection.'); }
    finally { setSaving(false); }
  };

  // Curated products according to creatorStorefrontProducts
  const displayedProducts = products.filter((p) =>
    creatorStorefrontProducts.includes(p.id)
  );

  const finalProducts = isLiveBackend ? displayedProducts : displayedProducts.length > 0 ? displayedProducts : products.slice(0, 4);

  if (loading) return <p role="status">Loading your creator collection…</p>;
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-300 max-w-md">
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white cursor-pointer ml-3"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Editorial Header with View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
            Client-Facing Destination
          </span>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
            Creator Storefront
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Your personal art-directed editorial showcase and shoppable catalog.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Editor vs Preview Mode Switcher */}
          <div className="p-0.5 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] flex text-xs">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-[#0F0F10] text-[#D4AF37] shadow-xs'
                  : 'text-[#6B7280] hover:text-[#0F0F10]'
              }`}
            >
              Client Preview
            </button>
            <button
              onClick={() => setViewMode('editor')}
              className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                viewMode === 'editor'
                  ? 'bg-[#0F0F10] text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-[#0F0F10]'
              }`}
            >
              Storefront Settings
            </button>
          </div>

          <button
            onClick={() => void handleShareStorefront()}
            className="px-4 py-2 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.97] transition-all"
          >
            <Share2 size={13} className="text-[#D4AF37]" />
            <span>{copiedLink ? 'Link Copied ✓' : 'Share Storefront'}</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 1. STOREFRONT SETTINGS / PRIVATE EDITOR VIEW */}
      {/* ==================================================== */}
      {viewMode === 'editor' ? (
        <form onSubmit={handleSaveEditor} className="p-6 sm:p-10 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
                Customization Panel
              </span>
              <h2 className="font-heading font-bold text-lg text-[#0F0F10]">
                Configure Your Public Profile &amp; Formulations
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#0F0F10] block mb-1.5">Display Name</label>
              <input
                type="text"
                readOnly={isLiveBackend} value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#0F0F10] block mb-1.5">Creator Handle</label>
              <input
                type="text"
                readOnly={isLiveBackend} value={creatorHandle}
                onChange={(e) => setCreatorHandle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#0F0F10] block mb-1.5">Editorial Headline</label>
            <input
              type="text"
              value={creatorHeadline}
              onChange={(e) => setCreatorHeadline(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#0F0F10] block mb-1.5">Storefront Bio</label>
            <textarea
              rows={3}
              value={creatorBio}
              onChange={(e) => setCreatorBio(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E5E7EB]">
            <div>
              <label className="text-xs font-bold text-[#0F0F10] block mb-1.5">Affiliate Promo Code</label>
              <input
                type="text"
                readOnly={isLiveBackend} value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] font-mono font-bold text-[#997A2E]"
              />
              <span className="text-[10px] text-[#6B7280] mt-1 block">Your assigned referral terms are managed by the administrator.</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs space-y-1">
              <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block font-bold">Storefront Attribution</span>
              <p className="font-extrabold text-base text-[#0F0F10]">See earnings ledger</p>
              <p className="text-[11px] font-mono text-[#0F0F10] font-bold">{'Collection status: ' + (record?.status || 'Not submitted')}</p>
            </div>
          </div>

          {/* Product Curation Selection Checklist */}
          <div className="space-y-3 pt-4 border-t border-[#E5E7EB]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#0F0F10]">
                  Curate Displayed Formulations
                </h3>
                <p className="text-[11px] text-[#6B7280]">
                  Select the products featured in your "Verified Natural Picks" shelf
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#997A2E] font-bold">
                {creatorStorefrontProducts.length} Selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {products.map((p) => {
                const isSelected = creatorStorefrontProducts.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleCreatorStorefrontProduct(p.id)}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0F0F10] bg-[#FAF9F6]'
                        : 'border-[#E5E7EB] bg-white opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0F0F10] truncate">{p.name}</p>
                        <p className="text-[10px] font-mono text-[#6B7280]">₦{p.price.toLocaleString('en-NG')}</p>
                      </div>
                    </div>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      isSelected ? 'bg-[#0F0F10] text-[#D4AF37]' : 'border border-[#E5E7EB] text-transparent'
                    }`}>
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#E5E7EB]">
            <button
              type="submit" disabled={saving || (isLiveBackend && record?.status === 'SUBMITTED')}
              className="px-6 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98] transition-all"
            >
              <Save size={14} className="text-[#D4AF37]" />
              <span>{saving ? 'Submitting…' : isLiveBackend ? record?.status === 'SUBMITTED' ? 'Awaiting admin review' : 'Submit collection for review' : 'Save & Update Storefront'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* ==================================================== */
        /* 2. LUXURY MINIMALIST CLIENT PREVIEW VIEW */
        /* ==================================================== */
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Main Hero Card with Delicate Ambient Glow & Box Shadow */}
          <section className="p-6 sm:p-10 rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#E5E7EB]/60 space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-[#E5E7EB]/70">
              {/* Creator Portrait */}
              <div className="relative shrink-0">
                <img
                  src="/desla_logo_dark.svg"
                  alt={creatorName}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover shadow-sm ring-4 ring-[#FAF9F6]"
                />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0F0F10] text-[#D4AF37] border-2 border-white flex items-center justify-center font-bold text-xs shadow-xs">
                  ✓
                </span>
              </div>

              {/* Bio & Details */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10] tracking-tight">
                      {creatorName}
                    </h2>
                    <span className="text-xs font-mono font-bold text-[#997A2E] tracking-wide">
                      {creatorHandle}
                    </span>
                  </div>

                  {/* Promo Badge Button */}
                  {promoCode && (
                    <button
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF9F6] border border-[#D4AF37]/50 text-xs font-mono font-bold text-[#0F0F10] hover:bg-[#FBF5E8] transition-colors cursor-pointer self-center sm:self-auto shadow-2xs"
                    >
                      <span>Use Code: <strong>{promoCode}</strong></span>
                      <span className="text-[10px] text-[#997A2E] bg-white px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
                        {copiedCode ? 'Copied ✓' : discount > 0 ? `${discount}% OFF` : 'Active Code'}
                      </span>
                    </button>
                  )}
                </div>

                <p className="text-xs sm:text-sm font-semibold text-[#0F0F10]">
                  {creatorHeadline}
                </p>
                <p className="text-xs text-[#6B7280] leading-relaxed max-w-2xl">
                  {creatorBio}
                </p>
              </div>
            </div>
            {/* Curated Standalone Formulations Grid */}
            <div className="space-y-4 pt-4 border-t border-[#E5E7EB]/70">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
                    Daily Holy-Grails
                  </span>
                  <h3 className="font-heading font-bold text-lg text-[#0F0F10]">
                    {creatorName}'s Natural Picks ({finalProducts.length})
                  </h3>
                </div>
                <span className="text-xs text-[#6B7280]">
                  Authentic Laboratory Batches
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {finalProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#D4AF37]/60 shadow-[0_4px_16px_rgb(0,0,0,0.03)] hover:shadow-md transition-all text-center flex flex-col justify-between group"
                  >
                    <div className="space-y-2">
                      <div className="w-full h-32 rounded-xl bg-[#FAF9F6] overflow-hidden flex items-center justify-center relative">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {discount > 0 && (
                          <span className="absolute top-2 right-2 text-[9px] font-mono font-bold bg-[#0F0F10]/85 text-[#D4AF37] px-1.5 py-0.5 rounded-full">
                            -{discount}%
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-[#0F0F10] line-clamp-1">{p.name}</h4>
                      <p className="text-xs font-mono font-extrabold text-[#0F0F10]">
                        ₦{p.price.toLocaleString('en-NG')}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        addToCart(p);
                        showToast(`Added ${p.name} to shopping bag with promo ${promoCode}!`);
                      }}
                      className="mt-3 w-full py-1.5 rounded-full bg-[#FAF9F6] group-hover:bg-[#0F0F10] text-[#0F0F10] group-hover:text-white text-xs font-bold transition-colors cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                    >
                      <ShoppingBag size={12} className="text-[#997A2E] group-hover:text-[#D4AF37]" />
                      <span>Add to Bag</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
