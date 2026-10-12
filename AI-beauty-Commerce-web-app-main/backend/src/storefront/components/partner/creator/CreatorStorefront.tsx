import React, { useState } from 'react';
import {
  ShoppingBag,
  Share2,
  Copy,
  ExternalLink,
  Edit2,
  Sparkles,
  Check,
  Eye,
  Instagram,
  Video,
  ArrowRight,
  TrendingUp,
  Sliders,
  CheckCircle2,
  Save
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export const CreatorStorefront: React.FC = () => {
  const { products, addToCart } = useApp();
  const [viewMode, setViewMode] = useState<'preview' | 'editor'>('preview');
  const [creatorName, setCreatorName] = useState('Amara Nnadi');
  const [creatorHandle, setCreatorHandle] = useState('@amara_glows');
  const [creatorHeadline, setCreatorHeadline] = useState('Clinical Beauty Specialist • Melanin Barrier Health');
  const [creatorBio, setCreatorBio] = useState(
    'Everyday clinical glow without the complicated routine. Focused on evidence-based melanin barrier repair, antioxidant protection, and zero-white-cast formulas.'
  );
  const [promoCode, setPromoCode] = useState('AMARA10');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(promoCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(`https://delsla.com/${creatorHandle}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSaveEditor = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2200);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200 pb-16">
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
            onClick={handleCopyLink}
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
                Configure Your Public Profile
              </h2>
            </div>
            {savedSuccess && (
              <span className="text-xs font-mono font-bold text-[#0F0F10] bg-[#FAF9F6] px-3 py-1 rounded-full border border-[#E5E7EB] flex items-center gap-1">
                <Check size={12} />
                <span>Saved &amp; Published Live</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#0F0F10] block mb-1.5">Display Name</label>
              <input
                type="text"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#0F0F10] block mb-1.5">Creator Handle</label>
              <input
                type="text"
                value={creatorHandle}
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
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs bg-[#FAF9F6] font-mono font-bold text-[#997A2E]"
              />
              <span className="text-[10px] text-[#6B7280] mt-1 block">Grants your audience 10% off and attributes 12% commission to you.</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs space-y-1">
              <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block font-bold">Live Conversion Pulse</span>
              <p className="font-extrabold text-base text-[#0F0F10]">148 Attributed Orders</p>
              <p className="text-[11px] font-mono text-[#0F0F10] font-bold">₦84,620 Earned Commission</p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#E5E7EB]">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98] transition-all"
            >
              <Save size={14} className="text-[#D4AF37]" />
              <span>Save &amp; Update Storefront</span>
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
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
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
                    <span className="text-xs font-mono font-bold text-[#997A2E] block mt-0.5">
                      {creatorHandle} • {creatorHeadline}
                    </span>
                  </div>

                  {/* Promo Code Pill with Copy Action */}
                  <div
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-xs font-mono self-center sm:self-start cursor-pointer hover:bg-[#F3F4F6] transition-colors"
                    title="Click to copy promo code"
                  >
                    <span className="text-[#6B7280]">Promo:</span>
                    <strong className="text-[#0F0F10]">{promoCode}</strong>
                    <span className="text-[10px] font-mono text-[#0F0F10] font-bold bg-white px-1.5 py-0.5 rounded-full border border-[#E5E7EB]">
                      10% OFF
                    </span>
                    <span className="text-[#0F0F10] text-[10px] font-mono font-bold">
                      {copiedCode ? 'Copied ✓' : 'Copy'}
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed max-w-xl pt-1">
                  {creatorBio}
                </p>

                {/* Minimalist Credential Badges */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-3 text-[11px] font-mono text-[#6B7280]">
                  <span><strong>148k</strong> Collective Reach</span>
                  <span>•</span>
                  <span><strong>4.8k</strong> Verified Formulations Dispatched</span>
                  <span>•</span>
                  <span className="text-[#0F0F10] font-bold">● Certified Partner Hub</span>
                </div>
              </div>
            </div>

            {/* Featured Regimens Shelf */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
                    Curated Regimens
                  </span>
                  <h3 className="font-heading font-bold text-lg text-[#0F0F10]">
                    Amara's Signature Regimen Sets
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#997A2E] font-bold">
                  Auto 10% Off via {promoCode}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Regimen 1 */}
                <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] hover:border-[#D4AF37]/50 transition-all space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#997A2E] bg-white px-2 py-0.5 rounded-full border border-[#D4AF37]/30 inline-block">
                      MORNING SHIELD
                    </span>
                    <h4 className="font-heading font-bold text-base text-[#0F0F10]">
                      Morning Glass Skin Barrier Regimen
                    </h4>
                    <p className="text-xs text-[#6B7280] leading-relaxed">
                      Cleanse with Gentle Amino Wash, press 3 drops of Radiant Glow Oil, seal with Sun Defense SPF50+.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]/70 text-xs">
                    <div>
                      <span className="font-mono text-[10px] text-[#9CA3AF] block line-through">₦42,500</span>
                      <span className="font-mono font-extrabold text-[#0F0F10] text-sm">₦38,250 Bundle</span>
                    </div>
                    <button
                      onClick={() => {
                        addToCart(products[0]);
                        addToCart(products[1]);
                        alert(`Morning Glass Skin Regimen added to your shopping bag with 10% promo code ${promoCode}!`);
                      }}
                      className="px-4 py-2 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-2xs flex items-center gap-1.5"
                    >
                      <ShoppingBag size={13} className="text-[#D4AF37]" />
                      <span>Add Regimen</span>
                    </button>
                  </div>
                </div>

                {/* Regimen 2 */}
                <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] hover:border-[#D4AF37]/50 transition-all space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-[#997A2E] bg-white px-2 py-0.5 rounded-full border border-[#D4AF37]/30 inline-block">
                      NIGHT RECOVERY
                    </span>
                    <h4 className="font-heading font-bold text-base text-[#0F0F10]">
                      Clinical Barrier Recovery at Night
                    </h4>
                    <p className="text-xs text-[#6B7280] leading-relaxed">
                      Double hydration layer designed specifically to soothe hyper-pigmentation and moisture loss during sleep.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]/70 text-xs">
                    <div>
                      <span className="font-mono text-[10px] text-[#9CA3AF] block line-through">₦46,000</span>
                      <span className="font-mono font-extrabold text-[#0F0F10] text-sm">₦41,400 Bundle</span>
                    </div>
                    <button
                      onClick={() => {
                        addToCart(products[1]);
                        addToCart(products[2] || products[0]);
                        alert(`Night Barrier Regimen added to your shopping bag with 10% promo code ${promoCode}!`);
                      }}
                      className="px-4 py-2 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-2xs flex items-center gap-1.5"
                    >
                      <ShoppingBag size={13} className="text-[#D4AF37]" />
                      <span>Add Regimen</span>
                    </button>
                  </div>
                </div>
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
                    Amara's Verified Clinical Picks
                  </h3>
                </div>
                <span className="text-xs text-[#6B7280]">
                  Authentic Laboratory Batches
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {products.slice(0, 4).map((p) => (
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
                        <span className="absolute top-2 right-2 text-[9px] font-mono font-bold bg-[#0F0F10]/80 text-[#D4AF37] px-1.5 py-0.5 rounded-full backdrop-blur-xs">
                          -10%
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#0F0F10] line-clamp-1">{p.name}</h4>
                      <p className="text-xs font-mono font-extrabold text-[#0F0F10]">
                        ₦{p.price.toLocaleString('en-NG')}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        addToCart(p);
                        alert(`Added ${p.name} to shopping bag with promo ${promoCode}!`);
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
