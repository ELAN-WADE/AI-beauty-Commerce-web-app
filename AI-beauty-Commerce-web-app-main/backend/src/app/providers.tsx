'use client';

import React from 'react';
import { MotionConfig } from 'motion/react';
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
      </ViewportProvider>
    </MotionConfig>
  );
}
