import React, { useMemo, useState } from 'react';
import {
  Heart,
  ChatCircleText,
  PaperPlaneTilt,
  Camera,
  Plus,
  X,
  CheckCircle,
  ArrowRight,
  CaretLeft,
  Sparkle,
  ShoppingBag,
  Star,
  MapPin,
  UsersThree,
  VideoCamera,
  ArrowBendDownRight,
} from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import { CustomerAccess } from '../../components/auth/CustomerAccess';
import {
  fetchPostCommentsApi,
  createPostCommentApi,
  uploadCommunityMediaApi,
} from '../../lib/owned-api';
import { CommunityComment, CommunityPost } from '../../types';

function formatRelativeTime(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ScreenCommunityChatContent: React.FC = () => {
  const {
    communityPosts,
    createCommunityPost,
    likeCommunityPost,
    syncPostCommentsCount,
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
    authUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'feed' | 'transformations' | 'chat'>('feed');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUserModal, setSelectedUserModal] = useState<CommunityPost | null>(null);

  // Composer State
  const [postContent, setPostContent] = useState('');
  const [selectedProductTagId, setSelectedProductTagId] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState<{ id: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  // Lounge chat input
  const [chatInput, setChatInput] = useState('');

  // Heart burst feedback
  const [animatingLikeId, setAnimatingLikeId] = useState<string | null>(null);

  // Comments & Replies State (per-post, intentionally separate from verified product reviews)
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommunityComment[]>>({});
  const [loadingCommentsId, setLoadingCommentsId] = useState<string | null>(null);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  const cityDistributors = useMemo(() => getDistributorsForCity(selectedCity), [getDistributorsForCity, selectedCity]);

  const uploadMedia = async (file?: File) => {
    if (!file || uploading || posting) return;
    setUploading(true);
    setPostError('');
    try {
      setUploadedMedia({ id: await uploadCommunityMediaApi(file), name: file.name });
    } catch (error) {
      setPostError(error instanceof Error ? error.message : 'Upload failed. Your text is preserved.');
    } finally {
      setUploading(false);
    }
  };

  React.useEffect(() => {
    setPostContent('');
    setUploadedMedia(null);
    setSelectedProductTagId('');
    setPostError('');
  }, [authUser?.id]);

  const handleLikePost = (postId: string) => {
    setAnimatingLikeId(postId);
    likeCommunityPost(postId);
    setTimeout(() => {
      setAnimatingLikeId((prev) => (prev === postId ? null : prev));
    }, 260);
  };

  const handleToggleComments = async (postId: string) => {
    if (openCommentsPostId === postId) {
      setOpenCommentsPostId(null);
      setReplyingTo(null);
      setCommentDraft('');
      setCommentsError(null);
      return;
    }

    setOpenCommentsPostId(postId);
    setReplyingTo(null);
    setCommentDraft('');
    setCommentsError(null);

    if (!UUID_RE.test(postId) || commentsByPost[postId]) return;

    setLoadingCommentsId(postId);
    try {
      const list = await fetchPostCommentsApi(postId);
      setCommentsByPost((prev) => ({ ...prev, [postId]: list }));
    } catch (error) {
      setCommentsError(error instanceof Error ? error.message : 'Could not load comments right now.');
    } finally {
      setLoadingCommentsId(null);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const content = commentDraft.trim();
    if (!content || submittingComment) return;
    setCommentsError(null);

    if (!UUID_RE.test(postId)) {
      const localComment: CommunityComment = {
        id: `comment-${Date.now()}`,
        postId,
        parentCommentId: replyingTo?.id ?? null,
        authorName: authUser?.profile?.displayName || userProfile.name || 'Member',
        authorAvatar: authUser?.profile?.avatarUrl || null,
        authorRole: 'Member',
        content,
        createdAt: new Date().toISOString(),
      };
      const next = [...(commentsByPost[postId] ?? []), localComment];
      setCommentsByPost((prev) => ({ ...prev, [postId]: next }));
      syncPostCommentsCount(postId, next.length);
      setCommentDraft('');
      setReplyingTo(null);
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await createPostCommentApi(postId, {
        content,
        ...(replyingTo ? { parentCommentId: replyingTo.id } : {}),
      });
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] ?? []), res.comment],
      }));
      syncPostCommentsCount(postId, res.commentsCount);
      setCommentDraft('');
      setReplyingTo(null);
    } catch (error) {
      setCommentsError(error instanceof Error ? error.message : 'Unable to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || posting || uploading) return;
    setPosting(true);
    setPostError('');
    try {
      await createCommunityPost({
        authorName: authUser?.profile?.displayName || '',
        authorHandle: '',
        authorAvatar: authUser?.profile?.avatarUrl || '',
        authorRole: 'Member',
        content: postContent.trim(),
        ...(selectedProductTagId ? { taggedProductId: selectedProductTagId } : {}),
        ...(uploadedMedia ? { mediaId: uploadedMedia.id } : {}),
      });
      setPostContent('');
      setUploadedMedia(null);
      setSelectedProductTagId('');
      setIsCreateModalOpen(false);
    } catch (error) {
      setPostError(error instanceof Error ? error.message : 'Your post could not be published. Your draft is preserved.');
    } finally {
      setPosting(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    try {
      await sendCommunityMessage(chatInput);
      setChatInput('');
    } catch (error) {
      setPostError(error instanceof Error ? error.message : 'The message could not be sent.');
    }
  };

  const displayedPosts = communityPosts.filter((p) => {
    if (activeTab === 'transformations') return p.mediaType === 'video';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F0F10] pb-28 lg:pb-16 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      {/* Clean Sticky Navigation Header */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={goBack}
                className="lg:hidden p-1.5 -ml-1.5 rounded-full text-[#0F0F10] hover:bg-[#FAF9F6] active:scale-95 transition-all cursor-pointer shrink-0"
                aria-label="Go back"
              >
                <CaretLeft size={20} weight="bold" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#997A2E] font-semibold">
                  Community Hub
                </p>
                <h1 className="font-heading font-semibold text-lg sm:text-2xl text-[#0F0F10] tracking-tight truncate">
                  Desla<span className="text-[#D4AF37]">!™</span> Collective
                </h1>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white px-4 py-2 text-xs font-semibold active:scale-[0.97] transition-all cursor-pointer shrink-0"
            >
              <Plus size={14} weight="bold" className="text-[#D4AF37]" aria-hidden="true" />
              <span>Share Routine</span>
            </button>
          </div>

          {/* Minimal Pill Switcher */}
          <div className="flex items-center gap-2 pt-3.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'feed', label: 'Community Feed', icon: UsersThree },
              { id: 'transformations', label: 'Video Reels', icon: VideoCamera },
              { id: 'chat', label: 'Lounge Chat', icon: ChatCircleText },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as 'feed' | 'transformations' | 'chat')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0F0F10] text-white font-semibold'
                      : 'bg-[#FAF9F6] text-[#6B7280] hover:text-[#0F0F10]'
                  }`}
                >
                  <Icon size={14} weight="fill" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Feed Column */}
          <div className="lg:col-span-8 space-y-5">
            {/* Compact Composer Trigger Card */}
            {activeTab !== 'chat' && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden">
                  {authUser?.profile?.avatarUrl ? (
                    <img
                      src={authUser.profile.avatarUrl}
                      alt={authUser.profile.displayName || 'Your avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (authUser?.profile?.displayName || userProfile.name || 'D').charAt(0).toUpperCase()
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex-1 text-left px-4 py-2.5 rounded-full bg-[#FAF9F6] hover:bg-[#F3EEE3]/60 text-xs sm:text-[13px] text-[#6B7280] transition-colors cursor-pointer"
                >
                  Share a formulation routine, texture note, or skin milestone...
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="p-2.5 rounded-full bg-[#FAF9F6] hover:bg-[#F3EEE3] text-[#0F0F10] transition-colors cursor-pointer shrink-0"
                  aria-label="Add photo or media post"
                >
                  <Camera size={17} weight="fill" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Posts Stream */}
            {activeTab !== 'chat' && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] divide-y divide-[#E5E7EB]">
                {displayedPosts.length === 0 ? (
                  <div className="p-8 text-center space-y-3">
                    <UsersThree size={28} weight="fill" className="mx-auto text-[#6B7280]/40" aria-hidden="true" />
                    <p className="text-sm text-[#6B7280]">
                      {activeTab === 'transformations'
                        ? 'No video reels have been published yet.'
                        : 'No community posts yet. Start the conversation.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#0F0F10] text-white px-4 py-2 text-xs font-semibold cursor-pointer"
                    >
                      <Plus size={13} weight="bold" aria-hidden="true" />
                      <span>Create First Post</span>
                    </button>
                  </div>
                ) : (
                  displayedPosts.map((post) => {
                    const taggedProduct = post.taggedProductId
                      ? products.find(
                          (p) =>
                            p.id === post.taggedProductId ||
                            p.slug === post.taggedProductId ||
                            p.hashtag === post.taggedProductHashtag,
                        )
                      : null;

                    const isCommentsOpen = openCommentsPostId === post.id;
                    const commentsList = commentsByPost[post.id] ?? [];
                    const topLevelComments = commentsList.filter((c) => !c.parentCommentId);
                    const repliesByParent = commentsList.reduce<Record<string, CommunityComment[]>>((acc, c) => {
                      if (!c.parentCommentId) return acc;
                      (acc[c.parentCommentId] ||= []).push(c);
                      return acc;
                    }, {});

                    return (
                      <article key={post.id} className="p-5 sm:p-6 space-y-3.5">
                        {/* Author Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={() => setSelectedUserModal(post)}
                              className="w-10 h-10 rounded-full overflow-hidden bg-[#F3EEE3] shrink-0 cursor-pointer flex items-center justify-center text-xs font-semibold text-[#0F0F10]"
                            >
                              {post.authorAvatar ? (
                                <img
                                  src={post.authorAvatar}
                                  alt={post.authorName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                (post.authorName || 'M').charAt(0).toUpperCase()
                              )}
                            </button>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setSelectedUserModal(post)}
                                  className="font-heading font-semibold text-sm text-[#0F0F10] hover:text-[#997A2E] transition-colors cursor-pointer truncate"
                                >
                                  {post.authorName || 'Member'}
                                </button>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                    post.authorRole === 'Creator / MUA'
                                      ? 'bg-[#0F0F10] text-[#D4AF37]'
                                      : post.authorRole === 'Verified Buyer'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-[#FAF9F6] text-[#6B7280]'
                                  }`}
                                >
                                  {post.authorRole}
                                </span>
                              </div>
                              <p className="text-xs text-[#6B7280] mt-0.5">
                                {formatRelativeTime(post.timestamp)}
                                {post.skinType ? ` • ${post.skinType}` : ''}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Body Content */}
                        <p className="text-[14px] text-[#0F0F10] leading-relaxed whitespace-pre-line">
                          {post.content}
                        </p>

                        {/* Post Media */}
                        {post.mediaUrl && (
                          <div className="rounded-xl overflow-hidden bg-[#F6F5F2]">
                            {post.mediaType === 'video' ? (
                              <video
                                src={post.mediaUrl}
                                controls
                                preload="metadata"
                                className="w-full max-h-[420px] object-cover bg-black"
                              />
                            ) : (
                              <img
                                src={post.mediaUrl}
                                alt={`Routine shared by ${post.authorName}`}
                                loading="lazy"
                                className="w-full max-h-[420px] object-cover"
                              />
                            )}
                          </div>
                        )}

                        {/* Associated Product Strip with Direct Product & Review Navigation */}
                        {taggedProduct && (
                          <div className="rounded-xl bg-[#FAF9F6] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => viewProductDetails(taggedProduct)}
                              className="flex items-center gap-3 min-w-0 text-left group cursor-pointer"
                            >
                              <img
                                src={taggedProduct.image}
                                alt={taggedProduct.name}
                                className="w-11 h-11 rounded-lg object-cover bg-white shrink-0"
                              />
                              <div className="min-w-0">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280] block">
                                  Referenced Formulation
                                </span>
                                <span className="font-heading font-semibold text-xs sm:text-[13px] text-[#0F0F10] group-hover:text-[#997A2E] transition-colors block truncate">
                                  {taggedProduct.name}
                                </span>
                                <span className="text-xs font-price font-semibold text-[#997A2E]">
                                  ₦{taggedProduct.price.toLocaleString('en-NG')}
                                </span>
                              </div>
                            </button>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => viewProductDetails(taggedProduct, { section: 'reviews' })}
                                className="inline-flex items-center gap-1 rounded-full bg-white hover:bg-[#F3EEE3] px-3 py-1.5 text-[11px] font-semibold text-[#0F0F10] transition-colors cursor-pointer"
                              >
                                <Star size={12} weight="fill" className="text-[#D4AF37]" aria-hidden="true" />
                                <span>Product Reviews</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => addToCart(taggedProduct, taggedProduct.sizes?.[0] || 'Standard', 1)}
                                className="inline-flex items-center gap-1 rounded-full bg-[#0F0F10] hover:bg-[#27272A] px-3 py-1.5 text-[11px] font-semibold text-white active:scale-[0.97] transition-all cursor-pointer"
                              >
                                <ShoppingBag size={12} weight="fill" className="text-[#D4AF37]" aria-hidden="true" />
                                <span>Add</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Engagement Bar */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-5">
                            <button
                              type="button"
                              onClick={() => handleLikePost(post.id)}
                              aria-pressed={post.likedByMe}
                              aria-label={post.likedByMe ? 'Unlike post' : 'Like post'}
                              className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer py-1 ${
                                post.likedByMe ? 'text-red-600 font-semibold' : 'text-[#6B7280] hover:text-[#0F0F10]'
                              }`}
                            >
                              <Heart
                                size={17}
                                weight={post.likedByMe ? 'fill' : 'regular'}
                                className={`transition-transform duration-200 ${
                                  post.likedByMe ? 'text-red-600' : ''
                                } ${animatingLikeId === post.id ? 'scale-125' : 'scale-100'}`}
                                aria-hidden="true"
                              />
                              <span>{post.likesCount}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleComments(post.id)}
                              aria-expanded={isCommentsOpen}
                              className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer py-1 ${
                                isCommentsOpen ? 'text-[#0F0F10] font-semibold' : 'text-[#6B7280] hover:text-[#0F0F10]'
                              }`}
                            >
                              <ChatCircleText
                                size={17}
                                weight={isCommentsOpen ? 'fill' : 'regular'}
                                aria-hidden="true"
                              />
                              <span>
                                {post.commentsCount} {post.commentsCount === 1 ? 'Comment' : 'Comments'}
                              </span>
                            </button>
                          </div>

                          {taggedProduct && (
                            <button
                              type="button"
                              onClick={() => viewProductDetails(taggedProduct)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#6B7280] hover:text-[#0F0F10] transition-colors cursor-pointer"
                            >
                              <span>View formulation</span>
                              <ArrowRight size={12} weight="bold" aria-hidden="true" />
                            </button>
                          )}
                        </div>

                        {/* Expandable Community Comments & Replies Thread */}
                        {isCommentsOpen && (
                          <div className="pt-3 border-t border-[#E5E7EB]/80 space-y-3">
                            <div className="flex items-center justify-between gap-2 text-[11px] text-[#6B7280]">
                              <span>Community discussion — kept separate from verified product reviews.</span>
                              {taggedProduct && (
                                <button
                                  type="button"
                                  onClick={() => viewProductDetails(taggedProduct, { section: 'reviews' })}
                                  className="font-semibold text-[#997A2E] hover:underline shrink-0 cursor-pointer"
                                >
                                  Write a product review →
                                </button>
                              )}
                            </div>

                            {loadingCommentsId === post.id ? (
                              <p className="text-xs text-[#6B7280] py-2">Loading discussion…</p>
                            ) : commentsError ? (
                              <p role="alert" className="text-xs text-red-600">{commentsError}</p>
                            ) : topLevelComments.length === 0 ? (
                              <p className="text-xs text-[#6B7280] py-1">
                                No comments yet. Add your question or perspective below.
                              </p>
                            ) : (
                              <ul className="space-y-3">
                                {topLevelComments.map((comment) => {
                                  const replies = repliesByParent[comment.id] ?? [];
                                  return (
                                    <li key={comment.id} className="space-y-2">
                                      <div className="bg-[#FAF9F6] rounded-xl px-3.5 py-2.5 space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2 min-w-0">
                                            <span className="font-heading font-semibold text-xs text-[#0F0F10] truncate">
                                              {comment.authorName}
                                            </span>
                                            <span className="text-[10px] text-[#6B7280]">{comment.authorRole}</span>
                                          </div>
                                          <span className="text-[10px] text-[#6B7280] shrink-0">
                                            {formatRelativeTime(comment.createdAt)}
                                          </span>
                                        </div>
                                        <p className="text-xs text-[#0F0F10] leading-relaxed">{comment.content}</p>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setReplyingTo({ id: comment.id, authorName: comment.authorName })
                                          }
                                          className="text-[11px] font-medium text-[#6B7280] hover:text-[#0F0F10] cursor-pointer"
                                        >
                                          Reply
                                        </button>
                                      </div>

                                      {replies.length > 0 && (
                                        <ul className="ml-5 space-y-2 border-l border-[#E5E7EB] pl-3">
                                          {replies.map((reply) => (
                                            <li key={reply.id} className="bg-[#FAF9F6]/70 rounded-xl px-3 py-2 space-y-1">
                                              <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                  <ArrowBendDownRight
                                                    size={11}
                                                    weight="bold"
                                                    className="text-[#997A2E] shrink-0"
                                                    aria-hidden="true"
                                                  />
                                                  <span className="font-heading font-semibold text-xs text-[#0F0F10] truncate">
                                                    {reply.authorName}
                                                  </span>
                                                </div>
                                                <span className="text-[10px] text-[#6B7280] shrink-0">
                                                  {formatRelativeTime(reply.createdAt)}
                                                </span>
                                              </div>
                                              <p className="text-xs text-[#0F0F10] leading-relaxed">{reply.content}</p>
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            )}

                            {/* Reply Target Indicator */}
                            {replyingTo && (
                              <div className="flex items-center justify-between text-[11px] text-[#997A2E] px-1">
                                <span>Replying to {replyingTo.authorName}</span>
                                <button
                                  type="button"
                                  onClick={() => setReplyingTo(null)}
                                  className="text-[#6B7280] hover:text-[#0F0F10] underline cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}

                            <form onSubmit={(e) => handleSubmitComment(e, post.id)} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={commentDraft}
                                onChange={(e) => setCommentDraft(e.target.value)}
                                placeholder={
                                  replyingTo ? `Reply to ${replyingTo.authorName}...` : 'Write a comment...'
                                }
                                maxLength={1000}
                                className="flex-1 px-3.5 py-2 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-base sm:text-xs text-[#0F0F10] placeholder-[#6B7280] focus:outline-none focus:border-[#0F0F10]"
                              />
                              <button
                                type="submit"
                                disabled={submittingComment || !commentDraft.trim()}
                                className="px-4 py-2 rounded-full bg-[#0F0F10] hover:bg-[#27272A] disabled:opacity-45 text-white text-xs font-semibold cursor-pointer shrink-0 transition-all active:scale-[0.97]"
                              >
                                {submittingComment ? 'Sending…' : 'Post'}
                              </button>
                            </form>
                          </div>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            )}

            {/* Real-Time Lounge Chat Tab */}
            {activeTab === 'chat' && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden flex flex-col min-h-[460px] max-h-[65vh]">
                <div className="flex-1 overflow-y-auto divide-y divide-[#E5E7EB]">
                  {communityMessages.map((msg) => (
                    <div key={msg.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={msg.avatar}
                            alt={msg.sender}
                            className="w-8 h-8 rounded-full object-cover bg-[#F3EEE3] shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-heading font-semibold text-xs text-[#0F0F10] block truncate">
                              {msg.sender}
                            </span>
                            {msg.skinType && (
                              <span className="text-[11px] text-[#6B7280] block">{msg.skinType}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] text-[#6B7280] font-mono shrink-0">{msg.timestamp}</span>
                      </div>

                      <p className="text-[13px] text-[#0F0F10] leading-relaxed">{msg.text}</p>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => likeCommunityMessage(msg.id)}
                          aria-pressed={msg.likedByMe}
                          className={`inline-flex items-center gap-1 text-xs cursor-pointer ${
                            msg.likedByMe ? 'text-red-600 font-semibold' : 'text-[#6B7280] hover:text-[#0F0F10]'
                          }`}
                        >
                          <Heart
                            size={14}
                            weight={msg.likedByMe ? 'fill' : 'regular'}
                            className={msg.likedByMe ? 'text-red-600' : ''}
                            aria-hidden="true"
                          />
                          <span>{msg.likesCount}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendChat} className="p-3.5 border-t border-[#E5E7EB] flex items-center gap-2 bg-[#FAF9F6]">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask skincare specialists or fellow members..."
                    className="flex-1 px-4 py-2.5 rounded-full bg-white border border-[#E5E7EB] text-base sm:text-xs text-[#0F0F10] placeholder-[#6B7280] focus:outline-none focus:border-[#0F0F10]"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    aria-label="Send chat message"
                    className="w-10 h-10 rounded-full bg-[#0F0F10] hover:bg-[#27272A] disabled:opacity-45 text-white flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-95"
                  >
                    <PaperPlaneTilt size={16} weight="fill" aria-hidden="true" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right Editorial Context Column */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-32">
            {/* Local Hub Dispatch Summary */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 space-y-3">
              <div className="flex items-center gap-2 text-[#0F0F10]">
                <MapPin size={16} weight="fill" className="text-[#997A2E] shrink-0" aria-hidden="true" />
                <h2 className="font-heading font-semibold text-sm">
                  {selectedCity} Collective
                </h2>
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                {cityDistributors.length > 0
                  ? `${cityDistributors.length} verified partner dispensaries fulfilling locally in ${selectedCity}.`
                  : `Explore formulations recommended by members across ${selectedCity}.`}
              </p>
              <button
                type="button"
                onClick={() => navigateTo('distributors')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#997A2E] hover:text-[#0F0F10] transition-colors cursor-pointer"
              >
                <span>View city partners</span>
                <ArrowRight size={12} weight="bold" aria-hidden="true" />
              </button>
            </div>

            {/* Clean Creator Studio Invite */}
            <div className="bg-[#0F0F10] text-white rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <Sparkle size={16} weight="fill" aria-hidden="true" />
                <span className="text-[11px] font-mono uppercase tracking-[0.16em] font-semibold">
                  Creator Studio
                </span>
              </div>
              <h3 className="font-heading font-semibold text-base leading-snug">
                Educate &amp; Earn on Desla!™
              </h3>
              <p className="text-xs text-white/70 leading-relaxed">
                Share authentic skincare routines, publish formulation tutorials, and earn transparent affiliate commissions.
              </p>
              <button
                type="button"
                onClick={() => navigateTo('creators')}
                className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-[#F3EEE3] text-[#0F0F10] text-xs font-semibold flex items-center justify-center gap-2 active:scale-[0.97] transition-all cursor-pointer"
              >
                <span>Open Creator Studio</span>
                <ArrowRight size={13} weight="bold" aria-hidden="true" />
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* Author Quick Modal */}
      {selectedUserModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selectedUserModal.authorName}
          onClick={() => setSelectedUserModal(null)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 border border-[#E5E7EB]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-[#F3EEE3] flex items-center justify-center font-semibold text-sm text-[#0F0F10]">
                  {selectedUserModal.authorAvatar ? (
                    <img
                      src={selectedUserModal.authorAvatar}
                      alt={selectedUserModal.authorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (selectedUserModal.authorName || 'M').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-sm text-[#0F0F10]">
                    {selectedUserModal.authorName}
                  </h4>
                  <span className="text-xs text-[#6B7280]">{selectedUserModal.authorRole}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserModal(null)}
                aria-label="Close member card"
                className="p-1.5 rounded-full text-[#6B7280] hover:text-[#0F0F10] cursor-pointer"
              >
                <X size={16} weight="bold" aria-hidden="true" />
              </button>
            </div>
            {selectedUserModal.skinType && (
              <p className="text-xs text-[#6B7280]">Skin profile: {selectedUserModal.skinType}</p>
            )}
          </div>
        </div>
      )}

      {/* Post Composer Modal */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="composer-modal-title"
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-6 space-y-4 border border-[#E5E7EB] shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 id="composer-modal-title" className="font-heading font-semibold text-base text-[#0F0F10]">
                  Share with the Collective
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Post a routine note, progress update, or skincare question.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                aria-label="Close post composer"
                className="p-1.5 rounded-full text-[#6B7280] hover:text-[#0F0F10] hover:bg-[#FAF9F6] cursor-pointer"
              >
                <X size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <textarea
                  required
                  rows={4}
                  maxLength={2000}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Write about your AM/PM layering experience or ask a formulation question..."
                  className="w-full rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] p-3.5 text-base sm:text-sm text-[#0F0F10] placeholder-[#6B7280] focus:outline-none focus:border-[#0F0F10] resize-none"
                />
                <div className="flex justify-end text-[11px] text-[#6B7280] mt-1">
                  {postContent.length}/2000
                </div>
              </div>

              {/* Associated Formulation */}
              <div className="space-y-1.5">
                <label htmlFor="composer-product-select" className="text-xs font-medium text-[#0F0F10] block">
                  Associate a Formulation (Optional)
                </label>
                <select
                  id="composer-product-select"
                  value={selectedProductTagId}
                  onChange={(e) => setSelectedProductTagId(e.target.value)}
                  className="w-full rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] px-3.5 py-2.5 text-base sm:text-xs text-[#0F0F10] focus:outline-none focus:border-[#0F0F10]"
                >
                  <option value="">None selected</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Media Upload */}
              <div className="space-y-2">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FAF9F6] hover:bg-[#F3EEE3] border border-[#E5E7EB] text-xs font-medium text-[#0F0F10] cursor-pointer transition-colors">
                  <Camera size={15} weight="fill" className="text-[#997A2E]" aria-hidden="true" />
                  <span>{uploading ? 'Uploading media…' : 'Attach Photo or Video'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                    disabled={uploading || posting}
                    onChange={(e) => void uploadMedia(e.target.files?.[0])}
                    className="sr-only"
                  />
                </label>

                {uploadedMedia && (
                  <div className="flex items-center justify-between text-xs text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <CheckCircle size={14} weight="fill" className="shrink-0" aria-hidden="true" />
                      <span className="truncate">{uploadedMedia.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setUploadedMedia(null)}
                      className="text-xs underline shrink-0 ml-2 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {postError && (
                <p role="alert" className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">
                  {postError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-full text-xs font-medium text-[#6B7280] hover:text-[#0F0F10] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posting || uploading || !postContent.trim()}
                  className="px-6 py-2.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] disabled:opacity-45 text-white text-xs font-semibold active:scale-[0.97] transition-all cursor-pointer"
                >
                  {posting ? 'Publishing…' : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const ScreenCommunityChat: React.FC = () => (
  <CustomerAccess title="Sign in to join the community">
    <ScreenCommunityChatContent />
  </CustomerAccess>
);
