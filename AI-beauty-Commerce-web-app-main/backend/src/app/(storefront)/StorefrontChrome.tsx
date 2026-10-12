'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useViewport } from '@/storefront/context/ViewportContext';
import { DesktopNav } from '@/storefront/components/common/DesktopNav';
import { Header } from '@/storefront/components/common/Header';
import { BottomNav } from '@/storefront/components/common/BottomNav';
import { AIFloatingButton } from '@/storefront/components/common/AIFloatingButton';
import { LocationSelector } from '@/storefront/components/common/LocationSelector';
import { AddToCartSheet } from '@/storefront/components/sheets/AddToCartSheet';
import { FilterSortSheet } from '@/storefront/components/sheets/FilterSortSheet';
import { AIAssistantDrawer } from '@/storefront/components/sheets/AIAssistantDrawer';
import { CommunityChatDrawer } from '@/storefront/components/community/CommunityChatDrawer';
import { InitialBrandLoader } from '@/storefront/components/common/InitialBrandLoader';
import { OfflineStatusBanner } from '@/storefront/components/common/OfflineStatusBanner';
import { useApp } from '@/storefront/context/AppContext';
import { ProductQuickModal } from '@/storefront/components/common/ProductQuickModal';
import {
  shouldShowStorefrontNav,
  shouldShowBottomNav,
  shouldShowStorefrontOverlays,
} from '@/lib/screen-routes';

/**
 * Pixel-preserving port of Vite `App` shell.
 * Same components, same order, same Tailwind classes.
 * Only change: visibility is driven by URL pathname instead of `currentScreen`.
 */
export default function StorefrontChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const { isDesktop } = useViewport();
  const {
    quickModalProduct,
    closeQuickModal,
    livePayment,
    dismissLivePayment,
    isLiveBackend,
    navigateTo,
    authUser,
  } = useApp();

  const showNav = shouldShowStorefrontNav(pathname);
  const showBottom = shouldShowBottomNav(pathname, isDesktop);
  const showOverlays = shouldShowStorefrontOverlays(pathname);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F0F10] relative font-body flex flex-col selection:bg-[#D4AF37]/20 selection:text-[#997A2E] overflow-x-clip">
      <OfflineStatusBanner />
      <InitialBrandLoader />
      {isDesktop && showNav && <DesktopNav />}
      {!isDesktop && showNav && <Header />}
      <main className="flex-1 w-full relative">{children}</main>
      {showBottom && <BottomNav />}
      {showOverlays && <AIFloatingButton />}
      {showOverlays && (
        <>
          <ProductQuickModal
            product={quickModalProduct}
            isOpen={!!quickModalProduct}
            onClose={closeQuickModal}
          />
          <AddToCartSheet />
          <FilterSortSheet />
          <AIAssistantDrawer />
          <CommunityChatDrawer />
          <LocationSelector />
        </>
      )}

      {/* Quick Launch Admin Portal Floating Pill */}
      {!pathname.startsWith('/admin') && authUser?.roles.some(role => ['STAFF', 'ADMIN', 'SUPER_ADMIN'].includes(role)) && (
        <button
          onClick={() => navigateTo('admin-console')}
          title="Open Admin Operations Console"
          className="fixed bottom-6 left-6 z-40 px-4 py-2 rounded-full bg-[#0F0F10] text-[#D4AF37] border border-[#D4AF37]/40 shadow-xl text-xs font-heading font-bold hover:bg-black active:scale-95 transition-all cursor-pointer backdrop-blur-md"
        >
          <span>Admin Portal</span>
        </button>
      )}

      {/* Live payment return states (owned backend only; demo flow untouched) */}
      {isLiveBackend && (livePayment.status === 'verifying' || livePayment.status === 'redirecting') && (
        <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur flex flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#E5E7EB] border-t-[#D4AF37] animate-spin" aria-label="Loading" />
          <p className="text-sm font-semibold text-[#0F0F10]">{livePayment.message || 'Confirming…'}</p>
          <p className="text-xs text-[#6B7280]">Do not close this page.</p>
        </div>
      )}
      {isLiveBackend && livePayment.status === 'error' && (
        <div className="fixed inset-x-4 bottom-24 z-[100] rounded-2xl bg-[#0F0F10] text-white p-4 shadow-float flex items-start gap-3">
          <p className="flex-1 text-xs leading-relaxed">{livePayment.message}</p>
          <button
            onClick={dismissLivePayment}
            className="shrink-0 px-4 py-2 rounded-full bg-[#D4AF37] text-[#0F0F10] text-xs font-bold active:scale-95 transition-all cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
