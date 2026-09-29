import React, { useState } from 'react';
import {
  ChevronLeft,
  Users,
  Sparkles,
  Copy,
  Check,
  TrendingUp,
  Gift,
  Download,
  Share2,
  DollarSign,
  Award,
  ShieldCheck,
  Instagram
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ScreenCreators: React.FC = () => {
  const { goBack, creators, products, registerCreator } = useApp();

  const [activeTab, setActiveTab] = useState<'analytics' | 'pr' | 'media' | 'apply'>('analytics');
  const [copiedCode, setCopiedCode] = useState(false);
  const [prClaimed, setPrClaimed] = useState<string | null>(null);

  // Application form
  const [applicantName, setApplicantName] = useState('');
  const [applicantHandle, setApplicantHandle] = useState('');
  const [applicantNiche, setApplicantNiche] = useState('Clinical Skincare');
  const [applicantPlatform, setApplicantPlatform] = useState<'Instagram' | 'TikTok' | 'YouTube'>('Instagram');
  const [applicantFollowers, setApplicantFollowers] = useState('15,000+');
  const [submitted, setSubmitted] = useState(false);

  const activeCreator = creators[0]; // Amara Nnadi

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeCreator.promoCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName || !applicantHandle) return;

    registerCreator({
      name: applicantName,
      handle: applicantHandle.startsWith('@') ? applicantHandle : `@${applicantHandle}`,
      platform: applicantPlatform,
      niche: applicantNiche,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      promoCode: `${applicantName.substring(0, 5).toUpperCase()}10`,
      discountPercent: 10,
      commissionRate: 12
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setActiveTab('analytics');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white text-[#0F0F10] pb-24">
      {/* Top Header (Mobile/Tablet Only — Hidden on Desktop) */}
      <div className="lg:hidden sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              className="p-2 -ml-2 rounded-full text-[#0F0F10] hover:bg-gray-100 active:scale-[0.97] transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <ChevronLeft size={22} strokeWidth={2} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#D4AF37]" />
                <h1 className="font-heading font-extrabold text-lg lg:text-xl text-[#0F0F10] tracking-tight">
                  Creators &amp; Collaborators Hub
                </h1>
              </div>
              <p className="text-xs text-[#6B7280]">
                Empowering MUAs, aesthetic dermatologists &amp; beauty creators
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <img
              src={activeCreator.avatar}
              alt={activeCreator.name}
              className="w-8 h-8 rounded-full object-cover border-2 border-[#D4AF37]"
            />
            <div className="hidden sm:block text-right">
              <span className="text-xs font-heading font-bold text-[#0F0F10] block leading-tight">
                {activeCreator.name}
              </span>
              <span className="text-[10px] text-[#997A2E] font-mono">
                {activeCreator.handle}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-full text-xs font-heading font-semibold whitespace-nowrap active:scale-[0.97] transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-[#0F0F10] text-white font-bold shadow-xs'
                : 'bg-white text-[#6B7280] hover:text-[#0F0F10] border border-[#E5E7EB]'
            }`}
          >
            Affiliate Analytics
          </button>
          <button
            onClick={() => setActiveTab('pr')}
            className={`px-4 py-2 rounded-full text-xs font-heading font-semibold whitespace-nowrap active:scale-[0.97] transition-all cursor-pointer ${
              activeTab === 'pr'
                ? 'bg-[#0F0F10] text-white font-bold shadow-xs'
                : 'bg-white text-[#6B7280] hover:text-[#0F0F10] border border-[#E5E7EB]'
            }`}
          >
            PR Gifting Desk
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`px-4 py-2 rounded-full text-xs font-heading font-semibold whitespace-nowrap active:scale-[0.97] transition-all cursor-pointer ${
              activeTab === 'media'
                ? 'bg-[#0F0F10] text-white font-bold shadow-xs'
                : 'bg-white text-[#6B7280] hover:text-[#0F0F10] border border-[#E5E7EB]'
            }`}
          >
            Brand Media Assets
          </button>
          <button
            onClick={() => setActiveTab('apply')}
            className={`px-4 py-2 rounded-full text-xs font-heading font-semibold whitespace-nowrap active:scale-[0.97] transition-all cursor-pointer ${
              activeTab === 'apply'
                ? 'bg-[#0F0F10] text-white font-bold shadow-xs'
                : 'bg-white text-[#6B7280] hover:text-[#0F0F10] border border-[#E5E7EB]'
            }`}
          >
            + Apply to Creator Collective
          </button>
        </div>

        {/* Tab 1: Creator Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Promo Code Card */}
            <div className="p-6 rounded-2xl bg-white border border-[#D4AF37]/40 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#997A2E]">
                  Your Exclusive Affiliate Code
                </span>
                <h3 className="font-heading font-extrabold text-2xl text-[#0F0F10] tracking-tight">
                  Give 10% Off • Earn 12% Commission
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Share this code with your community on Instagram, TikTok, and YouTube.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-5 py-3 rounded-xl bg-[#FAF9F6] border-2 border-[#D4AF37] font-mono font-bold text-lg text-[#0F0F10] tracking-wider select-all shadow-xs">
                  {activeCreator.promoCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  className="py-3 px-6 rounded-full bg-[#0F0F10] hover:bg-[#D4AF37] text-white hover:text-[#0F0F10] font-heading font-extrabold text-xs flex items-center gap-2 active:scale-[0.97] transition-all shadow-xs cursor-pointer"
                >
                  {copiedCode ? <Check size={14} className="stroke-[3] text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Affiliate Code'}</span>
                </button>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#6B7280]">Attributed Sales (₦)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    +18.4%
                  </span>
                </div>
                <span className="font-mono font-extrabold text-2xl text-[#0F0F10] block">
                  ₦{activeCreator.totalSalesNgn.toLocaleString()}
                </span>
                <span className="text-[11px] text-[#6B7280]">
                  Generated across all channels
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#D4AF37]/30 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#997A2E]">Earned Commission (₦)</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FBF5E8] text-[#997A2E] text-[10px] font-bold">
                    12% Net
                  </span>
                </div>
                <span className="font-mono font-extrabold text-2xl text-[#0F0F10] block">
                  ₦{activeCreator.commissionEarnedNgn.toLocaleString()}
                </span>
                <span className="text-[11px] text-[#6B7280]">
                  Flutterwave payout: Oct 1
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#6B7280]">Link Clicks</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    Active
                  </span>
                </div>
                <span className="font-mono font-extrabold text-2xl text-[#0F0F10] block">
                  {activeCreator.clicks.toLocaleString()}
                </span>
                <span className="text-[11px] text-[#6B7280]">
                  Unique visitors tracked
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#6B7280]">Conversion Rate</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                    13.0%
                  </span>
                </div>
                <span className="font-mono font-extrabold text-2xl text-[#0F0F10] block">
                  {activeCreator.ordersCount} Orders
                </span>
                <span className="text-[11px] text-[#6B7280]">
                  Avg basket: ₦26,300
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: PR Gifting Desk */}
        {activeTab === 'pr' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs">
              <h3 className="font-heading font-extrabold text-base text-[#0F0F10]">
                Complimentary PR Gifting Desk
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">
                As an authorized Desla creator, you are eligible to claim sample boxes of our laboratory releases for honest review and audience swatch tutorials.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.slice(0, 6).map((prod) => (
                <div
                  key={prod.id}
                  className="p-4 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#D4AF37]/40 shadow-xs hover:shadow-md transition-all flex items-center gap-3.5 justify-between"
                >
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-16 h-16 rounded-xl object-cover bg-[#F6F5F2] shrink-0"
                  />
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="font-mono text-[9px] font-bold text-[#997A2E] block">
                      {prod.sku}
                    </span>
                    <h4 className="font-heading font-bold text-xs text-[#0F0F10] truncate mt-0.5">
                      {prod.name}
                    </h4>
                    <span className="text-[10px] text-[#6B7280] block mt-0.5">
                      100ml Laboratory Release
                    </span>
                  </div>

                  <button
                    onClick={() => setPrClaimed(prod.id)}
                    disabled={prClaimed === prod.id}
                    className={`px-3.5 py-2 rounded-full text-xs font-heading font-bold transition-all active:scale-[0.97] shrink-0 cursor-pointer ${
                      prClaimed === prod.id
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        : 'bg-[#0F0F10] hover:bg-[#D4AF37] text-white hover:text-[#0F0F10] shadow-xs'
                    }`}
                  >
                    {prClaimed === prod.id ? 'Claimed ✓ En Route' : 'Claim PR Box'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Brand Media Assets */}
        {activeTab === 'media' && (
          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-5">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
                Official Brand Kit
              </span>
              <h3 className="font-heading font-extrabold text-xl text-[#0F0F10] mt-0.5">
                Desla!™ Media &amp; Typography Vault
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">
                Approved digital assets for Instagram stories, TikTok video overlays, and YouTube reviews.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-3 shadow-xs">
                <span className="text-xs font-heading font-bold text-[#0F0F10] block">Desla!™ Vector Logo (Gold &amp; White)</span>
                <p className="text-[11px] text-[#6B7280]">High-resolution transparent PNG and SVG files.</p>
                <button
                  onClick={() => alert('Downloaded Desla! Vector Logo Pack')}
                  className="w-full py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#D4AF37] text-white hover:text-[#0F0F10] text-xs font-heading font-bold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-colors cursor-pointer shadow-xs"
                >
                  <Download size={13} />
                  <span>Download SVG / PNG</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-3 shadow-xs">
                <span className="text-xs font-heading font-bold text-[#0F0F10] block">Product Bottle Transparent Cutouts</span>
                <p className="text-[11px] text-[#6B7280]">Isolated renders of Body Oil, Shea Butter, and Perfume flacons.</p>
                <button
                  onClick={() => alert('Downloaded Product PNG Cutouts')}
                  className="w-full py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#D4AF37] text-white hover:text-[#0F0F10] text-xs font-heading font-bold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-colors cursor-pointer shadow-xs"
                >
                  <Download size={13} />
                  <span>Download Pack (45 MB)</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-3 shadow-xs">
                <span className="text-xs font-heading font-bold text-[#0F0F10] block">Story &amp; Reel Guidelines</span>
                <p className="text-[11px] text-[#6B7280]">Brand color HEX codes, disclosure tags (#DeslaPartner), and typography rules.</p>
                <button
                  onClick={() => alert('Downloaded Creator Brand Guide')}
                  className="w-full py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#D4AF37] text-white hover:text-[#0F0F10] text-xs font-heading font-bold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-colors cursor-pointer shadow-xs"
                >
                  <Download size={13} />
                  <span>Download PDF Guide</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Apply as Creator */}
        {activeTab === 'apply' && (
          <div className="max-w-xl mx-auto p-6 lg:p-8 rounded-2xl bg-white border border-[#E5E7EB] shadow-lg space-y-5">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
                Creator Onboarding
              </span>
              <h3 className="font-heading font-extrabold text-xl text-[#0F0F10] mt-0.5">
                Join the Desla!™ Creator Collective
              </h3>
              <p className="text-xs text-[#6B7280] mt-1">
                Collaborate with Nigeria’s premier safe-conscious luxury beauty brand. Earn up to 15% commission on all referred sales.
              </p>
            </div>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-[#FBF5E8] border border-[#D4AF37]/40 text-center space-y-2">
                <Check size={32} className="text-[#997A2E] mx-auto" />
                <h4 className="font-heading font-extrabold text-base text-[#0F0F10]">
                  Application Received!
                </h4>
                <p className="text-xs text-[#6B7280]">
                  Our creator partnerships team in Lagos will review your handles within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="text-xs text-[#0F0F10] font-semibold block mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="e.g. Stephanie Okereke"
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs text-[#0F0F10] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 shadow-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#0F0F10] font-semibold block mb-1">
                      Primary Platform *
                    </label>
                    <select
                      value={applicantPlatform}
                      onChange={(e) => setApplicantPlatform(e.target.value as any)}
                      className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 shadow-xs cursor-pointer"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="TikTok">TikTok</option>
                      <option value="YouTube">YouTube</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-[#0F0F10] font-semibold block mb-1">
                      Handle *
                    </label>
                    <input
                      type="text"
                      required
                      value={applicantHandle}
                      onChange={(e) => setApplicantHandle(e.target.value)}
                      placeholder="@steph_beauty"
                      className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs text-[#0F0F10] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#0F0F10] font-semibold block mb-1">
                      Primary Niche
                    </label>
                    <select
                      value={applicantNiche}
                      onChange={(e) => setApplicantNiche(e.target.value)}
                      className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 shadow-xs cursor-pointer"
                    >
                      <option value="Clinical Skincare">Clinical Skincare</option>
                      <option value="Editorial MUA & Makeup">Editorial MUA &amp; Makeup</option>
                      <option value="Haute Fragrance & Scent">Haute Fragrance &amp; Scent</option>
                      <option value="Men's Grooming">Men's Grooming</option>
                      <option value="Wellness & Lifestyle">Wellness &amp; Lifestyle</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-[#0F0F10] font-semibold block mb-1">
                      Community Size
                    </label>
                    <input
                      type="text"
                      value={applicantFollowers}
                      onChange={(e) => setApplicantFollowers(e.target.value)}
                      placeholder="e.g. 25,000+"
                      className="w-full bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs text-[#0F0F10] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 shadow-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-[#0F0F10] text-white hover:bg-[#D4AF37] hover:text-[#0F0F10] font-heading font-extrabold text-xs uppercase tracking-wider active:scale-[0.97] transition-all shadow-sm cursor-pointer mt-3"
                >
                  Submit Creator Application
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
