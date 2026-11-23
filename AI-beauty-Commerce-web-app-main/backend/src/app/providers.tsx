'use client';

import React from 'react';
import { MotionConfig } from 'motion/react';
import { Toaster } from 'sonner';
import { ViewportProvider } from '@/storefront/context/ViewportContext';
import { AppProvider } from '@/storefront/context/AppContext';
import { initErrorReporting } from '@/storefront/lib/observe';
import type { Product } from '@/storefront/types';
import type { StorefrontSeed } from '@/lib/server-storefront';

/**
 * Client providers — wraps storefront in MotionConfig (reducedMotion="user")
 * with Emil Kowalski's restrained ease-out defaults so every transition respects
 * accessibility preferences automatically.
 */
export default function Providers({
  children,
  initialCatalogue,
  initialEditorial,
}: {
  children: React.ReactNode;
  initialCatalogue?: Product[];
  initialEditorial?: StorefrontSeed;
}) {
  React.useEffect(() => {
    initErrorReporting();
  }, []);
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
    >
      <ViewportProvider>
        <AppProvider initialCatalogue={initialCatalogue} initialEditorial={initialEditorial}>{children}</AppProvider>
        <Toaster
          position="bottom-center"
          offset={78}
          mobileOffset={76}
          gap={8}
          visibleToasts={3}
          toastOptions={{
            duration: 3200,
            classNames: {
              toast:
                'bg-[#111111] text-[#FBF9F5] border border-[#D4AF37]/30 rounded-2xl shadow-[0_14px_36px_-10px_rgba(15,15,16,0.35)] px-4 py-3 font-body text-xs',
              title: 'font-medium text-[#FBF9F5] text-xs',
              description: 'text-[#C8C3B8] text-[11px]',
              actionButton:
                'bg-[#D4AF37] text-[#111111] font-semibold text-[11px] rounded-full px-3 py-1.5 hover:bg-[#E6C77A] transition-colors',
              cancelButton:
                'bg-white/10 text-[#FBF9F5] font-medium text-[11px] rounded-full px-3 py-1.5',
            },
          }}
        />
      </ViewportProvider>
    </MotionConfig>
  );
}
