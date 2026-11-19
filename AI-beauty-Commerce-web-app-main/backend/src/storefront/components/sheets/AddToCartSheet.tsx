import React from 'react';
import { CheckCircle2, X, ArrowRight, ShieldCheck } from '../common/SolidIcons';
import { useApp } from '../../context/AppContext';
import { DeslaModalFrame } from '../motion/DeslaMotion';

export const AddToCartSheet: React.FC = () => {
  const {
    isAddToCartSheetOpen,
    closeAddToCartSheet,
    lastAddedCartItem,
    navigateTo,
    cartCount,
    cartSubtotal,
  } = useApp();

  const formatNaira = (amt: number) => '₦' + amt.toLocaleString('en-NG');

  const handleGoToCart = () => {
    closeAddToCartSheet();
    navigateTo('cart');
  };

  return (
    <DeslaModalFrame
      open={Boolean(isAddToCartSheetOpen && lastAddedCartItem)}
      onClose={closeAddToCartSheet}
      ariaLabel="Added to Shopping Bag"
      panelClassName="w-full max-w-md sm:max-w-xl bg-white rounded-3xl shadow-2xl border border-[#E5E7EB] overflow-hidden"
    >
      {lastAddedCartItem && (
        <>
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#E5E7EB] bg-[#FAF9F6]">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={19} className="text-[#0F0F10]" />
              <span className="font-heading font-semibold text-sm text-[#0F0F10]">
                Added to Shopping Bag
              </span>
            </div>

            <button
              type="button"
              onClick={closeAddToCartSheet}
              className="min-h-10 min-w-10 rounded-full text-gray-500 hover:text-black hover:bg-white active:scale-95 transition-all cursor-pointer flex items-center justify-center"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
            <div className="sm:col-span-5 flex flex-col items-center justify-center">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-[#FAF9F6] border border-[#E5E7EB] p-2 flex items-center justify-center relative shadow-2xs">
                <img
                  src={lastAddedCartItem.product.image}
                  alt={lastAddedCartItem.product.name}
                  className="w-full h-full object-contain rounded-xl"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/product_barrier_cream.jpg';
                  }}
                />
              </div>
              <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-[#6B7280]">
                <ShieldCheck size={12} className="text-[#D4AF37]" />
                <span>NAFDAC Verified</span>
              </div>
            </div>

            <div className="sm:col-span-7 space-y-3.5 min-w-0">
              <div>
                <span className="text-[10px] font-medium text-[#997A2E] uppercase tracking-wider block">
                  {lastAddedCartItem.product.category || 'Formulation'}
                </span>
                <h4 className="font-heading font-semibold text-sm sm:text-base text-[#0F0F10] truncate mt-0.5">
                  {lastAddedCartItem.product.name}
                </h4>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#FBF5E8] border border-[#D4AF37]/30 text-[10.5px] font-medium text-[#997A2E]">
                    {lastAddedCartItem.size}
                  </span>
                  <span className="text-xs font-normal text-[#6B7280]">
                    Qty: <strong className="text-[#0F0F10] font-semibold">{lastAddedCartItem.quantity}</strong>
                  </span>
                  <span className="font-price font-semibold text-sm text-[#0F0F10] ml-auto">
                    {formatNaira(lastAddedCartItem.unitPrice * lastAddedCartItem.quantity)}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#E5E7EB] flex items-center justify-between text-xs">
                <span className="text-[#6B7280] font-normal">
                  Bag Total ({cartCount} {cartCount === 1 ? 'item' : 'items'}):
                </span>
                <span className="font-price font-semibold text-sm text-[#0F0F10]">
                  {formatNaira(cartSubtotal)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={closeAddToCartSheet}
                  className="py-2.5 px-3 rounded-xl border border-[#E5E7EB] hover:bg-[#FAF9F6] text-[#0F0F10] font-medium text-xs active:scale-95 transition-all cursor-pointer text-center"
                >
                  Keep Shopping
                </button>
                <button
                  type="button"
                  onClick={handleGoToCart}
                  className="py-2.5 px-3 rounded-xl bg-[#0F0F10] hover:bg-[#27272A] text-[#D4AF37] border border-[#D4AF37]/30 font-semibold text-xs active:scale-95 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <span>View Bag</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </DeslaModalFrame>
  );
};
