import React, { useEffect, useState, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  Loader2,
  ChevronLeft,
  ArrowRight,
  MapPin,
  Check,
  ExternalLink,
  Coins,
  Copy,
  Clock,
  RefreshCw,
  QrCode,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { creatorDiscountNaira } from '../../lib/order-journey';
import { useApp } from '../../context/AppContext';
import { CustomerAccess } from '../../components/auth/CustomerAccess';
import { useViewport } from '../../context/ViewportContext';
import {
  lastPaymentReference,
  fetchCryptoRates,
  getCryptoPaymentStatus,
  type CryptoRatesDto,
  type CryptoInitDto,
} from '../../lib/owned-api';

const Screen11PaymentContent: React.FC = () => {
  const { isDesktop } = useViewport();
  const {
    cartItems,
    cartSubtotal,
    cartTotal,
    cartDeliveryFee,
    appliedCreator,
    activeCreatorCode,
    creatorDiscountPercent,
    selectedCity,
    createOrderFromCart,
    navigateTo,
    goBack,
    checkoutAddress,
    isLiveBackend,
    prepareLiveCheckout,
    prepareLiveCryptoCheckout,
    confirmLiveCryptoPayment,
    reverifyPayment,
    addLocalOrder,
    clearCart,
  } = useApp();

  const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'flutterwave' | 'crypto'>('stripe');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingReference, setPendingReference] = useState<string | null>(null);

  // Cryptocurrency state
  const [cryptoAsset, setCryptoAsset] = useState<'USDT' | 'BTC' | 'ETH' | 'SOL'>('USDT');
  const [cryptoNetwork, setCryptoNetwork] = useState<'TRC20' | 'ERC20' | 'BTC' | 'ETH' | 'SOL'>('TRC20');
  const [cryptoRates, setCryptoRates] = useState<CryptoRatesDto | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [cryptoInvoice, setCryptoInvoice] = useState<(CryptoInitDto & { serverOrderId?: string; orderNumber?: string }) | null>(null);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [txHashInput, setTxHashInput] = useState('');
  const [isVerifyingTx, setIsVerifyingTx] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'address' | 'amount' | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(900);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLiveBackend) setPendingReference(lastPaymentReference());
  }, [isLiveBackend]);

  // Load crypto rates on mount or when crypto is selected
  const loadRates = async () => {
    setIsLoadingRates(true);
    try {
      const data = await fetchCryptoRates();
      setCryptoRates(data);
    } catch {
      // Fallback rates if network is offline
      setCryptoRates({
        USDT: { asset: 'USDT', name: 'Tether USD', usdPrice: 1.0, ngnPrice: 1450, change24h: 0, networks: ['TRC20', 'ERC20'], decimals: 6, networkFee: '1.000000', defaultNetwork: 'TRC20', supportedNetworks: ['TRC20', 'ERC20'] },
        BTC: { asset: 'BTC', name: 'Bitcoin', usdPrice: 65000, ngnPrice: 94250000, change24h: 0, networks: ['BTC'], decimals: 8, networkFee: '0.00005000', defaultNetwork: 'BTC', supportedNetworks: ['BTC'] },
        ETH: { asset: 'ETH', name: 'Ethereum', usdPrice: 3400, ngnPrice: 4930000, change24h: 0, networks: ['ETH'], decimals: 8, networkFee: '0.00150000', defaultNetwork: 'ETH', supportedNetworks: ['ETH'] },
        SOL: { asset: 'SOL', name: 'Solana', usdPrice: 155, ngnPrice: 224750, change24h: 0, networks: ['SOL'], decimals: 4, networkFee: '0.0050', defaultNetwork: 'SOL', supportedNetworks: ['SOL'] },
      });
    } finally {
      setIsLoadingRates(false);
    }
  };

  useEffect(() => {
    if (selectedGateway === 'crypto' && !cryptoRates) {
      loadRates();
    }
  }, [selectedGateway]);

  // Adjust default network when asset changes
  const handleSelectAsset = (asset: 'USDT' | 'BTC' | 'ETH' | 'SOL') => {
    setCryptoAsset(asset);
    if (asset === 'USDT') setCryptoNetwork('TRC20');
    else if (asset === 'BTC') setCryptoNetwork('BTC');
    else if (asset === 'ETH') setCryptoNetwork('ETH');
    else if (asset === 'SOL') setCryptoNetwork('SOL');
    setCryptoInvoice(null);
    setVerifyError(null);
  };

  const formatNaira = (amt: number) => '₦' + amt.toLocaleString('en-NG');

  const creatorDiscount = activeCreatorCode ? creatorDiscountNaira(cartSubtotal, creatorDiscountPercent) : 0;
  const effectiveTotal = cartTotal > 0 ? cartTotal : Math.max(0, cartSubtotal - creatorDiscount + (cartDeliveryFee || 1500));

  // Compute live quote based on active rate
  const currentRate = cryptoRates?.[cryptoAsset];
  const ngnPrice = currentRate?.ngnPrice || (cryptoAsset === 'USDT' ? 1450 : cryptoAsset === 'BTC' ? 95000000 : cryptoAsset === 'ETH' ? 5000000 : 220000);
  const decimals = currentRate?.decimals || (cryptoAsset === 'SOL' ? 4 : cryptoAsset === 'USDT' ? 6 : 8);
  const computedCryptoAmount = (effectiveTotal / ngnPrice).toFixed(decimals);
  const computedFee = currentRate?.networkFee || (cryptoAsset === 'USDT' ? '1.000000' : cryptoAsset === 'BTC' ? '0.00005000' : cryptoAsset === 'ETH' ? '0.00150000' : '0.0050');
  const computedTotalCrypto = (Number(computedCryptoAmount) + Number(computedFee)).toFixed(decimals);

  // Countdown timer for active invoice
  useEffect(() => {
    if (!cryptoInvoice) return;
    setSecondsRemaining(cryptoInvoice.expiresInSeconds || 900);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cryptoInvoice]);

  // Status Polling for active invoice
  useEffect(() => {
    if (!cryptoInvoice?.paymentId) return;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await getCryptoPaymentStatus(cryptoInvoice.paymentId);
        if (res.status === 'COMPLETED' || (res.status as string) === 'PAID') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setVerifySuccess(`Blockchain transaction verified! Order #${res.orderNumber || cryptoInvoice.orderNumber} settled.`);
          setTimeout(() => {
            clearCart();
            navigateTo('order-confirmed');
          }, 1500);
        }
      } catch {
        // Polling gracefully ignores transient network hiccups
      }
    }, 6000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [cryptoInvoice, clearCart, navigateTo]);

  // Generate Crypto Invoice
  const handleGenerateCryptoInvoice = async () => {
    setIsGeneratingInvoice(true);
    setVerifyError(null);
    try {
      const invoice = await prepareLiveCryptoCheckout(cryptoAsset, cryptoNetwork);
      setCryptoInvoice(invoice);
    } catch (err: any) {
      setVerifyError(err?.message || 'Unable to generate crypto invoice. Please try again.');
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  // Verify submitted TxHash
  const handleVerifyTxHash = async () => {
    if (!cryptoInvoice) return;
    if (!txHashInput.trim()) {
      setVerifyError('Please enter the blockchain transaction hash (TXID).');
      return;
    }
    setIsVerifyingTx(true);
    setVerifyError(null);
    try {
      const res = await confirmLiveCryptoPayment(cryptoInvoice.paymentId, txHashInput.trim());
      setVerifySuccess(`Transaction verified on blockchain! Order confirmed.`);
      if (pollingRef.current) clearInterval(pollingRef.current);
      setTimeout(() => {
        navigateTo('order-confirmed');
      }, 1500);
    } catch (err: any) {
      setVerifyError(err?.message || 'Blockchain verification failed. Please check your transaction hash and try again.');
    } finally {
      setIsVerifyingTx(false);
    }
  };

  const copyToClipboard = (text: string, field: 'address' | 'amount') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getExplorerLink = (txHash: string) => {
    if (cryptoNetwork === 'TRC20') return `https://tronscan.org/#/transaction/${txHash}`;
    if (cryptoNetwork === 'ERC20' || cryptoAsset === 'ETH') return `https://etherscan.io/tx/${txHash}`;
    if (cryptoAsset === 'BTC') return `https://mempool.space/tx/${txHash}`;
    if (cryptoAsset === 'SOL') return `https://solscan.io/tx/${txHash}`;
    return `https://tronscan.org/#/transaction/${txHash}`;
  };

  const handlePay = async () => {
    // Live path: real server order + hosted provider checkout.
    if (isLiveBackend) {
      setIsProcessing(true);
      setProcessingStep('Creating secure order…');
      try {
        const result = await prepareLiveCheckout(selectedGateway as 'stripe' | 'flutterwave');
        if (!result.authorizationUrl) {
          throw new Error('The payment gateway did not return a secure checkout link. Please try again.');
        }
      } catch (e) {
        setIsProcessing(false);
        setProcessingStep(e instanceof Error ? e.message : 'Payment failed — please try again.');
      }
      return;
    }

    setIsProcessing(true);
    const gatewayTitle = selectedGateway === 'stripe' ? 'Stripe' : 'Flutterwave';

    setProcessingStep(`Connecting to ${gatewayTitle} 3D Secure Terminal...`);
    setTimeout(() => {
      setProcessingStep('Opening hosted checkout...');
    }, 600);

    setTimeout(() => {
      setProcessingStep('Preparing payment handoff...');
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
                {selectedGateway === 'stripe' ? 'Stripe 3D Secure' : 'Flutterwave Rave Gateway'}
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

            {/* TRI-GATEWAY SELECTOR: PAYSTACK, FLUTTERWAVE & CRYPTOCURRENCY */}
            <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F0F10]">
                  Select Official Payment Gateway
                </span>
                <span className="text-[10px] font-mono text-[#997A2E] font-bold">
                  NAFDAC Verified Escrow
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Stripe Tab */}
                <button
                  type="button"
                  onClick={() => setSelectedGateway('stripe')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all text-left flex items-center justify-between ${
                    selectedGateway === 'stripe'
                      ? 'border-[#00C3F7] bg-[#F0FAFF] shadow-xs ring-2 ring-[#00C3F7]/20'
                      : 'border-[#E5E7EB] bg-[#FAF9F6] hover:border-gray-300'
                  }`}
                >
                  <div>
                    <span className="font-heading font-extrabold text-sm tracking-wider text-[#00C3F7] block">
                      stripe
                    </span>
                    <span className="text-[10px] text-[#6B7280]">
                      Hosted card checkout
                    </span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedGateway === 'stripe' ? 'border-[#00C3F7]' : 'border-gray-300'
                  }`}>
                    {selectedGateway === 'stripe' && (
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
                      Cards &amp; Transfer
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

                {/* Cryptocurrency Tab */}
                <button
                  type="button"
                  onClick={() => setSelectedGateway('crypto')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all text-left flex items-center justify-between ${
                    selectedGateway === 'crypto'
                      ? 'border-[#D4AF37] bg-[#FAF7EE] shadow-xs ring-2 ring-[#D4AF37]/30'
                      : 'border-[#E5E7EB] bg-[#FAF9F6] hover:border-gray-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Coins size={14} className="text-[#997A2E]" />
                      <span className="font-heading font-extrabold text-sm tracking-wider text-[#0F0F10] block">
                        Crypto
                      </span>
                    </div>
                    <span className="text-[10px] text-[#6B7280]">
                      USDT, BTC, ETH
                    </span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedGateway === 'crypto' ? 'border-[#D4AF37]' : 'border-gray-300'
                  }`}>
                    {selectedGateway === 'crypto' && (
                      <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* DYNAMIC GATEWAY BRANDED HOSTED CHECKOUT BANNER */}
            {selectedGateway === 'stripe' ? (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#091522] via-[#0E2238] to-[#091522] text-white shadow-md border border-[#00C3F7]/30 transition-all">
                <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00C3F7] animate-pulse" />
                    <span className="font-heading font-extrabold text-base tracking-wider text-[#00C3F7]">
                      stripe
                    </span>
                    <span className="text-[10px] text-white/70 font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-white/10">
                      Hosted checkout
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
            ) : selectedGateway === 'flutterwave' ? (
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
            ) : (
              /* CRYPTOCURRENCY BRANDED BANNER */
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0C111C] via-[#161F30] to-[#0C111C] text-white shadow-md border border-[#D4AF37]/40 transition-all">
                <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] animate-pulse" />
                    <span className="font-heading font-extrabold text-base tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                      <Coins size={16} />
                      DESLA CRYPTO ESCROW
                    </span>
                    <span className="text-[10px] text-white/70 font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-white/10">
                      Zero Processing Fee
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <Lock size={13} />
                    <span>On-Chain Settlement</span>
                  </div>
                </div>

                <div className="pt-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider block">
                      Settlement Currency &amp; Rate
                    </span>
                    <h3 className="font-heading font-semibold text-sm text-white mt-0.5 flex items-center gap-2">
                      <span>{cryptoAsset} ({cryptoNetwork})</span>
                      <button
                        type="button"
                        onClick={loadRates}
                        title="Refresh live rates"
                        className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-white/80 transition-all cursor-pointer"
                      >
                        <RefreshCw size={12} className={isLoadingRates ? 'animate-spin' : ''} />
                      </button>
                    </h3>
                    <span className="text-[11px] text-white/60 font-mono">
                      1 {cryptoAsset} ≈ ₦{ngnPrice.toLocaleString('en-NG')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider block">
                      Total Due in Crypto
                    </span>
                    <p className="font-price font-bold text-2xl text-[#D4AF37] mt-0.5">
                      {computedTotalCrypto} <span className="text-sm font-sans font-normal text-white/70">{cryptoAsset}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CRYPTO INTERACTIVE TERMINAL */}
            {selectedGateway === 'crypto' ? (
              <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-5">
                {!cryptoInvoice ? (
                  /* ASSET SELECTION & QUOTE PREVIEW */
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-[#0F0F10] block mb-2">
                        1. Select Settlement Asset
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {(['USDT', 'BTC', 'ETH', 'SOL'] as const).map((asset) => (
                          <button
                            key={asset}
                            type="button"
                            onClick={() => handleSelectAsset(asset)}
                            className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
                              cryptoAsset === asset
                                ? 'border-[#D4AF37] bg-[#FAF7EE] text-[#0F0F10] font-bold shadow-xs'
                                : 'border-[#E5E7EB] bg-[#FAF9F6] text-[#4B5563] hover:border-gray-300'
                            }`}
                          >
                            <span className="block text-sm">{asset}</span>
                            <span className="text-[10px] text-[#6B7280] block truncate">
                              {asset === 'USDT' ? 'Tether USD' : asset === 'BTC' ? 'Bitcoin' : asset === 'ETH' ? 'Ethereum' : 'Solana'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {cryptoAsset === 'USDT' && (
                      <div>
                        <label className="text-xs font-semibold text-[#0F0F10] block mb-2">
                          2. Select Blockchain Network
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => setCryptoNetwork('TRC20')}
                            className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                              cryptoNetwork === 'TRC20'
                                ? 'border-[#0F0F10] bg-[#FAF9F6] text-[#0F0F10] font-bold shadow-xs'
                                : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">TRC-20 (TRON)</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">Recommended</span>
                            </div>
                            <span className="text-[10px] text-[#6B7280] block mt-1">Fast • Low fee (1 USDT)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCryptoNetwork('ERC20')}
                            className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                              cryptoNetwork === 'ERC20'
                                ? 'border-[#0F0F10] bg-[#FAF9F6] text-[#0F0F10] font-bold shadow-xs'
                                : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-gray-300'
                            }`}
                          >
                            <span className="text-xs font-bold">ERC-20 (Ethereum)</span>
                            <span className="text-[10px] text-[#6B7280] block mt-1">Global standard</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Breakdown Box */}
                    <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-2 text-xs">
                      <div className="flex justify-between text-[#6B7280]">
                        <span>Catalogue Order Equivalent:</span>
                        <span className="font-mono font-medium text-[#0F0F10]">{computedCryptoAmount} {cryptoAsset}</span>
                      </div>
                      <div className="flex justify-between text-[#6B7280]">
                        <span>Estimated Network Gas / Mining Fee:</span>
                        <span className="font-mono font-medium text-[#0F0F10]">{computedFee} {cryptoAsset}</span>
                      </div>
                      <div className="pt-2 border-t border-[#E5E7EB] flex justify-between font-bold text-sm text-[#0F0F10]">
                        <span>Exact Transfer Required:</span>
                        <span className="font-mono text-[#997A2E]">{computedTotalCrypto} {cryptoAsset}</span>
                      </div>
                    </div>

                    {verifyError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                        <AlertTriangle size={15} className="shrink-0" />
                        <span>{verifyError}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleGenerateCryptoInvoice}
                      disabled={isGeneratingInvoice}
                      className="w-full py-4 rounded-full bg-[#0F0F10] hover:bg-[#1F1D22] active:scale-[0.98] text-white font-heading font-semibold text-sm shadow-xl flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isGeneratingInvoice ? (
                        <>
                          <Loader2 size={18} className="animate-spin text-[#D4AF37]" />
                          <span>Generating Dedicated Payment Vault…</span>
                        </>
                      ) : (
                        <>
                          <QrCode size={18} className="text-[#D4AF37]" />
                          <span>Generate Crypto Payment Invoice ({computedTotalCrypto} {cryptoAsset})</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  /* ACTIVE INVOICE VIEW WITH QR, ADDRESS & TX HASH VERIFICATION */
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-xs font-mono font-bold text-[#0F0F10]">
                          INVOICE: #{cryptoInvoice.orderNumber || 'DES-CRYPTO'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-semibold">
                        <Clock size={13} />
                        <span>{formatTimer(secondsRemaining)} remaining</span>
                      </div>
                    </div>

                    {verifySuccess && (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                        <span>{verifySuccess}</span>
                      </div>
                    )}

                    {/* QR Code and Amount Display */}
                    <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] text-center space-y-4">
                      {/* Stylized QR representation */}
                      <div className="w-44 h-44 mx-auto bg-white p-3 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-col items-center justify-center relative">
                        {/* High contrast SVG QR simulation */}
                        <svg className="w-36 h-36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="100" height="100" fill="white" />
                          {/* Corner squares */}
                          <rect x="5" y="5" width="26" height="26" rx="4" fill="#0F0F10" />
                          <rect x="9" y="9" width="18" height="18" rx="2" fill="white" />
                          <rect x="13" y="13" width="10" height="10" fill="#0F0F10" />
                          
                          <rect x="69" y="5" width="26" height="26" rx="4" fill="#0F0F10" />
                          <rect x="73" y="9" width="18" height="18" rx="2" fill="white" />
                          <rect x="77" y="13" width="10" height="10" fill="#0F0F10" />

                          <rect x="5" y="69" width="26" height="26" rx="4" fill="#0F0F10" />
                          <rect x="9" y="73" width="18" height="18" rx="2" fill="white" />
                          <rect x="13" y="77" width="10" height="10" fill="#0F0F10" />

                          {/* Data elements */}
                          <rect x="36" y="8" width="6" height="6" fill="#0F0F10" />
                          <rect x="46" y="8" width="6" height="6" fill="#0F0F10" />
                          <rect x="56" y="8" width="6" height="6" fill="#0F0F10" />
                          <rect x="36" y="18" width="16" height="6" fill="#0F0F10" />
                          <rect x="56" y="18" width="6" height="16" fill="#0F0F10" />
                          <rect x="8" y="36" width="6" height="16" fill="#0F0F10" />
                          <rect x="18" y="46" width="6" height="16" fill="#0F0F10" />
                          <rect x="36" y="36" width="28" height="28" rx="4" fill="#D4AF37" />
                          <circle cx="50" cy="50" r="8" fill="#0F0F10" />
                          <rect x="70" y="36" width="12" height="6" fill="#0F0F10" />
                          <rect x="86" y="46" width="6" height="16" fill="#0F0F10" />
                          <rect x="36" y="70" width="16" height="6" fill="#0F0F10" />
                          <rect x="56" y="76" width="16" height="6" fill="#0F0F10" />
                          <rect x="76" y="70" width="16" height="16" fill="#0F0F10" />
                        </svg>
                        <span className="text-[9px] font-mono text-[#6B7280] mt-1 block">Scan with any Web3 wallet</span>
                      </div>

                      {/* Exact Amount To Send */}
                      <div className="space-y-1">
                        <span className="text-[11px] uppercase tracking-wider text-[#6B7280] font-semibold">
                          Exact Amount to Transfer
                        </span>
                        <div className="flex items-center justify-center gap-2">
                          <strong className="text-xl font-price font-bold text-[#0F0F10]">
                            {cryptoInvoice.totalCrypto} {cryptoInvoice.asset}
                          </strong>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(cryptoInvoice.totalCrypto, 'amount')}
                            className="p-1.5 rounded-lg bg-white border border-[#E5E7EB] hover:bg-gray-50 active:scale-95 transition-all text-[#4B5563] cursor-pointer"
                            title="Copy exact amount"
                          >
                            {copiedField === 'amount' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Deposit Address Box */}
                      <div className="space-y-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-[#0F0F10]">
                            Dedicated Deposit Address ({cryptoInvoice.network})
                          </span>
                          {copiedField === 'address' && (
                            <span className="text-[10px] text-emerald-600 font-bold animate-in fade-in">
                              Copied to clipboard!
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-[#E5E7EB] font-mono text-xs break-all text-[#0F0F10]">
                          <span className="flex-1 select-all">{cryptoInvoice.depositAddress}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(cryptoInvoice.depositAddress, 'address')}
                            className="p-2 rounded-lg bg-[#FAF9F6] border border-[#E5E7EB] hover:bg-gray-100 active:scale-95 transition-all text-[#0F0F10] shrink-0 cursor-pointer"
                            title="Copy address"
                          >
                            {copiedField === 'address' ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Network Warning */}
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                      <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600" />
                      <div className="text-[11px] leading-relaxed">
                        Send only <strong>{cryptoInvoice.asset}</strong> on the <strong>{cryptoInvoice.network}</strong> network. Sending via an unsupported network or transferring incorrect tokens will result in irreversible asset loss.
                      </div>
                    </div>

                    {/* Manual TxHash Submission Form */}
                    <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] space-y-3">
                      <div>
                        <label className="text-xs font-bold text-[#0F0F10] block mb-1">
                          Already Sent? Paste Transaction Hash (TxHash / TXID)
                        </label>
                        <p className="text-[10px] text-[#6B7280] mb-2">
                          After transferring from your wallet or exchange (Binance, Bybit, TrustWallet, etc.), paste the transaction ID below for instant on-chain clearance.
                        </p>
                        <input
                          type="text"
                          value={txHashInput}
                          onChange={(e) => setTxHashInput(e.target.value)}
                          placeholder="e.g. 0x8f2d... or tron txid"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37]/50"
                        />
                      </div>

                      {verifyError && (
                        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-700 flex items-center gap-1.5">
                          <AlertTriangle size={14} className="shrink-0" />
                          <span>{verifyError}</span>
                        </div>
                      )}

                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={handleVerifyTxHash}
                          disabled={isVerifyingTx || !!verifySuccess}
                          className="flex-1 py-3 rounded-xl bg-[#0F0F10] hover:bg-[#27272A] active:scale-[0.98] text-white font-heading font-semibold text-xs shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isVerifyingTx ? (
                            <>
                              <Loader2 size={15} className="animate-spin text-[#D4AF37]" />
                              <span>Validating Blockchain Confirmation…</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={15} className="text-[#D4AF37]" />
                              <span>Verify On-Chain Settlement</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCryptoInvoice(null)}
                          className="px-4 py-3 rounded-xl bg-white border border-[#E5E7EB] hover:bg-gray-50 text-xs font-medium text-[#4B5563] cursor-pointer"
                        >
                          Change Asset
                        </button>
                      </div>
                    </div>

                    <div className="text-center">
                      <span className="text-[10px] text-[#9CA3AF] flex items-center justify-center gap-1">
                        <Loader2 size={11} className="animate-spin" />
                        Awaiting network confirmations • Auto-listening to mempool
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* HOSTED CHECKOUT (PAYSTACK / FLUTTERWAVE) */
              <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
                <div className="rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] p-5 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center text-[#997A2E] shrink-0">
                    <ExternalLink size={20} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-heading font-semibold text-sm text-[#0F0F10]">Continue to secure hosted checkout</h3>
                    <p className="text-xs leading-relaxed text-[#6B7280]">
                      {selectedGateway === 'stripe' ? 'Stripe' : 'Flutterwave'} will securely collect your card, bank transfer, or other supported payment details. Desla never receives or stores your card number, CVV, or PIN.
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
                        <span>Authorizing via {selectedGateway === 'stripe' ? 'Stripe' : 'Flutterwave'}...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        <span>Continue to {selectedGateway === 'stripe' ? 'Stripe' : 'Flutterwave'} to pay {formatNaira(effectiveTotal)}</span>
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
            )}

            {/* Escrow & Regulatory Trust Badges */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-start gap-3 text-xs text-[#6B7280]">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center text-[#997A2E] shrink-0 shadow-xs">
                <ShieldCheck size={20} />
              </div>
              <div className="text-[11px] leading-relaxed">
                <strong className="text-[#0F0F10] block text-xs">Payment verification</strong>
                <span>
                  {selectedGateway === 'crypto'
                    ? 'Cryptocurrency payments are verified through immutable decentralized ledgers. All orders are released for courier dispatch immediately upon the required block confirmations.'
                    : 'Payment is processed by your selected provider. Your order is updated after server-side payment verification.'}
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
                {activeCreatorCode && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Creator code ({creatorDiscountPercent}% off)</span>
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
                  <div className="text-right">
                    <span className="font-price font-bold text-2xl text-[#0F0F10] block">
                      {formatNaira(effectiveTotal)}
                    </span>
                    {selectedGateway === 'crypto' && (
                      <span className="text-[11px] font-mono font-bold text-[#997A2E]">
                        ≈ {computedTotalCrypto} {cryptoAsset}
                      </span>
                    )}
                  </div>
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
export const Screen11Payment: React.FC = () => <CustomerAccess title="Sign in to pay securely"><Screen11PaymentContent /></CustomerAccess>;
