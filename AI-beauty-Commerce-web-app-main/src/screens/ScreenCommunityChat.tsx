import React, { useState } from 'react';
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
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
import { useApp } from '../context/AppContext';
import { CommunityPost } from '../types';
import { ProductCard } from '../components/common/ProductCard';

export const ScreenCommunityChat: React.FC = () => {
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
    addToCart
  } = useApp();

  const [activeTab, setActiveTab] = useState<'feed' | 'transformations' | 'chat'>('feed');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserModal, setSelectedUserModal] = useState<CommunityPost | null>(null);

  // New Post Form State
  const [postContent, setPostContent] = useState('');
  const [postSkinType, setPostSkinType] = useState('Combination Skin');
  const [selectedProductTagId, setSelectedProductTagId] = useState(products[0]?.id || '');
  const [postMediaType, setPostMediaType] = useState<'image' | 'video'>('image');

  // Direct chat input
  const [chatInput, setChatInput] = useState('');

  const cityDistributors = getDistributorsForCity(selectedCity);
  const flashSaleItems = products.filter((p) => p.isFlashSale || p.discountPercentage).slice(0, 3);
  const trendingItems = products.filter((p) => p.isBestseller).slice(0, 3);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    const taggedProd = products.find((p) => p.id === selectedProductTagId);

    createCommunityPost({
      authorName: userProfile.name,
      authorHandle: '@' + userProfile.name.toLowerCase().replace(/\s+/g, '_'),
      authorAvatar: userProfile.avatar,
      authorRole: 'Verified Buyer',
      skinType: postSkinType,
      content: postContent,
      mediaType: postMediaType,
      mediaUrl:
        postMediaType === 'video'
          ? 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80'
          : 'https://images.unsplash.com/photo-1608248597359-0c679234b4c7?auto=format&fit=crop&w=600&q=80',
      videoDuration: postMediaType === 'video' ? '0:35' : undefined,
      taggedProductId: taggedProd?.id,
      taggedProductSku: taggedProd?.sku,
      taggedProductHashtag: taggedProd?.hashtag,
      taggedProductName: taggedProd?.name,
      isTransformation: activeTab === 'transformations'
    });

    setPostContent('');
    setIsCreateModalOpen(false);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendCommunityMessage(chatInput);
    setChatInput('');
  };

  const displayedPosts = communityPosts.filter((p) => {
    if (activeTab === 'transformations') return p.isTransformation;
    return true;
  });

  const formatNaira = (amt: number) => '₦' + amt.toLocaleString('en-NG');

  return (
    <div className="min-h-screen bg-white text-[#0F0F10] pb-28 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      {/* Top Header without green radio dot */}
      <div className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              className="p-2 -ml-2 rounded-full text-[#0F0F10] hover:bg-gray-100 active:scale-95 transition-colors cursor-pointer"
              aria-label="Go back"
            >
              <ChevronLeft size={22} strokeWidth={2} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#D4AF37]" />
                <h1 className="font-heading font-extrabold tracking-tight text-lg lg:text-xl text-[#0F0F10]">
                  Delsla™ Collective
                </h1>
              </div>
              <p className="text-xs text-[#6B7280]">
                Real routines, verified video transformations &amp; peer consultations
              </p>
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

      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-6">
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
                  {cityDistributors[0]?.businessName || 'Maitama Central Hub'}
                </span>
                <span className="text-[10.5px] text-[#6B7280] mt-0.5 block truncate">
                  {cityDistributors[0]?.address || 'Aminu Kano Crescent, Wuse 2'}
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
                    #MelaninGlowRoutine
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
            {/* Navigation Tabs (Solid Gold, no gradients) */}
            <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
              <button
                onClick={() => setActiveTab('feed')}
                className={`px-4 py-2 rounded-full text-xs font-heading font-semibold active:scale-95 transition-all cursor-pointer ${
                  activeTab === 'feed'
                    ? 'bg-[#0F0F10] text-white font-bold shadow-xs'
                    : 'bg-[#F3EEE3] text-[#0F0F10] hover:bg-[#EAE4D7]'
                }`}
              >
                Community Feed ({communityPosts.length})
              </button>
              <button
                onClick={() => setActiveTab('transformations')}
                className={`px-4 py-2 rounded-full text-xs font-heading font-semibold active:scale-95 transition-all cursor-pointer ${
                  activeTab === 'transformations'
                    ? 'bg-[#0F0F10] text-white font-bold shadow-xs'
                    : 'bg-[#F3EEE3] text-[#0F0F10] hover:bg-[#EAE4D7]'
                }`}
              >
                Video Reels &amp; Results
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 rounded-full text-xs font-heading font-semibold active:scale-95 transition-all cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-[#0F0F10] text-white font-bold shadow-xs'
                    : 'bg-[#F3EEE3] text-[#0F0F10] hover:bg-[#EAE4D7]'
                }`}
              >
                Live Consultations
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
                          <img
                            src={post.authorAvatar}
                            alt={post.authorName}
                            className="w-10 h-10 rounded-full object-cover border border-[#E5E7EB]"
                          />
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
                          <img
                            src={post.mediaUrl}
                            alt="Routine reel preview"
                            className="w-full h-full object-cover"
                          />
                          {post.mediaType === 'video' && (
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg active:scale-95 cursor-pointer">
                                <Video size={20} className="ml-0.5 text-[#0F0F10]" />
                              </div>
                              {post.videoDuration && (
                                <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md bg-black/70 text-white font-mono text-[10px]">
                                  {post.videoDuration}
                                </span>
                              )}
                            </div>
                          )}
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
                Earn 10% commission on every verified referral routine post.
              </p>
              <div className="p-2.5 rounded-xl bg-[#F3EEE3] flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-[#0F0F10]">AMARA10</span>
                <span className="text-[10px] text-[#6B7280]">10% Off Routine</span>
              </div>
              <button
                onClick={() => navigateTo('creators')}
                className="w-full py-2 px-3 rounded-xl bg-[#0F0F10] hover:bg-[#1F1D22] text-white text-[11px] font-bold active:scale-95 transition-all cursor-pointer text-center block"
              >
                Join Creator Hub →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Routine Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#E5E7EB] space-y-4 animate-in zoom-in-95">
            <h3 className="font-heading font-bold text-base text-[#0F0F10]">
              Post a Community Routine Reel
            </h3>

            <form onSubmit={handleCreatePost} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#4B5563] block mb-1">Tag Formulation</label>
                <select
                  value={selectedProductTagId}
                  onChange={(e) => setSelectedProductTagId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs text-[#0F0F10]"
                >
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
                  className="flex-1 py-2.5 rounded-full bg-[#0F0F10] text-white text-xs font-bold"
                >
                  Publish Reel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
