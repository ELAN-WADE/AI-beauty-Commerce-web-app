import React, { useState } from 'react';
import {
  Check,
  User,
  MapPin,
  Truck,
  ShieldCheck,
  ArrowRight,
  Store,
  Clock,
  Sparkles,
  CreditCard,
  ChevronLeft,
  ShoppingBag
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useViewport } from '../context/ViewportContext';

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
    getDistributorsForCity,
    products,
    addToCart,
    checkoutAddress,
    setCheckoutAddress
  } = useApp();

  const [fulfillmentOption, setFulfillmentOption] = useState<'local-partner' | 'lagos-hq'>('local-partner');
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
  const localDeliveryCost = selectedCity === 'Lagos' ? 2000 : 1500;
  const hqDeliveryCost = 4500;

  const currentDeliveryFee = fulfillmentOption === 'local-partner' ? localDeliveryCost : hqDeliveryCost;
  const creatorDiscount = appliedCreator ? Math.round(cartSubtotal * 0.1) : 0;
  const calculatedTotal = Math.max(0, cartSubtotal - creatorDiscount + currentDeliveryFee);

  // Cross-sell items
  const routineAddons = products.filter(
    (p) => !cartItems.some((ci) => ci.productId === p.id)
  ).slice(0, 2);

  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();
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
      {/* Top Header — Only on Mobile (Desktop already has DesktopNav) */}
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
              <h1 className="font-heading font-extrabold tracking-tight text-lg text-[#0F0F10]">
                Checkout &amp; Fulfillment
              </h1>
            </div>
            <span className="text-xs font-mono font-bold text-[#997A2E]">
              Step 2 of 4
            </span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6">
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

            {/* Sourcing & Fulfillment Selection */}
            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-[#0F0F10]">
                  1. Sourcing &amp; Dispatch Option
                </h3>
                <span className="text-[11px] font-mono text-[#997A2E] font-bold">
                  Active: {selectedCity}
                </span>
              </div>

              <div className="space-y-3">
                {/* Local City Partner */}
                <div
                  onClick={() => setFulfillmentOption('local-partner')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    fulfillmentOption === 'local-partner'
                      ? 'border-[#D4AF37] bg-[#FBF5E8]/60 shadow-xs'
                      : 'border-[#E5E7EB] bg-[#FAF9F6] hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-[#D4AF37] flex items-center justify-center mt-0.5">
                        {fulfillmentOption === 'local-partner' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#0F0F10]" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#0F0F10]">
                            Local City Partner Dispatch ({selectedCity})
                          </span>
                          <span className="text-[9.5px] px-2 py-0.5 rounded-md bg-[#F3EEE3] text-[#0F0F10] border border-[#E5E7EB] font-bold">
                            RECOMMENDED
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B7280] mt-1 leading-snug">
                          Dispatched directly from verified local distributor stock. Same-day delivery via dedicated bike courier.
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs text-[#997A2E]">
                      {formatNaira(localDeliveryCost)}
                    </span>
                  </div>
                </div>

                {/* Lagos HQ Dispatch */}
                <div
                  onClick={() => setFulfillmentOption('lagos-hq')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    fulfillmentOption === 'lagos-hq'
                      ? 'border-[#D4AF37] bg-[#FBF5E8]/60 shadow-xs'
                      : 'border-[#E5E7EB] bg-[#FAF9F6] hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center mt-0.5">
                        {fulfillmentOption === 'lagos-hq' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#0F0F10]" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-[#0F0F10]">
                          Lagos Central HQ Direct Courier
                        </span>
                        <p className="text-[11px] text-[#6B7280] mt-1 leading-snug">
                          Shipped from central warehouse in Lagos via DHL/GIG interstate express (2–4 business days).
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs text-gray-700">
                      {formatNaira(hqDeliveryCost)}
                    </span>
                  </div>
                </div>
              </div>
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
                className="w-full py-4 rounded-full bg-[#0F0F10] hover:bg-[#1F1D22] text-white font-heading font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer mt-4"
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
                {appliedCreator && (
                  <div className="flex justify-between text-[#0F0F10] font-semibold">
                    <span>Creator Code (10% Off)</span>
                    <span className="font-mono">-{formatNaira(creatorDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#6B7280]">
                  <span>Delivery ({fulfillmentOption === 'local-partner' ? selectedCity : 'Lagos HQ'})</span>
                  <span className="font-mono font-medium text-[#0F0F10]">{formatNaira(currentDeliveryFee)}</span>
                </div>
                <div className="pt-3 border-t border-[#E5E7EB] flex justify-between items-center text-sm font-bold text-[#0F0F10]">
                  <span>Total Due</span>
                  <span className="font-price font-semibold text-xl text-[#FB7701]">{formatNaira(calculatedTotal)}</span>
                </div>
              </div>
            </div>

            {/* "Complete Your Routine" Cross-Sell Add-ons */}
            {routineAddons.length > 0 && (
              <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#D4AF37]" />
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
