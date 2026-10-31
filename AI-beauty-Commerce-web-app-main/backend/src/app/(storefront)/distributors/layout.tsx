import type { Metadata } from 'next';
import { publicSiteOrigin } from '@/storefront/lib/site-seo';
export const metadata: Metadata = {
  title: 'Find a Desla Distributor',
  description: 'Find approved Desla distributors and check local delivery and pickup availability.',
  ...(publicSiteOrigin() ? { alternates: { canonical: publicSiteOrigin()! + '/distributors' } } : {}),
};
export default function DistributorsLayout({ children }: { children: React.ReactNode }) { return children; }
