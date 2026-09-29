import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Plus,
  Package,
  Truck,
  ShieldCheck,
  ChevronLeft,
  Scan,
  MessageSquare,
  Clock,
  ArrowRight,
  ExternalLink,
  PhoneCall,
  CheckCircle2,
  RefreshCw,
  Search,
  Check,
  MapPin,
  Flame,
  HelpCircle,
  Menu,
  X,
  Store,
  ShoppingBag
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useViewport } from '../context/ViewportContext';
import { products } from '../data/products';
import { aiChat, isOwnedApiConfigured, type ChatMsg } from '../lib/owned-api';
import { BrandLogo } from '../components/common/BrandLogo';

export const ScreenAskAI: React.FC = () => {
  const { isDesktop } = useViewport();
  const {
    aiMessages,
    sendAIMessage,
    addToCart,
    viewProductDetails,
    selectedCity,
    orders,
    activeOrder,
    navigateTo,
    goBack,
    cartCount,
    authUser
  } = useApp();

  // Live thread (owned assistant, authenticated only; mock thread otherwise)
  const liveMode = isOwnedApiConfigured && !!authUser;
  const [liveMsgs, setLiveMsgs] = useState<ChatMsg[]>([]);
  const [liveBusy, setLiveBusy] = useState(false);
  const liveFeed: ChatMsg[] = liveMode
    ? liveMsgs.length > 0
      ? liveMsgs
      : [{ id: 'live-greeting', sender: 'assistant', text: 'Hello — I am linked to the live catalogue. Ask me about routines, ingredients, or orders.', timestamp: 'Just now' }]
    : [];

  const sendLive = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || liveBusy) return;
    setLiveBusy(true);
    setLiveMsgs((prev) => [...prev, { id: `u-${Date.now()}`, sender: 'user', text: trimmed, timestamp: 'Just now' }]);
    try {
      const { assistant } = await aiChat(trimmed);
      setLiveMsgs((prev) => [...prev, assistant]);
    } catch {
      setLiveMsgs((prev) => [...prev, { id: `e-${Date.now()}`, sender: 'assistant', text: 'The assistant is unavailable right now — please try again shortly.', timestamp: 'Just now' }]);
    } finally {
      setLiveBusy(false);
    }
  };

  const [inputVal, setInputVal] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addedItemNotification, setAddedItemNotification] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeTrackingId = activeOrder?.id || orders?.[0]?.id || 'DES-829104';

  const quickPrompts = [
    { label: 'Track My Package', icon: Package, query: `Where is my package #${activeTrackingId}?` },
    { label: 'Hyperpigmentation Routine', icon: CheckCircle2, query: 'Recommend a targeted clinical routine for hyperpigmentation on melanin skin' },
    { label: 'Whipped Shea vs 24K Oil', icon: Flame, query: 'Which body butter or oil is best for 24-hour dry skin hydration?' },
    { label: 'NAFDAC Authenticity', icon: ShieldCheck, query: 'How does Desla verify 100% NAFDAC authentic batch formulation?' },
    { label: 'Payment Gateways', icon: HelpCircle, query: 'What payment methods are supported on Paystack and Flutterwave?' },
    { label: 'Customer Care WhatsApp', icon: PhoneCall, query: 'Connect me with the Desla VIP Customer Service Concierge' }
  ];

  const recentConsultations = [
    { id: '1', title: `Track Package #${activeTrackingId}`, time: 'Today', category: 'tracking' },
    { id: '2', title: 'Melanin Hyperpigmentation Protocol', time: 'Yesterday', category: 'skincare' },
    { id: '3', title: 'Whipped Shea Butter & 24K Glow Oil', time: '2 days ago', category: 'body' },
    { id: '4', title: 'NAFDAC Batch Seal Verification', time: '3 days ago', category: 'authenticity' },
    { id: '5', title: `${selectedCity} Same-Day Courier Dispatch`, time: 'Last week', category: 'logistics' }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, liveMsgs, liveBusy]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputVal.trim()) {
      if (liveMode) {
        void sendLive(inputVal.trim());
      } else {
        sendAIMessage(inputVal.trim());
      }
      setInputVal('');
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (query: string) => {
    if (liveMode) {
      void sendLive(query);
    } else {
      sendAIMessage(query);
    }
  };

  const handleAddToCartWithToast = (product: any) => {
    addToCart(product, product?.sizes?.[0] || 'Standard', 1);
    setAddedItemNotification(product.name);
    setTimeout(() => setAddedItemNotification(null), 2500);
  };

  // Safe parsing helper that never throws or crashes
  const renderMessageContent = (text: any) => {
    const safeText = typeof text === 'string' ? text : String(text || '');
    const isTracking = safeText.includes('Package Status') || safeText.includes('Fulfillment Route');

    const lines = safeText.split('\n');
    return (
      <div className="space-y-2 text-xs sm:text-[13px] leading-relaxed">
        {lines.map((line, idx) => {
          if (!line || !line.trim()) return <div key={idx} className="h-1" />;

          // Bold formatting
          let formattedLine: React.ReactNode = line;
          if (line.includes('**')) {
            const parts = line.split(/\*\*(.*?)\*\*/g);
            formattedLine = parts.map((part, pIdx) =>
              pIdx % 2 === 1 ? <strong key={pIdx} className="font-bold text-[#0F0F10]">{part}</strong> : part
            );
          }

          if (line.startsWith('• ')) {
            return (
              <div key={idx} className="flex items-start gap-2 ml-1 text-[#222]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                <span>{formattedLine}</span>
              </div>
            );
          }

          if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) {
            return (
              <div key={idx} className="flex items-start gap-2 ml-1 text-[#222]">
                <span className="font-bold text-[#997A2E]">{line.substring(0, 3)}</span>
                <span>{typeof formattedLine === 'string' ? formattedLine.substring(3) : formattedLine}</span>
              </div>
            );
          }

          return <p key={idx}>{formattedLine}</p>;
        })}

        {/* Live Interactive Package Card for Tracking Inquiries */}
        {isTracking && (
          <div className="mt-3 p-3.5 rounded-xl bg-white border border-[#D4AF37]/50 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FAF9F6] border border-[#E5E7EB] text-[#997A2E] flex items-center justify-center">
                  <Package size={14} />
                </div>
                <div>
                  <span className="font-mono font-bold text-xs text-[#0F0F10]">#{activeTrackingId}</span>
                  <span className="text-[10px] text-[#6B7280] block">Local City Partner • {selectedCity}</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                Out for Delivery
              </span>
            </div>

            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#D4AF37] h-full rounded-full w-3/4 animate-pulse" />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#6B7280]">Courier ETA: <strong>25–40 mins</strong></span>
              <button
                onClick={() => navigateTo('orders')}
                className="text-[11px] font-bold text-[#0F0F10] hover:text-[#997A2E] flex items-center gap-1 cursor-pointer"
              >
                <span>Live Route Map</span>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-white text-[#0F0F10] font-body flex flex-col selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      {/* Toast Notification for Adding Products */}
      {addedItemNotification && (
        <div className="fixed top-16 right-6 z-50 p-3 rounded-xl bg-[#0F0F10] text-white text-xs font-semibold shadow-2xl flex items-center gap-2 border border-[#D4AF37]/40 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 size={16} className="text-[#D4AF37]" />
          <span>Added "{addedItemNotification}" to your Bag!</span>
        </div>
      )}

      {/* TOP HEADER & NAVIGATION BAR (ChatGPT Style with Storefront Exit) */}
      <header className="h-16 shrink-0 bg-white border-b border-[#E5E7EB] z-20">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Left: Storefront return & Mobile Sidebar Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo('home')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF9F6] hover:bg-white border border-[#E5E7EB] hover:border-[#D4AF37] text-xs font-bold text-[#0F0F10] active:scale-95 transition-all cursor-pointer shadow-2xs group"
              title="Return to Desla Storefront"
            >
              <ChevronLeft size={16} className="text-[#0F0F10] group-hover:-translate-x-0.5 transition-transform" />
              <Store size={14} className="text-[#D4AF37]" />
              <span>Storefront</span>
            </button>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-[#0F0F10] hover:bg-gray-100 cursor-pointer"
              aria-label="Toggle Consultation History"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Brand Monogram & Minimalist Concierge Title */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center font-heading font-black text-xs shadow-xs shrink-0">
                D!
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-heading font-bold text-sm sm:text-base text-[#0F0F10]">
                    Desla<span className="text-[#D4AF37]">!™</span> AI Concierge
                  </h1>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="System Online" />
                </div>
                <p className="text-[10px] text-[#6B7280]">
                  Clinical Formulations, Regimens &amp; Courier Telemetry
                </p>
              </div>
            </div>
          </div>

          {/* Center: Mode Segmented Switcher (Ask AI Concierge vs 3D Diagnostic Skin Scan) */}
          <div className="hidden sm:flex items-center p-1 rounded-full bg-[#FAF9F6] border border-[#E5E7EB]">
            <button
              className="px-3.5 py-1.5 rounded-full bg-[#0F0F10] text-[#D4AF37] text-xs font-semibold shadow-xs flex items-center gap-1.5"
            >
              <MessageSquare size={13} />
              <span>Ask AI Concierge</span>
            </button>
            <button
              onClick={() => navigateTo('ai-scan')}
              className="px-3.5 py-1.5 rounded-full text-[#6B7280] hover:text-[#0F0F10] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Scan size={13} />
              <span>3D Skin Diagnostic</span>
            </button>
          </div>

          {/* Right: Sourcing Hub & Shopping Bag Link */}
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-[11px] font-mono text-[#0F0F10]">
              <MapPin size={11} className="text-[#D4AF37]" />
              <span>Hub: <strong>{selectedCity}</strong></span>
            </span>

            <button
              onClick={() => navigateTo('cart')}
              className="px-3.5 py-1.5 rounded-full bg-[#0F0F10] text-white hover:bg-black text-xs font-heading font-bold active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ShoppingBag size={13} />
              <span>Bag</span>
              <span className="w-4 h-4 rounded-full bg-[#FB7701] text-white text-[10px] flex items-center justify-center font-bold">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* CHATGPT TWO-COLUMN WORKSPACE (Full 100vh Fill) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT SIDEBAR: Consultation History & Quick Channels (Collapsible on mobile) */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-[#FAF9F6] border-r border-[#E5E7EB] flex flex-col justify-between transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
          style={{ top: '64px', height: 'calc(100vh - 64px)' }}
        >
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            {/* New Consultation CTA */}
            <button
              onClick={() => {
                sendAIMessage('Hello! What clinical recommendations, orders, or package tracking can you assist me with today?');
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
              className="w-full py-2.5 px-3.5 rounded-xl bg-[#0F0F10] text-white hover:bg-[#1F1D22] text-xs font-heading font-bold flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            >
              <span className="flex items-center gap-2">
                <Plus size={15} className="text-[#D4AF37]" />
                <span>+ New Consultation</span>
              </span>
              <span className="text-[10px] text-gray-400 font-mono">⌘K</span>
            </button>

            {/* Quick Action: Jump to 3D Camera Scan */}
            <div
              onClick={() => navigateTo('ai-scan')}
              className="p-3 rounded-xl bg-gradient-to-br from-[#FBF5E8] to-[#FAF9F6] border border-[#D4AF37]/40 hover:border-[#D4AF37] cursor-pointer transition-all shadow-2xs group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white border border-[#D4AF37]/50 text-[#D4AF37] flex items-center justify-center shrink-0 shadow-2xs">
                  <Scan size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-heading font-bold text-xs text-[#0F0F10] group-hover:text-[#997A2E] transition-colors truncate">
                    3D AI Face Scan
                  </h4>
                  <p className="text-[10px] text-[#6B7280] truncate">
                    Camera melanin diagnostic
                  </p>
                </div>
              </div>
            </div>

            {/* Consultation History Feed */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#9CA3AF] px-1 block mb-2">
                Recent Inquiries
              </span>

              {recentConsultations.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    handlePromptClick(item.title);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-white hover:text-[#0F0F10] text-[#4B5563] text-xs transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    {item.category === 'tracking' ? (
                      <Package size={14} className="text-[#997A2E] shrink-0" />
                    ) : item.category === 'skincare' ? (
                      <ShieldCheck size={14} className="text-[#D4AF37] shrink-0" />
                    ) : (
                      <Clock size={14} className="text-gray-400 shrink-0" />
                    )}
                    <span className="truncate">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 group-hover:text-gray-600 shrink-0 font-mono">
                    {item.time}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Sourcing Guarantee & Human Support in Sidebar */}
          <div className="p-4 border-t border-[#E5E7EB] bg-white space-y-2 shrink-0">
            <a
              href="https://wa.me/2348148120642?text=Hello%20Desla%20VIP%20Concierge,%20I%20have%20an%20order%20inquiry."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-heading font-bold flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <PhoneCall size={13} />
                <span>WhatsApp VIP Support</span>
              </div>
              <ExternalLink size={12} />
            </a>

            <div className="flex items-center gap-2 text-[10px] text-[#6B7280]">
              <ShieldCheck size={14} className="text-[#997A2E] shrink-0" />
              <span>NAFDAC Reg No. A8-9042L • Clinical GMP</span>
            </div>
          </div>
        </aside>

        {/* Mobile backdrop for sidebar */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            aria-hidden="true"
          />
        )}

        {/* MAIN CHAT CONVERSATION VIEWPORT */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-white">
          {/* Quick Category Chips Strip */}
          <div className="px-4 py-2.5 bg-[#FAF9F6] border-b border-[#E5E7EB] overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold text-[#997A2E] uppercase tracking-wider shrink-0">
              Quick Inquiries:
            </span>
            {quickPrompts.map((p, idx) => {
              const Icon = p.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handlePromptClick(p.query)}
                  className="px-3 py-1 rounded-full bg-white text-[#0F0F10] border border-[#E5E7EB] hover:border-[#D4AF37] hover:text-[#997A2E] transition-all text-xs font-medium whitespace-nowrap shadow-2xs active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Icon size={12} className="text-[#D4AF37]" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {(liveMode ? liveFeed : aiMessages || []).map((msg) => {
              const isUser = msg?.sender === 'user';
              const textContent = msg?.text || (msg as any)?.message || '';
              return (
                <div
                  key={msg?.id || Math.random().toString()}
                  className={`flex items-start gap-3 max-w-3xl ${
                    isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  }`}
                >
                  {/* Minimalist Avatar Icon */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                      isUser
                        ? 'bg-[#0F0F10] text-[#D4AF37]'
                        : 'bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/30'
                    }`}
                  >
                    {isUser ? (
                      <span className="text-[10px] font-bold font-mono">YOU</span>
                    ) : (
                      <span className="text-[10px] font-heading font-black">D!</span>
                    )}
                  </div>

                  {/* Message Bubble Container */}
                  <div className={`space-y-2 max-w-[85%] sm:max-w-[78%]`}>
                    <div
                      className={`p-4 rounded-2xl shadow-2xs ${
                        isUser
                          ? 'bg-[#0F0F10] text-white rounded-tr-xs'
                          : 'bg-[#FAF9F6] border border-[#E5E7EB] text-[#0F0F10] rounded-tl-xs'
                      }`}
                    >
                      {renderMessageContent(textContent)}
                    </div>

                    <span className="text-[10px] text-[#9CA3AF] block px-1">
                      {msg?.timestamp || 'Just now'}
                    </span>

                    {/* Rich Embedded Product Recommendations */}
                    {!isUser && msg?.recommendedProductIds && msg.recommendedProductIds.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <span className="text-[10px] font-bold text-[#997A2E] uppercase tracking-wider block">
                          Formulations Mentioned:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {msg.recommendedProductIds.map((id) => {
                            const prod = products.find((p) => p.id === id);
                            if (!prod) return null;
                            return (
                              <div
                                key={id}
                                className="p-3 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#D4AF37] shadow-xs flex items-center justify-between gap-3 transition-all"
                              >
                                <div
                                  onClick={() => viewProductDetails(prod)}
                                  className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                                >
                                  <img
                                    src={prod.image}
                                    alt={prod.name}
                                    className="w-12 h-12 rounded-lg object-cover bg-[#F6F5F2] border border-[#E5E7EB] shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <span className="text-[9px] font-bold text-[#997A2E] uppercase truncate block">
                                      {prod.brand}
                                    </span>
                                    <h5 className="font-heading font-semibold text-xs text-[#0F0F10] truncate">
                                      {prod.name}
                                    </h5>
                                    <span className="font-price font-semibold text-xs text-[#FB7701]">
                                      ₦{prod.price.toLocaleString('en-NG')}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAddToCartWithToast(prod)}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#0F0F10] text-white hover:bg-[#D4AF37] hover:text-[#0F0F10] transition-colors text-[11px] font-bold shrink-0 flex items-center gap-1 active:scale-95 cursor-pointer shadow-2xs"
                                >
                                  <Plus size={12} strokeWidth={2.5} />
                                  <span>Add</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {liveMode && liveBusy && (
              <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF] px-1">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                <span>Concierge is thinking…</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* BOTTOM SMART CHATGPT INPUT DOCK (Always Pinned & Fully Accessible) */}
          <div className="p-4 border-t border-[#E5E7EB] bg-white shrink-0">
            <form
              onSubmit={handleSend}
              className="max-w-3xl mx-auto relative flex items-end gap-2 bg-[#FAF9F6] border border-[#E5E7EB] focus-within:border-[#D4AF37] focus-within:ring-2 focus-within:ring-[#D4AF37]/20 rounded-2xl p-2 transition-all shadow-xs"
            >
              <textarea
                ref={inputRef}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask about package tracking, hyperpigmentation, shea butter, ingredients..."
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-[#0F0F10] placeholder-[#9CA3AF] focus:outline-none resize-none max-h-32"
              />

              <div className="flex items-center gap-1 shrink-0 pb-1">
                <button
                  type="submit"
                  disabled={!inputVal || !inputVal.trim()}
                  className="w-9 h-9 rounded-xl bg-[#0F0F10] text-white disabled:opacity-30 hover:bg-[#1F1D22] active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-xs"
                  aria-label="Send query"
                >
                  <Send size={15} strokeWidth={2.2} />
                </button>
              </div>
            </form>

            <p className="text-[10px] text-center text-[#9CA3AF] mt-2 max-w-xl mx-auto">
              Desla!™ AI Concierge provides clinical formulation insights &amp; tracking. For medical dermatological advice, consult a physician.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};
