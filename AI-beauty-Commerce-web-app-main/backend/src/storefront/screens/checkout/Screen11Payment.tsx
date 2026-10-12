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
    addLocalOrder,
    selectedGateway,
    setSelectedGateway
  } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingReference, setPendingReference] = useState<string | null>(null);
  const [transferInfo, setTransferInfo] = useState<{ bankName: string; accountNumber: string; accountName: string; reference: string } | null>(null);
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
      setTransferInfo(null);
      setProcessingStep(selectedGateway === 'transfer' ? 'Reserving your order…' : 'Creating secure order…');
      try {
        const result = await prepareLiveCheckout(selectedGateway);
        // Bank transfer has no hosted redirect: show account details + reference
        // so the shopper can pay, then submit proof under Orders → Track.
        if (selectedGateway === 'transfer') {
          if (!result.bankDetails) {
            throw new Error('Bank transfer is temporarily unavailable. Please choose another method.');
          }
          setTransferInfo({ ...result.bankDetails, reference: result.reference });
          setIsProcessing(false);
          setProcessingStep('');
          return;
        }
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
    const gatewayTitle = selectedGateway === 'stripe' ? 'Stripe' : selectedGateway === 'transfer' ? 'Bank Transfer' : 'Flutterwave';

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
          <div className="bg-white rounded-3xl p-7 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-[#FAF9F6] text-[#D4AF37] flex items-center justify-center mx-auto">
              <Loader2 size={28} className="animate-spin text-[#D4AF37]" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#997A2E]">
                {selectedGateway === 'stripe' ? 'Stripe International' : selectedGateway === 'transfer' ? 'Direct Bank Settlement' : 'Flutterwave Rave'}
              </span>
              <h3 className="font-heading font-semibold text-base text-[#0F0F10]">
                Authorizing Payment
              </h3>
              <p className="text-xs text-[#6B7280]">
                {processingStep}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF9F6] text-xs flex items-center justify-between">
              <span className="text-[#6B7280]">Total Due:</span>
              <strong className="text-[#0F0F10] font-price font-semibold text-sm">{formatNaira(effectiveTotal)}</strong>
            </div>

            <p className="text-[10px] text-[#9CA3AF]">
              Please do not refresh or close this window while authorization completes.
            </p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-4">
        {/* Step Progress Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E5E7EB]/60">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goBack}
              className="w-8 h-8 rounded-full bg-[#FAF9F6] hover:bg-[#F0EDE8] flex items-center justify-center text-[#0F0F10] transition-colors cursor-pointer"
              aria-label="Back to checkout"
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <h1 className="font-heading font-semibold text-base sm:text-lg text-[#0F0F10] tracking-tight">
                Payment &amp; Settlement
              </h1>
              <p className="text-xs text-[#6B7280]">Official PCI-DSS Level 1 &amp; CBN-licensed payment channels</p>
            </div>
          </div>
          <nav aria-label="Checkout Progress" className="hidden sm:flex items-center gap-2 text-xs">
            <button type="button" onClick={() => navigateTo('cart')} className="text-[#6B7280] hover:text-[#0F0F10] transition-colors cursor-pointer">Bag</button>
            <span className="text-[#D1D5DB]">/</span>
            <button type="button" onClick={() => navigateTo('checkout')} className="text-[#6B7280] hover:text-[#0F0F10] transition-colors cursor-pointer">Fulfillment</button>
            <span className="text-[#D1D5DB]">/</span>
            <span className="font-semibold text-[#0F0F10] bg-[#FAF9F6] px-2.5 py-1 rounded-full">Payment</span>
            <span className="text-[#D1D5DB]">/</span>
            <span className="text-[#9CA3AF]">Confirmation</span>
          </nav>
        </div>

        {/* DUAL-GRID PAYMENT LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Gateway Switcher, Payment Channels & Authorize (7 cols) */}
          <div className="lg:col-span-7 space-y-6">

            {/* DUAL/TRIPLE GATEWAY SELECTOR */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-semibold text-sm text-[#0F0F10] tracking-tight">
                    Select Payment Channel
                  </h2>
                  <p className="text-xs text-[#6B7280]">Choose your preferred checkout settlement method</p>
                </div>
                <span className="text-[10px] font-mono font-semibold text-[#997A2E] bg-[#FAF9F6] px-2.5 py-1 rounded-full">
                  NAFDAC Verified Escrow
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Stripe Tab */}
                <button
                  type="button"
                  onClick={() => { setSelectedGateway('stripe'); setTransferInfo(null); }}
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
                  <span className="text-xs font-semibold text-[#0F0F10] block">International Cards</span>
                  <span className="text-[11px] text-[#6B7280] mt-0.5 block leading-snug">Visa, MC, Apple Pay</span>
                </button>

                {/* Bank Transfer Tab */}
                <button
                  type="button"
                  onClick={() => { setSelectedGateway('transfer'); setTransferInfo(null); }}
                  className={`p-4 rounded-2xl text-left transition-all cursor-pointer ${
                    selectedGateway === 'transfer'
                      ? 'bg-[#FAF9F6] ring-1.5 ring-[#0F0F10]'
                      : 'bg-[#FAF9F6]/40 hover:bg-[#FAF9F6]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-heading font-bold text-xs tracking-wider text-[#0F0F10]">
                      transfer
                    </span>
                    <span className="text-[10px] font-mono text-[#6B7280]">Direct</span>
                  </div>
                  <span className="text-xs font-semibold text-[#0F0F10] block">Bank Transfer</span>
                  <span className="text-[11px] text-[#6B7280] mt-0.5 block leading-snug">Corporate account</span>
                </button>

                {/* Flutterwave Tab */}
                <button
                  type="button"
                  onClick={() => { setSelectedGateway('flutterwave'); setTransferInfo(null); }}
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
                    <span className="text-[10px] font-mono text-[#6B7280]">Nigeria</span>
                  </div>
                  <span className="text-xs font-semibold text-[#0F0F10] block">Local &amp; Pan-African</span>
                  <span className="text-[11px] text-[#6B7280] mt-0.5 block leading-snug">Cards, USSD, Virtual Acct</span>
                </button>
              </div>
            </section>

            {/* DYNAMIC GATEWAY BRANDED ESCROW TERMINAL BANNER */}
            <div className="p-6 rounded-3xl bg-[#0F0F10] text-white shadow-lg space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${selectedGateway === 'stripe' ? 'bg-[#635BFF]' : selectedGateway === 'transfer' ? 'bg-[#D4AF37]' : 'bg-[#FB7701]'}`} />
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-white">
                    {selectedGateway === 'stripe' ? 'Stripe Global Escrow' : selectedGateway === 'transfer' ? 'Direct Bank Settlement' : 'Flutterwave Rave Escrow'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#D4AF37] font-medium">
                  <Lock size={12} />
                  <span>256-Bit SSL Encrypted</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-medium text-white/50 tracking-wider block">
                    Merchant Recipient
                  </span>
                  <h3 className="font-heading font-semibold text-sm text-white mt-0.5">
                    Desla Beauty &amp; Lifestyle Ltd
                  </h3>
                  <span className="text-[11px] text-white/50">
                    RC: 1984210 • Lagos &amp; Abuja Dispatch
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-medium text-white/50 tracking-wider block">
                    Amount Due
                  </span>
                  <p className="font-price font-semibold text-2xl text-[#D4AF37] mt-0.5">
                    {formatNaira(effectiveTotal)}
                  </p>
                </div>
              </div>
            </div>

            {/* Hosted checkout handoff & bank details */}
            <div className="bg-[#FAF9F6] rounded-3xl p-6 sm:p-7 space-y-5">
              {selectedGateway === 'transfer' && transferInfo && (
                <div className="rounded-2xl bg-white p-5 space-y-3.5 shadow-2xs" role="status">
                  <h3 className="font-heading font-semibold text-sm text-[#0F0F10]">Transfer {formatNaira(effectiveTotal)} to this account</h3>
                  <dl className="text-xs space-y-2">
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#6B7280]">Bank</dt>
                      <dd className="font-semibold text-[#0F0F10] text-right">{transferInfo.bankName}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#6B7280]">Account number</dt>
                      <dd className="font-mono font-semibold text-[#0F0F10] text-right">{transferInfo.accountNumber}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#6B7280]">Account name</dt>
                      <dd className="font-semibold text-[#0F0F10] text-right">{transferInfo.accountName}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-[#6B7280]">Reference</dt>
                      <dd className="font-mono font-semibold text-[#997A2E] text-right break-all">{transferInfo.reference}</dd>
                    </div>
                  </dl>
                  <p className="text-[11px] text-[#6B7280] leading-relaxed pt-1">
                    Use the reference above as your transfer narration. Then submit proof under Orders → Track so we can confirm it promptly.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigateTo('orders')}
                    className="w-full py-3.5 rounded-full bg-[#0F0F10] text-white font-heading font-medium text-xs tracking-wider uppercase active:scale-[0.99] transition-all cursor-pointer"
                  >
                    I Have Transferred — Submit Proof
                  </button>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-white flex items-start gap-3.5 shadow-2xs">
                <div className="w-9 h-9 rounded-xl bg-[#FAF9F6] flex items-center justify-center text-[#997A2E] shrink-0">
                  <ExternalLink size={16} />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-heading font-semibold text-xs text-[#0F0F10]">
                    {selectedGateway === 'transfer' ? 'Pay by direct bank transfer' : 'Continue to secure hosted gateway'}
                  </h3>
                  <p className="text-[11px] leading-relaxed text-[#6B7280]">
                    {selectedGateway === 'transfer'
                      ? 'We reserve your order and provide our verified corporate account details. Your order ships immediately once transfer proof is verified.'
                      : <>{selectedGateway === 'stripe' ? 'Stripe' : 'Flutterwave'} will securely process your transaction. Desla never accesses or stores your raw card details, PIN, or CVV.</>}
                  </p>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={isProcessing || isVerifying}
                  className="w-full py-4 rounded-full bg-[#0F0F10] hover:bg-[#252429] active:scale-[0.99] text-white font-heading font-medium text-xs tracking-wider uppercase shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-[#D4AF37]" />
                      <span>{selectedGateway === 'transfer' ? 'Reserving your order…' : <>Authorizing via {selectedGateway === 'stripe' ? 'Stripe' : 'Flutterwave'}...</>}</span>
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      <span>{selectedGateway === 'transfer' ? `Reserve order & view bank details (${formatNaira(effectiveTotal)})` : <>Pay {formatNaira(effectiveTotal)} via {selectedGateway === 'stripe' ? 'Stripe' : 'Flutterwave'}</>}</span>
                      <ArrowRight size={15} />
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
                    className="w-full mt-2.5 py-3 rounded-full bg-white text-xs font-semibold text-[#4B5563] hover:text-[#0F0F10] flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 size={13} className="animate-spin text-[#D4AF37]" />
                        <span>Verifying pending payment…</span>
                      </>
                    ) : (
                      <span>Already paid? Verify pending reference {pendingReference.slice(0, 18)}…</span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Escrow & Regulatory Trust Reassurance */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] flex items-start gap-3.5 text-xs text-[#6B7280]">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#997A2E] shrink-0 shadow-2xs">
                <ShieldCheck size={18} />
              </div>
              <div className="text-[11px] leading-relaxed">
                <strong className="text-[#0F0F10] block">Desla!™ Escrow Protection Guarantee</strong>
                <span>
                  Your funds are held securely in escrow ({selectedGateway === 'stripe' ? 'Stripe PCI-DSS Level 1 infrastructure' : selectedGateway === 'transfer' ? 'corporate account confirmation before dispatch' : 'CBN-licensed Flutterwave infrastructure'}) until courier handover. Full refund guarantee on unsealed or transit-damaged items.
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary & Fulfillment Recap (5 cols) */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
            {/* Order Items Breakdown */}
            <div className="bg-[#FAF9F6] rounded-3xl p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold text-sm text-[#0F0F10] tracking-tight">
                  Order Summary
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

              {/* Price Calculation Lines */}
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between text-[#6B7280]">
                  <span>Subtotal</span>
                  <span className="font-mono text-[#0F0F10]">{formatNaira(cartSubtotal)}</span>
                </div>
                {appliedCreator && (
                  <div className="flex justify-between text-[#997A2E] font-medium">
                    <span>Creator discount (10%)</span>
                    <span className="font-mono">-{formatNaira(creatorDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#6B7280]">
                  <span>Fulfillment ({selectedCity})</span>
                  <span className="font-mono text-[#0F0F10]">
                    {formatNaira(cartDeliveryFee || 1500)}
                  </span>
                </div>
                <div className="pt-3 border-t border-[#E5E7EB]/60 flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-[#0F0F10] uppercase tracking-wider">Total Payable</span>
                  <span className="font-price font-semibold text-2xl text-[#0F0F10]">
                    {formatNaira(effectiveTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Destination Snapshot */}
            <div className="bg-[#FAF9F6] rounded-3xl p-6 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]/50">
                <div className="flex items-center gap-2 font-heading font-semibold text-xs text-[#0F0F10]">
                  <MapPin size={14} className="text-[#D4AF37]" />
                  <span>Dispatch Destination</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('checkout')}
                  className="text-[11px] text-[#997A2E] font-medium hover:underline cursor-pointer"
                >
                  Edit details
                </button>
              </div>

              <div className="text-[11px] text-[#4B5563] space-y-1">
                <span className="font-medium text-[#0F0F10] block">
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
