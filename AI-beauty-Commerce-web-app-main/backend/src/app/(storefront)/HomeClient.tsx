'use client';

import React from 'react';
import { useViewport } from '@/storefront/context/ViewportContext';
import { useApp } from '@/storefront/context/AppContext';
import { Screen03Home } from '@/storefront/screens/catalog/Screen03Home';
import { Screen18DesktopHome } from '@/storefront/screens/catalog/Screen18DesktopHome';
import type { Product } from '@/storefront/types';

/**
 * Phase 3: screens render on the server (no ssr:false) with ISR-seeded
 * context — real grids in HTML on first paint. Same viewport rule as App.tsx.
 */
export default function HomeClient({ initialProducts }: { initialProducts: Product[] }) {
  const { isDesktop } = useViewport();
  const { seedCatalogue } = useApp();
  React.useEffect(() => {
    seedCatalogue(initialProducts);
  }, [initialProducts, seedCatalogue]);
  return isDesktop ? <Screen18DesktopHome /> : <Screen03Home />;
}
