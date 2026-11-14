import React from 'react';
import { ShoppingBag, ArrowRight, Trash, X } from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';

export const CartReminderBanner: React.FC = () => {
  const {
    cartCount,
    cartTotal,
    navigateTo,
    clearCart,
    isCartBannerDismissed,
    dismissCartBanner,
  } = useApp();

  if (cartCount === 0 || isCartBannerDismissed) {
    return null;
  }

  const formatNaira = (amt: number) => '₦' + amt.toLocaleString('en-NG');

  return (
    <aside
      aria-label="Pending Cart Alert"
      className="relative overflow-hidden rounded-2xl bg-[#FAF9F6] border border-[#E5E7EB] p-3.5 shadow-xs transition-all animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <ShoppingBag size={18} weight="fill" className="text-[#997A2E] shrink-0 mt-0.5" aria-hidden="true" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-heading font-semibold text-xs text-[#0F0F10]">
                Items Waiting in Your Bag
              </span>
              <span className="text-[11px] font-mono font-semibold text-[#997A2E]">
                {cartCount} {cartCount === 1 ? 'item' : 'items'} • {formatNaira(cartTotal)}
              </span>
            </div>

            <p className="text-xs text-[#6B7280] mt-0.5 leading-snug">
              Your selected formulations are reserved. Review your bag or clear to start fresh.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 mt-2.5">
              <button
                type="button"
                onClick={() => navigateTo('cart')}
                className="px-3.5 py-1.5 rounded-full bg-[#0F0F10] hover:bg-[#27272A] active:scale-[0.97] text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>View Bag</span>
                <ArrowRight size={12} weight="bold" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={clearCart}
                className="px-2.5 py-1.5 rounded-full bg-white hover:bg-red-50 active:scale-[0.97] text-[#6B7280] hover:text-red-600 text-xs font-medium border border-[#E5E7EB] transition-all flex items-center gap-1 cursor-pointer"
                title="Clear Cart"
              >
                <Trash size={13} weight="fill" aria-hidden="true" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={dismissCartBanner}
          className="p-1.5 rounded-full text-[#6B7280] hover:text-[#0F0F10] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
          aria-label="Dismiss cart alert"
        >
          <X size={15} weight="bold" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
};
