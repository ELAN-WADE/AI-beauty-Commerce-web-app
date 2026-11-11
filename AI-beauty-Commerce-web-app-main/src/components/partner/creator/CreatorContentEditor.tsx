import { useSocialConnections } from '../../../lib/use-social-connections';
import React, { useState, useRef } from 'react';
import {
  Video,
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
  Image as ImageIcon,
  X,
  AlertCircle
} from 'lucide-react';
import { buildCreatorSubmission } from '../../../lib/creator-submission';
import { writePartnerWorkspace, uploadPartnerMedia } from '../../../lib/owned-api';
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
  const { products, createCommunityPost, authUser, navigateTo, addToCart, isLiveBackend } = useApp();
  const [saving, setSaving] = useState(false);
  const [savedRecord, setSavedRecord] = useState<{id: string; version: number} | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<ContentFormat>('video');

  // ----------------------------------------------------
  // 1. Short Video / Reel State & Media Engine
  // ----------------------------------------------------
  const [videoTitle, setVideoTitle] = useState('');
  const [videoCaption, setVideoCaption] = useState('');
  const [videoFilter, setVideoFilter] = useState('Natural Radiance 4K');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [videoFileName, setVideoFileName] = useState('');
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const mediaPreviewUrl = videoPreviewUrl.trim();
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');
  const [mediaFileSize, setMediaFileSize] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Social Connections & OAuth
  const [socialModal, setSocialModal] = useState<'tiktok' | 'instagram' | null>(null);
  const social = useSocialConnections(authUser?.id);
  const tiktokAccount = social.account('tiktok'), instagramAccount = social.account('instagram');
  const isAuthorizing = social.authorizing;
  const modalAccount = socialModal === 'tiktok' ? tiktokAccount : instagramAccount;
  const modalHandle = modalAccount.handle, modalFollowers = modalAccount.followers;

  const [postToCommunity, setPostToCommunity] = useState(true);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([
    '#DelslaBeauty',
    '#NaturalGlow',
    '#NigerianSkincare',
    '#CleanBeautyAfrica'
  ]);

  // ----------------------------------------------------
  // 2. Routine Builder State
  // ----------------------------------------------------
  const [routineTitle, setRoutineTitle] = useState('');
  const [routineCategory, setRoutineCategory] = useState('');
  const [routineSkinType, setRoutineSkinType] = useState('');
  const [routineTimeOfDay, setRoutineTimeOfDay] = useState<'morning' | 'evening' | 'both'>('morning');
  const [routineSteps, setRoutineSteps] = useState([{ id: 'step-1', stepNumber: 1, name: '', productId: '', proTip: '' }]);

  // ----------------------------------------------------
  // 3. Product Review State
  // ----------------------------------------------------
  const [reviewProductId, setReviewProductId] = useState('');
  const [reviewVerdict, setReviewVerdict] = useState('');
  const [testingDuration, setTestingDuration] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [textureScore, setTextureScore] = useState(0);
  const [absorptionScore, setAbsorptionScore] = useState(0);
  const [longevityScore, setLongevityScore] = useState(0);

  // ----------------------------------------------------
  // 4. Technique Tutorial State
  // ----------------------------------------------------
  const [tutorialTitle, setTutorialTitle] = useState('');
  const [tutorialDifficulty, setTutorialDifficulty] = useState<'Beginner' | 'Intermediate' | 'Masterclass'>('Beginner');
  const [tutorialSteps, setTutorialSteps] = useState([{ id: 'tut-1', title: '', detail: '' }]);

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
      icon: Layers,
      desc: 'Step-by-step shoppable regimen'
    },
    {
      id: 'review',
      label: 'Product Review',
      icon: Star,
      desc: 'Natural scorecard & verified wear test'
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

  const handleFileSelect = (file: File) => {
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v)$/i.test(file.name);
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);

    if (!isVideo && !isImage) {
      setToastMessage('Please select a valid video (.mp4, .mov, .webm) or high-res image.');
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

    setVideoPreviewUrl(objectUrl);
    setVideoFileName(file.name);
    setMediaType(isVideo ? 'video' : 'image');
    setMediaFileSize(`${sizeMb} MB`);

    setToastMessage(`✓ ${file.name} loaded (${sizeMb} MB) • Uploading media…`);
    uploadPartnerMedia(file).then(res => {
      if (res?.url) {
        setVideoPreviewUrl(res.url);
        setToastMessage(`✓ ${file.name} uploaded successfully`);
      }
    }).catch(() => {
      setToastMessage(`Upload failed. ${file.name} is a local preview only. Select the file again to retry or enter a hosted HTTPS URL.`);
    }).finally(() => setTimeout(() => setToastMessage(null), 4000));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const openSocialConnect = (platform: 'tiktok' | 'instagram') => setSocialModal(platform);
  const handleSaveSocialChannel = () => { if (socialModal) void social.connect(socialModal); };
  const handleDisconnectSocial = (platform: 'tiktok' | 'instagram') => { void social.disconnect(platform); };

  const saveContent = async (status: 'DRAFT' | 'SUBMITTED') => {
    if (saving) return;
    setSaving(true);
    try {
      const content = buildCreatorSubmission({ format: selectedFormat, videoTitle, videoCaption, mediaUrl: videoPreviewUrl, selectedProductIds, routineTitle, routineCategory, routineSkinType, routineTimeOfDay, routineSteps, reviewProductId, reviewVerdict, testingDuration, textureScore, absorptionScore, longevityScore, tutorialTitle, tutorialDifficulty, tutorialSteps }, products, status === 'SUBMITTED');
      const { result: saved } = await writePartnerWorkspace({ action: 'save', kind: 'CREATOR', type: 'CONTENT', ...savedRecord, status, ...content });
      setSavedRecord({ id: saved.id, version: saved.version });
      setToastMessage(status === 'DRAFT' ? 'Draft saved to your content library.' : 'Submitted for administrator review.');
      if (status === 'SUBMITTED') onPublishSuccess?.();
    } catch (error) { setToastMessage(error instanceof Error ? error.message : 'Content could not be saved.'); }
    finally { setSaving(false); }
  };

  const handlePublish = async () => { await saveContent('SUBMITTED'); };

  // ----------------------------------------------------
  // Content is submitted for administrator review through saveContent.
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
            Craft high-converting short video reels, step-by-step regimens, and verified natural reviews.
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
            disabled={saving} onClick={() => void saveContent('DRAFT')}
            className="px-4 py-2 rounded-full border border-[#D4AF37] bg-[#FBF5E8] hover:bg-[#F3EEE3] text-xs font-bold text-[#997A2E] cursor-pointer active:scale-95 transition-all"
          >
            Save Draft
          </button>
          <button
            disabled={saving} onClick={handlePublish}
            className="px-6 py-2 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-[#D4AF37] text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <span>Submit for review</span>
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
                  ● {Number(tiktokAccount.connected) + Number(instagramAccount.connected)} CHANNELS ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* TikTok Account */}
                <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center font-bold text-xs shadow-xs"><img src="/icons/tiktok.svg" alt="TikTok" width={18} height={18}/></div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-xs text-[#0F0F10]">{tiktokAccount.handle}</span>
                          {tiktokAccount.connected && <CheckCircle2 size={11} className="text-[#997A2E]" />}
                        </div>
                        <span className="text-[10px] text-[#6B7280]">{tiktokAccount.followers}</span>
                      </div>
                    </div>
                    {tiktokAccount.connected && (
                      <a
                        href={tiktokAccount.profileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#9CA3AF] hover:text-[#0F0F10] p-1"
                        title="Open TikTok Profile"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#E5E7EB]/60">
                    <span className="text-[9.5px] font-mono text-[#6B7280]">
                      {tiktokAccount.connected ? 'Account Connected' : 'Not Connected'}
                    </span>
                    <button
                      type="button"
                      onClick={() => openSocialConnect('tiktok')}
                      className={`text-[11px] font-bold px-3 py-1 rounded-full cursor-pointer transition-all ${
                        tiktokAccount.connected
                          ? 'bg-[#0F0F10] text-white hover:bg-[#27272A]'
                          : 'bg-[#0F0F10] text-[#D4AF37] hover:bg-[#27272A]'
                      }`}
                    >
                      {tiktokAccount.connected ? 'Configure' : '+ Connect TikTok'}
                    </button>
                  </div>
                </div>

                {/* Instagram Reels Account */}
                <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#0F0F10] text-white flex items-center justify-center font-bold text-xs shadow-xs"><img src="/icons/instagram.svg" alt="Instagram" width={18} height={18}/></div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-xs text-[#0F0F10]">{instagramAccount.handle}</span>
                          {instagramAccount.connected && <CheckCircle2 size={11} className="text-[#997A2E]" />}
                        </div>
                        <span className="text-[10px] text-[#6B7280]">{instagramAccount.followers}</span>
                      </div>
                    </div>
                    {instagramAccount.connected && (
                      <a
                        href={instagramAccount.profileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#9CA3AF] hover:text-[#0F0F10] p-1"
                        title="Open Instagram Profile"
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#E5E7EB]/60">
                    <span className="text-[9.5px] font-mono text-[#6B7280]">
                      {instagramAccount.connected ? 'Account Connected' : 'Not Connected'}
                    </span>
                    <button
                      type="button"
                      onClick={() => openSocialConnect('instagram')}
                      className={`text-[11px] font-bold px-3 py-1 rounded-full cursor-pointer transition-all ${
                        instagramAccount.connected
                          ? 'bg-[#0F0F10] text-white hover:bg-[#27272A]'
                          : 'bg-[#0F0F10] text-[#D4AF37] hover:bg-[#27272A]'
                      }`}
                    >
                      {instagramAccount.connected ? 'Configure' : '+ Connect Instagram'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Video & Media File Uploader (Native HTML5 Drag & Drop) */}
            <div className="p-5 rounded-3xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/x-m4v,image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-[#0F0F10] block mb-0.5">
                    Upload Reel Media (CapCut / Phone / Camera)
                  </label>
                  <p className="text-[11px] text-[#6B7280]">
                    Select from device or drag &amp; drop your vertical 9:16 MP4, MOV, or photography.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-[#6B7280]">
                  {mediaType === 'video' ? 'VIDEO ENGINE' : 'PHOTO ENGINE'}
                </span>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? 'border-[#D4AF37] bg-[#FBF5E8]'
                    : 'border-[#D4AF37]/50 bg-[#FAF9F6]/80 hover:bg-[#FAF9F6] hover:border-[#D4AF37]'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-[#FBF5E8] text-[#997A2E] flex items-center justify-center shadow-xs">
                  {mediaType === 'video' ? <Film size={22} /> : <ImageIcon size={22} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0F0F10] flex items-center justify-center gap-1.5">
                    <span>Active File:</span>
                    <span className="font-mono text-[#997A2E] underline underline-offset-2">{videoFileName}</span>
                  </p>
                  <p className="text-[10px] text-[#6B7280] mt-1 font-mono">
                    Size: {mediaFileSize} • {mediaType === 'video' ? 'Vertical 1080x1920 (9:16) MP4/WebM' : 'High-Res Regimen Image'}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1.5 rounded-full bg-white border border-[#E5E7EB] text-[11px] font-bold text-[#0F0F10] hover:bg-[#FAF9F6] shadow-xs flex items-center gap-1.5">
                    <Upload size={12} className="text-[#997A2E]" />
                    <span>Choose File from Device</span>
                  </span>
                </div>
              </div>

              {/* Beauty Filter Preset */}
              <div>
                <label className="text-xs font-bold text-[#0F0F10] block mb-1.5 flex items-center gap-1.5">
                  <Sliders size={13} className="text-[#997A2E]" />
                  <span>Beauty Lighting &amp; Color Grading Preset</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    'Natural Radiance 4K',
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
                    '#NaturalGlow',
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
                  Your assigned commission
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
                {!mediaPreviewUrl ? (
                  <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-white/80">
                    <Video size={28} aria-hidden="true" />
                    <p className="text-sm">Choose a video or image to preview.</p>
                  </div>
                ) : mediaType === 'video' ? (
                  <video
                    key={mediaPreviewUrl}
                    src={mediaPreviewUrl || undefined}
                    controls
                    playsInline
                    autoPlay
                    loop
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={mediaPreviewUrl || undefined}
                    alt="Reel preview"
                    className="w-full h-full object-cover opacity-90"
                  />
                )}

                {/* Ambient Scrim Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

                {/* Filter Stamp Badge */}
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] font-mono text-white/90 border border-white/20">
                  {videoFilter}
                </div>

                {/* Right Reel Action Icons (TikTok / IG style) */}
                <div className="absolute right-2.5 bottom-16 flex flex-col items-center gap-3 text-white pointer-events-none">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-rose-500">
                      <Heart size={16} fill="currentColor" />
                    </div>
                    <span className="text-[9px] font-mono mt-0.5">Preview</span>
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
                <div className="absolute bottom-3 left-3 right-12 text-white space-y-1.5 pointer-events-none">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs">{tiktokAccount.handle || ''}</span>
                    <span className="text-[9px] font-mono text-[#D4AF37] bg-[#D4AF37]/20 px-1.5 py-0.2 rounded-full border border-[#D4AF37]/30">
                      {tiktokAccount.connected ? 'CONNECTED' : 'DELSLA'}
                    </span>
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
                  placeholder="e.g. Morning Natural Barrier Shield"
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
                  <option>Natural UV Defense &amp; Glow</option>
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
                  placeholder="e.g. Combination & Natural"
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
              const matchedProduct = products.find((p) => p.id === step.productId);
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
                          <option value="">Choose a formulation</option>
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
      {/* 3. NATURAL PRODUCT REVIEW INTERFACE */}
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
                  Natural Wear Duration
                </label>
                <input
                  type="text"
                  value={testingDuration}
                  onChange={(e) => setTestingDuration(e.target.value)}
                  placeholder="e.g. 14 Days Natural Wear Test"
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

            {/* Written Natural Verdict */}
            <div>
              <label className="text-xs font-bold text-[#0F0F10] block mb-1.5">
                Detailed Natural Verdict &amp; Skin Transformation
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
                  aria-label="Tutorial title"
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
                      aria-label={`Tutorial step ${i + 1} title`}
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
                      aria-label={`Tutorial step ${i + 1} instructions`}
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

      {isLiveBackend && <label className="block rounded-2xl border bg-white p-4 text-xs">Hosted media URL (HTTPS)
        <input aria-label="Hosted media URL" className="mt-2 w-full rounded-xl border p-3" value={videoPreviewUrl} onChange={event => setVideoPreviewUrl(event.target.value)} />
      </label>}
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-300 max-w-md">
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span className="text-white">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white cursor-pointer ml-3"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Social Account Linking Modal */}
      {socialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E5E7EB] space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center font-bold text-xs shadow-xs">
                  {socialModal === 'tiktok' ? 'TT' : 'IG'}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-[#0F0F10]">
                    {socialModal === 'tiktok' ? 'TikTok Creator Connection' : 'Instagram Reels API'}
                  </h3>
                  <span className="text-[10px] font-mono text-[#6B7280]">
                    OAuth 2.0 Partner Integration
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSocialModal(null)}
                className="w-8 h-8 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-[#6B7280] hover:text-[#0F0F10] flex items-center justify-center cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-xs text-[#6B7280] leading-relaxed">
              Authorize your {socialModal === 'tiktok' ? 'TikTok' : 'Instagram professional'} account to read its profile. Instagram uses Facebook Login and requires a linked Facebook Page. Channel connection does not publish content automatically.
            </p>

            {/* Direct Web Authentication Link */}
            <div className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#0F0F10] block">
                  Authenticate on {socialModal === 'tiktok' ? 'TikTok.com' : 'Facebook.com'}
                </span>
                <span className="text-[10px] text-[#6B7280]">
                  Opens official login page in a new window
                </span>
              </div>
              <button
                type="button"
                onClick={handleSaveSocialChannel}
                disabled={isAuthorizing || !modalAccount.configured}
                className="px-3 py-1.5 rounded-full bg-white border border-[#E5E7EB] hover:bg-[#FAF9F6] text-xs font-bold text-[#0F0F10] flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95 transition-all"
              >
                <span>Open Login</span>
                <ExternalLink size={12} />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#0F0F10] block mb-1">
                  Creator Vanity Handle
                </label>
                <input
                  type="text"
                  value={modalHandle}
                  readOnly
                  placeholder="Available after authorization"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs text-[#0F0F10] bg-[#FAF9F6] font-mono focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#0F0F10] block mb-1">
                  Verified Follower Community
                </label>
                <input
                  type="text"
                  value={modalFollowers}
                  readOnly
                  placeholder="Not provided by the channel"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs text-[#0F0F10] bg-[#FAF9F6] font-medium focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#FBF5E8]/60 border border-[#D4AF37]/30 space-y-2 text-xs">
              <p>{modalAccount.configured ? 'Profile access is requested on the provider’s consent screen.' : 'Developer app credentials and callback URLs have not been configured yet.'}</p>
              <p>No social passwords are collected by Desla.</p>
              {social.error && <p role="alert">{social.error}</p>}
              {social.pending.filter(item => item.provider === socialModal).map(item => <div key={item.grant}>
                <p>Choose the Instagram account to connect:</p>
                {item.accounts.map(account => <button key={account.accountId} type="button" className="block underline py-2" onClick={() => { void social.select(item.provider, item.grant, account.accountId); }}>{account.handle} — {account.displayName}</button>)}
              </div>)}
              {isAuthorizing && <button type="button" className="underline" onClick={social.cancel}>Stop waiting</button>}
            </div>

            {/* CTAs */}
            <div className="flex items-center justify-between gap-3 pt-2">
              {(socialModal === 'tiktok' ? tiktokAccount.connected : instagramAccount.connected) ? (
                <button
                  type="button"
                  onClick={() => handleDisconnectSocial(socialModal)}
                  className="px-4 py-2 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer transition-colors"
                >
                  Disconnect
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSocialModal(null)}
                  className="px-4 py-2 rounded-full border border-[#E5E7EB] bg-white text-xs font-bold text-[#6B7280] hover:text-[#0F0F10] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isAuthorizing || !modalAccount.configured}
                  onClick={handleSaveSocialChannel}
                  className="px-5 py-2 rounded-full bg-[#0F0F10] text-[#D4AF37] hover:bg-[#27272A] text-xs font-bold cursor-pointer shadow-sm active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isAuthorizing ? (
                    <span>Authorizing API…</span>
                  ) : (
                    <>
                      <Check size={13} />
                      <span>Authorize &amp; Link Channel</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
