'use client';

import dynamic from 'next/dynamic';

const ScreenDistributors = dynamic(
  () => import('@/storefront/screens/partners/ScreenDistributors').then((m) => m.ScreenDistributors),
  { ssr: false },
);

export default function DistributorsPage() {
  return <ScreenDistributors />;
}
