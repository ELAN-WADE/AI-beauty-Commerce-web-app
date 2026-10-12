import React, { useState } from 'react';
import {
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ShoppingBag,
  X,
  Tag,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useViewport } from '../../context/ViewportContext';

export const Screen09Cart: React.FC = () => {
  const { isDesktop } = useViewport();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    navigateTo,
    products,
    appliedCreator,
    applyCreatorCode,
    selectedCity,
    setIsLocationModalOpen,
    addToCart,
    voucherCode,
    setVoucherCode
  } = useApp();

  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [voucherInput, setVoucherInput] = useState(voucherCode);
  const [voucherMessage, setVoucherMessage] = useState('');
  const [fulfillmentOption, setFulfillmentOption] = useState<'local' | 'lagos'>('local');

  const formatNaira = (amt: number) => '₦' + amt.toLocaleString('en-NG');

  const handleApplyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = await applyCreatorCode(promoInput.trim());
    if (res.success) {
      setPromoMessage({ text: res.message, success: true });
    } else {
      setPromoMessage({ text: 'Invalid or expired creator code. Try AMARA10 or TIWA10.', success: false });
    }
  };

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const code = voucherInput.trim().toUpperCase();
    setVoucherCode(code);
    setVoucherMessage(code ? `Voucher ${code} will be validated at secure checkout.` : '');
  };

  const discountAmount = appliedCreator ? Math.round(cartSubtotal * 0.1) : 0;
  const localFee = selectedCity === 'Lagos' ? 2000 : 1500;
  const hqFee = 4500;
  const activeDeliveryFee = fulfillmentOption === 'local' ? localFee : hqFee;
  const finalTotal = Math.max(0, cartSubtotal - discountAmount + activeDeliveryFee);

  // Suggested formulations for cross-sell
  const routineCrossSell = products.filter(
    (p) => !cartItems.some((ci) => ci.productId === p.id)
  ).slice(0, 3);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white text-[#0F0F10] pb-28 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#FAF9F6] flex items-center justify-center mx-auto text-[#0F0F10]">
            <ShoppingBag size={26} strokeWidth={1.5} />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-heading font-extrabold text-2xl text-[#0F0F10] tracking-tight">
              Your bag is empty
            </h2>
            <p className="text-xs text-[#737373] max-w-sm mx-auto leading-relaxed">
              Explore authentic Delsla™ clinical cleansers, barrier creams, and invisible sun defenses.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigateTo('catalogue')}
              className="py-3 px-8 rounded-full bg-[#0F0F10] hover:bg-[#262626] text-white font-heading font-semibold text-xs tracking-wide shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              Explore Formulations
            </button>
          </div>

          {/* Quick Starter Formulations */}
          <div className="pt-10 border-t border-black/[0.06] text-left">
            <h3 className="font-heading font-semibold text-xs uppercase tracking-wider text-[#737373] mb-4">
              Popular Starter Formulations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {products.slice(0, 3).map((product) => (
                <div key={product.id} className="p-3.5 rounded-2xl bg-[#FAF9F6] flex flex-col justify-between hover:bg-[#F5F4F0] transition-colors">
                  <div className="w-full h-28 rounded-xl overflow-hidden bg-white mb-3 flex items-center justify-center">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#8C7335] font-semibold uppercase tracking-wider">{product.category}</span>
                    <h4 className="font-semibold text-xs text-[#0F0F10] line-clamp-1 mt-0.5">{product.name}</h4>
                    <span className="font-price font-semibold text-xs text-[#0F0F10] block mt-1">{formatNaira(product.price)}</span>
                  </div>
                  <button
                    onClick={() => addToCart(product, product.sizes?.[0] || 'Standard', 1)}
                    className="mt-3 w-full py-2 rounded-full bg-[#0F0F10] text-white text-[11px] font-semibold active:scale-95 transition-transform cursor-pointer"
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
    <div className="min-h-screen bg-white text-[#0F0F10] pb-28 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      <main className="max-w-6xl mx-auto px-4 lg:px-8 pt-6 sm:pt-8">
        {/* Cart items header summary bar */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-black/[0.06]">
          <div>
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-[#0F0F10] tracking-tight">
              Shopping Bag
            </h1>
            <span className="text-xs text-[#737373] font-mono mt-0.5 block">
              {cartItems.length} {cartItems.length === 1 ? 'formulation' : 'formulations'}
            </span>
          </div>
          <button
            onClick={clearCart}
            className="flex items-center gap-1.5 text-xs font-medium text-[#737373] hover:text-rose-600 active:scale-95 transition-colors cursor-pointer"
            title="Clear all items from bag"
          >
            <Trash2 size={13} />
            <span>Clear Bag</span>
          </button>
        </div>

        {/* DUAL-GRID CART SYSTEM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* LEFT COLUMN: Items, Sourcing & Discounts (7 cols) */}
          <div className="lg:col-span-7 min-w-0 space-y-6">
            {/* City Fulfillment Savings Banner */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white text-[#8C7335] flex items-center justify-center shrink-0 shadow-2xs">
                  <MapPin size={15} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0F0F10]">
                      Local Hub: {selectedCity}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 font-semibold">
                      Save {formatNaira(3000)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#737373] mt-0.5">
                    Dispatched from verified local distributor stock.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="text-xs font-semibold text-[#8C7335] hover:underline shrink-0 cursor-pointer active:scale-95 ml-2"
              >
                Change
              </button>
            </div>

            {/* Cart Items List — Borderless, Breathable Luxury Layout */}
            <div className="divide-y divide-black/[0.06]">
              {cartItems.map((item) => (
                <div
                  key={`${item.productId}-${item.size}`}
                  className="py-5 first:pt-0 last:pb-0 flex items-center sm:items-start gap-4 sm:gap-5"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#FAF9F6] p-2 shrink-0 flex items-center justify-center overflow-hidden">
                    <img
                      src={item.product.image || '/product_barrier_cream.jpg'}
                      alt={item.product.name}
                      className="w-full h-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/product_barrier_cream.jpg';
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-[#8C7335] uppercase font-semibold block truncate">
                          {item.product.category}
                        </span>
                        <h4 className="font-heading font-bold text-sm sm:text-base text-[#0F0F10] truncate mt-0.5">
                          {item.product.name}
                        </h4>
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-[#F5F5F5] text-[10px] text-[#525252] font-medium">
                          {item.size}
                        </span>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-[#A3A3A3] hover:text-rose-500 p-1.5 active:scale-95 transition-colors cursor-pointer rounded-full hover:bg-black/5"
                        aria-label="Remove item"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3 sm:mt-4">
                      <span className="font-price font-bold text-sm sm:text-base text-[#0F0F10]">
                        {formatNaira(item.unitPrice * item.quantity)}
                      </span>

                      {/* Tactile Pill Stepper */}
                      <div className="flex items-center rounded-full bg-[#F5F5F5] px-2 py-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-full text-[#737373] hover:text-black active:scale-90 transition-all cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-2 text-xs font-bold text-[#0F0F10] font-mono min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-full text-[#737373] hover:text-black active:scale-90 transition-all cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Creator Promo Code Input */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F0F10]">
                <Tag size={13} className="text-[#8C7335]" />
                <span>Creator / Influencer Promo Code</span>
              </div>
              <form onSubmit={handleApplyCode} className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="e.g. AMARA10 or TIWA10"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-white text-xs text-[#0F0F10] uppercase font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-black shadow-2xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#0F0F10] text-white font-semibold text-xs hover:bg-[#262626] active:scale-95 transition-all cursor-pointer"
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

            {/* Loyalty Voucher Input */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F0F10]">
                <Tag size={13} className="text-[#8C7335]" />
                <span>Loyalty Voucher Code</span>
                {voucherCode && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                    {voucherCode}
                  </span>
                )}
              </div>
              <form onSubmit={handleApplyVoucher} className="flex gap-2">
                <input
                  type="text"
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value)}
                  placeholder="e.g. GLW-AB12CD"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-white text-xs text-[#0F0F10] uppercase font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-black shadow-2xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#0F0F10] text-white font-semibold text-xs hover:bg-[#262626] active:scale-95 transition-all cursor-pointer"
                >
                  Apply
                </button>
              </form>
              {voucherMessage && (
                <p className="text-[11px] font-medium text-emerald-700">{voucherMessage}</p>
              )}
            </div>

            {/* Fulfillment Selector */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] space-y-3">
              <h3 className="font-heading font-semibold text-xs uppercase tracking-wider text-[#737373]">
                Fulfillment Method
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setFulfillmentOption('local')}
                  className={`p-3.5 rounded-xl cursor-pointer flex flex-col justify-between transition-all active:scale-[0.98] ${
                    fulfillmentOption === 'local'
                      ? 'bg-white shadow-xs ring-1 ring-[#0F0F10]'
                      : 'bg-white/60 hover:bg-white text-[#737373]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#0F0F10]">
                      Local Hub ({selectedCity})
                    </span>
                    <span className="font-mono text-xs font-bold text-[#8C7335]">
                      {formatNaira(localFee)}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#737373] mt-1">
                    Same-day bike dispatch or pickup in {selectedCity}
                  </span>
                </div>

                <div
                  onClick={() => setFulfillmentOption('lagos')}
                  className={`p-3.5 rounded-xl cursor-pointer flex flex-col justify-between transition-all active:scale-[0.98] ${
                    fulfillmentOption === 'lagos'
                      ? 'bg-white shadow-xs ring-1 ring-[#0F0F10]'
                      : 'bg-white/60 hover:bg-white text-[#737373]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#0F0F10]">
                      Lagos Central HQ
                    </span>
                    <span className="font-mono text-xs font-bold text-[#737373]">
                      {formatNaira(hqFee)}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#737373] mt-1">
                    Direct warehouse interstate courier (2–4 days)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary & Checkout */}
          <div className="lg:col-span-5 min-w-0 space-y-5 lg:sticky lg:top-24">
            {/* Price Breakdown - Architectural Card */}
            <div className="p-6 rounded-3xl bg-[#FAF9F6] space-y-3.5 text-xs">
              <h3 className="font-heading font-extrabold text-base text-[#0F0F10] pb-3 border-b border-black/[0.06]">
                Order Summary
              </h3>
              <div className="flex justify-between text-[#737373]">
                <span>Formulations Subtotal</span>
                <span className="font-mono font-medium text-[#0F0F10]">{formatNaira(cartSubtotal)}</span>
              </div>
              {appliedCreator && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Creator Discount (10%)</span>
                  <span className="font-mono">-{formatNaira(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#737373]">
                <span>Delivery ({fulfillmentOption === 'local' ? `${selectedCity} Hub` : 'Lagos HQ'})</span>
                <span className="font-mono font-medium text-[#0F0F10]">{formatNaira(activeDeliveryFee)}</span>
              </div>
              <div className="pt-3 border-t border-black/[0.06] flex justify-between items-center text-sm font-bold text-[#0F0F10]">
                <span>Total Payable</span>
                <span className="font-price font-extrabold text-xl text-[#0F0F10]">{formatNaira(finalTotal)}</span>
              </div>

              {/* Primary Checkout Button */}
              <button
                onClick={() => navigateTo('checkout')}
                className="w-full mt-3 min-h-[50px] py-3.5 px-6 rounded-full bg-[#0F0F10] hover:bg-[#262626] text-white font-heading font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* "Complete Your Routine" Synergistic Cross-Sell */}
            {routineCrossSell.length > 0 && (
              <div className="p-5 rounded-3xl bg-[#FAF9F6] space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-[#8C7335]" />
                  <h4 className="font-heading font-semibold text-xs text-[#0F0F10]">
                    Complete Your Routine
                  </h4>
                </div>

                <div className="space-y-2.5">
                  {routineCrossSell.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 rounded-2xl bg-white flex items-center gap-3 hover:shadow-xs transition-shadow"
                    >
                      <div className="w-12 h-12 rounded-xl bg-[#FAF9F6] p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/product_barrier_cream.jpg';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-heading font-semibold text-xs text-[#0F0F10] truncate">
                          {product.name}
                        </h5>
                        <span className="font-mono font-bold text-[11px] text-[#0F0F10]">
                          {formatNaira(product.price)}
                        </span>
                      </div>

                      <button
                        onClick={() => addToCart(product, product.sizes?.[0] || 'Standard', 1)}
                        className="px-3 py-1.5 rounded-full bg-[#0F0F10] hover:bg-[#262626] text-white font-semibold text-[11px] active:scale-95 transition-transform shrink-0 cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
