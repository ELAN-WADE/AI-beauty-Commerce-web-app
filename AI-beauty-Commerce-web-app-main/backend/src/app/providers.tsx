'use client';

import React from 'react';
import { ViewportProvider } from '@/storefront/context/ViewportContext';
import { AppProvider } from '@/storefront/context/AppContext';
import { initErrorReporting } from '@/storefront/lib/observe';
import type { Product } from '@/storefront/types';

/**
 * Client providers — identical tree to Vite `src/main.tsx`. No UI change.
 * `initialCatalogue` is the ISR server seed (Phase 3): present at first
 * render on both server and client, so SSR HTML and hydration match exactly.
 */
export default function Providers({
  children,
  initialCatalogue,
}: {
  children: React.ReactNode;
  initialCatalogue?: Product[];
}) {
  React.useEffect(() => {
    initErrorReporting();
  }, []);
  return (
    <ViewportProvider>
      <AppProvider initialCatalogue={initialCatalogue}>{children}</AppProvider>
    </ViewportProvider>
  );
}
