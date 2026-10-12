import React, { useState } from 'react';
import {
  Video,
  Sparkles,
  Star,
  BookOpen,
  Plus,
  Trash2,
  Check,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  ExternalLink,
  Upload,
  CheckCircle2,
  Film,
  Music,
  Share2,
  Sliders,
  Play,
  Heart,
  MessageCircle,
  Copy,
  Layers,
  Sparkle
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export interface CreatorContentEditorProps {
  onPublishSuccess?: () => void;
  onCancel?: () => void;
}

export type ContentFormat = 'video' | 'routine' | 'review' | 'tutorial';

export const CreatorContentEditor: React.FC<CreatorContentEditorProps> = ({
  onPublishSuccess,
  onCancel
}) => {
  const { products, createCommunityPost, navigateTo, addToCart } = useApp();
  const [selectedFormat, setSelectedFormat] = useState<ContentFormat>('video');
  const [isPublished, setIsPublished] = useState(false);
  const [publishedPostId, setPublishedPostId] = useState<string>('');

  // ----------------------------------------------------
  // 1. Short Video / Reel State
  // ----------------------------------------------------
  const [videoTitle, setVideoTitle] = useState('Morning 3-Drop Radiance Routine for Lekki Sun');
  const [videoCaption, setVideoCaption] = useState(
    'Never skip antioxidant barrier protection! The lightweight botanical absorption gives zero white cast even in Lagos humidity. Tagged formulations below 👇'
  );
  const [videoFilter, setVideoFilter] = useState('Clinical Radiance 4K');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([
    products[0]?.id || 'prod-1',
    products[1]?.id || 'prod-2'
  ]);
  const [videoFileName, setVideoFileName] = useState('CapCut_Glow_Prep_Final_1080p.mp4');
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80'
  );
  const [postToCommunity, setPostToCommunity] = useState(true);
  const [tiktokConnected, setTiktokConnected] = useState(true);
  const [instagramConnected, setInstagramConnected] = useState(true);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([
    '#DelslaBeauty',
    '#MelaninGlow',
    '#NigerianSkincare',
    '#CleanBeautyAfrica'
  ]);

  // ----------------------------------------------------
  // 2. Routine Builder State
  // ----------------------------------------------------
  const [routineTitle, setRoutineTitle] = useState('Morning Melanin Barrier Shield');
  const [routineCategory, setRoutineCategory] = useState('Hydration & Barrier Repair');
  const [routineSkinType, setRoutineSkinType] = useState('Combination & Melanin-Rich');
  const [routineTimeOfDay, setRoutineTimeOfDay] = useState<'morning' | 'evening' | 'both'>('morning');
  const [routineSteps, setRoutineSteps] = useState([
    {
      id: 'step-1',
      stepNumber: 1,
      name: 'Gentle Amino Acid Cleanse',
      productId: products[0]?.id || 'prod-1',
      proTip: 'Massage gently into damp skin for 60 seconds with lukewarm water. Rinse thoroughly.'
    },
    {
      id: 'step-2',
      stepNumber: 2,
      name: 'Hydrating Botanical Mist',
      productId: products[2]?.id || 'prod-3',
      proTip: 'Mist 3 pumps across face and neck while skin is slightly damp to prime barrier pores.'
    },
    {
      id: 'step-3',
      stepNumber: 3,
      name: 'Antioxidant Radiance Treatment',
      productId: products[1]?.id || 'prod-2',
      proTip: 'Warm 3 drops between clean palms and press gently into cheekbones and forehead.'
    }
  ]);

  // ----------------------------------------------------
  // 3. Product Review State
  // ----------------------------------------------------
  const [reviewProductId, setReviewProductId] = useState(products[0]?.id || 'prod-1');
  const [reviewVerdict, setReviewVerdict] = useState(
    'Incredible barrier relief. Absorbs within 30 seconds without any sticky residue. Completely healed dry flaking along my jawline within 10 days of continuous morning use.'
  );
  const [testingDuration, setTestingDuration] = useState('14 Days Clinical Wear Test');
  const [reviewRating, setReviewRating] = useState(5);
  const [textureScore, setTextureScore] = useState(5);
  const [absorptionScore, setAbsorptionScore] = useState(5);
  const [longevityScore, setLongevityScore] = useState(5);

  // ----------------------------------------------------
  // 4. Technique Tutorial State
  // ----------------------------------------------------
  const [tutorialTitle, setTutorialTitle] = useState('60-Second Facial Lymphatic Drainage & Oil Press');
  const [tutorialDifficulty, setTutorialDifficulty] = useState<'Beginner' | 'Intermediate' | 'Masterclass'>('Beginner');
  const [tutorialSteps, setTutorialSteps] = useState([
    {
      id: 'tut-1',
      title: 'Warm 3 Drops of Formulation Oil',
      detail: 'Rub clean palms together for 5 seconds to activate botanical actives before touching face.'
    },
    {
      id: 'tut-2',
      title: 'Upward Contouring Along Jawline',
      detail: 'Glide knuckles from chin towards earlobes with light, rhythmic upwards pressure.'
    },
    {
      id: 'tut-3',
      title: 'Temple Drainage & Seal',
      detail: 'Sweep outward from center of forehead towards hairline, releasing facial tension.'
    }
  ]);

  const formats = [
    {
      id: 'video',
      label: 'Short Video / Reel',
      icon: Video,
      desc: 'CapCut clip, TikTok & Community Reel',
      popular: true
    },
    {
      id: 'routine',
      label: 'Beauty Routine',
      icon: Sparkles,
      desc: 'Step-by-step shoppable regimen'
    },
    {
      id: 'review',
      label: 'Product Review',
      icon: Star,
      desc: 'Clinical scorecard & verified wear test'
    },
    {
      id: 'tutorial',
      label: 'Technique Masterclass',
      icon: BookOpen,
      desc: 'Application guide & facial routines'
    }
  ];

  const toggleProductSelection = (id: string) => {
    if (selectedProductIds.includes(id)) {
      if (selectedProductIds.length > 1) {
        setSelectedProductIds(selectedProductIds.filter((p) => p !== id));
      }
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const toggleHashtag = (tag: string) => {
    if (selectedHashtags.includes(tag)) {
      setSelectedHashtags(selectedHashtags.filter((t) => t !== tag));
    } else {
      setSelectedHashtags([...selectedHashtags, tag]);
    }
  };

  const handlePublish = () => {
    const taggedFirstProd = products.find((p) =>
      selectedFormat === 'review'
        ? p.id === reviewProductId
        : selectedProductIds.includes(p.id)
    ) || products[0];

    const contentSummary =
      selectedFormat === 'video'
        ? videoCaption
        : selectedFormat === 'routine'
        ? `${routineTitle} • ${routineSteps.length}-Step Regimen (${routineSkinType})`
        : selectedFormat === 'review'
        ? `★ ${reviewRating}.0 / 5.0 Review: ${reviewVerdict}`
        : `${tutorialTitle} • ${tutorialDifficulty} Technique Guide`;

    // 1. Post directly into the Community Feed
    if (postToCommunity || selectedFormat === 'video' || selectedFormat === 'routine') {
      createCommunityPost({
        authorName: 'Amara Nnadi',
        authorHandle: '@amara_glows',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        authorRole: 'Creator / MUA',
        skinType: selectedFormat === 'routine' ? routineSkinType : 'Melanin Barrier',
        content: contentSummary,
        mediaType: selectedFormat === 'video' ? 'video' : 'image',
        mediaUrl: videoPreviewUrl,
        videoDuration: selectedFormat === 'video' ? '0:42' : undefined,
        taggedProductId: taggedFirstProd?.id,
        taggedProductSku: taggedFirstProd?.sku,
        taggedProductHashtag: taggedFirstProd?.hashtag || '#RadiantGlow',
        taggedProductName: taggedFirstProd?.name,
        isTransformation: selectedFormat === 'review'
      });
    }

    setPublishedPostId(`post-${Date.now()}`);
    setIsPublished(true);
  };

  // ----------------------------------------------------
  // PUBLISHED SUCCESS MODAL / VIEW
  // ----------------------------------------------------
  if (isPublished) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#E5E7EB] text-center max-w-xl mx-auto shadow-md animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-[#FAF9F6] text-[#0F0F10] border border-[#E5E7EB] flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} />
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0F0F10] bg-[#FAF9F6] px-3 py-1 rounded-full border border-[#E5E7EB]">
            Live on Community Feed &amp; Storefront
          </span>
        </div>

        <h2 className="font-heading font-extrabold text-2xl text-[#0F0F10] mt-2">
          {selectedFormat === 'video'
            ? videoTitle
            : selectedFormat === 'routine'
            ? routineTitle
            : selectedFormat === 'review'
            ? `Review: ${products.find((p) => p.id === reviewProductId)?.name}`
            : tutorialTitle}
        </h2>

        <p className="text-xs sm:text-sm text-[#6B7280] mt-2 max-w-md mx-auto leading-relaxed">
          Your content has been broadcasted to the <strong>Desla! Collective Community</strong> and added to your creator library. Customers who purchase through your tagged formulations earn you <strong>12% commission</strong> automatically.
        </p>

        {/* Shareable Link Box */}
        <div className="mt-6 p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs font-mono flex items-center justify-between gap-3 text-left">
          <div className="truncate">
            <span className="text-[10px] text-[#9CA3AF] uppercase block font-sans font-bold">Public Shoppable Link</span>
            <span className="text-[#0F0F10] font-bold">delsla.com/@amara_glows/c/{publishedPostId}</span>
          </div>
          <button
            onClick={() => alert('Link & promo caption copied to clipboard!')}
            className="px-3.5 py-1.5 rounded-full bg-[#0F0F10] text-white hover:bg-[#27272A] font-bold text-[11px] shrink-0 cursor-pointer flex items-center gap-1 active:scale-95 transition-all"
          >
            <Copy size={12} />
            <span>Copy</span>
          </button>
        </div>

        {/* Cross-Posting Confirmation Badges */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-[#6B7280]">
          <span className="inline-flex items-center gap-1 bg-[#FAF9F6] text-[#0F0F10] px-2.5 py-1 rounded-full border border-[#E5E7EB] font-bold">
            ● Community Feed Live
          </span>
          {tiktokConnected && (
            <span className="inline-flex items-center gap-1 bg-[#FAF9F6] text-[#0F0F10] px-2.5 py-1 rounded-full border border-[#E5E7EB]">
              ● Ready for TikTok Cross-Post
            </span>
          )}
          {instagramConnected && (
            <span className="inline-flex items-center gap-1 bg-[#FAF9F6] text-[#0F0F10] px-2.5 py-1 rounded-full border border-[#E5E7EB]">
              ● Ready for IG Reels
            </span>
          )}
        </div>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigateTo('community')}
            className="px-6 py-2.5 rounded-full bg-[#0F0F10] text-[#D4AF37] hover:bg-[#27272A] font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <span>View in Community Feed</span>
            <ArrowRight size={13} />
          </button>

          <button
            onClick={() => {
              if (onPublishSuccess) {
                onPublishSuccess();
              } else if (onCancel) {
                onCancel();
              }
            }}
            className="px-6 py-2.5 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-[#0F0F10] font-semibold text-xs cursor-pointer"
          >
            Back to Content Library
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN STUDIO BUILDER INTERFACE
  // ----------------------------------------------------
  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
            Creator Studio Suite
          </span>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10]">
            Create New Content
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
            Craft high-converting short video reels, step-by-step regimens, and verified clinical reviews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-full border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-semibold text-[#0F0F10] cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => alert('Draft saved successfully to My Content Library!')}
            className="px-4 py-2 rounded-full border border-[#D4AF37] bg-[#FBF5E8] hover:bg-[#F3EEE3] text-xs font-bold text-[#997A2E] cursor-pointer active:scale-95 transition-all"
          >
            Save Draft
          </button>
          <button
            onClick={handlePublish}
            className="px-6 py-2 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-[#D4AF37] text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <span>Publish Content</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Format Selector Pills */}
      <section className="space-y-3">
        <label className="text-xs font-bold text-[#0F0F10] block">
          Select Content Type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {formats.map((f) => {
            const Icon = f.icon;
            const isSelected = selectedFormat === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFormat(f.id as ContentFormat)}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between min-h-[96px] transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#D4AF37] bg-[#FDFBF7] shadow-sm ring-1 ring-[#D4AF37]/50'
                    : 'border-[#E5E7EB] bg-white hover:border-[#D4AF37]/40 hover:bg-[#FAF9F6]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? 'bg-[#0F0F10] text-[#D4AF37]' : 'bg-[#FAF9F6] text-[#6B7280]'}`}>
                    <Icon size={16} />
                  </div>
                  {f.popular && (
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#997A2E] bg-white px-2 py-0.5 rounded-full border border-[#D4AF37]/40">
                      VIRAL
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#0F0F10]">{f.label}</h3>
                  <p className="text-[10px] text-[#6B7280] line-clamp-1 mt-0.5">{f.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ==================================================== */}
      {/* 1. SHORT VIDEO / REEL CREATION INTERFACE */}
      {/* ==================================================== */}
      {selectedFormat === 'video' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Video Upload, TikTok Sync & Caption */}
          <div className="lg:col-span-7 space-y-5">
            {/* Social Accounts Sync Card */}
            <div className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
                    Social Cross-Publishing
                  </span>
                  <h3 className="font-heading font-bold text-sm text-[#0F0F10]">
                    Connected Creator Accounts
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#0F0F10] bg-[#FAF9F6] px-2.5 py-0.5 rounded-full border border-[#E5E7EB]">
                  ● 2 CHANNELS SYNCED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* TikTok Account */}
                <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#0F0F10] text-white flex items-center justify-center font-bold text-xs">
                      TT
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[#0F0F10] block">@amara_glows</span>
                      <span className="text-[10px] text-[#6B7280]">148.4k Followers</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setTiktokConnected(!tiktokConnected)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                      tiktokConnected
                        ? 'bg-[#0F0F10] text-white'
                        : 'bg-[#E5E7EB] text-[#6B7280]'
                    }`}
                  >
                    {tiktokConnected ? 'Synced ✓' : 'Connect'}
                  </button>
                </div>

                {/* Instagram Reels Account */}
                <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#0F0F10] text-white flex items-center justify-center font-bold text-xs">
                      IG
                    </div>
                    <div>
                      <span className="font-bold text-xs text-[#0F0F10] block">@amara_skincare</span>
                      <span className="text-[10px] text-[#6B7280]">112.8k Followers</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setInstagramConnected(!instagramConnected)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                      instagramConnected
                        ? 'bg-[#0F0F10] text-white'
                        : 'bg-[#E5E7EB] text-[#6B7280]'
                    }`}
                  >
                    {instagramConnected ? 'Synced ✓' : 'Connect'}
                  </button>
                </div>
              </div>
            </div>

            {/* Video File Uploader (CapCut / Phone) */}
            <div className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <div>
                <label className="text-xs font-bold text-[#0F0F10] block mb-1">
                  Upload Video Clip (CapCut / Phone / Camera)
                </label>
                <p className="text-[11px] text-[#6B7280]">
                  Record on your phone, edit in CapCut, and drag &amp; drop your 9:16 vertical MP4 or WebM video.
                </p>
              </div>

              <div className="border border-dashed border-[#D4AF37]/50 rounded-2xl p-6 text-center bg-[#FAF9F6]/80 hover:bg-[#FAF9F6] transition-colors cursor-pointer flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#FBF5E8] text-[#997A2E] flex items-center justify-center">
                  <Film size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0F0F10]">
                    Current File: <span className="font-mono text-[#997A2E]">{videoFileName}</span>
                  </p>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">
                    MP4, MOV up to 250MB • Vertical 1080x1920 (9:16)
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => {
                      setVideoFileName('Morning_Barrier_CapCut_v2.mp4');
                      alert('Uploaded sample phone video: Morning_Barrier_CapCut_v2.mp4');
                    }}
                    className="px-3 py-1 rounded-full bg-white border border-[#E5E7EB] text-[11px] font-semibold text-[#0F0F10] hover:bg-[#FAF9F6]"
                  >
                    Replace Video
                  </button>
                </div>
              </div>

              {/* Beauty Filter Preset */}
              <div>
                <label className="text-xs font-bold text-[#0F0F10] block mb-1.5 flex items-center gap-1.5">
                  <Sparkle size={13} className="text-[#997A2E]" />
                  <span>Beauty Lighting &amp; Filter Grading Preset</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    'Clinical Radiance 4K',
                    'Warm Golden Hour',
                    'Dewy Glass Skin',
                    'Natural Daylight'
                  ].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setVideoFilter(filter)}
                      className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                        videoFilter === filter
                          ? 'border-[#D4AF37] bg-[#FBF5E8] text-[#997A2E]'
                          : 'border-[#E5E7EB] bg-[#FAF9F6] text-[#6B7280] hover:text-[#0F0F10]'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Video Details & Caption */}
            <div className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <div>
                <label className="text-xs font-bold text-[#0F0F10] block mb-1.5">
                  Reel Title
                </label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="e.g. My 3-Drop Radiance Routine for Lekki Sun"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37] bg-[#FAF9F6] font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#0F0F10] block mb-1.5">
                  Caption &amp; Creator Takeaway
                </label>
                <textarea
                  rows={3}
                  value={videoCaption}
                  onChange={(e) => setVideoCaption(e.target.value)}
                  placeholder="Explain why you love these formulations..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37] bg-[#FAF9F6] font-medium"
                />
              </div>

              {/* Viral Beauty Hashtag Pills */}
              <div>
                <label className="text-xs font-bold text-[#0F0F10] block mb-1.5">
                  Trending Beauty Hashtags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '#DelslaBeauty',
                    '#MelaninGlow',
                    '#NigerianSkincare',
                    '#CleanBeautyAfrica',
                    '#GlassSkinLagos',
                    '#BarrierRepair',
                    '#NoWhiteCastSPF'
                  ].map((tag) => {
                    const isSelected = selectedHashtags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleHashtag(tag)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0F0F10] text-white font-bold'
                            : 'bg-[#FAF9F6] text-[#6B7280] border border-[#E5E7EB] hover:text-[#0F0F10]'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cross-post to Community Toggle */}
              <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#0F0F10] block">
                    Broadcast to Delsla Community Feed
                  </span>
                  <span className="text-[11px] text-[#6B7280]">
                    Pushes this video directly into the Collective community discussion.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={postToCommunity}
                  onChange={(e) => setPostToCommunity(e.target.checked)}
                  className="w-4 h-4 rounded text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Tag Formulations & 9:16 Video Player Preview */}
          <div className="lg:col-span-5 space-y-5">
            {/* Tagged Beauty Products Card */}
            <div className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
                    Shoppable Attribution
                  </span>
                  <h3 className="font-heading font-bold text-sm text-[#0F0F10]">
                    Tag Formulations in Reel
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#997A2E]">
                  12% Commission
                </span>
              </div>

              <p className="text-[11px] text-[#6B7280]">
                Select the authentic laboratory products featured in this clip:
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {products.slice(0, 5).map((p) => {
                  const isTagged = selectedProductIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProductSelection(p.id)}
                      className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isTagged
                          ? 'border-[#D4AF37] bg-[#FDFBF7] shadow-2xs'
                          : 'border-[#E5E7EB] bg-white hover:bg-[#FAF9F6]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-cover border border-[#E5E7EB] shrink-0"
                        />
                        <div>
                          <span className="font-bold text-xs text-[#0F0F10] block line-clamp-1">
                            {p.name}
                          </span>
                          <span className="font-mono text-[11px] text-[#6B7280]">
                            ₦{p.price.toLocaleString('en-NG')} • Earn ₦{Math.round(p.price * 0.12).toLocaleString('en-NG')}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          isTagged ? 'bg-[#0F0F10] text-[#D4AF37]' : 'border border-[#D1D5DB]'
                        }`}
                      >
                        {isTagged && <Check size={11} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live 9:16 Mobile Reel Preview */}
            <div className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B7280] block text-center">
                Live Community &amp; TikTok Mobile Preview
              </span>

              {/* 9:16 Reel Container */}
              <div className="relative aspect-[9/16] w-full max-w-[260px] mx-auto rounded-3xl overflow-hidden bg-black shadow-lg border border-black/10">
                <img
                  src={videoPreviewUrl}
                  alt="Reel preview"
                  className="w-full h-full object-cover opacity-90"
                />

                {/* Ambient Scrim Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

                {/* Filter Stamp Badge */}
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-mono text-white/90 border border-white/20">
                  {videoFilter}
                </div>

                {/* Right Reel Action Icons (TikTok / IG style) */}
                <div className="absolute right-2.5 bottom-16 flex flex-col items-center gap-3 text-white">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-rose-500">
                      <Heart size={16} fill="currentColor" />
                    </div>
                    <span className="text-[9px] font-mono mt-0.5">2.4k</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                      <MessageCircle size={15} />
                    </div>
                    <span className="text-[9px] font-mono mt-0.5">148</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                      <Share2 size={14} />
                    </div>
                    <span className="text-[9px] font-mono mt-0.5">Share</span>
                  </div>
                </div>

                {/* Bottom Creator Info & Shoppable Tag */}
                <div className="absolute bottom-3 left-3 right-12 text-white space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs">@amara_glows</span>
                    <span className="text-[9px] font-mono text-[#D4AF37] bg-[#D4AF37]/20 px-1.5 py-0.2 rounded-full">VIP</span>
                  </div>

                  <p className="text-[10px] text-white/90 line-clamp-2 leading-snug">
                    {videoCaption}
                  </p>

                  {/* Shoppable Tag Banner */}
                  <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-[9.5px]">
                    <ShoppingBag size={12} className="text-[#D4AF37] shrink-0" />
                    <span className="truncate font-semibold">
                      {products.find((p) => p.id === selectedProductIds[0])?.name || 'Radiant Glow Oil'}
                    </span>
                    <span className="font-mono text-[#D4AF37] font-bold shrink-0 ml-auto">Shop</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ==================================================== */}
      {/* 2. BEAUTY ROUTINE BUILDER INTERFACE */}
      {/* ==================================================== */}
      {selectedFormat === 'routine' && (
        <section className="space-y-6">
          {/* Routine Metadata */}
          <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[#0F0F10] block mb-1.5">
                  Routine Regimen Title
                </label>
                <input
                  type="text"
                  value={routineTitle}
                  onChange={(e) => setRoutineTitle(e.target.value)}
                  placeholder="e.g. Morning Melanin Barrier Shield"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37] bg-[#FAF9F6] font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#0F0F10] block mb-1.5">
                  Primary Skin Concern
                </label>
                <select
                  value={routineCategory}
                  onChange={(e) => setRoutineCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37] bg-[#FAF9F6] font-medium cursor-pointer"
                >
                  <option>Hydration &amp; Barrier Repair</option>
                  <option>Dark Spot &amp; Hyperpigmentation</option>
                  <option>Melanin UV Defense &amp; Glow</option>
                  <option>Gentle Clarifying &amp; Texture</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E5E7EB]">
              <div>
                <label className="text-xs font-bold text-[#0F0F10] block mb-1.5">
                  Target Skin Type
                </label>
                <input
                  type="text"
                  value={routineSkinType}
                  onChange={(e) => setRoutineSkinType(e.target.value)}
                  placeholder="e.g. Combination & Melanin-Rich"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs text-[#0F0F10] bg-[#FAF9F6] font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#0F0F10] block mb-1.5">
                  Time of Day
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['morning', 'evening', 'both'] as const).map((tod) => (
                    <button
                      key={tod}
                      type="button"
                      onClick={() => setRoutineTimeOfDay(tod)}
                      className={`py-2 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                        routineTimeOfDay === tod
                          ? 'bg-[#0F0F10] text-[#D4AF37]'
                          : 'bg-[#FAF9F6] text-[#6B7280] border border-[#E5E7EB]'
                      }`}
                    >
                      {tod}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step-by-Step Regimen Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-[#0F0F10]">
                Regimen Steps ({routineSteps.length})
              </h3>
              <button
                type="button"
                onClick={() => {
                  setRoutineSteps([
                    ...routineSteps,
                    {
                      id: `step-${Date.now()}`,
                      stepNumber: routineSteps.length + 1,
                      name: 'Barrier Lock Moisture Step',
                      productId: products[3]?.id || products[0]?.id,
                      proTip: 'Smooth a nickel-sized amount across face and decolletage to seal active layers.'
                    }
                  ]);
                }}
                className="px-4 py-1.5 rounded-full border border-[#D4AF37] bg-[#FBF5E8] text-[#997A2E] text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Plus size={13} />
                <span>Add Regimen Step</span>
              </button>
            </div>

            {routineSteps.map((step, idx) => {
              const matchedProduct = products.find((p) => p.id === step.productId) || products[0];
              return (
                <div
                  key={step.id}
                  className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <span className="w-8 h-8 rounded-2xl bg-[#0F0F10] text-[#D4AF37] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      0{idx + 1}
                    </span>

                    <div className="space-y-2 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <input
                          type="text"
                          value={step.name}
                          onChange={(e) => {
                            const updated = [...routineSteps];
                            updated[idx].name = e.target.value;
                            setRoutineSteps(updated);
                          }}
                          className="font-heading font-bold text-sm text-[#0F0F10] border-b border-transparent hover:border-[#D4AF37] focus:border-[#D4AF37] focus:outline-none"
                        />

                        <select
                          value={step.productId}
                          onChange={(e) => {
                            const updated = [...routineSteps];
                            updated[idx].productId = e.target.value;
                            setRoutineSteps(updated);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-[#E5E7EB] bg-[#FAF9F6] text-xs font-medium cursor-pointer"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (₦{p.price.toLocaleString('en-NG')})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-[#9CA3AF] uppercase block">
                          Creator Pro-Tip
                        </label>
                        <input
                          type="text"
                          value={step.proTip}
                          onChange={(e) => {
                            const updated = [...routineSteps];
                            updated[idx].proTip = e.target.value;
                            setRoutineSteps(updated);
                          }}
                          className="w-full text-xs text-[#4B5563] border-b border-transparent hover:border-[#E5E7EB] focus:border-[#D4AF37] focus:outline-none py-1"
                        />
                      </div>
                    </div>
                  </div>

                  {routineSteps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setRoutineSteps(routineSteps.filter((s) => s.id !== step.id))}
                      className="text-rose-500 hover:text-rose-700 text-xs font-semibold self-end md:self-auto cursor-pointer p-1"
                      title="Remove step"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ==================================================== */}
      {/* 3. CLINICAL PRODUCT REVIEW INTERFACE */}
      {/* ==================================================== */}
      {selectedFormat === 'review' && (
        <section className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#0F0F10] block mb-1.5">
                  Select Formulation to Review
                </label>
                <select
                  value={reviewProductId}
                  onChange={(e) => setReviewProductId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37] bg-[#FAF9F6] font-medium cursor-pointer"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} • ₦{p.price.toLocaleString('en-NG')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#0F0F10] block mb-1.5">
                  Clinical Wear Duration
                </label>
                <input
                  type="text"
                  value={testingDuration}
                  onChange={(e) => setTestingDuration(e.target.value)}
                  placeholder="e.g. 14 Days Clinical Wear Test"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs text-[#0F0F10] bg-[#FAF9F6] font-medium"
                />
              </div>
            </div>

            {/* Scorecard Metrics */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E] block">
                Formulation Performance Scorecard (1 - 5 Stars)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="font-bold text-[#0F0F10] block mb-1">Absorption Speed</span>
                  <div className="flex gap-1 text-[#D4AF37]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        fill={star <= absorptionScore ? 'currentColor' : 'none'}
                        onClick={() => setAbsorptionScore(star)}
                        className="cursor-pointer"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-[#0F0F10] block mb-1">Skin Feel &amp; Texture</span>
                  <div className="flex gap-1 text-[#D4AF37]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        fill={star <= textureScore ? 'currentColor' : 'none'}
                        onClick={() => setTextureScore(star)}
                        className="cursor-pointer"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-[#0F0F10] block mb-1">Moisture Longevity</span>
                  <div className="flex gap-1 text-[#D4AF37]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        fill={star <= longevityScore ? 'currentColor' : 'none'}
                        onClick={() => setLongevityScore(star)}
                        className="cursor-pointer"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Written Clinical Verdict */}
            <div>
              <label className="text-xs font-bold text-[#0F0F10] block mb-1.5">
                Detailed Clinical Verdict &amp; Skin Transformation
              </label>
              <textarea
                rows={4}
                value={reviewVerdict}
                onChange={(e) => setReviewVerdict(e.target.value)}
                placeholder="Give your honest verdict on texture, skin barrier results, and application..."
                className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37] bg-[#FAF9F6]"
              />
            </div>
          </div>
        </section>
      )}

      {/* ==================================================== */}
      {/* 4. TECHNIQUE TUTORIAL INTERFACE */}
      {/* ==================================================== */}
      {selectedFormat === 'tutorial' && (
        <section className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-[#0F0F10] block mb-1.5">
                  Tutorial Title
                </label>
                <input
                  type="text"
                  value={tutorialTitle}
                  onChange={(e) => setTutorialTitle(e.target.value)}
                  placeholder="e.g. 60-Second Facial Lymphatic Drainage & Oil Press"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs text-[#0F0F10] bg-[#FAF9F6] font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#0F0F10] block mb-1.5">
                  Technique Difficulty
                </label>
                <select
                  value={tutorialDifficulty}
                  onChange={(e) => setTutorialDifficulty(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs text-[#0F0F10] bg-[#FAF9F6] font-medium cursor-pointer"
                >
                  <option value="Beginner">Beginner Everyday</option>
                  <option value="Intermediate">Intermediate Sculpt</option>
                  <option value="Masterclass">Pro Aesthetician Masterclass</option>
                </select>
              </div>
            </div>

            {/* Tutorial Walkthrough Steps */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-[#0F0F10] block">
                Step-by-Step Hands-On Instructions
              </span>

              {tutorialSteps.map((tut, i) => (
                <div key={tut.id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#0F0F10] text-[#D4AF37] font-mono text-xs flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={tut.title}
                      onChange={(e) => {
                        const copy = [...tutorialSteps];
                        copy[i].title = e.target.value;
                        setTutorialSteps(copy);
                      }}
                      className="font-bold text-xs text-[#0F0F10] w-full bg-transparent border-b border-transparent focus:border-[#D4AF37] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={tut.detail}
                      onChange={(e) => {
                        const copy = [...tutorialSteps];
                        copy[i].detail = e.target.value;
                        setTutorialSteps(copy);
                      }}
                      className="text-xs text-[#6B7280] w-full bg-transparent border-b border-transparent focus:border-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
