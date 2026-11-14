import { useSocialConnections } from '../../../lib/use-social-connections';
import React, { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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
} from '../../common/SolidIcons';
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
  const { products, authUser, isLiveBackend } = useApp();
  const shouldReduceMotion = useReducedMotion();
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

  // Saved social profile links
  const [socialModal, setSocialModal] = useState<'tiktok' | 'instagram' | null>(null);
  const social = useSocialConnections(authUser?.id);
  const tiktokAccount = social.account('tiktok'), instagramAccount = social.account('instagram');
  const isAuthorizing = social.saving;
  const [profileUrl, setProfileUrl] = useState('');
  const modalAccount = socialModal === 'tiktok' ? tiktokAccount : instagramAccount;
  const dialogRef = useRef<HTMLFormElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const savingProfile = useRef(isAuthorizing); savingProfile.current = isAuthorizing;
  useEffect(() => {
    if (!socialModal) return;
    const previous = triggerRef.current;
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !savingProfile.current) { event.preventDefault(); setSocialModal(null); }
      if (event.key !== 'Tab') return;
      const nodes = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled])') || []);
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); previous?.focus(); };
  }, [socialModal]);

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

    setToastMessage(`${file.name} loaded (${sizeMb} MB). Uploading media...`);
    uploadPartnerMedia(file).then(res => {
      if (res?.url) {
        setVideoPreviewUrl(res.url);
        setToastMessage(`${file.name} uploaded successfully`);
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

  const openSocialConnect = (platform: 'tiktok' | 'instagram') => { triggerRef.current = document.activeElement as HTMLElement; setProfileUrl(social.account(platform).profileUrl); setSocialModal(platform); };
  const handleSaveSocialChannel = async () => { if (socialModal && await social.save(socialModal, profileUrl)) setSocialModal(null); };

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

  const studioEase = [0.23, 1, 0.32, 1] as const;

  // Content is submitted for administrator review through saveContent.
  return (
    <div className="space-y-6 pb-16">
      {/* Studio Composition Header with Shared-Element Hero Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-6 border-b border-[#E5E7EB]">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
          {/* Settled Shared-Element Studio Card (capped width on mobile so it integrates into layout) */}
          <motion.div
            layoutId={!shouldReduceMotion ? 'creator-studio-hero-card' : undefined}
            transition={{ duration: shouldReduceMotion ? 0 : 0.36, ease: studioEase }}
            className="relative w-full max-w-[240px] sm:w-48 md:w-52 aspect-[16/10] rounded-2xl overflow-hidden bg-[#18181B] shadow-[0_8px_24px_-6px_rgba(0,0,0,0.16)] shrink-0"
          >
            <img
              src="/tile_create_studio.jpg"
              alt="Creator Studio"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
              <span className="font-mono text-[10px] tracking-wider text-white/80">01</span>
              <span className="text-xs font-medium text-white">Creator Studio</span>
            </div>
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.05, ease: studioEase }}
            className="space-y-1"
          >
            <p className="text-xs font-medium text-[#6B7280]">
              Creator Studio Suite
            </p>
            <h1 className="font-heading font-semibold text-xl sm:text-2xl text-[#0F0F10] tracking-tight">
              Create New Content
            </h1>
            <p className="text-sm text-[#6B7280] max-w-md leading-relaxed">
              Craft short video reels, step-by-step regimens, and verified product reviews.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: 0.08, ease: studioEase }}
          className="flex flex-wrap items-center gap-2.5"
        >
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="min-h-11 px-4 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-medium text-[#0F0F10] cursor-pointer transition-colors touch-manipulation"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveContent('DRAFT')}
            className="min-h-11 px-4 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#FAF9F6] text-xs font-medium text-[#0F0F10] cursor-pointer active:scale-[0.98] transition-all disabled:opacity-50 touch-manipulation"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handlePublish}
            className="min-h-11 px-5 rounded-xl bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs font-medium cursor-pointer flex items-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 touch-manipulation"
          >
            <span>{saving ? 'Submitting...' : 'Submit for review'}</span>
            <ArrowRight size={14} />
          </button>
        </motion.div>
      </div>

      {/* Format Selector Pills */}
      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1, ease: studioEase }}
        className="space-y-3"
      >
        <label className="text-sm font-medium text-[#0F0F10] block">
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
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between min-h-[96px] transition-colors cursor-pointer touch-manipulation ${
                  isSelected
                    ? 'border-[#0F0F10] bg-[#FAF9F6]'
                    : 'border-[#E5E7EB] bg-white hover:border-[#9CA3AF]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#0F0F10] text-white' : 'bg-[#FAF9F6] text-[#6B7280]'}`}>
                    <Icon size={16} />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#0F0F10]">{f.label}</h3>
                  <p className="text-xs text-[#6B7280] line-clamp-1 mt-0.5">{f.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </motion.section>

      {/* ==================================================== */}
      {/* 1. SHORT VIDEO / REEL CREATION INTERFACE */}
      {/* ==================================================== */}
      {selectedFormat === 'video' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Video Upload, TikTok Sync & Caption */}
          <div className="lg:col-span-7 space-y-5">
            {/* Social Accounts Sync Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs text-[#6B7280] block">
                    Social Cross-Publishing
                  </span>
                  <h3 className="font-heading font-medium text-base text-[#0F0F10]">
                    Connected Creator Accounts
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#4B5563] bg-[#FAF9F6] px-2.5 py-1 rounded-lg border border-[#E5E7EB]">
                  {Number(tiktokAccount.saved) + Number(instagramAccount.saved)} profile links saved
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* TikTok Account */}
                <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#0F0F10] flex items-center justify-center shrink-0"><img src="/icons/tiktok.svg" alt="TikTok" width={18} height={18}/></div>
                      <div className="min-w-0">
                        <span className="font-medium text-sm text-[#0F0F10] block truncate">{tiktokAccount.handle || 'TikTok'}</span>
                        <span className="text-xs text-[#6B7280] block truncate">{tiktokAccount.followers}</span>
                      </div>
                    </div>
                    {tiktokAccount.saved && (
                      <a
                        href={tiktokAccount.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-10 min-w-10 rounded-lg text-[#6B7280] hover:text-[#0F0F10] hover:bg-white flex items-center justify-center shrink-0"
                        title="Open TikTok Profile"
                        aria-label="Open TikTok Profile"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E5E7EB]/80">
                    <span className="text-xs text-[#6B7280]">
                      {tiktokAccount.saved ? 'Profile link saved' : 'Not linked'}
                    </span>
                    <button
                      type="button"
                      onClick={() => openSocialConnect('tiktok')}
                      className="min-h-10 text-xs font-medium px-3.5 rounded-lg bg-[#0F0F10] text-white hover:bg-[#27272A] cursor-pointer transition-colors touch-manipulation"
                    >
                      {tiktokAccount.saved ? 'Edit link' : '+ Add TikTok'}
                    </button>
                  </div>
                </div>

                {/* Instagram Reels Account */}
                <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#0F0F10] flex items-center justify-center shrink-0"><img src="/icons/instagram.svg" alt="Instagram" width={18} height={18}/></div>
                      <div className="min-w-0">
                        <span className="font-medium text-sm text-[#0F0F10] block truncate">{instagramAccount.handle || 'Instagram'}</span>
                        <span className="text-xs text-[#6B7280] block truncate">{instagramAccount.followers}</span>
                      </div>
                    </div>
                    {instagramAccount.saved && (
                      <a
                        href={instagramAccount.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-10 min-w-10 rounded-lg text-[#6B7280] hover:text-[#0F0F10] hover:bg-white flex items-center justify-center shrink-0"
                        title="Open Instagram Profile"
                        aria-label="Open Instagram Profile"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E5E7EB]/80">
                    <span className="text-xs text-[#6B7280]">
                      {instagramAccount.saved ? 'Profile link saved' : 'Not linked'}
                    </span>
                    <button
                      type="button"
                      onClick={() => openSocialConnect('instagram')}
                      className="min-h-10 text-xs font-medium px-3.5 rounded-lg bg-[#0F0F10] text-white hover:bg-[#27272A] cursor-pointer transition-colors touch-manipulation"
                    >
                      {instagramAccount.saved ? 'Edit link' : '+ Add Instagram'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Video & Media File Uploader (Native HTML5 Drag & Drop) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-4">
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

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="text-sm font-medium text-[#0F0F10] block mb-0.5">
                    Upload Reel Media
                  </label>
                  <p className="text-xs text-[#6B7280]">
                    Select from device or drop a vertical 9:16 video or image.
                  </p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-[#FAF9F6] border border-[#E5E7EB] text-[#4B5563]">
                  {mediaType === 'video' ? 'Video' : 'Photo'}
                </span>
              </div>

              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed rounded-2xl p-5 text-center transition-colors cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
                  isDragging
                    ? 'border-[#0F0F10] bg-[#FAF9F6]'
                    : 'border-[#D1D5DB] bg-[#FAF9F6]/70 hover:bg-[#FAF9F6] hover:border-[#0F0F10]'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-white border border-[#E5E7EB] text-[#0F0F10] flex items-center justify-center">
                  {mediaType === 'video' ? <Film size={20} /> : <ImageIcon size={20} />}
                </div>
                <div>
                  {videoFileName ? (
                    <p className="text-xs font-medium text-[#0F0F10] flex flex-wrap items-center justify-center gap-1.5">
                      <span>Selected file:</span>
                      <span className="font-mono underline underline-offset-2">{videoFileName}</span>
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-[#0F0F10]">
                      Drop media here or browse device
                    </p>
                  )}
                  <p className="text-xs text-[#6B7280] mt-1">
                    {mediaFileSize ? `${mediaFileSize} — ` : ''}
                    {mediaType === 'video' ? 'Vertical 1080x1920 (9:16) MP4 or WebM' : 'High-resolution photography'}
                  </p>
                </div>
                <span className="mt-1 min-h-10 px-4 rounded-xl bg-white border border-[#E5E7EB] text-xs font-medium text-[#0F0F10] inline-flex items-center gap-1.5">
                  <Upload size={13} />
                  <span>Choose File</span>
                </span>
              </div>

              {/* Beauty Filter Preset */}
              <div>
                <label className="text-sm font-medium text-[#0F0F10] mb-2 flex items-center gap-1.5">
                  <Sliders size={14} className="text-[#4B5563]" />
                  <span>Color &amp; Lighting Preset</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                      className={`min-h-10 px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer touch-manipulation ${
                        videoFilter === filter
                          ? 'border-[#0F0F10] bg-[#0F0F10] text-white'
                          : 'border-[#E5E7EB] bg-[#FAF9F6] text-[#4B5563] hover:text-[#0F0F10]'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Video Details & Caption */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-4">
              <div>
                <label className="text-sm font-medium text-[#0F0F10] block mb-1.5">
                  Reel Title
                </label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="e.g. My 3-Drop Radiance Routine for Lekki Sun"
                  className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-base sm:text-sm text-[#0F0F10] focus:outline-none focus:border-[#0F0F10] bg-[#FAF9F6]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#0F0F10] block mb-1.5">
                  Caption &amp; Creator Takeaway
                </label>
                <textarea
                  rows={3}
                  value={videoCaption}
                  onChange={(e) => setVideoCaption(e.target.value)}
                  placeholder="Explain why you love these formulations..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-base sm:text-sm text-[#0F0F10] focus:outline-none focus:border-[#0F0F10] bg-[#FAF9F6]"
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
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs text-[#6B7280] block">
                    Shoppable Attribution
                  </span>
                  <h3 className="font-heading font-medium text-base text-[#0F0F10]">
                    Tag Formulations in Reel
                  </h3>
                </div>
                <span className="text-xs text-[#6B7280]">
                  Assigned commission
                </span>
              </div>

              <p className="text-xs text-[#6B7280]">
                Select the formulations featured in this clip:
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {products.slice(0, 5).map((p) => {
                  const isTagged = selectedProductIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProductSelection(p.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isTagged
                          ? 'border-[#0F0F10] bg-[#FAF9F6]'
                          : 'border-[#E5E7EB] bg-white hover:bg-[#FAF9F6]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover border border-[#E5E7EB] shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-medium text-xs text-[#0F0F10] block truncate">
                            {p.name}
                          </span>
                          <span className="font-mono text-xs text-[#6B7280]">
                            ₦{p.price.toLocaleString('en-NG')} (Est. ₦{Math.round(p.price * 0.12).toLocaleString('en-NG')})
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          isTagged ? 'bg-[#0F0F10] text-white' : 'border border-[#D1D5DB]'
                        }`}
                      >
                        {isTagged && <Check size={11} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live 9:16 Mobile Reel Preview */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-3">
              <span className="text-xs font-medium text-[#6B7280] block text-center">
                Content Mobile Preview
              </span>

              {/* 9:16 Reel Container */}
              <div className="relative aspect-[9/16] w-full max-w-[260px] mx-auto rounded-2xl overflow-hidden bg-black shadow-md">
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
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono text-white/90">
                  {videoFilter}
                </div>

                {/* Right Reel Action Icons */}
                <div className="absolute right-2.5 bottom-16 flex flex-col items-center gap-3 text-white pointer-events-none">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-rose-500">
                      <Heart size={16} />
                    </div>
                    <span className="text-[10px] font-mono mt-0.5">Preview</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                      <MessageCircle size={15} />
                    </div>
                    <span className="text-[10px] font-mono mt-0.5">Comments</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                      <Share2 size={14} />
                    </div>
                    <span className="text-[10px] font-mono mt-0.5">Share</span>
                  </div>
                </div>

                {/* Bottom Creator Info & Shoppable Tag */}
                <div className="absolute bottom-3 left-3 right-12 text-white space-y-1.5 pointer-events-none">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-xs">{tiktokAccount.handle || ''}</span>
                    <span className="text-[10px] font-mono text-white/80 bg-white/15 px-1.5 py-0.5 rounded-md">
                      {tiktokAccount.saved ? 'Linked' : 'Desla'}
                    </span>
                  </div>

                  <p className="text-[11px] text-white/90 line-clamp-2 leading-snug">
                    {videoCaption}
                  </p>

                  {/* Shoppable Tag Banner */}
                  <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white/20 backdrop-blur-md text-[10px]">
                    <ShoppingBag size={12} className="text-white shrink-0" />
                    <span className="truncate font-medium">
                      {products.find((p) => p.id === selectedProductIds[0])?.name || 'Radiant Glow Oil'}
                    </span>
                    <span className="font-mono text-white font-medium shrink-0 ml-auto">Shop</span>
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
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-[#0F0F10] block mb-1.5">
                  Routine Regimen Title
                </label>
                <input
                  type="text"
                  value={routineTitle}
                  onChange={(e) => setRoutineTitle(e.target.value)}
                  placeholder="e.g. Morning Natural Barrier Shield"
                  className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-base sm:text-sm text-[#0F0F10] focus:outline-none focus:border-[#0F0F10] bg-[#FAF9F6]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#0F0F10] block mb-1.5">
                  Primary Skin Concern
                </label>
                <select
                  value={routineCategory}
                  onChange={(e) => setRoutineCategory(e.target.value)}
                  className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-base sm:text-sm text-[#0F0F10] focus:outline-none focus:border-[#0F0F10] bg-[#FAF9F6] cursor-pointer"
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
                <label className="text-sm font-medium text-[#0F0F10] block mb-1.5">
                  Target Skin Type
                </label>
                <input
                  type="text"
                  value={routineSkinType}
                  onChange={(e) => setRoutineSkinType(e.target.value)}
                  placeholder="e.g. Combination & Natural"
                  className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-base sm:text-sm text-[#0F0F10] bg-[#FAF9F6] focus:outline-none focus:border-[#0F0F10]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#0F0F10] block mb-1.5">
                  Time of Day
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['morning', 'evening', 'both'] as const).map((tod) => (
                    <button
                      key={tod}
                      type="button"
                      onClick={() => setRoutineTimeOfDay(tod)}
                      className={`min-h-11 rounded-xl text-xs font-medium capitalize transition-colors cursor-pointer touch-manipulation ${
                        routineTimeOfDay === tod
                          ? 'bg-[#0F0F10] text-white'
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
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-heading font-medium text-base text-[#0F0F10]">
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
                className="min-h-10 px-4 rounded-xl border border-[#0F0F10] bg-white hover:bg-[#FAF9F6] text-[#0F0F10] text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus size={14} />
                <span>Add Regimen Step</span>
              </button>
            </div>

            {routineSteps.map((step, idx) => {
              return (
                <div
                  key={step.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E7EB] flex flex-col md:flex-row md:items-start justify-between gap-4"
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
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#0F0F10] block mb-1.5">
                  Select Formulation to Review
                </label>
                <select
                  value={reviewProductId}
                  onChange={(e) => setReviewProductId(e.target.value)}
                  className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-base sm:text-sm text-[#0F0F10] focus:outline-none focus:border-[#0F0F10] bg-[#FAF9F6] cursor-pointer"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₦{p.price.toLocaleString('en-NG')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-[#0F0F10] block mb-1.5">
                  Natural Wear Duration
                </label>
                <input
                  type="text"
                  value={testingDuration}
                  onChange={(e) => setTestingDuration(e.target.value)}
                  placeholder="e.g. 14 Days Natural Wear Test"
                  className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-base sm:text-sm text-[#0F0F10] bg-[#FAF9F6] focus:outline-none focus:border-[#0F0F10]"
                />
              </div>
            </div>

            {/* Scorecard Metrics */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-3">
              <span className="text-xs font-medium text-[#4B5563] block">
                Formulation Performance Scorecard (1 - 5 Stars)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="font-medium text-[#0F0F10] block mb-1">Absorption Speed</span>
                  <div className="flex gap-1 text-[#0F0F10]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={18}
                        fill={star <= absorptionScore ? 'currentColor' : 'none'}
                        onClick={() => setAbsorptionScore(star)}
                        className="cursor-pointer"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-medium text-[#0F0F10] block mb-1">Skin Feel &amp; Texture</span>
                  <div className="flex gap-1 text-[#0F0F10]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={18}
                        fill={star <= textureScore ? 'currentColor' : 'none'}
                        onClick={() => setTextureScore(star)}
                        className="cursor-pointer"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-medium text-[#0F0F10] block mb-1">Moisture Longevity</span>
                  <div className="flex gap-1 text-[#0F0F10]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={18}
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
              <label className="text-sm font-medium text-[#0F0F10] block mb-1.5">
                Detailed Natural Verdict &amp; Skin Transformation
              </label>
              <textarea
                rows={4}
                value={reviewVerdict}
                onChange={(e) => setReviewVerdict(e.target.value)}
                placeholder="Give your honest verdict on texture, skin barrier results, and application..."
                className="w-full px-3.5 py-3 rounded-xl border border-[#E5E7EB] text-base sm:text-sm text-[#0F0F10] focus:outline-none focus:border-[#0F0F10] bg-[#FAF9F6]"
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
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-[#0F0F10] block mb-1.5">
                  Tutorial Title
                </label>
                <input
                  type="text"
                  aria-label="Tutorial title"
                  value={tutorialTitle}
                  onChange={(e) => setTutorialTitle(e.target.value)}
                  placeholder="e.g. 60-Second Facial Lymphatic Drainage & Oil Press"
                  className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-base sm:text-sm text-[#0F0F10] bg-[#FAF9F6] focus:outline-none focus:border-[#0F0F10]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-[#0F0F10] block mb-1.5">
                  Technique Difficulty
                </label>
                <select
                  value={tutorialDifficulty}
                  onChange={(e) => setTutorialDifficulty(e.target.value as any)}
                  className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-base sm:text-sm text-[#0F0F10] bg-[#FAF9F6] cursor-pointer focus:outline-none focus:border-[#0F0F10]"
                >
                  <option value="Beginner">Beginner Everyday</option>
                  <option value="Intermediate">Intermediate Sculpt</option>
                  <option value="Masterclass">Pro Aesthetician Masterclass</option>
                </select>
              </div>
            </div>

            {/* Tutorial Walkthrough Steps */}
            <div className="space-y-3 pt-2">
              <span className="text-sm font-medium text-[#0F0F10] block">
                Step-by-Step Hands-On Instructions
              </span>

              {tutorialSteps.map((tut, i) => (
                <div key={tut.id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#0F0F10] text-white font-mono text-xs flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      aria-label={`Tutorial step ${i + 1} title`}
                      value={tut.title}
                      onChange={(e) => {
                        const copy = [...tutorialSteps];
                        copy[i].title = e.target.value;
                        setTutorialSteps(copy);
                      }}
                      className="font-medium text-base sm:text-sm text-[#0F0F10] w-full bg-transparent border-b border-transparent focus:border-[#0F0F10] focus:outline-none"
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
                      className="text-base sm:text-sm text-[#4B5563] w-full bg-transparent border-b border-transparent focus:border-[#0F0F10] focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {isLiveBackend && (
        <label className="block rounded-2xl border border-[#E5E7EB] bg-white p-4 text-sm font-medium text-[#0F0F10]">
          Hosted media URL (HTTPS)
          <input
            aria-label="Hosted media URL"
            className="mt-2 w-full min-h-11 rounded-xl border border-[#E5E7EB] bg-[#FAF9F6] px-3.5 py-2.5 text-base sm:text-sm font-normal focus:outline-none focus:border-[#0F0F10]"
            value={videoPreviewUrl}
            onChange={(event) => setVideoPreviewUrl(event.target.value)}
          />
        </label>
      )}
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 p-3.5 rounded-xl bg-[#0F0F10] text-white flex items-center justify-between gap-3 shadow-xl max-w-md"
        >
          <div className="flex items-center gap-2.5 text-xs">
            <CheckCircle2 size={16} className="shrink-0 text-white" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Dismiss notification"
            className="min-h-8 min-w-8 flex items-center justify-center text-white/70 hover:text-white cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Saved profile links; sign-in happens on the external platform. */}
      {socialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px]">
          <form
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="social-link-title"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSaveSocialChannel();
            }}
            className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[#E5E7EB] space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 id="social-link-title" className="text-base font-semibold text-[#0F0F10]">
                {socialModal === 'tiktok' ? 'TikTok' : 'Instagram'} profile link
              </h3>
              <button
                type="button"
                aria-label="Close profile settings"
                disabled={isAuthorizing}
                onClick={() => setSocialModal(null)}
                className="min-h-10 min-w-10 rounded-lg flex items-center justify-center text-[#6B7280] hover:text-[#0F0F10] hover:bg-[#FAF9F6] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Save your profile address. Sign in and publish directly on the social platform, then submit the published post link in Campaigns for DESLA review.
            </p>
            <label className="block text-sm font-medium text-[#0F0F10]">
              Profile URL
              <input
                autoFocus
                required
                type="url"
                value={profileUrl}
                onChange={(event) => setProfileUrl(event.target.value)}
                placeholder={socialModal === 'tiktok' ? 'https://www.tiktok.com/@yourname' : 'https://www.instagram.com/yourname/'}
                className="mt-2 w-full min-h-11 rounded-xl border border-[#E5E7EB] bg-[#FAF9F6] px-3.5 py-2.5 text-base sm:text-sm font-normal focus:outline-none focus:border-[#0F0F10]"
              />
            </label>
            <a
              href={modalAccount.profileUrl || (socialModal === 'tiktok' ? 'https://www.tiktok.com/' : 'https://www.instagram.com/')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-[#0F0F10] underline underline-offset-4"
            >
              <span>Open {socialModal === 'tiktok' ? 'TikTok' : 'Instagram'}</span>
              <ExternalLink size={14} />
            </a>
            <p className="text-xs text-[#6B7280]">
              A saved link does not verify account ownership or sync followers, views or posts.
            </p>
            {social.error && <p role="alert" className="text-sm text-rose-600">{social.error}</p>}
            <div className="flex items-center justify-between gap-3 pt-1">
              {modalAccount.saved && (
                <button
                  type="button"
                  disabled={isAuthorizing}
                  onClick={async () => {
                    if (await social.disconnect(socialModal)) setSocialModal(null);
                  }}
                  className="min-h-11 px-3 text-sm font-medium text-rose-600 hover:underline cursor-pointer"
                >
                  Remove link
                </button>
              )}
              <button
                type="submit"
                disabled={isAuthorizing}
                className="ml-auto min-h-11 rounded-xl bg-[#0F0F10] hover:bg-[#27272A] px-5 text-sm font-medium text-white disabled:opacity-50 cursor-pointer transition-colors"
              >
                {isAuthorizing ? 'Saving...' : 'Save profile link'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
