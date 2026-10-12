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
        <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-center mx-auto text-[#D4AF37] shadow-xs">
            <ShoppingBag size={28} strokeWidth={1.75} />
          </div>
          <div>
            <h2 className="font-heading font-extrabold text-xl text-[#0F0F10]">
              Your Shopping Bag is Empty
            </h2>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto mt-1 leading-relaxed">
              Explore authentic Delsla™ clinical cleansers, barrier creams, and invisible sun defenses.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigateTo('catalogue')}
              className="py-3 px-8 rounded-full bg-[#0F0F10] hover:bg-[#1F1D22] text-white font-heading font-semibold text-xs shadow-md active-press transition-colors cursor-pointer"
            >
              Explore Formulations
            </button>
          </div>

          {/* Quick Starter Formulations */}
          <div className="pt-8 border-t border-[#E5E7EB] text-left">
            <h3 className="font-heading font-semibold text-xs uppercase tracking-wider text-[#0F0F10] mb-3">
              Popular Starter Formulations
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {products.slice(0, 3).map((product) => (
                <div key={product.id} className="p-3 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex flex-col justify-between">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-24 rounded-xl object-cover bg-white mb-2"
                  />
                  <div>
                    <span className="text-[9px] font-mono text-[#997A2E] font-bold uppercase">{product.category}</span>
                    <h4 className="font-semibold text-xs text-[#0F0F10] line-clamp-1">{product.name}</h4>
                    <span className="font-price font-semibold text-xs text-[#0F0F10] block mt-1">{formatNaira(product.price)}</span>
                  </div>
                  <button
                    onClick={() => addToCart(product, product.sizes?.[0] || 'Standard', 1)}
                    className="mt-2 w-full py-1.5 rounded-lg bg-[#0F0F10] text-white text-[10px] font-bold active-press cursor-pointer"
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
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-3">
        {/* Cart items header summary bar */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E7EB]">
          <div>
            <h1 className="font-heading font-extrabold text-base text-[#0F0F10] leading-tight">
              Shopping Bag
            </h1>
            <span className="text-[11px] text-[#6B7280] font-mono">
              {cartItems.length} {cartItems.length === 1 ? 'formulation' : 'formulations'}
            </span>
          </div>
          <button
            onClick={clearCart}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#6B7280] hover:text-rose-600 active-press transition-colors cursor-pointer"
            title="Clear all items from bag"
          >
            <Trash2 size={13} />
            <span>Clear Bag</span>
          </button>
        </div>

        {/* DUAL-GRID CART SYSTEM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Items, Sourcing & Discounts (7 cols) */}
          <div className="lg:col-span-7 min-w-0 space-y-4">
            {/* City Fulfillment Savings Banner */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] flex items-center justify-between text-xs shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FBF5E8] text-[#997A2E] flex items-center justify-center shrink-0 border border-[#D4AF37]/30">
                  <MapPin size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#0F0F10]">
                      Local Hub: {selectedCity}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      Save {formatNaira(3000)} on delivery
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">
                    Items dispatched directly from verified local distributor stock.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="text-xs font-bold text-[#997A2E] hover:underline shrink-0 cursor-pointer active-press ml-2"
              >
                Change
              </button>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div
                  key={`${item.productId}-${item.size}`}
                  className="p-4 rounded-2xl bg-white border border-[#E5E7EB] flex items-center sm:items-start gap-4 shadow-2xs hover:border-[#D4AF37]/40 transition-colors"
                >
                  <img
                    src={item.product.image || '/product_barrier_cream.jpg'}
                    alt={item.product.name}
                    className="w-20 h-20 sm:w-22 sm:h-22 aspect-square rounded-xl object-cover bg-white shrink-0 border border-[#E5E7EB]"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/product_barrier_cream.jpg';
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-[#997A2E] uppercase font-bold block truncate">
                          {item.product.category}
                        </span>
                        <h4 className="font-heading font-bold text-xs sm:text-sm text-[#0F0F10] truncate mt-0.5">
                          {item.product.name}
                        </h4>
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-[#FAF9F6] text-[10px] text-[#4B5563] font-medium border border-[#E5E7EB]">
                          Size: {item.size}
                        </span>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-rose-500 p-1.5 active-press transition-colors cursor-pointer rounded-lg hover:bg-gray-50"
                        aria-label="Remove item"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#F3F4F6]">
                      <span className="font-price font-bold text-xs sm:text-sm text-[#0F0F10]">
                        {formatNaira(item.unitPrice * item.quantity)}
                      </span>

                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-[#E5E7EB] rounded-full bg-[#FAF9F6] px-2 py-0.5 shadow-2xs">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-gray-500 hover:text-black active-press transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-[#0F0F10] font-mono min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-gray-500 hover:text-black active-press transition-colors cursor-pointer"
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
            <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F0F10]">
                <Tag size={13} className="text-[#D4AF37]" />
                <span>Creator / Influencer Promo Code</span>
              </div>
              <form onSubmit={handleApplyCode} className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="e.g. AMARA10 or TIWA10"
                  className="flex-1 px-3 py-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs text-[#0F0F10] uppercase font-mono tracking-wider focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0F0F10] text-white font-bold text-xs hover:bg-[#1F1D22] active-press transition-colors cursor-pointer"
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
            <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F0F10]">
                <Tag size={13} className="text-[#D4AF37]" />
                <span>Loyalty Voucher Code</span>
                {voucherCode && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold">
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
                  className="flex-1 px-3 py-2 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs text-[#0F0F10] uppercase font-mono tracking-wider focus:outline-none focus:border-[#D4AF37]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0F0F10] text-white font-bold text-xs hover:bg-[#1F1D22] active-press transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </form>
              {voucherMessage && (
                <p className="text-[11px] font-medium text-emerald-700">{voucherMessage}</p>
              )}
            </div>

            {/* Fulfillment Selector */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-2.5">
              <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F0F10]">
                Select Sourcing Method
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div
                  onClick={() => setFulfillmentOption('local')}
                  className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all active-press ${
                    fulfillmentOption === 'local'
                      ? 'border-[#D4AF37] bg-[#FBF5E8]/40 shadow-2xs'
                      : 'border-[#E5E7EB] bg-white hover:border-gray-300'
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
                </div>

                <div
                  onClick={() => setFulfillmentOption('lagos')}
                  className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all active-press ${
                    fulfillmentOption === 'lagos'
                      ? 'border-[#D4AF37] bg-[#FBF5E8]/40 shadow-2xs'
                      : 'border-[#E5E7EB] bg-white hover:border-gray-300'
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
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary & Checkout */}
          <div className="lg:col-span-5 min-w-0 space-y-4 lg:sticky lg:top-20">
            {/* Price Breakdown - Clean White Card */}
            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-2 text-xs">
              <h3 className="font-heading font-extrabold text-sm text-[#0F0F10] pb-2 border-b border-[#E5E7EB]">
                Order Summary
              </h3>
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
                <span>Delivery ({fulfillmentOption === 'local' ? `${selectedCity} Hub` : 'Lagos HQ'})</span>
                <span className="font-mono font-medium text-[#0F0F10]">{formatNaira(activeDeliveryFee)}</span>
              </div>
              <div className="pt-2 border-t border-[#E5E7EB] flex justify-between items-center text-sm font-bold text-[#0F0F10]">
                <span>Total Payable</span>
                <span className="font-price font-bold text-lg text-[#0F0F10]">{formatNaira(finalTotal)}</span>
              </div>

              {/* Primary Checkout Button */}
              <button
                onClick={() => navigateTo('checkout')}
                className="w-full mt-2 min-h-[48px] py-3 px-6 rounded-full bg-[#0F0F10] hover:bg-[#1F1D22] text-white font-heading font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 active-press transition-colors cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* "Complete Your Routine" Synergistic Cross-Sell */}
            {routineCrossSell.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] shadow-2xs space-y-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-[#D4AF37]" />
                  <h4 className="font-heading font-bold text-xs text-[#0F0F10]">
                    Complete Your Routine
                  </h4>
                </div>

                <div className="space-y-2">
                  {routineCrossSell.map((product) => (
                    <div
                      key={product.id}
                      className="p-2.5 rounded-xl bg-white border border-[#E5E7EB] hover:border-gray-300 transition-colors flex items-center gap-2.5"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover bg-[#F6F5F2] shrink-0 border border-[#E5E7EB]"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/product_barrier_cream.jpg';
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-heading font-bold text-xs text-[#0F0F10] truncate">
                          {product.name}
                        </h5>
                        <span className="font-mono font-bold text-[11px] text-[#0F0F10]">
                          {formatNaira(product.price)}
                        </span>
                      </div>

                      <button
                        onClick={() => addToCart(product, product.sizes?.[0] || 'Standard', 1)}
                        className="px-2.5 py-1 rounded-lg bg-[#0F0F10] hover:bg-[#D4AF37] hover:text-[#0F0F10] text-white font-bold text-[10.5px] active-press transition-colors shrink-0 cursor-pointer"
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
