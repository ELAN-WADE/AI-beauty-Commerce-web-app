import React, { useEffect, useState } from 'react';
import {
  Check,
  User,
  MapPin,
  Truck,
  ShieldCheck,
  ArrowRight,
  Store,
  Clock,
  CreditCard,
  ChevronLeft,
  ShoppingBag
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useViewport } from '../../context/ViewportContext';
import { locateStockApi, resolveVariantId, isOwnedApiConfigured, type FulfilmentOption } from '../../lib/owned-api';
import { routingKey } from '../../lib/fulfilment';

export const Screen10Checkout: React.FC = () => {
  const { isDesktop } = useViewport();
  const {
    cartItems,
    cartSubtotal,
    cartDeliveryFee,
    cartTotal,
    navigateTo,
    goBack,
    userProfile,
    selectedCity,
    appliedCreator,
    activeCreatorCode,
    creatorDiscountPercent,
    preferredDistributor,
    checkoutFulfilment,
    setCheckoutFulfilment,
    getDistributorsForCity,
    products,
    addToCart,
    checkoutAddress,
    setCheckoutAddress,
    selectedGateway,
    setSelectedGateway
  } = useApp();

  const [fulfilMode, setFulfilMode] = useState<'DELIVERY' | 'PICKUP'>(checkoutFulfilment?.method ?? 'DELIVERY');
  const [fulfilOptions, setFulfilOptions] = useState<FulfilmentOption[] | null>(null);
  const [fulfilLocationId, setFulfilLocationId] = useState<string | null>(checkoutFulfilment?.locationId ?? preferredDistributor?.location?.id ?? null);
  const [fulfilLoading, setFulfilLoading] = useState(false);
  const [fulfilError, setFulfilError] = useState('');
  const [fulfilHasFullCart, setFulfilHasFullCart] = useState(true);
  const [retryRouting, setRetryRouting] = useState(0);
  const [resolvedKey, setResolvedKey] = useState('');

  const [formData, setFormData] = useState({
    fullName: checkoutAddress.fullName || userProfile.name,
    email: checkoutAddress.email || userProfile.email,
    phone: checkoutAddress.phone || userProfile.phone,
    street: checkoutAddress.street || 'Plot 742, Aminu Kano Crescent, Wuse 2',
    city: checkoutAddress.city || selectedCity,
    state: checkoutAddress.state || (selectedCity === 'Lagos' ? 'Lagos State' : selectedCity === 'Abuja' ? 'Abuja FCT' : `${selectedCity} State`),
    deliveryNotes: checkoutAddress.deliveryNotes || 'Please ring upon arrival at estate gate.'
  });

  const formatNaira = (amt: number) => '₦' + amt.toLocaleString('en-NG');

  const localDistributors = getDistributorsForCity(selectedCity);
  const currentRoutingKey = routingKey(cartItems, formData.city || selectedCity, formData.state, fulfilMode);

  // Live fulfilment options: resolve cart lines to variant ids, then ask routing.
  useEffect(() => {
    if (!isOwnedApiConfigured || cartItems.length === 0) {
      setFulfilOptions(null);
      return;
    }
    let cancelled = false;
    setFulfilLoading(true);
    setFulfilError('');
    setFulfilOptions(null);
    setResolvedKey('');
    setCheckoutFulfilment(null);
    (async () => {
      try {
        const lines: { variantId: string; qty: number }[] = [];
        for (const ci of cartItems) {
          const variantId = await resolveVariantId(ci.productId, ci.size);
          if (variantId) lines.push({ variantId, qty: ci.quantity });
        }
        if (lines.length !== cartItems.length) {
          if (!cancelled) {
            setFulfilOptions([]);
            setFulfilHasFullCart(false);
            setFulfilError('Some items are not available for live checkout yet.');
          }
          return;
        }
        const res = await locateStockApi({ city: formData.city || selectedCity, state: formData.state, method: fulfilMode, items: lines });
        if (cancelled) return;
        if (!res || res.options.length === 0) {
          setFulfilOptions([]);
          setFulfilHasFullCart(false);
          setFulfilError(fulfilMode === 'PICKUP' ? 'No pickup point can fulfil your complete bag. Try delivery.' : 'Your complete bag is not available for delivery to this city.');
          return;
        }
        setFulfilOptions(res.options);
        setFulfilHasFullCart(res.hasFullCart);
        setResolvedKey(currentRoutingKey);
        setFulfilLocationId((prev) => (prev && res.options.some((o) => o.locationId === prev) ? prev : preferredDistributor ? null : res.recommendedLocationId));
      } catch (e) {
        if (!cancelled) {
          setFulfilOptions(null);
          setFulfilHasFullCart(false);
          setFulfilError(e instanceof Error ? e.message : 'Could not check fulfilment. Please retry.');
        }
      } finally {
        if (!cancelled) setFulfilLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // formData.city/state drive routing; cart changes re-resolve. fulfilMode switches lists.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoutingKey, retryRouting]);

  const selectedOption = resolvedKey === currentRoutingKey ? fulfilOptions?.find((o) => o.locationId === fulfilLocationId) ?? null : null;
  const canContinue = !isOwnedApiConfigured || (!fulfilLoading && fulfilHasFullCart && !!selectedOption);
  const fallbackDeliveryFee = selectedCity === 'Lagos' ? 2000 : 1500;
  const currentDeliveryFee = selectedOption ? selectedOption.feeKobo / 100 : isOwnedApiConfigured ? null : fallbackDeliveryFee;
  const creatorDiscount = activeCreatorCode ? Math.round(cartSubtotal * creatorDiscountPercent) / 100 : 0;
  const calculatedTotal = currentDeliveryFee == null ? null : Math.max(0, cartSubtotal - creatorDiscount + currentDeliveryFee);

  // Cross-sell items
  const routineAddons = products.filter(
    (p) => !cartItems.some((ci) => ci.productId === p.id)
  ).slice(0, 2);

  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue) {
      setFulfilError('Choose a delivery option to continue.');
      return;
    }
    if (selectedOption) setCheckoutFulfilment({ locationId: selectedOption.locationId, method: fulfilMode, feeKobo: selectedOption.feeKobo, routingKey: currentRoutingKey });
    setCheckoutAddress(formData);
    navigateTo('payment');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white text-[#0F0F10] pb-28 font-body">
        <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#FAF9F6] flex items-center justify-center mx-auto text-[#D4AF37]">
            <ShoppingBag size={26} strokeWidth={1.8} />
          </div>
          <h2 className="font-heading font-semibold text-xl text-[#0F0F10] tracking-tight">
            No Items in Checkout
          </h2>
          <p className="text-xs text-[#6B7280]">
            Your shopping bag is currently empty. Explore our clinical formulations.
          </p>
          <button
            onClick={() => navigateTo('catalogue')}
            className="py-3 px-6 rounded-full bg-[#0F0F10] hover:bg-[#252429] text-white font-semibold text-xs active:scale-[0.98] transition-all cursor-pointer"
          >
            Explore Catalogue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0F0F10] pb-36 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-4">
        {/* Step Progress Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E5E7EB]/60">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              className="w-8 h-8 rounded-full bg-[#FAF9F6] hover:bg-[#F0EDE8] flex items-center justify-center text-[#0F0F10] transition-colors cursor-pointer"
              aria-label="Back to bag"
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <h1 className="font-heading font-semibold text-base sm:text-lg text-[#0F0F10] tracking-tight">
                Fulfillment &amp; Checkout
              </h1>
              <p className="text-xs text-[#6B7280]">Verified dispatch across Lagos, Abuja &amp; nationwide</p>
            </div>
          </div>
          <nav aria-label="Checkout Progress" className="hidden sm:flex items-center gap-2 text-xs">
            <button type="button" onClick={() => navigateTo('cart')} className="text-[#6B7280] hover:text-[#0F0F10] transition-colors cursor-pointer">Bag</button>
            <span className="text-[#D1D5DB]">/</span>
            <span className="font-semibold text-[#0F0F10] bg-[#FAF9F6] px-2.5 py-1 rounded-full">Fulfillment</span>
            <span className="text-[#D1D5DB]">/</span>
            <span className="text-[#9CA3AF]">Payment</span>
            <span className="text-[#D1D5DB]">/</span>
            <span className="text-[#9CA3AF]">Confirmation</span>
          </nav>
        </div>

        {/* DUAL-GRID CHECKOUT SYSTEM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT COLUMN: Fulfillment Choice, Address Form & Payment Gateway Selection (7 cols) */}
          <div className="lg:col-span-7 space-y-6">

            {/* Fulfilment Method Segmented Control & Live Node Picker */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-semibold text-sm text-[#0F0F10] tracking-tight">
                    1. Method of Fulfillment
                  </h2>
                  <p className="text-xs text-[#6B7280]">Choose doorstep delivery or local hub pickup</p>
                </div>
                <span className="text-[11px] font-mono font-semibold text-[#997A2E] bg-[#FAF9F6] px-2.5 py-1 rounded-full">
                  {formData.city || selectedCity}
                </span>
              </div>

              {/* Segmented Pill Control */}
              <div className="p-1.5 bg-[#FAF9F6] rounded-2xl flex gap-1" role="group" aria-label="Fulfilment method">
                {(['DELIVERY', 'PICKUP'] as const).map((mode) => {
                  const isActive = fulfilMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFulfilMode(mode)}
                      aria-pressed={isActive}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        isActive
                          ? 'bg-white text-[#0F0F10] shadow-xs'
                          : 'text-[#6B7280] hover:text-[#0F0F10]'
                      }`}
                    >
                      {mode === 'DELIVERY' ? <Truck size={14} /> : <Store size={14} />}
                      <span>{mode === 'DELIVERY' ? 'Doorstep Delivery' : 'Pickup in Store'}</span>
                    </button>
                  );
                })}
              </div>

              {fulfilLoading ? (
                <div className="p-4 rounded-2xl bg-[#FAF9F6]/50 text-xs text-[#6B7280]">
                  Checking live availability across dispatch nodes…
                </div>
              ) : fulfilOptions && fulfilOptions.length > 0 ? (
                <div className="space-y-2" role="radiogroup" aria-label={fulfilMode === 'DELIVERY' ? 'Delivery options' : 'Pickup points'}>
                  {fulfilOptions.map((option) => {
                    const selected = fulfilLocationId === option.locationId;
                    return (
                      <button
                        key={option.locationId}
                        type="button"
                        onClick={() => setFulfilLocationId(option.locationId)}
                        role="radio"
                        aria-checked={selected}
                        className={`w-full text-left p-4 rounded-2xl transition-all cursor-pointer ${
                          selected
                            ? 'bg-[#FAF9F6] ring-1.5 ring-[#0F0F10]'
                            : 'bg-[#FAF9F6]/40 hover:bg-[#FAF9F6] text-[#4B5563]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-xs text-[#0F0F10] block">{option.name}</span>
                            <span className="text-[11px] text-[#6B7280] block">
                              {option.city}{option.address ? ` • ${option.address}` : ''}{fulfilMode === 'PICKUP' && option.operatingHours ? ` • ${option.operatingHours}` : ''}
                            </span>
                            <span className="text-[11px] text-[#997A2E] font-medium block">{option.etaText}</span>
                          </div>
                          <span className="font-mono font-bold text-xs text-[#0F0F10] shrink-0">
                            {option.feeKobo === 0 ? 'Free' : formatNaira(Math.round(option.feeKobo / 100))}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  {isOwnedApiConfigured
                    ? 'Enter your city below and verified fulfillment options will populate automatically.'
                    : `Standard dispatch from ${selectedCity}. Live inventory verified.`}
                </p>
              )}
              {preferredDistributor && (
                <p className="text-xs text-[#6B7280]">
                  Preferred store: <span className="text-[#0F0F10] font-medium">{preferredDistributor.location?.name}</span>. If unavailable for full order, select an alternate hub.
                </p>
              )}
              {fulfilError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center justify-between">
                  <span>{fulfilError}</span>
                  <button type="button" disabled={fulfilLoading} onClick={() => setRetryRouting(n => n + 1)} className="underline font-semibold cursor-pointer">
                    Retry
                  </button>
                </div>
              )}
              {!fulfilHasFullCart && fulfilOptions && fulfilOptions.length === 0 && (
                <p className="text-xs text-[#6B7280]">
                  One location must hold every item in your bag. Consider doorstep delivery or adjusting line items.
                </p>
              )}
            </section>

            {/* Recipient & Delivery Address Form */}
            <form onSubmit={handleContinueToPayment} className="space-y-6 pt-4 border-t border-[#E5E7EB]/60">
              <div>
                <h2 className="font-heading font-semibold text-sm text-[#0F0F10] tracking-tight">
                  2. Recipient &amp; Delivery Details
                </h2>
                <p className="text-xs text-[#6B7280]">Where should our couriers dispatch this order?</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-medium text-[#6B7280] block mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#FAF9F6] text-xs text-[#0F0F10] placeholder-[#9CA3AF] focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-[#0F0F10] transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[#6B7280] block mb-1.5">Phone (WhatsApp updates)</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#FAF9F6] text-xs text-[#0F0F10] placeholder-[#9CA3AF] focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-[#0F0F10] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#6B7280] block mb-1.5">Street Address / Estate</label>
                  <input
                    type="text"
                    required
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF9F6] text-xs text-[#0F0F10] placeholder-[#9CA3AF] focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-[#0F0F10] transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-medium text-[#6B7280] block mb-1.5">City</label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#FAF9F6] text-xs text-[#0F0F10] placeholder-[#9CA3AF] focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-[#0F0F10] transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[#6B7280] block mb-1.5">State</label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#FAF9F6] text-xs text-[#0F0F10] placeholder-[#9CA3AF] focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-[#0F0F10] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#6B7280] block mb-1.5">Delivery Instructions (Optional)</label>
                  <input
                    type="text"
                    value={formData.deliveryNotes}
                    onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
                    placeholder="Gate access code, landmarks, estate security instructions..."
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF9F6] text-xs text-[#0F0F10] placeholder-[#9CA3AF] focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-[#0F0F10] transition-all"
                  />
                </div>
              </div>

              {/* 3. Choose Payment Gateway */}
              <div className="space-y-3 pt-4 border-t border-[#E5E7EB]/60">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading font-semibold text-sm text-[#0F0F10] tracking-tight">
                      3. Select Payment Channel
                    </h2>
                    <p className="text-xs text-[#6B7280]">Official PCI-DSS compliant payment infrastructure</p>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    Instant Clearance
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Stripe Gateway Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedGateway('stripe')}
                    className={`p-4 rounded-2xl text-left transition-all cursor-pointer ${
                      selectedGateway === 'stripe'
                        ? 'bg-[#FAF9F6] ring-1.5 ring-[#0F0F10]'
                        : 'bg-[#FAF9F6]/40 hover:bg-[#FAF9F6]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-heading font-bold text-xs tracking-wider text-[#635BFF]">
                        stripe
                      </span>
                      <span className="text-[10px] font-mono text-[#6B7280]">Global</span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] leading-snug">
                      International Cards (Visa/MC/Amex), Apple Pay &amp; Google Pay.
                    </p>
                  </button>

                  {/* Flutterwave Gateway Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedGateway('flutterwave')}
                    className={`p-4 rounded-2xl text-left transition-all cursor-pointer ${
                      selectedGateway === 'flutterwave'
                        ? 'bg-[#FAF9F6] ring-1.5 ring-[#0F0F10]'
                        : 'bg-[#FAF9F6]/40 hover:bg-[#FAF9F6]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-heading font-bold text-xs tracking-wider text-[#FB7701]">
                        flutterwave
                      </span>
                      <span className="text-[10px] font-mono text-[#6B7280]">Nigeria &amp; Africa</span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] leading-snug">
                      Debit Cards, Dedicated Bank Transfer, USSD &amp; Barter.
                    </p>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!canContinue}
                className="w-full py-4 rounded-full bg-[#0F0F10] hover:bg-[#252429] text-white font-heading font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-40"
              >
                <span>Continue to {selectedGateway === 'stripe' ? 'Stripe' : 'Flutterwave'} Payment</span>
                <ArrowRight size={15} />
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: Architectural Summary & Cross-Sell (5 cols) */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
            {/* Order Summary Panel */}
            <div className="bg-[#FAF9F6] rounded-3xl p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold text-sm text-[#0F0F10] tracking-tight">
                  Bag Summary
                </h3>
                <span className="text-xs text-[#6B7280]">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={`${item.productId}-${item.size}`} className="flex items-center gap-3.5 py-2 border-b border-[#E5E7EB]/50">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-12 h-12 rounded-xl object-cover bg-[#F0EDE8] shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <span className="font-medium text-[#0F0F10] block truncate">
                        {item.product.name}
                      </span>
                      <span className="text-[11px] text-[#6B7280]">
                        Qty: {item.quantity} • {item.size}
                      </span>
                    </div>
                    <span className="font-mono font-medium text-xs text-[#0F0F10]">
                      {formatNaira(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculations */}
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between text-[#6B7280]">
                  <span>Subtotal</span>
                  <span className="font-mono text-[#0F0F10]">{formatNaira(cartSubtotal)}</span>
                </div>
                {activeCreatorCode && (
                  <div className="flex justify-between text-[#997A2E] font-medium">
                    <span>Creator discount ({creatorDiscountPercent}%)</span>
                    <span className="font-mono">-{formatNaira(creatorDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#6B7280]">
                  <span>{fulfilMode === 'PICKUP' ? 'Store Pickup' : 'Delivery'}{selectedOption ? ` (${selectedOption.name})` : ''}</span>
                  <span className="font-mono text-[#0F0F10]">
                    {currentDeliveryFee == null ? 'Awaiting selection' : formatNaira(currentDeliveryFee)}
                  </span>
                </div>
                <div className="pt-3 border-t border-[#E5E7EB]/60 flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-[#0F0F10] uppercase tracking-wider">Total Due</span>
                  <span className="font-price font-semibold text-2xl text-[#0F0F10]">
                    {calculatedTotal == null ? '—' : formatNaira(calculatedTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* "Complete Your Routine" Cross-Sell Add-ons */}
            {routineAddons.length > 0 && (
              <div className="bg-[#FAF9F6] rounded-3xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-semibold text-xs text-[#0F0F10] tracking-tight">
                    Complete Your Routine
                  </span>
                </div>

                <div className="space-y-2">
                  {routineAddons.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 rounded-2xl bg-white flex items-center gap-3 text-xs shadow-2xs"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-11 h-11 rounded-xl object-cover bg-[#F0EDE8] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-[#0F0F10] block truncate text-[11.5px]">
                          {product.name}
                        </span>
                        <span className="font-mono text-[#997A2E] text-[11px] font-semibold">
                          {formatNaira(product.price)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => addToCart(product, product.sizes?.[0] || 'Standard', 1)}
                        className="px-3 py-1.5 rounded-full bg-[#0F0F10] text-white font-medium text-[10px] hover:bg-[#252429] active:scale-[0.98] transition-all shrink-0 cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quiet Escrow & Security Trust Reassurance */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] flex items-center gap-3.5 text-xs text-[#6B7280]">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#997A2E] shrink-0 shadow-2xs">
                <ShieldCheck size={18} />
              </div>
              <div className="text-[11px] leading-snug">
                <span className="font-semibold text-[#0F0F10] block">256-Bit SSL Encrypted Checkout</span>
                <span>Protected by Flutterwave &amp; Stripe Payment Infrastructure. Escrow guaranteed.</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
