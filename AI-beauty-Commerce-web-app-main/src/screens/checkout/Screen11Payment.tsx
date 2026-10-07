import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Loader2,
  ChevronLeft,
  ArrowRight,
  MapPin,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useViewport } from '../../context/ViewportContext';
import { lastPaymentReference } from '../../lib/owned-api';

export const Screen11Payment: React.FC = () => {
  const { isDesktop } = useViewport();
  const {
    cartItems,
    cartSubtotal,
    cartTotal,
    cartDeliveryFee,
    appliedCreator,
    selectedCity,
    createOrderFromCart,
    navigateTo,
    goBack,
    checkoutAddress,
    isLiveBackend,
    prepareLiveCheckout,
    reverifyPayment,
    addLocalOrder
  } = useApp();

  const [selectedGateway, setSelectedGateway] = useState<'paystack' | 'flutterwave'>('paystack');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingReference, setPendingReference] = useState<string | null>(null);
  useEffect(() => {
    if (isLiveBackend) setPendingReference(lastPaymentReference());
  }, [isLiveBackend]);

  const formatNaira = (amt: number) => '₦' + amt.toLocaleString('en-NG');

  const creatorDiscount = appliedCreator ? Math.round(cartSubtotal * 0.1) : 0;
  const effectiveTotal = cartTotal > 0 ? cartTotal : Math.max(0, cartSubtotal - creatorDiscount + (cartDeliveryFee || 1500));

  const handlePay = async () => {
    // Live path: real server order + hosted provider checkout.
    if (isLiveBackend) {
      setIsProcessing(true);
      setProcessingStep('Creating secure order…');
      try {
        const result = await prepareLiveCheckout(selectedGateway);
        if (!result.authorizationUrl) {
          throw new Error('The payment gateway did not return a secure checkout link. Please try again.');
        }
        // Hosted path: browser redirects; ?pay= return flow confirms on landing.
      } catch (e) {
        setIsProcessing(false);
        setProcessingStep(e instanceof Error ? e.message : 'Payment failed — please try again.');
      }
      return;
    }

    setIsProcessing(true);
    const gatewayTitle = selectedGateway === 'paystack' ? 'Paystack' : 'Flutterwave';

    setProcessingStep(`Connecting to ${gatewayTitle} 3D Secure Terminal...`);
    setTimeout(() => {
      setProcessingStep('Validating Transaction & Escrow Vault...');
    }, 600);

    setTimeout(() => {
      setProcessingStep('Authorizing Payment Clearance...');
    }, 1100);

    setTimeout(() => {
      setIsProcessing(false);
      createOrderFromCart(`${gatewayTitle} hosted checkout`, checkoutAddress);
      navigateTo('order-confirmed');
    }, 1600);
  };

  return (
    <div className="min-h-screen bg-white text-[#0F0F10] pb-36 font-body selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
      {/* 3D SECURE MODAL OVERLAY WHILE PROCESSING */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-[#E5E7EB] animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-[#FAF9F6] border-2 border-[#D4AF37]/50 text-[#D4AF37] flex items-center justify-center mx-auto shadow-inner">
              <Loader2 size={32} className="animate-spin text-[#D4AF37]" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
                {selectedGateway === 'paystack' ? 'Paystack 3D Secure' : 'Flutterwave Rave Gateway'}
              </span>
              <h3 className="font-heading font-bold text-base text-[#0F0F10]">
                Authorizing Payment
              </h3>
              <p className="text-xs text-[#6B7280]">
                {processingStep}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] text-xs flex items-center justify-between font-mono">
              <span className="text-[#6B7280]">Total Due:</span>
              <strong className="text-[#0F0F10] font-price font-bold text-sm">{formatNaira(effectiveTotal)}</strong>
            </div>

            <p className="text-[10px] text-[#9CA3AF]">
              Please do not refresh or close this window while authorization completes.
            </p>
          </div>
        </div>
      )}

      {/* Mobile-Only Top Bar */}
      {false && (
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
                Payment &amp; Authorization
              </h1>
            </div>
            <span className="text-xs font-mono font-bold text-[#997A2E]">
              Step 3 of 4
            </span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6">
        {/* DUAL-GRID PAYMENT LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Gateway Switcher, Payment Channels & Authorize (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 4-Step Visual Stepper */}
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
                  <div className="w-7 h-7 rounded-full bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center text-xs font-bold shadow-xs">
                    <Check size={14} strokeWidth={2.6} />
                  </div>
                  <span className="text-[10px] font-semibold text-[#6B7280] mt-1">Fulfillment</span>
                </div>

                {/* Step 3: Payment */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center text-xs font-extrabold shadow-xs">
                    3
                  </div>
                  <span className="text-[10px] font-bold text-[#0F0F10] mt-1">Payment</span>
                </div>

                {/* Step 4: Confirmed */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-white border-2 border-gray-300 text-gray-400 flex items-center justify-center text-xs font-bold">
                    4
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 mt-1">Confirmed</span>
                </div>
              </div>
            </div>

            {/* DUAL GATEWAY SELECTOR: PAYSTACK VS FLUTTERWAVE */}
            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F0F10]">
                  Select Official Payment Gateway
                </span>
                <span className="text-[10px] font-mono text-[#997A2E] font-bold">
                  NAFDAC Verified Escrow
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Paystack Tab */}
                <button
                  type="button"
                  onClick={() => setSelectedGateway('paystack')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all text-left flex items-center justify-between ${
                    selectedGateway === 'paystack'
                      ? 'border-[#00C3F7] bg-[#F0FAFF] shadow-xs ring-2 ring-[#00C3F7]/20'
                      : 'border-[#E5E7EB] bg-[#FAF9F6] hover:border-gray-300'
                  }`}
                >
                  <div>
                    <span className="font-heading font-extrabold text-sm tracking-wider text-[#00C3F7] block">
                      paystack
                    </span>
                    <span className="text-[10px] text-[#6B7280]">
                      Cards, Transfer &amp; USSD
                    </span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedGateway === 'paystack' ? 'border-[#00C3F7]' : 'border-gray-300'
                  }`}>
                    {selectedGateway === 'paystack' && (
                      <div className="w-2 h-2 rounded-full bg-[#00C3F7]" />
                    )}
                  </div>
                </button>

                {/* Flutterwave Tab */}
                <button
                  type="button"
                  onClick={() => setSelectedGateway('flutterwave')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all text-left flex items-center justify-between ${
                    selectedGateway === 'flutterwave'
                      ? 'border-[#FB7701] bg-[#FFF8F2] shadow-xs ring-2 ring-[#FB7701]/20'
                      : 'border-[#E5E7EB] bg-[#FAF9F6] hover:border-gray-300'
                  }`}
                >
                  <div>
                    <span className="font-heading font-extrabold text-sm tracking-wider text-[#FB7701] block">
                      flutterwave
                    </span>
                    <span className="text-[10px] text-[#6B7280]">
                      Cards, Virtual Acct, Barter
                    </span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedGateway === 'flutterwave' ? 'border-[#FB7701]' : 'border-gray-300'
                  }`}>
                    {selectedGateway === 'flutterwave' && (
                      <div className="w-2 h-2 rounded-full bg-[#FB7701]" />
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* DYNAMIC GATEWAY BRANDED ESCROW TERMINAL BANNER */}
            {selectedGateway === 'paystack' ? (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#091522] via-[#0E2238] to-[#091522] text-white shadow-md border border-[#00C3F7]/30 transition-all">
                <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00C3F7] animate-pulse" />
                    <span className="font-heading font-extrabold text-base tracking-wider text-[#00C3F7]">
                      paystack
                    </span>
                    <span className="text-[10px] text-white/70 font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-white/10">
                      Official Escrow
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <Lock size={13} />
                    <span>256-Bit SSL Encrypted</span>
                  </div>
                </div>

                <div className="pt-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider block">
                      Merchant Recipient
                    </span>
                    <h3 className="font-heading font-semibold text-sm text-white mt-0.5">
                      Desla Beauty &amp; Lifestyle Ltd
                    </h3>
                    <span className="text-[11px] text-white/60">
                      RC: 1984210 • Lagos &amp; Abuja Dispatch
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider block">
                      Amount Due
                    </span>
                    <p className="font-price font-bold text-2xl text-[#D4AF37] mt-0.5">
                      {formatNaira(effectiveTotal)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#181005] via-[#2A1608] to-[#181005] text-white shadow-md border border-[#FB7701]/30 transition-all">
                <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FB7701] animate-pulse" />
                    <span className="font-heading font-extrabold text-base tracking-wider text-[#FB7701]">
                      flutterwave
                    </span>
                    <span className="text-[10px] text-white/70 font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-white/10">
                      Rave For Business
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <Lock size={13} />
                    <span>PCIDSS Level 1 Verified</span>
                  </div>
                </div>

                <div className="pt-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider block">
                      Merchant Recipient
                    </span>
                    <h3 className="font-heading font-semibold text-sm text-white mt-0.5">
                      Desla Beauty &amp; Lifestyle Ltd
                    </h3>
                    <span className="text-[11px] text-white/60">
                      Flutterwave Merchant ID: FLW-DES-9281
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider block">
                      Amount Due
                    </span>
                    <p className="font-price font-bold text-2xl text-[#D4AF37] mt-0.5">
                      {formatNaira(effectiveTotal)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Hosted checkout handoff. Payment credentials never enter this application. */}
            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] p-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center text-[#997A2E] shrink-0">
                  <ExternalLink size={20} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading font-semibold text-sm text-[#0F0F10]">Continue to secure hosted checkout</h3>
                  <p className="text-xs leading-relaxed text-[#6B7280]">
                    {selectedGateway === 'paystack' ? 'Paystack' : 'Flutterwave'} will securely collect your card, bank transfer, or other supported payment details. Desla never receives or stores your card number, CVV, or PIN.
                  </p>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={isProcessing || isVerifying}
                  className="w-full py-4 rounded-full bg-[#0F0F10] hover:bg-[#1F1D22] active:scale-[0.98] text-white font-heading font-semibold text-sm shadow-xl flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-[#D4AF37]" />
                      <span>Authorizing via {selectedGateway === 'paystack' ? 'Paystack' : 'Flutterwave'}...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>Continue to {selectedGateway === 'paystack' ? 'Paystack' : 'Flutterwave'} to pay {formatNaira(effectiveTotal)}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
                {isLiveBackend && pendingReference && !isProcessing && (
                  <button
                    type="button"
                    disabled={isVerifying}
                    onClick={() => {
                      setIsVerifying(true);
                      void reverifyPayment(pendingReference).finally(() => setIsVerifying(false));
                    }}
                    className="w-full mt-2 py-3 rounded-full bg-white border border-[#E5E7EB] text-xs font-semibold text-[#4B5563] hover:text-[#0F0F10] flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-[#D4AF37]" />
                        <span>Verifying pending payment…</span>
                      </>
                    ) : (
                      <span>Already paid? Verify pending payment {pendingReference.slice(0, 18)}…</span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Escrow & Regulatory Trust Badges */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-start gap-3 text-xs text-[#6B7280]">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center text-[#997A2E] shrink-0 shadow-xs">
                <ShieldCheck size={20} />
              </div>
              <div className="text-[11px] leading-relaxed">
                <strong className="text-[#0F0F10] block text-xs">Desla!™ Dual-Gateway Escrow Protection Guarantee</strong>
                <span>
                  Your funds are held securely in escrow under CBN-licensed infrastructure ({selectedGateway === 'paystack' ? 'Paystack Payments Ltd' : 'Flutterwave Technology Solutions'}) until your local city partner confirms courier dispatch. 100% money-back guarantee for damaged or unsealed packaging.
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary & Fulfillment Recap (5 cols) */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            {/* Order Items Breakdown Box */}
            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                <h3 className="font-heading font-semibold text-sm text-[#0F0F10]">
                  Order Items ({cartItems.length})
                </h3>
                <span className="text-[11px] font-mono text-[#997A2E] font-bold">
                  City: {selectedCity}
                </span>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={`${item.productId}-${item.size}`} className="flex items-center gap-3 py-2 border-b border-[#E5E7EB]/60">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-12 h-12 rounded-lg object-cover bg-[#F6F5F2] border border-[#E5E7EB] shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <span className="font-semibold text-[#0F0F10] block truncate">
                        {item.product.name}
                      </span>
                      <span className="text-[10px] text-[#6B7280]">
                        Qty: {item.quantity} • {item.size}
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-xs text-[#0F0F10]">
                      {formatNaira(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculation Lines */}
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between text-[#6B7280]">
                  <span>Subtotal</span>
                  <span className="font-mono font-medium text-[#0F0F10]">{formatNaira(cartSubtotal)}</span>
                </div>
                {appliedCreator && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Creator Code (10% Off)</span>
                    <span className="font-mono">-{formatNaira(creatorDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#6B7280]">
                  <span>Local Dispatch ({selectedCity})</span>
                  <span className="font-mono font-medium text-[#0F0F10]">
                    {formatNaira(cartDeliveryFee || 1500)}
                  </span>
                </div>
                <div className="pt-3 border-t border-[#E5E7EB] flex justify-between items-center text-sm font-semibold text-[#0F0F10]">
                  <span>Total Payable</span>
                  <span className="font-price font-bold text-2xl text-[#0F0F10]">
                    {formatNaira(effectiveTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Destination Snapshot */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] shadow-xs space-y-2 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-1.5 font-semibold text-[#0F0F10]">
                  <MapPin size={14} className="text-[#D4AF37]" />
                  <span>Delivery Destination</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('checkout')}
                  className="text-[11px] text-[#997A2E] font-semibold hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>

              <div className="text-[11px] text-[#4B5563] space-y-0.5">
                <span className="font-semibold text-[#0F0F10] block">
                  {checkoutAddress.fullName} • {checkoutAddress.phone}
                </span>
                <p className="leading-snug">{checkoutAddress.street}</p>
                <p>{checkoutAddress.city}, {checkoutAddress.state}</p>
                {checkoutAddress.deliveryNotes && (
                  <p className="text-[#6B7280] italic pt-1">Note: {checkoutAddress.deliveryNotes}</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
