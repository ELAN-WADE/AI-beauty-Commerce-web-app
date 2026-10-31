import React from 'react';
import { useApp } from '../../context/AppContext';
export function CartStatusBanner() {
  const { cartError, cartSaving, retryCart } = useApp();
  if (cartError) return <div role="alert" className="relative z-40 flex flex-wrap items-center justify-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
    <span>{cartError}</span><button onClick={retryCart} className="font-semibold underline">Retry bag</button>
  </div>;
  if (cartSaving) return <div role="status" className="border-b bg-[#FAF9F6] px-4 py-2 text-center text-xs text-[#6B7280]">Saving your bag…</div>;
  return null;
}

