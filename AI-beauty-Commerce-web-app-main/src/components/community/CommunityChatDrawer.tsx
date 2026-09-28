import React, { useState } from 'react';
import {
  X,
  Send,
  Heart,
  Sparkles,
  ShieldCheck,
  Award,
  ChevronLeft,
  Users,
  MessageSquareHeart,
  Smile,
  Droplets,
  Shield
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { communityChannels } from '../../data/community';

export const CommunityChatDrawer: React.FC = () => {
  const {
    isCommunityOpen,
    closeCommunity,
    communityMessages,
    activeCommunityChannel,
    setActiveCommunityChannel,
    sendCommunityMessage,
    likeCommunityMessage,
    userProfile,
    viewProductDetails,
    products
  } = useApp();

  const [inputMessage, setInputMessage] = useState('');

  if (!isCommunityOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendCommunityMessage(inputMessage);
    setInputMessage('');
  };

  const filteredMessages = communityMessages.filter((msg) => {
    if (activeCommunityChannel === 'all') return true;
    return msg.channel === activeCommunityChannel;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch justify-end pointer-events-auto">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeCommunity}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Container */}
      <div className="relative z-10 w-full sm:w-[420px] max-w-full h-[90vh] sm:h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-right duration-300 sm:border-l border-[#E5E7EB] rounded-t-[28px] sm:rounded-none">
        {/* Drawer Header */}
        <div className="bg-white border-b border-[#E5E7EB] px-5 py-3.5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={closeCommunity}
                className="p-1.5 -ml-1 rounded-full text-[#0F0F10] hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
                aria-label="Close community"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading font-semibold text-sm text-[#0F0F10] leading-none">
                    Desla<span className="text-[#D4AF37]">!™</span> Collective
                  </h3>
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
                <span className="text-[10px] text-[#6B7280]">
                  Active Skincare Community &amp; Chemist Insights
                </span>
              </div>
            </div>

            <button
              onClick={closeCommunity}
              className="p-1.5 rounded-full text-gray-400 hover:text-[#0F0F10] hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Channels Rail */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2.5 -mx-1 px-1">
            {communityChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setActiveCommunityChannel(channel.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                  activeCommunityChannel === channel.id
                    ? 'bg-glowly-primary text-white shadow-xs font-bold'
                    : 'bg-white text-glowly-charcoal border border-glowly-border hover:bg-glowly-surface'
                }`}
              >
                #{channel.name}
              </button>
            ))}
          </div>
        </div>

        {/* Message Thread Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {filteredMessages.map((msg) => {
            const isChemist = msg.role === 'chemist';
            const isAdmin = msg.role === 'admin';

            return (
              <div
                key={msg.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isChemist
                    ? 'bg-gradient-to-br from-[#FFF9FB] to-[#FFF0F6] border-glowly-primary/30 shadow-xs'
                    : isAdmin
                    ? 'bg-gradient-to-br from-[#FFFBF0] to-[#FFF6E0] border-amber-300 shadow-xs'
                    : 'bg-white border-glowly-border/80 shadow-xs'
                }`}
              >
                {/* Author row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-glowly-border shrink-0 bg-white">
                      <img
                        src={msg.avatar}
                        alt={msg.sender}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-heading font-bold text-xs text-glowly-charcoal">
                          {msg.sender}
                        </span>
                        {msg.roleBadge && (
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase tracking-tight ${
                              isChemist
                                ? 'bg-glowly-primary text-white'
                                : 'bg-amber-500 text-white'
                            }`}
                          >
                            {msg.roleBadge}
                          </span>
                        )}
                      </div>
                      {msg.skinType && (
                        <span className="text-[10px] text-glowly-muted">
                          {msg.skinType}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-glowly-muted font-mono">
                    {msg.timestamp}
                  </span>
                </div>

                {/* Message text */}
                <p className="text-xs text-glowly-charcoal leading-relaxed">
                  {msg.text}
                </p>

                {/* Optional Tagged Product Card */}
                {msg.taggedProduct && (
                  <div
                    onClick={() => {
                      const prod = products.find((p) => p.id === msg.taggedProduct?.id);
                      if (prod) {
                        closeCommunity();
                        viewProductDetails(prod);
                      }
                    }}
                    className="mt-2.5 p-2 rounded-xl bg-white border border-glowly-border hover:border-glowly-primary/40 cursor-pointer flex items-center justify-between gap-2 group transition-all"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-glowly-surface shrink-0 border border-glowly-border/60 p-0.5">
                        <img
                          src={msg.taggedProduct.image}
                          alt={msg.taggedProduct.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="truncate">
                        <span className="text-[9px] font-bold text-glowly-muted uppercase block">
                          {msg.taggedProduct.brand}
                        </span>
                        <span className="text-[11px] font-heading font-semibold text-glowly-charcoal truncate block group-hover:text-glowly-primary transition-colors">
                          {msg.taggedProduct.name}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-glowly-primary shrink-0">
                      ₦{(msg.taggedProduct.price || 0).toLocaleString('en-NG')}
                    </span>
                  </div>
                )}

                {/* Likes Action */}
                <div className="flex items-center justify-end mt-2 pt-1 border-t border-glowly-border/40">
                  <button
                    onClick={() => likeCommunityMessage(msg.id)}
                    className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full transition-colors ${
                      msg.likedByMe
                        ? 'text-glowly-primary font-bold bg-glowly-accent/50'
                        : 'text-glowly-muted hover:text-glowly-charcoal'
                    }`}
                  >
                    <Heart
                      size={13}
                      className={msg.likedByMe ? 'fill-glowly-primary text-glowly-primary' : ''}
                    />
                    <span>{msg.likesCount}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Footer */}
        <div className="bg-white border-t border-glowly-border p-3 shrink-0">
          <div className="text-[10px] text-glowly-muted mb-1.5 flex items-center justify-between px-1">
            <span>Posting as <strong className="text-glowly-charcoal">{userProfile.name}</strong></span>
            <span className="text-glowly-primary font-bold">Gold Tier</span>
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Share a tip or ask the community..."
              className="flex-1 bg-glowly-surface border border-glowly-border rounded-full px-4 py-2.5 text-xs text-glowly-charcoal placeholder-glowly-muted focus:outline-none focus:border-glowly-primary transition-colors"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="w-10 h-10 rounded-full bg-glowly-primary disabled:opacity-40 hover:bg-glowly-primary-hover active:scale-95 text-white flex items-center justify-center shrink-0 transition-all shadow-soft"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
