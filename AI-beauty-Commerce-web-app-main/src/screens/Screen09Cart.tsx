import React, { useState } from 'react';
import {
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ShoppingBag,
  ChevronLeft,
  X,
  Tag,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useViewport } from '../context/ViewportContext';
import { ProductCard } from '../components/common/ProductCard';

export const Screen09Cart: React.FC = () => {
  const { isDesktop } = useViewport();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartDeliveryFee,
    cartTotal,
    navigateTo,
    goBack,
    products,
    appliedCreator,
    applyCreatorCode,
    selectedCity,
    setIsLocationModalOpen,
    addToCart
  } = useApp();

  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [fulfillmentOption, setFulfillmentOption] = useState<'local' | 'lagos'>('local');

  const formatNaira = (amt: number) => '₦' + amt.toLocaleString('en-NG');

  const handleApplyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = applyCreatorCode(promoInput.trim());
    if (res.success) {
      setPromoMessage({ text: `Code ${promoInput.toUpperCase()} applied! 10% discount activated.`, success: true });
    } else {
      setPromoMessage({ text: 'Invalid or expired creator code. Try AMARA10 or TIWA10.', success: false });
    }
  };

  const discountAmount = appliedCreator ? Math.round(cartSubtotal * 0.1) : 0;
  const localFee = selectedCity === 'Lagos' ? 2000 : 1500;
  const hqFee = 4500;
  const activeDeliveryFee = fulfillmentOption === 'local' ? localFee : hqFee;
  const finalTotal = Math.max(0, cartSubtotal - discountAmount + activeDeliveryFee);

  // Suggested formulations for empty cart or cross-sell
  const routineCrossSell = products.filter(
    (p) => !cartItems.some((ci) => ci.productId === p.id)
  ).slice(0, 3);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white text-[#0F0F10] pb-28 font-body">
        {!isDesktop && (
          <div className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 py-3.5">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <button
                onClick={goBack}
                className="p-1.5 -ml-1 rounded-full text-[#0F0F10] hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
                aria-label="Go back"
              >
                <ChevronLeft size={22} strokeWidth={2.2} />
              </button>
              <h1 className="font-heading font-extrabold tracking-tight text-base text-[#0F0F10]">
                Shopping Bag
              </h1>
              <div className="w-8" />
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-center mx-auto text-[#D4AF37] shadow-sm">
            <ShoppingBag size={32} strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-2xl text-[#0F0F10]">
              Your Shopping Bag is Empty
            </h2>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto mt-1 leading-relaxed">
              Explore authentic Desla!™ body care washes, 24K shimmer oils, or whipped shea soufflés.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigateTo('catalogue')}
              className="py-3 px-8 rounded-full bg-[#0F0F10] hover:bg-[#1F1D22] text-white font-heading font-semibold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
            >
              Explore Desla!™ Catalogue
            </button>
          </div>

          {/* Quick Starter Formulations */}
          <div className="pt-8 border-t border-[#E5E7EB] text-left">
            <h3 className="font-heading font-semibold text-sm text-[#0F0F10] mb-3">
              Popular Starter Formulations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {products.slice(0, 3).map((product) => (
                <div key={product.id} className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex flex-col justify-between">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-28 rounded-xl object-cover bg-white mb-2"
                  />
                  <div>
                    <span className="text-[9px] font-mono text-[#997A2E] font-bold uppercase">{product.category}</span>
                    <h4 className="font-semibold text-xs text-[#0F0F10] line-clamp-1">{product.name}</h4>
                    <span className="font-price font-semibold text-xs text-[#FB7701] block mt-1">{formatNaira(product.price)}</span>
                  </div>
                  <button
                    onClick={() => addToCart(product, product.sizes?.[0] || 'Standard', 1)}
                    className="mt-2.5 w-full py-2 rounded-xl bg-[#0F0F10] text-white text-[11px] font-semibold hover:bg-[#D4AF37] hover:text-[#0F0F10] transition-colors active:scale-95 cursor-pointer"
                  >
                    + Add to Bag
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0F0F10] pb-36 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      {/* Header — Only on Mobile */}
      {!isDesktop && (
        <div className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 py-3.5">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={goBack}
                className="p-1.5 -ml-1 rounded-full text-[#0F0F10] hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
                aria-label="Go back"
              >
                <ChevronLeft size={22} strokeWidth={2.2} />
              </button>
              <div>
                <h1 className="font-heading font-extrabold tracking-tight text-lg text-[#0F0F10] leading-none">
                  Shopping Bag
                </h1>
                <span className="text-[11px] text-[#6B7280] font-mono">
                  {cartItems.length} {cartItems.length === 1 ? 'formulation' : 'formulations'}
                </span>
              </div>
            </div>

            <button
              onClick={clearCart}
              className="p-2 text-[#6B7280] hover:text-rose-500 active:scale-95 transition-colors cursor-pointer"
              title="Clear Bag"
              aria-label="Clear Bag"
            >
              <Trash2 size={18} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6">
        {/* DUAL-GRID CART SYSTEM (Left: Items & Fulfillment, Right: Routine Cross-Sell) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Items, Sourcing & Summary (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* City Fulfillment Savings Banner */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-between text-xs shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FBF5E8] text-[#997A2E] flex items-center justify-center shrink-0 border border-[#D4AF37]/30">
                  <MapPin size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#0F0F10]">
                      Local Hub: {selectedCity}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      Save ₦3,000 on delivery
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Items dispatched directly from verified local distributor stock.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="text-xs font-bold text-[#997A2E] hover:underline shrink-0 cursor-pointer"
              >
                Change
              </button>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div
                  key={`${item.productId}-${item.size}`}
                  className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-start gap-4 shadow-xs"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-20 h-20 rounded-xl object-cover bg-[#F6F5F2] shrink-0 border border-[#E5E7EB]"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-[#997A2E] uppercase font-bold block">
                          {item.product.sku || 'DESLA!™'}
                        </span>
                        <h4 className="font-heading font-bold text-sm text-[#0F0F10] truncate">
                          {item.product.name}
                        </h4>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-[#F6F5F2] text-[10px] text-[#4B5563] font-medium border border-[#E5E7EB]">
                          Size: {item.size}
                        </span>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-rose-500 p-1 active:scale-95 transition-colors cursor-pointer"
                        aria-label="Remove item"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#E5E7EB]">
                      <span className="font-price font-semibold text-sm text-[#FB7701]">
                        {formatNaira(item.unitPrice * item.quantity)}
                      </span>

                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-[#E5E7EB] rounded-full bg-white px-2 py-0.5 shadow-xs">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-gray-500 hover:text-black active:scale-90 transition-all cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-[#0F0F10] font-mono min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-gray-500 hover:text-black active:scale-90 transition-all cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Creator Promo Code Input */}
            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F0F10]">
                <Tag size={14} className="text-[#D4AF37]" />
                <span>Creator / Influencer Promo Code</span>
              </div>
              <form onSubmit={handleApplyCode} className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="e.g. AMARA10 or TIWA10"
                  className="flex-1 px-4 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs text-[#0F0F10] uppercase font-mono tracking-wider focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0F0F10] text-white font-bold text-xs hover:bg-[#1F1D22] active:scale-95 transition-all cursor-pointer"
                >
                  Apply
                </button>
              </form>
              {promoMessage && (
                <p className={`text-[11px] font-medium ${promoMessage.success ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {promoMessage.text}
                </p>
              )}
            </div>

            {/* Fulfillment Selector */}
            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F0F10]">
                Select Sourcing Method
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setFulfillmentOption('local')}
                  className={`p-3.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                    fulfillmentOption === 'local'
                      ? 'border-[#D4AF37] bg-[#FBF5E8]/60 shadow-xs'
                      : 'border-[#E5E7EB] bg-[#FAF9F6] hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#0F0F10]">
                      Local Hub ({selectedCity})
                    </span>
                    <span className="font-mono text-xs font-bold text-[#997A2E]">
                      {formatNaira(localFee)}
                    </span>
                  </div>
                  <span className="text-[10.5px] text-[#6B7280] mt-1">
                    Same-day bike dispatch or pickup in {selectedCity}
                  </span>
                </label>

                <label
                  onClick={() => setFulfillmentOption('lagos')}
                  className={`p-3.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                    fulfillmentOption === 'lagos'
                      ? 'border-[#D4AF37] bg-[#FBF5E8]/60 shadow-xs'
                      : 'border-[#E5E7EB] bg-[#FAF9F6] hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#0F0F10]">
                      Lagos Central HQ
                    </span>
                    <span className="font-mono text-xs font-bold text-gray-700">
                      {formatNaira(hqFee)}
                    </span>
                  </div>
                  <span className="text-[10.5px] text-[#6B7280] mt-1">
                    Direct warehouse interstate courier (2–4 days)
                  </span>
                </label>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] shadow-xs space-y-2 text-xs">
              <div className="flex justify-between text-[#6B7280]">
                <span>Formulations Subtotal</span>
                <span className="font-mono font-medium text-[#0F0F10]">{formatNaira(cartSubtotal)}</span>
              </div>
              {appliedCreator && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Creator Discount (10%)</span>
                  <span className="font-mono">-{formatNaira(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#6B7280]">
                <span>Delivery Fee ({fulfillmentOption === 'local' ? selectedCity : 'Lagos HQ'})</span>
                <span className="font-mono font-medium text-[#0F0F10]">{formatNaira(activeDeliveryFee)}</span>
              </div>
              <div className="pt-2 border-t border-[#E5E7EB] flex justify-between items-center text-sm font-bold text-[#0F0F10]">
                <span>Total Payable</span>
                <span className="font-price font-semibold text-[17px] leading-[20px] text-[#FB7701]">{formatNaira(finalTotal)}</span>
              </div>
            </div>

            <button
              onClick={() => navigateTo('checkout')}
              className="w-full py-4 rounded-full bg-[#0F0F10] hover:bg-[#1F1D22] text-white font-heading font-semibold text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* RIGHT COLUMN: "Complete Your Routine" Synergistic Cross-Sell (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#D4AF37]" />
                <h3 className="font-heading font-bold text-sm text-[#0F0F10]">
                  Complete Your Routine
                </h3>
              </div>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Formulations crafted to work synergistically with your selected items for optimal skin barrier glow:
              </p>

              <div className="space-y-3">
                {routineCrossSell.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center gap-3 shadow-xs"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-14 h-14 rounded-lg object-cover bg-[#F6F5F2] shrink-0 border border-[#E5E7EB]"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[9.5px] font-mono text-[#997A2E] font-bold uppercase block truncate">
                        {product.category}
                      </span>
                      <h4 className="font-heading font-bold text-xs text-[#0F0F10] truncate">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-bold text-xs text-[#0F0F10]">
                          {formatNaira(product.price)}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="font-mono text-[10px] text-gray-400 line-through">
                            {formatNaira(product.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => addToCart(product, product.sizes?.[0] || 'Standard', 1)}
                      className="px-3 py-1.5 rounded-lg bg-[#0F0F10] hover:bg-[#D4AF37] hover:text-[#0F0F10] text-white font-bold text-[11px] active:scale-95 transition-all shrink-0 cursor-pointer shadow-xs"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Guarantees Card */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] shadow-xs space-y-2.5 text-xs text-[#6B7280]">
              <div className="flex items-center gap-2 font-bold text-[#0F0F10]">
                <ShieldCheck size={16} className="text-[#D4AF37]" />
                <span>Desla!™ Sourcing Guarantee</span>
              </div>
              <ul className="space-y-1.5 text-[11px] leading-relaxed">
                <li>• 100% NAFDAC compliant safe-conscious active ingredients.</li>
                <li>• Sealed batch codes with anti-counterfeit authenticity verification.</li>
                <li>• Instant WhatsApp order dispatch updates from your local city hub.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
