import React from 'react';
import { Check, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useViewport } from '../../context/ViewportContext';

export const AddToCartSheet: React.FC = () => {
  const {
    isAddToCartSheetOpen,
    closeAddToCartSheet,
    lastAddedCartItem,
    navigateTo,
    cartCount,
    cartSubtotal
  } = useApp();
  const { isDesktop } = useViewport();

  if (!isAddToCartSheetOpen || !lastAddedCartItem) {
    return null;
  }

  const formatNaira = (amt: number) => '₦' + amt.toLocaleString('en-NG');

  const handleGoToCart = () => {
    closeAddToCartSheet();
    navigateTo('cart');
  };

  const handleCheckout = () => {
    closeAddToCartSheet();
    navigateTo('checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Dimmed backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={closeAddToCartSheet}
      />

      {/* Responsive Temu-style Card Modal (Centered on Desktop, Elegant Sheet on Mobile) */}
      <div
        className={`relative z-10 w-full bg-white rounded-3xl shadow-2xl border border-[#E5E7EB] p-5 sm:p-6 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isDesktop
            ? 'max-w-md animate-in zoom-in-95'
            : 'max-w-md sm:max-w-lg mt-auto sm:my-auto animate-in slide-in-from-bottom-4 sm:zoom-in-95'
        }`}
      >
        {/* Header with Close */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#0F0F10] text-[#D4AF37] flex items-center justify-center shadow-xs">
              <Check size={14} strokeWidth={3} />
            </div>
            <span className="font-heading font-extrabold text-sm text-[#0F0F10]">
              Added to Shopping Bag
            </span>
          </div>

          <button
            onClick={closeAddToCartSheet}
            className="p-1 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Added Product Snippet */}
        <div className="flex items-center gap-3.5 my-4 p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB]">
          <img
            src={lastAddedCartItem.product.image}
            alt={lastAddedCartItem.product.name}
            className="w-16 h-16 rounded-xl object-cover bg-[#F6F5F2] border border-[#E5E7EB] shrink-0"
          />
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-mono text-[#997A2E] font-bold uppercase tracking-wider block">
              {lastAddedCartItem.product.sku || 'DESLA!™ SKU'}
            </span>
            <h4 className="font-heading font-bold text-xs text-[#0F0F10] truncate mt-0.5">
              {lastAddedCartItem.product.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-md bg-[#F3EEE3] text-[10px] font-medium text-[#0F0F10]">
                {lastAddedCartItem.size}
              </span>
              <span className="text-xs text-[#6B7280]">
                Qty: <strong className="text-[#0F0F10] font-mono">{lastAddedCartItem.quantity}</strong>
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="font-price font-bold text-sm text-[#0F0F10] block">
              {formatNaira(lastAddedCartItem.unitPrice * lastAddedCartItem.quantity)}
            </span>
          </div>
        </div>

        {/* Bag Totals Snapshot */}
        <div className="p-3 rounded-xl bg-[#F3EEE3]/40 border border-[#F3EEE3] flex items-center justify-between text-xs mb-4">
          <span className="text-[#6B7280]">
            Bag Total ({cartCount} {cartCount === 1 ? 'item' : 'items'}):
          </span>
          <span className="font-price font-bold text-sm text-[#0F0F10]">
            {formatNaira(cartSubtotal)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={closeAddToCartSheet}
            className="py-3 px-4 rounded-xl border border-[#E5E7EB] hover:bg-[#FAF9F6] text-[#0F0F10] font-heading font-bold text-xs active:scale-[0.97] transition-all cursor-pointer text-center"
          >
            Keep Shopping
          </button>
          <button
            onClick={handleGoToCart}
            className="py-3 px-4 rounded-xl bg-[#0F0F10] hover:bg-[#1F1D22] text-white font-heading font-extrabold text-xs active:scale-[0.97] transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
          >
            <span>View Bag</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
