'use client';

import dynamic from 'next/dynamic';

const Screen14AISkinScan = dynamic(
  () => import('@/storefront/screens/ai/Screen14AISkinScan').then((m) => m.Screen14AISkinScan),
  { ssr: false },
);

export default function AiSkinScanPage() {
  return <Screen14AISkinScan />;
}
