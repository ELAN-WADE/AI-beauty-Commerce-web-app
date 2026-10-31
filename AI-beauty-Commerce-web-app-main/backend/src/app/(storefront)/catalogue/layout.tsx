import type { Metadata } from 'next';
import { publicSiteOrigin } from '@/storefront/lib/site-seo';
export const metadata: Metadata = {
  title: 'Shop Skincare, Body Care & Fragrance | Desla',
  description: 'Explore Desla formulations, sizes, prices and availability. Shop skincare, body care and fragrance.',
  ...(publicSiteOrigin() ? { alternates: { canonical: publicSiteOrigin()! + '/catalogue' } } : {}),
};
export default function CatalogueLayout({ children }: { children: React.ReactNode }) { return children; }
