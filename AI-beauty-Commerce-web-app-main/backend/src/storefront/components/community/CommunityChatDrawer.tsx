import React, { useState } from 'react';
import {
  X,
  PaperPlaneTilt,
  Heart,
  CaretLeft,
} from '@phosphor-icons/react';
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
    products,
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
        className="fixed inset-0 bg-black/55 backdrop-blur-xs transition-opacity duration-200"
        onClick={closeCommunity}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Desla Collective Chat"
        className="relative z-10 w-full sm:w-[420px] max-w-full h-[90vh] sm:h-full bg-[#FAF9F6] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-right duration-250 sm:border-l border-[#E5E7EB] rounded-t-[24px] sm:rounded-none font-body"
      >
        {/* Header */}
        <div className="bg-white border-b border-[#E5E7EB] px-5 py-3.5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeCommunity}
                className="p-1.5 -ml-1 rounded-full text-[#0F0F10] hover:bg-[#F3F4F6] active:scale-95 transition-all cursor-pointer"
                aria-label="Close community"
              >
                <CaretLeft size={19} weight="bold" aria-hidden="true" />
              </button>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-heading font-semibold text-sm text-[#0F0F10] leading-none">
                    Desla<span className="text-[#D4AF37]">!™</span> Collective
                  </h3>
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[11px] text-[#6B7280]">
                  Live Routine Discussion &amp; Community Lounge
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={closeCommunity}
              className="p-1.5 rounded-full text-[#6B7280] hover:text-[#0F0F10] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X size={18} weight="bold" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2.5 -mx-1 px-1">
            {communityChannels.map((channel) => (
              <button
                key={channel.id}
                type="button"
                onClick={() => setActiveCommunityChannel(channel.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                  activeCommunityChannel === channel.id
                    ? 'bg-[#0F0F10] text-white font-semibold'
                    : 'bg-[#FAF9F6] text-[#6B7280] border border-[#E5E7EB] hover:text-[#0F0F10]'
                }`}
              >
                #{channel.name}
              </button>
            ))}
          </div>
        </div>

        {/* Thread Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E5E7EB] bg-white">
          {filteredMessages.map((msg) => {
            const isChemist = msg.role === 'chemist';
            const isAdmin = msg.role === 'admin';

            return (
              <div key={msg.id} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#F3EEE3] shrink-0">
                      <img src={msg.avatar} alt={msg.sender} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-heading font-semibold text-xs text-[#0F0F10] truncate">
                          {msg.sender}
                        </span>
                        {msg.roleBadge && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide ${
                              isChemist
                                ? 'bg-[#0F0F10] text-[#D4AF37]'
                                : isAdmin
                                  ? 'bg-[#FBF5E8] text-[#997A2E]'
                                  : 'bg-[#F3F4F6] text-[#6B7280]'
                            }`}
                          >
                            {msg.roleBadge}
                          </span>
                        )}
                      </div>
                      {msg.skinType && (
                        <span className="text-[11px] text-[#6B7280] block">{msg.skinType}</span>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] text-[#6B7280] font-mono shrink-0">{msg.timestamp}</span>
                </div>

                <p className="text-[13px] text-[#0F0F10] leading-relaxed">{msg.text}</p>

                {msg.taggedProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      const prod = products.find((p) => p.id === msg.taggedProduct?.id);
                      if (prod) {
                        closeCommunity();
                        viewProductDetails(prod);
                      }
                    }}
                    className="w-full text-left mt-1 p-2.5 rounded-xl bg-[#FAF9F6] hover:bg-[#F3EEE3]/60 cursor-pointer flex items-center justify-between gap-2 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={msg.taggedProduct.image}
                        alt={msg.taggedProduct.name}
                        className="w-9 h-9 rounded-lg object-cover bg-white shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-[#6B7280] uppercase block truncate">
                          {msg.taggedProduct.brand}
                        </span>
                        <span className="text-xs font-medium text-[#0F0F10] truncate block">
                          {msg.taggedProduct.name}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-price font-semibold text-[#997A2E] shrink-0">
                      ₦{(msg.taggedProduct.price || 0).toLocaleString('en-NG')}
                    </span>
                  </button>
                )}

                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => likeCommunityMessage(msg.id)}
                    aria-pressed={msg.likedByMe}
                    className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full transition-transform active:scale-90 cursor-pointer ${
                      msg.likedByMe ? 'text-red-600 font-semibold' : 'text-[#6B7280] hover:text-[#0F0F10]'
                    }`}
                  >
                    <Heart
                      size={14}
                      weight={msg.likedByMe ? 'fill' : 'regular'}
                      className={msg.likedByMe ? 'text-red-600 scale-110 transition-transform duration-150' : ''}
                      aria-hidden="true"
                    />
                    <span>{msg.likesCount}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Composer */}
        <div className="bg-white border-t border-[#E5E7EB] p-3.5 shrink-0 pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))]">
          <div className="text-[11px] text-[#6B7280] mb-1.5 px-1">
            Posting as <strong className="font-medium text-[#0F0F10]">{userProfile.name}</strong>
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Share a tip or ask the community..."
              className="flex-1 bg-[#FAF9F6] border border-[#E5E7EB] rounded-full px-4 py-2.5 text-base sm:text-xs text-[#0F0F10] placeholder-[#6B7280] focus:outline-none focus:border-[#0F0F10] transition-colors"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="w-10 h-10 rounded-full bg-[#0F0F10] disabled:opacity-40 hover:bg-[#27272A] active:scale-95 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer"
              aria-label="Send message"
            >
              <PaperPlaneTilt size={16} weight="fill" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
