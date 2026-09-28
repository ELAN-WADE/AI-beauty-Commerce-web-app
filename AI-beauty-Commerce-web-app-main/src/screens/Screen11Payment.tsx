import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Building2,
  PhoneCall,
  ShieldCheck,
  Lock,
  Loader2,
  CheckCircle2,
  Copy,
  Clock,
  Sparkles,
  ChevronLeft,
  ArrowRight,
  MapPin,
  Check,
  QrCode,
  Smartphone,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useViewport } from '../context/ViewportContext';

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
    addLocalOrder
  } = useApp();

  const [selectedGateway, setSelectedGateway] = useState<'paystack' | 'flutterwave'>('paystack');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer' | 'ussd' | 'barter'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [copied, setCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(1794); // ~30 mins

  // Card Form State
  const [cardNumber, setCardNumber] = useState('5399 4120 8940 3821');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('382');
  const [cardPin, setCardPin] = useState('1234');
  const [cardHolder, setCardHolder] = useState(checkoutAddress.fullName || 'Desla Valued Patron');

  // Timer countdown for bank transfer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNaira = (amt: number) => '₦' + amt.toLocaleString('en-NG');

  const creatorDiscount = appliedCreator ? Math.round(cartSubtotal * 0.1) : 0;
  const effectiveTotal = cartTotal > 0 ? cartTotal : Math.max(0, cartSubtotal - creatorDiscount + (cartDeliveryFee || 1500));

  const virtualAccount = selectedGateway === 'paystack' ? {
    bankName: 'Wema Bank / Titan Trust',
    accountName: 'Paystack / Desla!™ Commerce',
    accountNumber: '0123948572'
  } : {
    bankName: 'Providus Bank / Stanbic IBTC',
    accountName: 'Flutterwave / Desla!™ Escrow',
    accountNumber: '8849201934'
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(virtualAccount.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePay = async () => {
    // Live path: real server order + hosted provider checkout (or bank details).
    if (isLiveBackend) {
      setIsProcessing(true);
      setProcessingStep('Creating secure order…');
      try {
        const provider = paymentMethod === 'transfer' ? 'transfer' : selectedGateway;
        const result = await prepareLiveCheckout(provider);
        if (!result.authorizationUrl) {
          // Bank transfer: order is placed, customer pays manually + claims later.
          addLocalOrder(result.order);
          navigateTo('order-confirmed');
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
      const methodName =
        paymentMethod === 'card'
          ? `${gatewayTitle} Card (•••• ${cardNumber.replace(/\s/g, '').slice(-4) || '3821'})`
          : paymentMethod === 'transfer'
          ? `${gatewayTitle} Dedicated Bank Transfer`
          : paymentMethod === 'barter'
          ? 'Flutterwave Barter / QR'
          : `${gatewayTitle} USSD (*737#)`;

      createOrderFromCart(methodName, checkoutAddress);
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
              <strong className="text-[#FB7701] font-price font-semibold text-sm">{formatNaira(effectiveTotal)}</strong>
            </div>

            <p className="text-[10px] text-[#9CA3AF]">
              Please do not refresh or close this window while authorization completes.
            </p>
          </div>
        </div>
      )}

      {/* Mobile-Only Top Bar */}
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
                  onClick={() => {
                    setSelectedGateway('paystack');
                    if (paymentMethod === 'barter') setPaymentMethod('card');
                  }}
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
                    <p className="font-price font-semibold text-2xl text-[#FB7701] mt-0.5">
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
                    <p className="font-price font-semibold text-2xl text-[#FB7701] mt-0.5">
                      {formatNaira(effectiveTotal)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENT CHANNELS TABS */}
            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold text-sm text-[#0F0F10]">
                  Select Payment Method
                </h3>
                <span className="text-xs text-[#6B7280]">
                  Instant Payment Clearance
                </span>
              </div>

              <div className={`grid ${selectedGateway === 'flutterwave' ? 'grid-cols-4' : 'grid-cols-3'} gap-2`}>
                {/* Card Tab */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-3 px-2 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-[#FAF9F6] border-[#D4AF37] text-[#0F0F10] shadow-xs ring-2 ring-[#D4AF37]/30'
                      : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:border-gray-300'
                  }`}
                >
                  <CreditCard size={18} className={paymentMethod === 'card' ? 'text-[#D4AF37]' : 'text-gray-400'} />
                  <span>Debit Card</span>
                </button>

                {/* Bank Transfer Tab */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`py-3 px-2 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'transfer'
                      ? 'bg-[#FAF9F6] border-[#D4AF37] text-[#0F0F10] shadow-xs ring-2 ring-[#D4AF37]/30'
                      : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:border-gray-300'
                  }`}
                >
                  <Building2 size={18} className={paymentMethod === 'transfer' ? 'text-[#D4AF37]' : 'text-gray-400'} />
                  <span>Bank Transfer</span>
                </button>

                {/* USSD Tab */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('ussd')}
                  className={`py-3 px-2 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === 'ussd'
                      ? 'bg-[#FAF9F6] border-[#D4AF37] text-[#0F0F10] shadow-xs ring-2 ring-[#D4AF37]/30'
                      : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:border-gray-300'
                  }`}
                >
                  <PhoneCall size={18} className={paymentMethod === 'ussd' ? 'text-[#D4AF37]' : 'text-gray-400'} />
                  <span>USSD Code</span>
                </button>

                {/* Barter Tab (Flutterwave exclusive) */}
                {selectedGateway === 'flutterwave' && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('barter')}
                    className={`py-3 px-2 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      paymentMethod === 'barter'
                        ? 'bg-[#FAF9F6] border-[#FB7701] text-[#0F0F10] shadow-xs ring-2 ring-[#FB7701]/30'
                        : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:border-gray-300'
                    }`}
                  >
                    <QrCode size={18} className={paymentMethod === 'barter' ? 'text-[#FB7701]' : 'text-gray-400'} />
                    <span>Barter / QR</span>
                  </button>
                )}
              </div>

              {/* CHANNEL 1: DEBIT/CREDIT CARD WITH LUXURY CARD PREVIEW */}
              {paymentMethod === 'card' && (
                <div className="pt-2 space-y-4 animate-in fade-in duration-200">
                  {/* Interactive Virtual Card Visual */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-tr from-[#0F0F10] via-[#1F1D22] to-[#2C292E] text-white shadow-xl relative overflow-hidden border border-[#D4AF37]/30">
                    <div className="absolute right-0 top-0 bottom-0 w-44 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#D4AF37]/15 to-transparent pointer-events-none" />
                    
                    <div className="flex items-center justify-between pb-4">
                      <div className="w-10 h-7 rounded bg-gradient-to-br from-amber-200 to-amber-400 border border-amber-500/50 shadow-inner flex items-center justify-center">
                        <div className="w-6 h-4 border border-amber-700/40 rounded-xs" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-white">
                          {selectedGateway.toUpperCase()}
                        </span>
                        <span className="font-heading font-bold text-xs text-[#D4AF37]">
                          DESLA!™
                        </span>
                      </div>
                    </div>

                    <div className="py-2">
                      <span className="font-mono text-base sm:text-lg tracking-[0.2em] text-white drop-shadow-sm font-semibold">
                        {cardNumber || '•••• •••• •••• ••••'}
                      </span>
                    </div>

                    <div className="flex items-end justify-between pt-2 text-xs">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-white/50 tracking-wider block">Cardholder</span>
                        <span className="font-semibold text-white/90 truncate block max-w-[180px]">
                          {cardHolder || checkoutAddress.fullName}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-white/50 tracking-wider block">Expires</span>
                        <span className="font-mono font-semibold text-white/90">
                          {cardExpiry || 'MM/YY'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form Inputs */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                        Cardholder Full Name
                      </label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full bg-[#FAF9F6] border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                        placeholder="Name as printed on card"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                        16-Digit Card Number (Visa, Mastercard, Verve)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full bg-[#FAF9F6] border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs font-mono font-semibold text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                          placeholder="0000 0000 0000 0000"
                        />
                        <CreditCard size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full bg-[#FAF9F6] border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs font-mono font-semibold text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                          CVV Security Code
                        </label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="123"
                          className="w-full bg-[#FAF9F6] border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs font-mono font-semibold text-[#0F0F10] focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#4B5563] mb-1">
                        4-Digit Bank Card PIN
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardPin}
                        onChange={(e) => setCardPin(e.target.value)}
                        placeholder="••••"
                        className="w-full bg-[#FAF9F6] border border-[#E5E7EB] rounded-xl px-3.5 py-2.5 text-xs font-mono font-semibold text-[#0F0F10] tracking-widest focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* CHANNEL 2: DEDICATED ESCROW VIRTUAL ACCOUNT */}
              {paymentMethod === 'transfer' && (
                <div className="pt-2 space-y-3.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                    <span className="text-xs font-semibold text-[#0F0F10] uppercase tracking-wider">
                      {selectedGateway === 'paystack' ? 'Paystack Virtual Escrow Account' : 'Flutterwave Dedicated Escrow Account'}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-mono text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                      <Clock size={12} />
                      <span>Expires in {formatTimer(secondsRemaining)}</span>
                    </span>
                  </div>

                  <p className="text-xs text-[#6B7280]">
                    Transfer exactly <strong className="text-[#0F0F10] font-mono">{formatNaira(effectiveTotal)}</strong> into this dedicated one-time escrow account generated by {selectedGateway === 'paystack' ? 'Paystack' : 'Flutterwave'}:
                  </p>

                  <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6B7280]">Bank Name:</span>
                      <span className="font-semibold text-[#0F0F10]">{virtualAccount.bankName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#6B7280]">Account Name:</span>
                      <span className="font-semibold text-[#0F0F10]">{virtualAccount.accountName}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
                      <span className="text-[#6B7280] text-xs">Account Number:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-lg text-[#0F0F10] tracking-wider">
                          {virtualAccount.accountNumber}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyAccount}
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#E5E7EB] text-[#0F0F10] hover:bg-gray-50 active:scale-95 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                        >
                          {copied ? (
                            <>
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2">
                    <AlertCircle size={15} className="text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      Automatic webhook verification reconciles this transfer within 60 seconds. Once sent from your banking app, click "I Have Sent The Money" below.
                    </span>
                  </div>
                </div>
              )}

              {/* CHANNEL 3: USSD CODE QUICK DIAL */}
              {paymentMethod === 'ussd' && (
                <div className="pt-2 space-y-3 animate-in fade-in duration-200">
                  <span className="text-xs font-semibold text-[#0F0F10] uppercase tracking-wider block">
                    Instant Bank USSD Quick Dial
                  </span>
                  <p className="text-xs text-[#6B7280]">
                    Dial the USSD string from your phone line registered with your bank:
                  </p>
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#0F0F10]">GTBank</span>
                      <span className="font-mono font-bold text-[#0F0F10] bg-white px-2 py-0.5 rounded border">*737*50*51000*8291#</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#0F0F10]">Zenith Bank</span>
                      <span className="font-mono font-bold text-[#0F0F10] bg-white px-2 py-0.5 rounded border">*966*00*51000*8291#</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#0F0F10]">Access Bank</span>
                      <span className="font-mono font-bold text-[#0F0F10] bg-white px-2 py-0.5 rounded border">*901*00*51000*8291#</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#0F0F10]">First Bank</span>
                      <span className="font-mono font-bold text-[#0F0F10] bg-white px-2 py-0.5 rounded border">*894*50*51000*8291#</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#0F0F10]">United Bank for Africa (UBA)</span>
                      <span className="font-mono font-bold text-[#0F0F10] bg-white px-2 py-0.5 rounded border">*919*00*51000*8291#</span>
                    </div>
                  </div>
                </div>
              )}

              {/* CHANNEL 4: BARTER / QR CODE (Flutterwave) */}
              {paymentMethod === 'barter' && selectedGateway === 'flutterwave' && (
                <div className="pt-2 space-y-3.5 animate-in fade-in duration-200">
                  <span className="text-xs font-semibold text-[#0F0F10] uppercase tracking-wider block">
                    Barter by Flutterwave &amp; QR Payment
                  </span>
                  
                  <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] text-center space-y-3">
                    <div className="w-32 h-32 rounded-2xl bg-white border border-[#E5E7EB] mx-auto p-2 flex items-center justify-center shadow-xs">
                      <QrCode size={108} className="text-[#0F0F10]" />
                    </div>
                    <div>
                      <strong className="text-xs text-[#0F0F10] block">Scan with any Nigerian Banking App</strong>
                      <span className="text-[11px] text-[#6B7280]">Supports NQR, Barter, Chipper &amp; Kuda</span>
                    </div>
                  </div>
                </div>
              )}

              {/* PRIMARY AUTHORIZATION CTA */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="w-full py-4 rounded-full bg-[#0F0F10] hover:bg-[#1F1D22] active:scale-[0.98] text-white font-heading font-semibold text-sm shadow-xl flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-[#D4AF37]" />
                      <span>Authorizing via {selectedGateway === 'paystack' ? 'Paystack' : 'Flutterwave'}...</span>
                    </>
                  ) : paymentMethod === 'transfer' ? (
                    <>
                      <CheckCircle2 size={16} className="text-[#D4AF37]" />
                      <span>I Have Sent The Money ({formatNaira(effectiveTotal)})</span>
                      <ArrowRight size={16} />
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>Authorize &amp; Pay {formatNaira(effectiveTotal)} via {selectedGateway === 'paystack' ? 'Paystack' : 'Flutterwave'}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
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
                  <span className="font-price font-semibold text-2xl text-[#FB7701]">
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
