'use client';

import React from 'react';
import { useApp } from '@/storefront/context/AppContext';
import { Screen06Catalogue } from '@/storefront/screens/catalog/Screen06Catalogue';
import type { Product } from '@/storefront/types';

/** Phase 3: server-rendered catalogue grid, seeded context, unchanged screen. */
export default function CatalogueClient({ initialProducts }: { initialProducts: Product[] }) {
  const { seedCatalogue } = useApp();
  React.useEffect(() => {
    seedCatalogue(initialProducts);
  }, [initialProducts, seedCatalogue]);
  return <Screen06Catalogue />;
}
