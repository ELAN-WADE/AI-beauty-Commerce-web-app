import type { Metadata } from 'next';
import { publicSiteOrigin } from '@/storefront/lib/site-seo';
export const metadata: Metadata = {
  title: 'Beauty Collections | Desla',
  description: 'Browse Desla collections for skincare, body care, fragrance and everyday routines.',
  ...(publicSiteOrigin() ? { alternates: { canonical: publicSiteOrigin()! + '/categories' } } : {}),
};
export default function CategoriesLayout({ children }: { children: React.ReactNode }) { return children; }
