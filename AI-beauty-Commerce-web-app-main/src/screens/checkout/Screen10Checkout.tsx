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
    setCheckoutAddress
  } = useApp();

  const [fulfilMode, setFulfilMode] = useState<'DELIVERY' | 'PICKUP'>(checkoutFulfilment?.method ?? 'DELIVERY');
  const [fulfilOptions, setFulfilOptions] = useState<FulfilmentOption[] | null>(null);
  const [fulfilLocationId, setFulfilLocationId] = useState<string | null>(checkoutFulfilment?.locationId ?? preferredDistributor?.location?.id ?? null);
  const [fulfilLoading, setFulfilLoading] = useState(false);
  const [fulfilError, setFulfilError] = useState('');
  const [fulfilHasFullCart, setFulfilHasFullCart] = useState(true);
  const [retryRouting, setRetryRouting] = useState(0);
  const [resolvedKey, setResolvedKey] = useState('');
  const [selectedGateway, setSelectedGateway] = useState<'paystack' | 'flutterwave'>('paystack');

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
          <div className="w-16 h-16 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-center mx-auto text-[#D4AF37]">
            <ShoppingBag size={28} />
          </div>
          <h2 className="font-heading font-semibold text-xl text-[#0F0F10]">
            No Items in Checkout
          </h2>
          <p className="text-xs text-[#6B7280]">
            Your shopping bag is currently empty. Explore our clinical formulations.
          </p>
          <button
            onClick={() => navigateTo('catalogue')}
            className="py-3 px-6 rounded-full bg-[#0F0F10] text-white font-semibold text-xs active:scale-95 transition-all"
          >
            Explore Catalogue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0F0F10] pb-36 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-3">
        {/* Step Progress Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E7EB]">
          <div>
            <h1 className="font-heading font-extrabold text-base text-[#0F0F10] leading-none">
              Checkout &amp; Fulfillment
            </h1>
            <p className="text-[11px] text-[#6B7280] mt-0.5">Secure local Lagos &amp; national dispatch</p>
          </div>
          <span className="text-xs font-mono font-bold text-[#997A2E] bg-[#FBF5E8] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30">
            Step 2 of 4
          </span>
        </div>
        {/* DUAL-GRID CHECKOUT SYSTEM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Customer Info, Fulfillment Choice & Address Form (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 4-Step Visual Progress Stepper */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] shadow-xs">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-[#E5E7EB] -translate-y-1/2 z-0" />

                {/* Step 1: Customer */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center text-xs font-bold shadow-xs">
                    <Check size={14} strokeWidth={2.6} />
                  </div>
                  <span className="text-[10px] font-semibold text-[#6B7280] mt-1">Customer</span>
                </div>

                {/* Step 2: Delivery */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center text-xs font-extrabold shadow-xs">
                    2
                  </div>
                  <span className="text-[10px] font-bold text-[#0F0F10] mt-1">Fulfillment</span>
                </div>

                {/* Step 3: Order Review */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-white border-2 border-gray-300 text-gray-400 flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 mt-1">Review</span>
                </div>

                {/* Step 4: Pay */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-white border-2 border-gray-300 text-gray-400 flex items-center justify-center text-xs font-bold">
                    4
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 mt-1">Payment</span>
                </div>
              </div>
            </div>

            {/* Fulfilment: delivery or pickup from a location holding the whole bag */}
            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-[#0F0F10]">
                  1. Delivery or pickup
                </h3>
                <span className="text-[11px] font-mono text-[#997A2E] font-bold">
                  {formData.city || selectedCity}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Fulfilment method">
                {(['DELIVERY', 'PICKUP'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFulfilMode(mode)}
                    aria-pressed={fulfilMode === mode}
                    className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
                      fulfilMode === mode ? 'border-[#D4AF37] bg-[#FBF5E8]/60 text-[#0F0F10]' : 'border-[#E5E7EB] bg-[#FAF9F6] text-[#4B5563]'
                    }`}
                  >
                    {mode === 'DELIVERY' ? 'Deliver to me' : 'Pick up'}
                  </button>
                ))}
              </div>

              {fulfilLoading ? (
                <p className="text-[11px] text-[#6B7280]">Checking live availability…</p>
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
                        className={`w-full text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                          selected ? 'border-[#D4AF37] bg-[#FBF5E8]/60' : 'border-[#E5E7EB] bg-[#FAF9F6] hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-xs text-[#0F0F10] block">{option.name}</span>
                            <span className="text-[11px] text-[#6B7280] block mt-0.5">
                              {option.city}{option.address ? ` • ${option.address}` : ''}{fulfilMode === 'PICKUP' && option.operatingHours ? ` • ${option.operatingHours}` : ''}
                            </span>
                            <span className="text-[11px] text-[#6B7280] block mt-0.5">{option.etaText}</span>
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
                <p className="text-[11px] text-[#6B7280]">
                  {isOwnedApiConfigured
                    ? 'Enter your city below and live fulfilment options will appear here.'
                    : `Standard dispatch from ${selectedCity}. Connect the live backend for verified local stock.`}
                </p>
              )}
              {preferredDistributor && <p className="text-xs text-[#6B7280]">Preferred store: {preferredDistributor.location?.name}. If it cannot fulfil the complete bag, choose another option explicitly.</p>}
              {fulfilError && <div className="space-y-2"><p role="alert" className="text-xs text-rose-600">{fulfilError}</p><button type="button" disabled={fulfilLoading} onClick={() => setRetryRouting(n => n + 1)} className="text-xs underline min-h-11">Retry availability</button></div>}
              {!fulfilHasFullCart && fulfilOptions && fulfilOptions.length === 0 && (
                <p className="text-[11px] text-[#6B7280]">One location must hold every item in your bag. Try removing an item or choosing delivery.</p>
              )}
            </div>

            {/* Delivery Address Form */}
            <form onSubmit={handleContinueToPayment} className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <h3 className="font-heading font-bold text-sm text-[#0F0F10]">
                2. Recipient &amp; Delivery Address
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#4B5563] block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#4B5563] block mb-1">Phone Number (WhatsApp)</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#4B5563] block mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#4B5563] block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#4B5563] block mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#4B5563] block mb-1">Delivery Instructions (Optional)</label>
                <input
                  type="text"
                  value={formData.deliveryNotes}
                  onChange={(e) => setFormData({ ...formData, deliveryNotes: e.target.value })}
                  placeholder="Gate code, landmarks, special notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* 3. Choose Payment Gateway & Method */}
              <div className="pt-3 border-t border-[#E5E7EB] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-sm text-[#0F0F10]">
                    3. Select Payment Gateway &amp; Channels
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Instant Clearance
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Paystack Gateway Option */}
                  <div
                    onClick={() => setSelectedGateway('paystack')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedGateway === 'paystack'
                        ? 'border-[#00C3F7] bg-[#F0FAFF] shadow-xs'
                        : 'border-[#E5E7EB] bg-[#FAF9F6] hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-extrabold text-xs tracking-wider text-[#00C3F7]">
                        paystack
                      </span>
                      <div className="w-4 h-4 rounded-full border-2 border-[#00C3F7] flex items-center justify-center">
                        {selectedGateway === 'paystack' && (
                          <div className="w-2 h-2 rounded-full bg-[#00C3F7]" />
                        )}
                      </div>
                    </div>
                    <p className="text-[10.5px] text-[#4B5563] mt-1.5 leading-snug">
                      Debit Cards (Visa/MC/Verve), Bank Transfer &amp; USSD.
                    </p>
                    <span className="text-[9.5px] font-bold text-[#00C3F7] uppercase mt-1 block">Official Escrow</span>
                  </div>

                  {/* Flutterwave Gateway Option */}
                  <div
                    onClick={() => setSelectedGateway('flutterwave')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedGateway === 'flutterwave'
                        ? 'border-[#FB7701] bg-[#FFF8F2] shadow-xs'
                        : 'border-[#E5E7EB] bg-[#FAF9F6] hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-extrabold text-xs tracking-wider text-[#FB7701]">
                        flutterwave
                      </span>
                      <div className="w-4 h-4 rounded-full border-2 border-[#FB7701] flex items-center justify-center">
                        {selectedGateway === 'flutterwave' && (
                          <div className="w-2 h-2 rounded-full bg-[#FB7701]" />
                        )}
                      </div>
                    </div>
                    <p className="text-[10.5px] text-[#4B5563] mt-1.5 leading-snug">
                      Debit Cards, Dedicated Transfer, Barter &amp; USSD.
                    </p>
                    <span className="text-[9.5px] font-bold text-[#FB7701] uppercase mt-1 block">Rave For Business</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!canContinue}
                className="w-full py-4 rounded-full bg-[#0F0F10] hover:bg-[#1F1D22] text-white font-heading font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer mt-4 disabled:opacity-50"
              >
                <span>Proceed to {selectedGateway === 'paystack' ? 'Paystack' : 'Flutterwave'} Payment</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: Order Summary & "Complete Your Routine" Cross-Sell (5 cols) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            {/* Order Summary Box */}
            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <h3 className="font-heading font-bold text-sm text-[#0F0F10]">
                Order Summary ({cartItems.length} items)
              </h3>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={`${item.productId}-${item.size}`} className="flex items-center gap-3 py-2 border-b border-[#E5E7EB]">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-12 h-12 rounded-lg object-cover bg-[#F6F5F2] border border-[#E5E7EB] shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <span className="font-bold text-[#0F0F10] block truncate">
                        {item.product.name}
                      </span>
                      <span className="text-[10px] text-[#6B7280]">
                        Qty: {item.quantity} • {item.size}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-xs text-[#0F0F10]">
                      {formatNaira(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculations */}
              <div className="space-y-2 pt-2 text-xs">
                <div className="flex justify-between text-[#6B7280]">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium text-[#0F0F10]">{formatNaira(cartSubtotal)}</span>
                </div>
                {activeCreatorCode && (
                  <div className="flex justify-between text-[#0F0F10] font-semibold">
                    <span>Creator code ({creatorDiscountPercent}% off)</span>
                    <span className="font-mono">-{formatNaira(creatorDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#6B7280]">
                  <span>{fulfilMode === 'PICKUP' ? 'Pickup' : 'Delivery'}{selectedOption ? ` (${selectedOption.name})` : ''}</span>
                  <span className="font-mono font-medium text-[#0F0F10]">{currentDeliveryFee == null ? 'Awaiting availability' : formatNaira(currentDeliveryFee)}</span>
                </div>
                <div className="pt-3 border-t border-[#E5E7EB] flex justify-between items-center text-sm font-bold text-[#0F0F10]">
                  <span>Total Due</span>
                  <span className="font-price font-extrabold text-xl text-[#0F0F10]">{calculatedTotal == null ? 'Choose fulfilment' : formatNaira(calculatedTotal)}</span>
                </div>
              </div>
            </div>

            {/* "Complete Your Routine" Cross-Sell Add-ons */}
            {routineAddons.length > 0 && (
              <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#D4AF37]" />
                  <span className="font-heading font-bold text-xs text-[#0F0F10]">
                    Complete Your Routine
                  </span>
                </div>

                <div className="space-y-2">
                  {routineAddons.map((product) => (
                    <div
                      key={product.id}
                      className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center gap-3 text-xs"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-11 h-11 rounded-lg object-cover bg-[#F6F5F2] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-[#0F0F10] block truncate text-[11.5px]">
                          {product.name}
                        </span>
                        <span className="font-mono font-bold text-[#997A2E] text-[11px]">
                          {formatNaira(product.price)}
                        </span>
                      </div>
                      <button
                        onClick={() => addToCart(product, product.sizes?.[0] || 'Standard', 1)}
                        className="px-2.5 py-1 rounded-lg bg-[#0F0F10] text-white font-bold text-[10px] hover:bg-[#D4AF37] hover:text-[#0F0F10] active:scale-95 transition-all shrink-0 cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Paystack & Flutterwave SSL & Security Trust Badges */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] shadow-xs flex items-center gap-3 text-xs text-[#6B7280]">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center text-[#997A2E] shrink-0 shadow-xs">
                <ShieldCheck size={20} />
              </div>
              <div className="text-[11px] leading-snug">
                <span className="font-bold text-[#0F0F10] block">256-Bit SSL Encrypted Checkout</span>
                <span>Protected by Paystack &amp; Flutterwave Payment Infrastructure. 100% Escrow Guarantee.</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
