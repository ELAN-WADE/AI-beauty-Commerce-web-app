'use client';

import React from 'react';
import { useApp } from '@/storefront/context/AppContext';
import { Screen07ProductDetails } from '@/storefront/screens/catalog/Screen07ProductDetails';
import type { Product } from '@/storefront/types';

function matchSlug(items: Product[], slug: string): Product | undefined {
  const key = decodeURIComponent(slug).toLowerCase();
  if (!key) return undefined;
  return (
    items.find((p) => p.id.toLowerCase() === key) ??
    items.find((p) => p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === key)
  );
}

/**
 * Phase 3: the URL slug resolves against the ISR seed during render (server
 * and hydration agree), so the correct formulation server-renders with full
 * metadata — no "Product Not Found" flash. Context still syncs post-mount.
 */
export default function ProductClient({
  slug,
  initialProducts,
}: {
  slug: string;
  initialProducts: Product[];
}) {
  const { products, selectedProduct, setSelectedProduct, seedCatalogue } = useApp();

  React.useEffect(() => {
    seedCatalogue(initialProducts);
  }, [initialProducts, seedCatalogue]);

  React.useEffect(() => {
    const match = matchSlug(products, slug);
    if (match && (!selectedProduct || selectedProduct.id !== match.id)) setSelectedProduct(match);
  }, [slug, products, selectedProduct, setSelectedProduct]);

  return <Screen07ProductDetails initialProduct={matchSlug(initialProducts, slug)} />;
}
