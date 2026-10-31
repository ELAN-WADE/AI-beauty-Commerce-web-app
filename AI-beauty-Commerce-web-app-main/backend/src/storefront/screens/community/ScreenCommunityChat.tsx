import { uploadCommunityMediaApi } from '../../lib/owned-api';
import React, { useState } from 'react';
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  Share2,
  Users,
  Video,
  Image as ImageIcon,
  Send,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Store,
  BookOpen,
  MapPin
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomerAccess } from '../../components/auth/CustomerAccess';
import { CommunityPost } from '../../types';
import { ProductCard } from '../../components/common/ProductCard';

const ScreenCommunityChatContent: React.FC = () => {
  const {
    communityPosts,
    createCommunityPost,
    likeCommunityPost,
    products,
    navigateTo,
    viewProductDetails,
    goBack,
    userProfile,
    communityMessages,
    sendCommunityMessage,
    likeCommunityMessage,
    selectedCity,
    getDistributorsForCity,
    addToCart,
    loginWithGoogle,
    authUser
  } = useApp();

  const [activeTab, setActiveTab] = useState<'feed' | 'transformations' | 'chat'>('feed');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserModal, setSelectedUserModal] = useState<CommunityPost | null>(null);

  // New Post Form State
  const [postContent, setPostContent] = useState('');
  const [postSkinType, setPostSkinType] = useState('Combination Skin');
  const [selectedProductTagId, setSelectedProductTagId] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState<{ id: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false), [posting, setPosting] = useState(false), [postError, setPostError] = useState('');
  const uploadMedia = async (file?: File) => {
    if (!file || uploading || posting) return;
    setUploading(true); setPostError('');
    try { setUploadedMedia({ id: await uploadCommunityMediaApi(file), name: file.name }); }
    catch (error) { setPostError(error instanceof Error ? error.message : 'Upload failed. Your text is preserved.'); }
    finally { setUploading(false); }
  };

  React.useEffect(() => { setPostContent(''); setUploadedMedia(null); setSelectedProductTagId(''); setPostError(''); }, [authUser?.id]);
  // Direct chat input
  const [chatInput, setChatInput] = useState('');

  const cityDistributors = getDistributorsForCity(selectedCity);
  const flashSaleItems = products.filter((p) => p.isFlashSale || p.discountPercentage).slice(0, 3);
  const trendingItems = products.filter((p) => p.isBestseller).slice(0, 3);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    if (posting || uploading) return;
    setPosting(true); setPostError('');
    try {
      await createCommunityPost({
        authorName: authUser?.profile?.displayName || '', authorHandle: '', authorAvatar: authUser?.profile?.avatarUrl || '', authorRole: 'Member',
        content: postContent.trim(), ...(selectedProductTagId ? { taggedProductId: selectedProductTagId } : {}),
        ...(uploadedMedia ? { mediaId: uploadedMedia.id } : {}),
      });
      setPostContent(''); setUploadedMedia(null); setSelectedProductTagId(''); setIsCreateModalOpen(false);
    } catch (error) { setPostError(error instanceof Error ? error.message : 'Your post could not be published. Your draft is preserved.'); }
    finally { setPosting(false); }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    try { await sendCommunityMessage(chatInput); } catch (error) { setPostError(error instanceof Error ? error.message : 'The message could not be sent.'); return; }
    setChatInput('');
  };

  const displayedPosts = communityPosts.filter((p) => {
    if (activeTab === 'transformations') return p.mediaType === 'video';
    return true;
  });

  const formatNaira = (amt: number) => '₦' + amt.toLocaleString('en-NG');

  return (
    <div className="min-h-screen bg-white text-[#0F0F10] pb-28 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      {/* Top Header (Mobile/Tablet Only — Hidden on Desktop) */}
      <div className="lg:hidden sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#D4AF37]" />
                <h1 className="font-heading font-extrabold tracking-tight text-lg lg:text-xl text-[#0F0F10]">
                  Desla!™ Collective
                </h1>
              </div>

            </div>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-full bg-[#0F0F10] hover:bg-[#1F1D22] text-white font-heading font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <Plus size={14} strokeWidth={3} />
            <span>Share Routine</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-3 lg:pt-6">
        {/* 3-COLUMN RESPONSIVE LAYOUT (Left: Hubs & Routines, Center: Reels Feed, Right: Flash Sales) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Nearest Hub, Trending & Routine Guides (3 cols) */}
          <div className="hidden lg:block lg:col-span-3 space-y-5">
            {/* Nearest City Distributor Finder Card */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0F0F10]">
                <Store size={15} className="text-[#D4AF37]" />
                <span>Nearest Distributor Hub</span>
              </div>
              <p className="text-[11px] text-[#6B7280] leading-snug">
                Verified partners in <strong>{selectedCity}</strong> holding authentic Desla formulations for same-day delivery.
              </p>
              <div className="p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-xs">
                <span className="font-bold text-[#0F0F10] block">
                  {cityDistributors[0]?.businessName || 'No local hub listed'}
                </span>
                <span className="text-[10.5px] text-[#6B7280] mt-0.5 block truncate">
                  {cityDistributors[0]?.address || ''}
                </span>
              </div>
              <button
                onClick={() => navigateTo('distributors')}
                className="w-full py-2 px-3 rounded-xl bg-[#F3EEE3] hover:bg-[#EAE4D7] text-[#0F0F10] text-[11px] font-bold active:scale-95 transition-all cursor-pointer text-center block"
              >
                Browse All {selectedCity} Hubs →
              </button>
            </div>

            {/* Daily Routine Playbooks */}
            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0F0F10]">
                <BookOpen size={15} className="text-[#997A2E]" />
                <span>Curated Routines</span>
              </div>
              <ul className="space-y-2 text-xs">
                <li
                  onClick={() => {
                    setActiveTab('transformations');
                  }}
                  className="p-2 rounded-xl bg-[#FAF9F6] hover:bg-[#F3EEE3] cursor-pointer transition-all"
                >
                  <span className="font-bold text-[#0F0F10] block text-[11.5px]">
                    #NaturalGlowRoutine
                  </span>
                  <span className="text-[10px] text-[#6B7280]">
                    Radiant Body Oil + Whipped Butter
                  </span>
                </li>
                <li
                  onClick={() => {
                    setActiveTab('transformations');
                  }}
                  className="p-2 rounded-xl bg-[#FAF9F6] hover:bg-[#F3EEE3] cursor-pointer transition-all"
                >
                  <span className="font-bold text-[#0F0F10] block text-[11.5px]">
                    #BarrierRepairAM
                  </span>
                  <span className="text-[10px] text-[#6B7280]">
                    Gentle Cleanser + SPF 50+ Sunscreen
                  </span>
                </li>
              </ul>
            </div>

            {/* Trending Formulations Rail */}
            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
              <span className="text-xs font-bold text-[#0F0F10] block">
                Trending in Collective
              </span>
              <div className="space-y-2.5">
                {trendingItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => viewProductDetails(item)}
                    className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[#FAF9F6] cursor-pointer transition-all"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover bg-[#F6F5F2] border border-[#E5E7EB]"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <span className="font-bold text-[#0F0F10] block truncate text-[11px]">
                        {item.name}
                      </span>
                      <span className="font-mono text-[#997A2E] font-bold text-[10.5px]">
                        {formatNaira(item.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: Feed, Reels & Live Chat (6 cols) */}
          <div className="lg:col-span-6 space-y-5">
            <label className="lg:hidden flex items-center gap-2 text-xs">
              <span className="sr-only">Community sections</span>
              <select aria-label="Community sections" value={activeTab} onChange={event => { const value = event.target.value; if (['feed', 'transformations', 'chat'].includes(value)) setActiveTab(value as typeof activeTab); else navigateTo(value as 'catalogue' | 'distributors' | 'creators'); }} className="min-h-11 bg-transparent py-2 pr-6 font-semibold">
                <option value="feed">Community Feed</option><option value="transformations">Video Reels</option><option value="chat">Conversations</option><option value="catalogue">Shop formulations</option><option value="distributors">Find a distributor</option><option value="creators">Creator Studio</option>
              </select>
            </label>
            {/* Navigation Tabs Bar with Desktop Share Routine CTA */}
            <div className="hidden lg:flex items-center justify-between border-b border-[#E5E7EB] pb-3 gap-2">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveTab('feed')}
                  className={`px-4 py-2 rounded-full text-xs font-heading font-semibold active:scale-95 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'feed'
                      ? 'bg-[#0F0F10] text-white font-bold shadow-xs'
                      : 'bg-[#F3EEE3] text-[#0F0F10] hover:bg-[#EAE4D7]'
                  }`}
                >
                  Community Feed ({communityPosts.length})
                </button>
                <button
                  onClick={() => setActiveTab('transformations')}
                  className={`px-4 py-2 rounded-full text-xs font-heading font-semibold active:scale-95 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'transformations'
                      ? 'bg-[#0F0F10] text-white font-bold shadow-xs'
                      : 'bg-[#F3EEE3] text-[#0F0F10] hover:bg-[#EAE4D7]'
                  }`}
                >
                  Video Reels &amp; Results
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-4 py-2 rounded-full text-xs font-heading font-semibold active:scale-95 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'chat'
                      ? 'bg-[#0F0F10] text-white font-bold shadow-xs'
                      : 'bg-[#F3EEE3] text-[#0F0F10] hover:bg-[#EAE4D7]'
                  }`}
                >
                  Live Consultations
                </button>
              </div>

              {/* Desktop Share Routine Button */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="hidden lg:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0F0F10] hover:bg-[#D4AF37] hover:text-[#0F0F10] text-white font-heading font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus size={14} strokeWidth={3} />
                <span>Share Routine</span>
              </button>
            </div>

            {/* Social Posts Feed */}
            {activeTab !== 'chat' && (
              <div className="space-y-5">
                {displayedPosts.map((post) => {
                  const taggedProduct = products.find((p) => p.id === post.taggedProductId);

                  return (
                    <div
                      key={post.id}
                      className="p-5 rounded-3xl bg-[#FAF9F6] border border-[#E5E7EB] shadow-xs space-y-3.5"
                    >
                      {/* Author Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {post.authorAvatar ? (
                            <img
                              src={post.authorAvatar}
                              alt={post.authorName || 'Author'}
                              className="w-10 h-10 rounded-full object-cover border border-[#E5E7EB]"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#E5E7EB] text-[#4B5563] flex items-center justify-center font-bold text-xs uppercase border border-[#E5E7EB]">
                              {post.authorName ? post.authorName.charAt(0) : 'U'}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-heading font-bold text-xs sm:text-sm text-[#0F0F10]">
                                {post.authorName}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F3EEE3] text-[#0F0F10] font-medium border border-[#E5E7EB]">
                                {post.authorRole}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10.5px] text-[#6B7280]">
                              <span>{post.authorHandle}</span>
                              {post.skinType && (
                                <>
                                  <span>•</span>
                                  <span>{post.skinType}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{post.timestamp}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => likeCommunityPost(post.id)}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                            post.likedByMe
                              ? 'border-[#D4AF37] text-[#997A2E] bg-[#FBF5E8]'
                              : 'border-[#E5E7EB] text-[#6B7280] hover:bg-white'
                          }`}
                        >
                          <Heart size={14} className={post.likedByMe ? 'fill-[#D4AF37] text-[#D4AF37]' : ''} />
                          <span className="font-mono">{post.likesCount}</span>
                        </button>
                      </div>

                      {/* Post Content */}
                      <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
                        {post.content}
                      </p>

                      {/* Media (TikTok/Reels style video or image preview) */}
                      {post.mediaUrl && (
                        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-72 border border-[#E5E7EB]">
                          {post.mediaType === 'video' ? <video src={post.mediaUrl} controls playsInline preload="metadata" className="w-full h-full object-contain" /> : <img src={post.mediaUrl} alt="Shared routine" loading="lazy" className="w-full h-full object-cover" />}

                        </div>
                      )}

                      {/* Tagged Product Link Bar */}
                      {taggedProduct && (
                        <div
                          onClick={() => viewProductDetails(taggedProduct)}
                          className="p-2.5 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#D4AF37] flex items-center justify-between gap-3 cursor-pointer transition-all shadow-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={taggedProduct.image}
                              alt={taggedProduct.name}
                              className="w-9 h-9 rounded-lg object-cover bg-[#F6F5F2] shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="text-[10px] font-mono font-bold text-[#997A2E] block truncate">
                                {taggedProduct.hashtag || taggedProduct.sku}
                              </span>
                              <span className="text-xs font-bold text-[#0F0F10] block truncate">
                                {taggedProduct.name}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono font-bold text-xs text-[#0F0F10]">
                              {formatNaira(taggedProduct.price)}
                            </span>
                            <div className="w-7 h-7 rounded-full bg-[#0F0F10] text-white flex items-center justify-center text-xs">
                              <ArrowRight size={12} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Live Chat AMA Mode */}
            {activeTab === 'chat' && (
              <div className="p-5 rounded-3xl bg-[#FAF9F6] border border-[#E5E7EB] shadow-xs space-y-4">
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {communityMessages.map((msg) => (
                    <div key={msg.id} className="p-3 rounded-2xl bg-white border border-[#E5E7EB] space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#0F0F10]">
                          {msg.senderName || msg.sender || 'Beauty Enthusiast'}
                        </span>
                        <span className="text-[10px] text-gray-400">{msg.time || 'Just now'}</span>
                      </div>
                      <p className="text-xs text-[#4B5563] leading-relaxed">
                        {msg.message || msg.text}
                      </p>
                    </div>
                  ))}
                </div>

                {postError && <p role="alert" className="text-xs text-rose-700">{postError}</p>}
                <form onSubmit={handleSendChat} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask dermatologists and verified buyers a question..."
                    className="flex-1 px-4 py-2.5 rounded-full bg-white border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                  />
                  <button
                    type="submit"
                  disabled={!chatInput.trim()}
                    className="px-5 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#1F1D22] text-white text-xs font-bold active:scale-95 transition-all cursor-pointer"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Flash Sales & Creator Spotlight (3 cols) */}
          <div className="hidden lg:block lg:col-span-3 space-y-5">
            {/* Flash Sales Card */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F0F10]">
                  <Flame size={15} className="text-[#D4AF37]" />
                  <span>Flash Routine Drops</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#F3EEE3] text-[#0F0F10] text-[9.5px] font-mono font-bold">
                  Active
                </span>
              </div>

              <div className="space-y-3">
                {flashSaleItems.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-2.5 rounded-xl bg-white border border-[#E5E7EB] flex items-center gap-3 shadow-xs"
                  >
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-12 h-12 rounded-lg object-cover bg-[#F6F5F2] shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <h4 className="font-bold text-[#0F0F10] truncate text-[11px]">
                        {prod.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono font-bold text-xs text-[#0F0F10]">
                          {formatNaira(prod.price)}
                        </span>
                        {prod.originalPrice && (
                          <span className="font-mono text-[10px] text-gray-400 line-through">
                            {formatNaira(prod.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(prod, prod.sizes?.[0] || 'Standard', 1)}
                      className="px-2.5 py-1 rounded-md bg-[#0F0F10] hover:bg-[#D4AF37] hover:text-[#0F0F10] text-white text-[10px] font-bold active:scale-95 transition-all shrink-0 cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Creator Affiliate Desk Spotlight */}
            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-2.5 text-xs">
              <span className="font-heading font-bold text-xs text-[#0F0F10] block">
                Creator Affiliate Desk
              </span>
              <p className="text-[11px] text-[#6B7280] leading-snug">
                Apply to the Creator Studio to request a reviewed affiliate account.
              </p>

              <button
                onClick={() => navigateTo('creators')}
                className="w-full py-2.5 px-3 rounded-xl bg-[#0F0F10] hover:bg-[#1F1D22] text-white text-[11px] font-bold active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Join Creator Studio</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Routine Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto bg-white rounded-3xl p-6 shadow-2xl border border-[#E5E7EB] space-y-4 animate-in zoom-in-95">
            <h3 className="font-heading font-bold text-base text-[#0F0F10]">
              Share a routine
            </h3>

            <form onSubmit={handleCreatePost} className="space-y-3">
              <label className="block text-xs">Optional photo or video<input aria-label="Routine media" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" disabled={posting || uploading} onChange={event => { void uploadMedia(event.target.files?.[0]); event.target.value = ''; }} className="block mt-2 w-full" /></label>
              {uploading && <p role="status" className="text-xs">Uploading your media…</p>}
              {uploadedMedia && <p className="text-xs">{uploadedMedia.name} <button type="button" disabled={posting} className="underline" onClick={() => setUploadedMedia(null)}>Remove</button></p>}
              {postError && <p role="alert" className="text-xs text-rose-700">{postError}</p>}
              <div>
                <label className="text-[11px] font-bold text-[#4B5563] block mb-1">Tag Formulation</label>
                <select
                  value={selectedProductTagId}
                  onChange={(e) => setSelectedProductTagId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs text-[#0F0F10]"
                >
                  <option value="">No product tag</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#4B5563] block mb-1">Your Honest Review / Experience</label>
                <textarea
                  rows={3}
                  required
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share your application technique, skin hydration results, fragrance longevity..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-full border border-[#E5E7EB] text-xs font-bold text-[#0F0F10]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posting || uploading || !postContent.trim()}
                  className="flex-1 py-2.5 rounded-full bg-[#0F0F10] text-white text-xs font-bold"
                >
                  {posting ? 'Publishing…' : 'Publish routine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export const ScreenCommunityChat: React.FC = () => <CustomerAccess title="Sign in to join the community"><ScreenCommunityChatContent /></CustomerAccess>;
