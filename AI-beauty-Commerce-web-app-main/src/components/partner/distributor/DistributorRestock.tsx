import React, { useEffect, useRef, useState } from 'react';
import {
  Truck,
  Plus,
  Minus,
  ShoppingBag,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  X,
  PackageCheck
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { ActionDrawer } from '../shared/ActionDrawer';
import { PartnerKitRequests } from '../PartnerKitRequests';
import { buyWholesale, fetchWholesale, newIdempotencyKey, quoteWholesale, type WholesaleDashboard, type WholesaleQuote } from '../../../lib/owned-api';

export const DistributorRestock: React.FC = () => {
  const { products, selectedCity, distributorHubSettings } = useApp();
  const [wholesale, setWholesale] = useState<WholesaleDashboard | null>(null);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [lastBatchPlaced, setLastBatchPlaced] = useState<any | null>(null);
  const [quote, setQuote] = useState<WholesaleQuote | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const checkoutAttempt = useRef<{ fingerprint: string; key: string } | null>(null);

  useEffect(() => {
    let active = true;
    void fetchWholesale().then((data) => { if (active) { setWholesale(data); setLoadError(''); } })
      .catch((error) => { if (active) setLoadError(error instanceof Error ? error.message : 'Could not load wholesale catalogue.'); });
    return () => { active = false; };
  }, []);

  const wholesaleItems = (wholesale?.items ?? []).map((item) => {
    const cartonUnits = item.unitsPerCarton;
    const product = products.find((p) => p.sku === item.sku);
    const retailCartonValue = (product?.price ?? 0) * cartonUnits;
    const wholesalePrice = Math.round(item.unitPriceKobo * cartonUnits / 100);
    const expectedMargin = retailCartonValue - wholesalePrice;

    return {
      id: item.variantId,
      variantId: item.variantId,
      sku: item.sku,
      name: item.name,
      image: product?.image ?? '',
      cartonUnits,
      retailCartonValue,
      wholesalePrice,
      expectedMargin,
      minimumCartons: item.minimumCartons,
      available: item.available,
    };
  });

  const handleUpdateQty = (id: string, delta: number) => {
    const current = quantities[id] || 0;
    const item = wholesaleItems.find((candidate) => candidate.id === id);
    const next = Math.max(0, current + delta);
    const adjusted = delta > 0 && current === 0 && item ? Math.max(next, item.minimumCartons) : next;
    if (item && adjusted > 0 && adjusted * item.cartonUnits > item.available) return;
    setQuantities({ ...quantities, [id]: adjusted });
    setSubmitError('');
    checkoutAttempt.current = null;
  };

  const totalCartons = Object.values(quantities).reduce((acc, q) => acc + q, 0);
  const totalUnits = wholesaleItems.reduce((sum, item) => sum + (quantities[item.id] || 0) * item.cartonUnits, 0);
  const estimatedInvestment = wholesaleItems.reduce((acc, item) => {
    return acc + (quantities[item.id] || 0) * item.wholesalePrice;
  }, 0);
  const totalInvestment = quote ? quote.totalKobo / 100 : estimatedInvestment;
  const totalExpectedMargin = wholesaleItems.reduce((acc, item) => {
    return acc + (quantities[item.id] || 0) * item.expectedMargin;
  }, 0);
  const quoteLines = wholesaleItems.filter((item) => (quantities[item.id] || 0) > 0).map((item) => ({ variantId: item.variantId, cartons: quantities[item.id] }));
  const quoteFingerprintInput = JSON.stringify(quoteLines);
  useEffect(() => {
    if (!checkoutOpen || quoteLines.length === 0) { setQuote(null); setIsQuoting(false); return; }
    let active = true;
    setIsQuoting(true);
    void quoteWholesale(quoteLines).then((next) => { if (active) { setQuote(next); setSubmitError(''); } })
      .catch((error) => { if (active) { setQuote(null); setSubmitError(error instanceof Error ? error.message : 'Could not price this order.'); } })
      .finally(() => { if (active) setIsQuoting(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { active = false; };
  }, [checkoutOpen, quoteFingerprintInput]);

  const handlePlaceOrder = async () => {
    const items = wholesaleItems.filter((item) => (quantities[item.id] || 0) > 0).map((item) => ({ variantId: item.variantId, cartons: quantities[item.id] }));
    if (!items.length) return;
    setSubmitError('');
    const fingerprint = JSON.stringify(items);
    if (checkoutAttempt.current?.fingerprint !== fingerprint) checkoutAttempt.current = { fingerprint, key: newIdempotencyKey() };
    try {
      const freshQuote = await quoteWholesale(items);
      const result = await buyWholesale(items, freshQuote.quoteFingerprint, checkoutAttempt.current.key);
      const order = result.order;
      setLastBatchPlaced({ batchNumber: order.orderNumber, status: order.status, itemCount: order.wholesaleTerms.items.reduce((sum, item) => sum + item.qty, 0), courier: 'Awaiting dispatch', trackingNumber: 'Not dispatched' });
      setCheckoutOpen(false); setQuantities({}); checkoutAttempt.current = null;
      try { setWholesale(await fetchWholesale()); } catch { /* the saved order remains authoritative */ }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Wholesale order could not be created.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-20 md:pb-8">
      <PartnerKitRequests kind="DISTRIBUTOR" />
      {(loadError || submitError) && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">{submitError || loadError}</p>}
      {/* Header */}
      <div className="pb-2 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
            Wholesale Logistics • Direct Laboratory Factory Pricing
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#FAF9F6] border border-[#E5E7EB] text-[#0F0F10] font-bold">
            Configured wholesale prices
          </span>
        </div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10] mt-1">
          Restock Wholesale Master Cartons
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
          Order 24-unit master cartons directly from Desla Central Laboratory with cold-chain priority dispatch.
        </p>
      </div>

      {/* Success Banner if batch was placed */}
      {lastBatchPlaced && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#0F0F10] text-white border border-[#D4AF37]/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center shrink-0">
              <PackageCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-heading font-bold text-sm text-white">
                  Wholesale Order Queued: {lastBatchPlaced.batchNumber}
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#0F0F10] text-[9px] font-mono font-bold uppercase">
                  {lastBatchPlaced.status}
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF] mt-0.5 font-mono">
                {lastBatchPlaced.itemCount} Units ordered • Courier: {lastBatchPlaced.courier} • Track: {lastBatchPlaced.trackingNumber}
              </p>
            </div>
          </div>
          <button
            onClick={() => setLastBatchPlaced(null)}
            className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/10 text-xs font-semibold cursor-pointer self-start sm:self-auto"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Cartons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {wholesaleItems.map((item) => {
          const qty = quantities[item.id] || 0;
          return (
            <div
              key={item.id}
              className={`p-5 rounded-3xl border bg-white shadow-xs transition-all flex flex-col justify-between ${
                qty > 0 ? 'border-[#D4AF37] shadow-md ring-1 ring-[#D4AF37]/20' : 'border-[#E5E7EB]'
              }`}
            >
              <div className="space-y-4">
                <div className="relative h-44 rounded-2xl overflow-hidden bg-[#FAF9F6]">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                   <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-[#0F0F10]/80 backdrop-blur-md text-[#D4AF37] text-[10px] font-mono font-bold">
                     Master Carton ({item.cartonUnits} Units)
                  </span>
                </div>

                <div>
                  <h3 className="font-heading font-bold text-base text-[#0F0F10]">{item.name}</h3>
                  <p className="text-[11px] font-mono text-[#6B7280]">SKU: {item.sku}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Wholesale Price:</span>
                    <strong className="font-mono text-[#0F0F10]">
                      ₦{item.wholesalePrice.toLocaleString('en-NG')}
                    </strong>
                  </div>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Retail Value:</span>
                    <span className="font-mono">₦{item.retailCartonValue.toLocaleString('en-NG')}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#E5E7EB] pt-1.5 text-[#0F0F10] font-bold">
                    <span>Expected Margin:</span>
                    <span className="font-mono text-[#997A2E]">
                      +₦{item.expectedMargin.toLocaleString('en-NG')} 
                    </span>
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="pt-4 border-t border-[#E5E7EB] mt-4 flex items-center justify-between">
                <span className="text-xs text-[#6B7280] font-mono">Carton Qty</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleUpdateQty(item.id, -1)}
                    disabled={qty === 0}
                    className="w-8 h-8 rounded-full border border-[#E5E7EB] bg-white text-[#0F0F10] flex items-center justify-center hover:bg-[#FAF9F6] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-mono font-bold text-sm text-[#0F0F10] w-6 text-center">{qty}</span>
                  <button
                    onClick={() => handleUpdateQty(item.id, 1)}
                    className="w-8 h-8 rounded-full bg-[#0F0F10] text-white flex items-center justify-center hover:bg-[#27272A] cursor-pointer transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Restock Summary Bar */}
      {totalCartons > 0 && (
        <div className="fixed bottom-6 inset-x-4 max-w-4xl mx-auto z-40 bg-[#0F0F10] text-white p-4 rounded-3xl shadow-2xl border border-[#D4AF37]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-bottom-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-white">
                 {totalCartons} Master Cartons ({totalUnits} Units)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#0F0F10] font-bold">
                Est. gross difference: ₦{totalExpectedMargin.toLocaleString('en-NG')}
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF] font-mono">
              Total Wholesale Investment: <strong className="text-white">₦{totalInvestment.toLocaleString('en-NG')}</strong>
            </p>
          </div>

          <button
            onClick={() => setCheckoutOpen(true)}
            className="px-6 py-3 rounded-full bg-[#D4AF37] hover:bg-[#c5a028] text-[#0F0F10] font-bold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <span>Review &amp; Dispatch Order</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Restock Checkout Action Drawer */}
      <ActionDrawer
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        title="Wholesale Restock Checkout"
         subtitle="Server-priced wholesale order"
        footer={
          <button
            onClick={handlePlaceOrder}
            disabled={isQuoting || !quote || !!submitError}
            className="w-full py-3.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-[#D4AF37] font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShieldCheck size={16} />
            <span>{isQuoting ? 'Getting server quote…' : `Create wholesale invoice (₦${totalInvestment.toLocaleString('en-NG')})`}</span>
          </button>
        }
      >
        <div className="space-y-5 text-xs">
          <div className="p-4 rounded-2xl bg-[#FBF5E8] border border-[#D4AF37]/30 space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase text-[#997A2E]">
              City Hub Destination
            </span>
            <p className="font-bold text-[#0F0F10]">{wholesale?.location?.name || distributorHubSettings?.hubName || selectedCity || 'Configured distributor hub'} • {wholesale?.location?.address || distributorHubSettings?.address}</p>
            <p className="text-[#6B7280]">Dispatch timing is confirmed after the wholesale order is accepted.</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-[#0F0F10]">Cartons Breakdown</h4>
            <div className="divide-y divide-[#E5E7EB]">
              {wholesaleItems
                .filter((item) => (quantities[item.id] || 0) > 0)
                .map((it) => (
                  <div key={it.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#0F0F10]">{it.name}</p>
                      <p className="text-[10px] text-[#6B7280]">
                        {quantities[it.id]} cartons × {it.cartonUnits} units = {quantities[it.id] * it.cartonUnits} bottles
                      </p>
                    </div>
                    <span className="font-mono font-bold text-[#0F0F10]">
                      ₦{((quantities[it.id] || 0) * it.wholesalePrice).toLocaleString('en-NG')}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] space-y-2">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Total Wholesale Investment:</span>
              <strong className="font-mono text-[#0F0F10]">₦{(quote?.subtotalKobo != null ? quote.subtotalKobo / 100 : estimatedInvestment).toLocaleString('en-NG')}</strong>
            </div>
            <div className="flex justify-between"><span className="text-[#6B7280]">Delivery:</span><strong className="font-mono">{quote ? `₦${(quote.deliveryFeeKobo / 100).toLocaleString('en-NG')}` : isQuoting ? 'Quoting…' : 'Calculated at quote'}</strong></div>
            <div className="flex justify-between"><span className="text-[#6B7280]">Total order:</span><strong className="font-mono">{quote ? `₦${(quote.totalKobo / 100).toLocaleString('en-NG')}` : isQuoting ? 'Quoting…' : '—'}</strong></div>
            <div className="flex justify-between text-[#0F0F10]">
              <span>Estimated Retail Value:</span>
              <strong className="font-mono">₦{(totalInvestment + totalExpectedMargin).toLocaleString('en-NG')}</strong>
            </div>
            <div className="flex justify-between border-t border-[#E5E7EB] pt-2 font-bold text-xs text-[#0F0F10]">
              <span>Estimated Gross Difference:</span>
              <span className="text-[#0F0F10] font-mono font-extrabold">₦{totalExpectedMargin.toLocaleString('en-NG')}</span>
            </div>
          </div>
        </div>
      </ActionDrawer>
    </div>
  );
};
