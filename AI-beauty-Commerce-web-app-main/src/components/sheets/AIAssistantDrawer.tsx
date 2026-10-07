import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Plus, ArrowRight, ShieldCheck, CheckCircle2, Maximize2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { products } from '../../data/products';

export const AIAssistantDrawer: React.FC = () => {
  const {
    isAIAssistantOpen,
    closeAIAssistant,
    aiMessages,
    sendAIMessage,
    addToCart,
    viewProductDetails,
    selectedCity,
    navigateTo
  } = useApp();

  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Recommend routine for hyperpigmentation',
    'Which body wash pairs with 24K shimmer oil?',
    'Is my order dispatched locally in ' + selectedCity + '?',
    'Explain NAFDAC batch authenticity verification'
  ];

  useEffect(() => {
    if (isAIAssistantOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages, isAIAssistantOpen]);

  if (!isAIAssistantOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      sendAIMessage(inputVal.trim());
      setInputVal('');
    }
  };

  const handlePromptClick = (prompt: string) => {
    sendAIMessage(prompt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch justify-end p-0 pointer-events-auto">
      {/* Backdrop with smooth fade */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeAIAssistant}
        aria-hidden="true"
      />

      {/* Drawer Container: Slide from right on desktop, slide from bottom on mobile */}
      <div className="relative z-10 w-full sm:w-[420px] max-w-full bg-white sm:shadow-2xl flex flex-col h-[88vh] sm:h-full rounded-t-[28px] sm:rounded-none sm:border-l border-[#E5E7EB] overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-right duration-300">
        {/* Mobile drag bar */}
        <div className="w-12 h-1.5 rounded-full bg-gray-300 mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Assistant Header */}
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center font-heading font-black text-xs shadow-xs shrink-0">
              D!
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-heading font-bold text-sm text-[#0F0F10]">
                  Desla<span className="text-[#D4AF37]">!™</span> AI Concierge
                </h3>
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="System Online" />
              </div>
              <p className="text-[10px] text-[#6B7280]">
                Clinical Formulations, Regimens &amp; Courier Telemetry
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                closeAIAssistant();
                navigateTo('ask-ai');
              }}
              className="p-1.5 rounded-full text-gray-400 hover:text-[#0F0F10] hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
              aria-label="Expand to Full Screen Chat"
              title="Expand to Full Screen Chat"
            >
              <Maximize2 size={16} />
            </button>
            <button
              onClick={closeAIAssistant}
              className="p-1.5 rounded-full text-gray-400 hover:text-[#0F0F10] hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
              aria-label="Close Assistant"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2.5 bg-[#FAF9F6] border-b border-[#E5E7EB] overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#997A2E] shrink-0">
            Suggested:
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(p)}
              className="text-[11px] font-medium px-3 py-1 rounded-full bg-white text-[#0F0F10] border border-[#E5E7EB] hover:border-[#D4AF37] hover:text-[#997A2E] transition-colors whitespace-nowrap shadow-xs active:scale-95 cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FCFAF9]">
          {aiMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs sm:text-[13px] leading-relaxed ${
                    isUser
                      ? 'bg-[#0F0F10] text-white rounded-br-xs shadow-sm'
                      : 'bg-white text-[#0F0F10] border border-[#E5E7EB] shadow-xs rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                <span className="text-[10px] text-[#9CA3AF] mt-1 px-1">
                  {msg.timestamp}
                </span>

                {/* Embedded Product Recommendations */}
                {!isUser && msg.recommendedProductIds && msg.recommendedProductIds.length > 0 && (
                  <div className="mt-2.5 w-full max-w-[95%] space-y-2">
                    <p className="text-[10px] font-bold text-[#997A2E] uppercase tracking-wider">
                      Recommended Formulations:
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {msg.recommendedProductIds.map((id) => {
                        const prod = products.find((p) => p.id === id);
                        if (!prod) return null;
                        return (
                          <div
                            key={id}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#D4AF37] shadow-xs transition-all"
                          >
                            <div
                              onClick={() => {
                                closeAIAssistant();
                                viewProductDetails(prod);
                              }}
                              className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                            >
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-12 h-12 rounded-lg object-cover bg-[#F6F5F2] shrink-0 border border-[#E5E7EB]"
                              />
                              <div className="min-w-0">
                                <p className="text-[9px] font-bold text-[#997A2E] uppercase truncate">
                                  {prod.brand}
                                </p>
                                <h5 className="font-heading font-semibold text-xs text-[#0F0F10] truncate">
                                  {prod.name}
                                </h5>
                                <span className="font-price font-bold text-xs text-[#0F0F10]">
                                  ₦{prod.price.toLocaleString('en-NG')}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => addToCart(prod, prod.sizes[0], 1)}
                              className="px-3 py-1.5 rounded-lg bg-[#0F0F10] text-white hover:bg-[#D4AF37] hover:text-[#0F0F10] transition-colors text-xs font-semibold shrink-0 active:scale-95 flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <Plus size={13} strokeWidth={2.5} />
                              <span>Add</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 border-t border-[#E5E7EB] bg-white flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            placeholder="Ask about skin type, ingredients, orders..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 bg-[#FAF9F6] border border-[#E5E7EB] rounded-full px-4 py-2.5 text-xs sm:text-sm text-[#0F0F10] placeholder-[#9CA3AF] focus:outline-none focus:border-[#D4AF37]"
          />
          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="w-10 h-10 rounded-full bg-[#0F0F10] text-white flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-[#1F1D22] active:scale-95 transition-all shadow-md cursor-pointer"
            aria-label="Send message"
          >
            <Send size={15} strokeWidth={2.2} />
          </button>
        </form>
      </div>
    </div>
  );
};

