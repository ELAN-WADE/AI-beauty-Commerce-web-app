import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Minus,
  ShoppingBag,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { ActionDrawer } from '../shared/ActionDrawer';

export const DistributorRestock: React.FC = () => {
  const { products } = useApp();
  const [quantities, setQuantities] = useState<Record<string, number>>({
    'prod-1': 1,
    'prod-2': 2
  });
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  const wholesaleItems = products.slice(0, 5).map((p, index) => {
    const cartonUnits = 24;
    const retailCartonValue = p.price * cartonUnits;
    // Silver Partner Tier gives 32% wholesale discount
    const wholesalePrice = Math.round(retailCartonValue * 0.68);
    const expectedMargin = retailCartonValue - wholesalePrice;

    return {
      id: p.id,
      name: p.name,
      image: p.image,
      cartonUnits,
      retailCartonValue,
      wholesalePrice,
      expectedMargin
    };
  });

  const handleUpdateQty = (id: string, delta: number) => {
    const current = quantities[id] || 0;
    const next = Math.max(0, current + delta);
    setQuantities({ ...quantities, [id]: next });
  };

  const totalCartons = Object.values(quantities).reduce((acc, q) => acc + q, 0);
  const totalInvestment = wholesaleItems.reduce((acc, item) => {
    return acc + (quantities[item.id] || 0) * item.wholesalePrice;
  }, 0);
  const totalExpectedMargin = wholesaleItems.reduce((acc, item) => {
    return acc + (quantities[item.id] || 0) * item.expectedMargin;
  }, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-20 md:pb-8">
      {/* Header */}
      <div className="pb-2 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#997A2E]">
            Laboratory Wholesale Purchasing
          </span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.2 rounded-full bg-[#FBF5E8] text-[#997A2E] border border-[#D4AF37]/30">
            Silver Tier • 32% Margin
          </span>
        </div>
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F0F10] mt-1">
          Wholesale Restock &amp; Cartons
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
          Order authentic clinical laboratory formulations in master cartons for guaranteed same-day local dispatch in your territory.
        </p>
      </div>

      {/* Product Rows Grid */}
      <div className="space-y-4">
        {wholesaleItems.map((item) => {
          const qty = quantities[item.id] || 0;
          return (
            <div
              key={item.id}
              className="p-5 rounded-3xl bg-white border border-[#E5E7EB] hover:border-[#D4AF37]/60 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-[#E5E7EB] shrink-0"
                />
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-base text-[#0F0F10]">
                    {item.name}
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Master Carton: <strong>{item.cartonUnits} bottles</strong> • Retail Value: ₦{item.retailCartonValue.toLocaleString('en-NG')}
                  </p>
                  <p className="text-[11px] font-mono font-bold text-emerald-700">
                    Your Wholesale Price: ₦{item.wholesalePrice.toLocaleString('en-NG')} (Save ₦{item.expectedMargin.toLocaleString('en-NG')})
                  </p>
                </div>
              </div>

              {/* Stepper Controls */}
              <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-[#E5E7EB]">
                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#9CA3AF] uppercase block">
                    Subtotal
                  </span>
                  <span className="font-mono font-extrabold text-sm sm:text-base text-[#0F0F10]">
                    ₦{(qty * item.wholesalePrice).toLocaleString('en-NG')}
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-[#FAF9F6] p-1 rounded-full border border-[#E5E7EB]">
                  <button
                    onClick={() => handleUpdateQty(item.id, -1)}
                    disabled={qty === 0}
                    className="w-8 h-8 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#0F0F10] hover:bg-[#F3F4F6] disabled:opacity-40 cursor-pointer"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-xs text-[#0F0F10]">
                    {qty}
                  </span>
                  <button
                    onClick={() => handleUpdateQty(item.id, 1)}
                    className="w-8 h-8 rounded-full bg-[#0F0F10] text-white flex items-center justify-center hover:bg-[#27272A] cursor-pointer"
                  >
                    <Plus size={14} className="text-[#D4AF37]" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Cart Bar */}
      {totalCartons > 0 && (
        <div className="fixed bottom-14 md:bottom-6 inset-x-4 md:inset-x-auto md:right-8 z-40 max-w-xl mx-auto md:w-auto">
          <div className="p-4 rounded-3xl bg-[#0F0F10] text-white shadow-2xl border border-white/20 flex items-center justify-between gap-6 backdrop-blur-md">
            <div>
              <p className="text-xs font-bold text-[#D4AF37] flex items-center gap-1.5">
                <Truck size={14} />
                <span>{totalCartons} Cartons Selected</span>
              </p>
              <p className="font-heading font-extrabold text-lg text-white">
                ₦{totalInvestment.toLocaleString('en-NG')}
              </p>
              <p className="text-[10px] text-emerald-400 font-mono">
                Est. Retail Profit: ₦{totalExpectedMargin.toLocaleString('en-NG')} (32%)
              </p>
            </div>

            <button
              onClick={() => setCheckoutOpen(true)}
              className="px-6 py-2.5 rounded-full bg-[#D4AF37] hover:bg-[#E5C365] text-[#0F0F10] font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-[0.97] transition-all cursor-pointer shrink-0"
            >
              <span>Review Order</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Wholesale Checkout Drawer */}
      <ActionDrawer
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        title="Wholesale Restock Checkout"
        subtitle="Desla! Central Laboratory Direct Dispatch"
        footer={
          <button
            onClick={() => {
              setOrderSubmitted(true);
              setTimeout(() => {
                setOrderSubmitted(false);
                setCheckoutOpen(false);
                setQuantities({});
                alert('Wholesale order submitted! Laboratory batch #LAB-821 has been queued for dispatch to Lagos Central Hub.');
              }, 1200);
            }}
            className="w-full py-3 rounded-full bg-[#0F0F10] hover:bg-[#27272A] text-[#D4AF37] font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <ShieldCheck size={16} />
            <span>Confirm &amp; Place Wholesale Order (₦{totalInvestment.toLocaleString('en-NG')})</span>
          </button>
        }
      >
        <div className="space-y-5 text-xs">
          <div className="p-4 rounded-2xl bg-[#FBF5E8] border border-[#D4AF37]/30 space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase text-[#997A2E]">
              City Hub Destination
            </span>
            <p className="font-bold text-[#0F0F10]">Lagos Central Hub • Plot 14 Admiralty Way, Lekki</p>
            <p className="text-[#6B7280]">Dispatch ETA: Within 24 hours from Central Laboratory</p>
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
                        {quantities[it.id]} cartons × 24 units = {quantities[it.id] * 24} bottles
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
              <strong className="font-mono text-[#0F0F10]">₦{totalInvestment.toLocaleString('en-NG')}</strong>
            </div>
            <div className="flex justify-between text-emerald-800">
              <span>Expected Retail Revenue:</span>
              <strong className="font-mono">₦{(totalInvestment + totalExpectedMargin).toLocaleString('en-NG')}</strong>
            </div>
            <div className="flex justify-between border-t border-[#E5E7EB] pt-2 font-bold text-xs text-[#0F0F10]">
              <span>Your Wholesale Margin:</span>
              <span className="text-emerald-700 font-mono font-extrabold">₦{totalExpectedMargin.toLocaleString('en-NG')} (32%)</span>
            </div>
          </div>
        </div>
      </ActionDrawer>
    </div>
  );
};
