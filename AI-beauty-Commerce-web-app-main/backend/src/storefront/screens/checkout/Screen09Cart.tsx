import React, { useState } from 'react';
import {
  ShoppingBag,
  Trash,
  Plus,
  Minus,
  MapPin,
  Tag,
  Ticket,
  ShieldCheck,
  ArrowRight,
  Truck,
  CheckCircle,
  X,
} from '@phosphor-icons/react';
import { creatorDiscountNaira } from '../../lib/order-journey';
import { useApp } from '../../context/AppContext';
import { CustomerAccess } from '../../components/auth/CustomerAccess';
import { ProductImage } from '../../components/common/ProductImage';

const Screen09CartContent: React.FC = () => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    navigateTo,
    products,
    appliedCreator,
    activeCreatorCode,
    creatorDiscountPercent,
    applyCreatorCode,
    selectedCity,
    setIsLocationModalOpen,
    addToCart,
    voucherCode,
    setVoucherCode,
  } = useApp();

  const [promoInput, setPromoInput] = useState('');
  const [promoApplying, setPromoApplying] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [voucherInput, setVoucherInput] = useState(voucherCode);
  const [voucherMessage, setVoucherMessage] = useState('');

  const formatNaira = (amt: number) => '₦' + amt.toLocaleString('en-NG');

  const handleApplyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = promoInput.trim();
    if (!trimmed) return;
    setPromoApplying(true);
    try {
      const res = await applyCreatorCode(trimmed);
      if (res.success) {
        setPromoMessage({ text: res.message || `Creator code ${trimmed.toUpperCase()} applied.`, success: true });
      } else {
        setPromoMessage({ text: res.message || 'This creator code is invalid or expired.', success: false });
      }
    } finally {
      setPromoApplying(false);
    }
  };

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const code = voucherInput.trim().toUpperCase();
    setVoucherCode(code);
    setVoucherMessage(code ? `Voucher ${code} saved for verification at checkout.` : 'Voucher cleared.');
  };

  const handleClearVoucher = () => {
    setVoucherInput('');
    setVoucherCode('');
    setVoucherMessage('');
  };

  const discountAmount = activeCreatorCode ? creatorDiscountNaira(cartSubtotal, creatorDiscountPercent) : 0;
  const finalTotal = Math.max(0, cartSubtotal - discountAmount);

  // Complementary products for light editorial cross-sell
  const crossSellProducts = products
    .filter((p) => !cartItems.some((item) => item.productId === p.id))
    .slice(0, 3);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#0F0F10] pb-28 lg:pb-16 font-body flex flex-col items-center justify-center px-6">
        <div className="max-w-sm w-full text-center space-y-5">
          <ShoppingBag size={40} weight="fill" className="mx-auto text-[#0F0F10]/25" aria-hidden="true" />
          <div className="space-y-1.5">
            <h1 className="font-heading font-semibold text-xl sm:text-2xl text-[#0F0F10] tracking-tight">
              Your Shopping Bag Is Empty
            </h1>
            <p className="text-sm text-[#6B7280] leading-relaxed">
              Explore natural formulations calibrated for daily skin balance and barrier strength.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('catalogue')}
            className="w-full py-3.5 px-6 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-xs sm:text-sm font-semibold active:scale-[0.97] transition-all cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <span>Explore Formulations</span>
            <ArrowRight size={14} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0F0F10] pb-32 lg:pb-20 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        {/* Minimal Editorial Page Header */}
        <header className="flex items-end justify-between pb-5 border-b border-[#E5E7EB]">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#997A2E] font-semibold">
              Review Selection
            </p>
            <h1 className="font-heading font-semibold text-2xl sm:text-3xl text-[#0F0F10] tracking-tight mt-0.5">
              Shopping Bag
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-[#6B7280]">
              {cartItems.reduce((sum, i) => sum + i.quantity, 0)} {cartItems.length === 1 ? 'item' : 'items'}
            </span>
            <button
              type="button"
              onClick={clearCart}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B7280] hover:text-red-600 transition-colors cursor-pointer py-1.5"
            >
              <Trash size={14} weight="fill" aria-hidden="true" />
              <span>Clear bag</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pt-6 sm:pt-8 items-start">
          {/* LEFT COLUMN: Location Bar, Cart Line Items & Cross-Sell */}
          <div className="lg:col-span-7 space-y-6">
            {/* Borderless Editorial Dispatch Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-[#E5E7EB] text-xs">
              <div className="flex items-center gap-2.5 text-[#0F0F10] min-w-0">
                <MapPin size={16} weight="fill" className="text-[#997A2E] shrink-0" aria-hidden="true" />
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="font-semibold">Local Hub: {selectedCity}</span>
                  <span className="text-[#6B7280] flex items-center gap-1">
                    <Truck size={13} weight="fill" className="text-[#6B7280] shrink-0" aria-hidden="true" />
                    <span>Delivery &amp; pickup calculated at checkout</span>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="text-xs font-semibold text-[#997A2E] hover:text-[#0F0F10] underline underline-offset-4 transition-colors cursor-pointer"
              >
                Change city
              </button>
            </div>

            {/* Clean Editorial Line Items List */}
            <ul className="divide-y divide-[#E5E7EB]">
              {cartItems.map((item) => {
                const variantLabel = item.size && item.size !== 'Standard' ? item.size : 'Full Size';
                return (
                  <li
                    key={`${item.productId}-${item.size}`}
                    className="py-5 first:pt-1 flex gap-4 sm:gap-5 items-start"
                  >
                    {/* Proportional Product Photograph */}
                    <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl bg-[#F3EEE3]/60 overflow-hidden shrink-0">
                      <ProductImage
                        src={item.product.image}
                        alt={item.product.name}
                        sizes="96px"
                        className="w-full h-full object-cover object-center"
                      />
                    </div>

                    {/* Details + Controls */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between min-h-[96px] sm:min-h-[112px]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-[#6B7280] block">
                            {item.product.category} • {variantLabel}
                          </span>
                          <h2 className="font-heading font-semibold text-[15px] sm:text-base text-[#0F0F10] leading-snug mt-0.5">
                            {item.product.name}
                          </h2>
                          <span className="text-xs text-[#6B7280] block mt-1">
                            {formatNaira(item.unitPrice)} each
                          </span>
                        </div>

                        <span className="font-price font-semibold text-sm sm:text-base text-[#0F0F10] shrink-0">
                          {formatNaira(item.unitPrice * item.quantity)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-3">
                        {/* Refined Quantity Stepper */}
                        <div className="inline-flex items-center rounded-full bg-white border border-[#E5E7EB] px-1 py-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-[#0F0F10] hover:bg-[#FAF9F6] active:scale-90 transition-all cursor-pointer"
                            aria-label={`Decrease quantity of ${item.product.name}`}
                          >
                            <Minus size={12} weight="bold" aria-hidden="true" />
                          </button>
                          <span className="w-8 text-center font-mono font-semibold text-xs text-[#0F0F10]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-[#0F0F10] hover:bg-[#FAF9F6] active:scale-90 transition-all cursor-pointer"
                            aria-label={`Increase quantity of ${item.product.name}`}
                          >
                            <Plus size={12} weight="bold" aria-hidden="true" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-red-600 transition-colors cursor-pointer py-1.5 px-2"
                          aria-label={`Remove ${item.product.name}`}
                        >
                          <Trash size={14} weight="fill" aria-hidden="true" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Editorial Pairings */}
            {crossSellProducts.length > 0 && (
              <section aria-label="Complementary formulations" className="pt-4 border-t border-[#E5E7EB] space-y-3">
                <h3 className="font-heading font-semibold text-sm text-[#0F0F10]">
                  Pair with Your Regimen
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {crossSellProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex sm:flex-col items-center sm:items-stretch gap-3 p-3 rounded-xl bg-white border border-[#E5E7EB]/80"
                    >
                      <div className="w-14 h-14 sm:w-full sm:h-24 rounded-lg overflow-hidden bg-[#F6F5F2] shrink-0">
                        <ProductImage
                          src={p.image}
                          alt={p.name}
                          sizes="160px"
                          className="w-full h-full object-cover object-center"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-medium text-xs text-[#0F0F10] truncate">
                          {p.name}
                        </p>
                        <p className="font-price font-semibold text-xs text-[#997A2E] mt-0.5">
                          {formatNaira(p.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addToCart(p, p.sizes?.[0] || 'Standard', 1)}
                        className="px-3 py-1.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white text-[11px] font-semibold active:scale-[0.97] transition-all cursor-pointer shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT COLUMN: Editorial Checkout Summary & Codes */}
          <aside className="lg:col-span-5 lg:sticky lg:top-24 bg-white rounded-2xl border border-[#E5E7EB] p-5 sm:p-6 space-y-5">
            <h2 className="font-heading font-semibold text-base text-[#0F0F10]">
              Order Summary
            </h2>

            {/* Creator / Promo Code */}
            <div className="space-y-2 pb-4 border-b border-[#E5E7EB]">
              <label htmlFor="cart-promo-input" className="flex items-center gap-1.5 text-xs font-medium text-[#0F0F10]">
                <Tag size={14} weight="fill" className="text-[#997A2E]" aria-hidden="true" />
                <span>Creator or Promo Code</span>
              </label>
              <form onSubmit={handleApplyCode} className="flex gap-2">
                <input
                  id="cart-promo-input"
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  placeholder="Enter code (e.g. AMARA10)"
                  className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-base sm:text-xs font-mono uppercase text-[#0F0F10] placeholder:normal-case placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0F0F10] transition-colors"
                />
                <button
                  type="submit"
                  disabled={promoApplying || !promoInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#0F0F10] hover:bg-[#27272A] disabled:opacity-45 text-white text-xs font-semibold active:scale-[0.97] transition-all cursor-pointer shrink-0"
                >
                  {promoApplying ? 'Applying…' : 'Apply'}
                </button>
              </form>

              {activeCreatorCode && (
                <div className="flex items-center justify-between text-xs text-emerald-700 pt-1">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <CheckCircle size={14} weight="fill" className="shrink-0" aria-hidden="true" />
                    <span>
                      Code <strong>{activeCreatorCode}</strong> applied
                      {appliedCreator?.name ? ` (${appliedCreator.name})` : ''}
                    </span>
                  </span>
                </div>
              )}

              {promoMessage && !promoMessage.success && (
                <p role="alert" className="text-xs text-red-600 pt-0.5">
                  {promoMessage.text}
                </p>
              )}
              {promoMessage && promoMessage.success && !activeCreatorCode && (
                <p className="text-xs text-emerald-700 pt-0.5">{promoMessage.text}</p>
              )}
            </div>

            {/* Loyalty Voucher */}
            <div className="space-y-2 pb-4 border-b border-[#E5E7EB]">
              <label htmlFor="cart-voucher-input" className="flex items-center gap-1.5 text-xs font-medium text-[#0F0F10]">
                <Ticket size={14} weight="fill" className="text-[#997A2E]" aria-hidden="true" />
                <span>Desla Club Voucher</span>
              </label>
              <form onSubmit={handleApplyVoucher} className="flex gap-2">
                <input
                  id="cart-voucher-input"
                  type="text"
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value)}
                  placeholder="Optional voucher code"
                  className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-base sm:text-xs font-mono uppercase text-[#0F0F10] placeholder:normal-case placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0F0F10] transition-colors"
                />
                {voucherCode ? (
                  <button
                    type="button"
                    onClick={handleClearVoucher}
                    aria-label="Clear voucher"
                    className="px-3 py-2.5 rounded-xl border border-[#E5E7EB] text-[#6B7280] hover:text-[#0F0F10] text-xs font-medium cursor-pointer flex items-center gap-1"
                  >
                    <X size={13} weight="bold" aria-hidden="true" />
                    <span>Clear</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!voucherInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] hover:border-[#0F0F10] disabled:opacity-45 text-[#0F0F10] text-xs font-semibold active:scale-[0.97] transition-all cursor-pointer shrink-0"
                  >
                    Save
                  </button>
                )}
              </form>
              {voucherMessage && (
                <p className="text-xs text-[#6B7280]">{voucherMessage}</p>
              )}
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-2.5 text-xs sm:text-[13px]">
              <div className="flex justify-between text-[#6B7280]">
                <span>Subtotal</span>
                <span className="font-price font-medium text-[#0F0F10]">{formatNaira(cartSubtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Creator discount ({creatorDiscountPercent}%)</span>
                  <span className="font-price">-{formatNaira(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-[#6B7280]">
                <span>Estimated delivery</span>
                <span>Calculated next step</span>
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex items-baseline justify-between">
                <span className="font-heading font-semibold text-sm text-[#0F0F10]">Estimated Total</span>
                <span className="font-price font-semibold text-xl text-[#0F0F10]">
                  {formatNaira(finalTotal)}
                </span>
              </div>
            </div>

            {/* Checkout Action */}
            <button
              type="button"
              onClick={() => navigateTo('checkout')}
              className="w-full py-3.5 px-6 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-white font-heading font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-all cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={15} weight="bold" className="text-[#D4AF37]" aria-hidden="true" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#6B7280] pt-1">
              <ShieldCheck size={14} weight="fill" className="text-[#997A2E] shrink-0" aria-hidden="true" />
              <span>NAFDAC-certified batches • Local hub fulfillment</span>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export const Screen09Cart: React.FC = () => (
  <CustomerAccess title="Sign in to view your bag">
    <Screen09CartContent />
  </CustomerAccess>
);
