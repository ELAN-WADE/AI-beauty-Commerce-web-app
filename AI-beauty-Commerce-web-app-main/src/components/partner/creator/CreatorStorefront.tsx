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
  Video
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export const CreatorStorefront: React.FC = () => {
  const { products } = useApp();
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('preview');
  const [creatorBio, setCreatorBio] = useState(
    'Everyday clinical glow without the complicated routine. Melanin barrier health • Formulation deep dives • Lagos, Nigeria.'
  );
  const [promoCode] = useState('AMARA10');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header with Editor / Preview Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
            Client-Facing Profile
          </span>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
            Creator Storefront
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Your personal shoppable editorial space on the Desla! marketplace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-0.5 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] flex text-xs">
            <button
              onClick={() => setViewMode('editor')}
              className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                viewMode === 'editor'
                  ? 'bg-[#0F0F10] text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-[#0F0F10]'
              }`}
            >
              Private Editor
            </button>
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
          </div>

          <button
            onClick={() => alert('Storefront link copied: delsla.com/@amara_glows')}
            className="px-4 py-2 rounded-full bg-[#0F0F10] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 size={13} className="text-[#D4AF37]" />
            <span>Share Link</span>
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="p-6 sm:p-10 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs max-w-4xl mx-auto space-y-8">
        {/* Profile Card */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b border-[#E5E7EB]">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
              alt="Amara Nnadi"
              className="w-24 h-24 rounded-full object-cover border-4 border-[#FAF9F6] shadow-md"
            />
            <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#D4AF37] text-[#0F0F10] flex items-center justify-center font-bold text-xs ring-2 ring-white">
              ✓
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-heading font-extrabold text-2xl text-[#0F0F10]">
                  Amara Nnadi
                </h2>
                <span className="text-xs font-mono font-bold text-[#997A2E]">
                  @amara_glows • Clinical Beauty Creator
                </span>
              </div>

              {/* Promo code pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FBF5E8] border border-[#D4AF37]/40 text-xs font-mono self-center sm:self-start">
                <span className="text-[#6B7280]">Use Code:</span>
                <strong className="text-[#0F0F10]">{promoCode}</strong>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                  10% OFF
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed max-w-xl">
              {creatorBio}
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-6 pt-2 text-xs font-medium text-[#6B7280]">
              <span><strong>128k</strong> Followers</span>
              <span><strong>4.8k</strong> Formulations Sold</span>
              <span><strong>2.1k</strong> Client Orders</span>
            </div>
          </div>
        </div>

        {/* Featured Routines Shelf */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-lg text-[#0F0F10]">
              Amara's Curated Routines
            </h3>
            <span className="text-xs text-[#997A2E] font-bold">Shoppable (10% off applied)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
                Featured Regimen
              </span>
              <h4 className="font-heading font-bold text-base text-[#0F0F10]">
                Morning Glass Skin Barrier Routine
              </h4>
              <p className="text-xs text-[#6B7280]">
                Cleanse with Gentle Amino Wash, follow with 4 drops of Radiant Glow Oil, seal with SPF50+.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] text-xs">
                <span className="font-mono font-extrabold text-[#0F0F10]">₦38,500 Complete</span>
                <button
                  onClick={() => alert('Full routine added to cart with promo AMARA10')}
                  className="px-4 py-1.5 rounded-full bg-[#0F0F10] text-white text-xs font-bold cursor-pointer hover:bg-[#27272A]"
                >
                  Buy Entire Routine
                </button>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
                Evening Regimen
              </span>
              <h4 className="font-heading font-bold text-base text-[#0F0F10]">
                Clinical Barrier Recovery at Night
              </h4>
              <p className="text-xs text-[#6B7280]">
                Nourishing double hydration layer for hyper-pigmentation soothing during sleep.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] text-xs">
                <span className="font-mono font-extrabold text-[#0F0F10]">₦42,000 Complete</span>
                <button
                  onClick={() => alert('Full routine added to cart with promo AMARA10')}
                  className="px-4 py-1.5 rounded-full bg-[#0F0F10] text-white text-xs font-bold cursor-pointer hover:bg-[#27272A]"
                >
                  Buy Entire Routine
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Curated Standalone Products */}
        <section className="space-y-4">
          <h3 className="font-heading font-bold text-lg text-[#0F0F10]">
            Amara's Daily Holy-Grail Picks
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {products.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl border border-[#E5E7EB] bg-white text-center space-y-2 group"
              >
                <div className="w-full h-28 rounded-xl bg-[#FAF9F6] overflow-hidden flex items-center justify-center">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <h4 className="text-xs font-bold text-[#0F0F10] line-clamp-1">{p.name}</h4>
                <p className="text-xs font-mono font-extrabold text-[#0F0F10]">
                  ₦{p.price.toLocaleString('en-NG')}
                </p>
                <button
                  onClick={() => alert(`Added ${p.name} to cart with promo AMARA10`)}
                  className="w-full py-1.5 rounded-full bg-[#FAF9F6] hover:bg-[#0F0F10] hover:text-white text-xs font-bold text-[#0F0F10] transition-colors cursor-pointer"
                >
                  Quick Add
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
