import type { Metadata } from 'next';
import { getCatalogSeed } from '@/lib/server-catalog';
import CatalogueClient from './CatalogueClient';

/**
 * Phase 2 — catalogue is ISR-static (CDN-served HTML shell + seeded RSC data).
 * `revalidate` is the safety net; admin stock/product writes revalidate
 * on demand via `revalidateStorefront()` for instant freshness.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Shop All Skincare & Beauty',
  description:
    'Browse Desla!™ luxury skincare, bodycare and fragrance — bestsellers, new arrivals and flash sales, stocked across Nigerian city hubs.',
  openGraph: {
    title: 'Shop All | Desla!™',
    description: 'Luxury Nigerian beauty — skincare, bodycare, fragrance.',
    type: 'website',
  },
};

export default async function CataloguePage() {
  const seed = await getCatalogSeed();
  return <CatalogueClient initialProducts={seed} />;
}
