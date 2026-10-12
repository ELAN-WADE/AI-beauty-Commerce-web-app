import type { Metadata } from 'next';
import { getCatalogSeed } from '@/lib/server-catalog';
import HomeClient from './HomeClient';

/** Phase 2 — editorial home is ISR-static; seeded so hero grids paint instantly. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Desla!™ Luxury Beauty — Health Before Beauty',
  description:
    'Desla!™ luxury Nigerian skincare, bodycare and fragrance. AI skin scan, creator picks, city-hub pickup and delivery.',
  openGraph: {
    title: 'Desla!™ Luxury Beauty',
    description: 'Health Before Beauty • Intention Before Trend.',
    type: 'website',
  },
};

export default async function HomePage() {
  const seed = await getCatalogSeed();
  return <HomeClient initialProducts={seed} />;
}
