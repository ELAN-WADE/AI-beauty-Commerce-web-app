import React from 'react';
import { ShoppingBag, ArrowRight, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CartReminderBanner: React.FC = () => {
  const {
    cartCount,
    cartTotal,
    navigateTo,
    clearCart,
    isCartBannerDismissed,
    dismissCartBanner
  } = useApp();

  if (cartCount === 0 || isCartBannerDismissed) {
    return null;
  }

  const formatNaira = (amt: number) => '₦' + amt.toLocaleString('en-NG');

  return (
    <aside
      aria-label="Pending Cart Alert"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FFF4F7] via-[#FFF8FA] to-[#FFF0F5] border border-glowly-primary/25 p-3.5 shadow-xs transition-all animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-glowly-primary/10 text-glowly-primary flex items-center justify-center shrink-0 mt-0.5 animate-bounce-gentle">
            <ShoppingBag size={16} strokeWidth={2} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-heading font-extrabold text-xs text-glowly-charcoal">
                Items Waiting in Your Bag
              </span>
              <span className="text-[10px] font-mono font-bold text-glowly-primary bg-glowly-accent/60 px-1.5 py-0.2 rounded-full">
                {cartCount} {cartCount === 1 ? 'item' : 'items'} • {formatNaira(cartTotal)}
              </span>
            </div>

            <p className="text-[11px] text-glowly-muted mt-0.5 leading-snug">
              Your selected formulations are reserved. Review your bag or clear to start fresh.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={() => navigateTo('cart')}
                className="px-3 py-1.5 rounded-full bg-glowly-primary hover:bg-glowly-primary-hover active:scale-95 text-white text-[11px] font-bold tracking-tight shadow-xs flex items-center gap-1 transition-all"
              >
                <span>View Cart</span>
                <ArrowRight size={12} strokeWidth={2.5} />
              </button>

              <button
                onClick={clearCart}
                className="px-2.5 py-1.5 rounded-full bg-white hover:bg-rose-50 active:scale-95 text-glowly-muted hover:text-rose-600 text-[11px] font-semibold border border-glowly-border transition-all flex items-center gap-1"
                title="Clear Cart"
              >
                <Trash2 size={12} strokeWidth={1.75} />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={dismissCartBanner}
          className="p-1 rounded-full text-glowly-muted hover:text-glowly-charcoal hover:bg-white/80 transition-colors"
          aria-label="Dismiss cart alert"
        >
          <X size={15} />
        </button>
      </div>
    </aside>
  );
};
