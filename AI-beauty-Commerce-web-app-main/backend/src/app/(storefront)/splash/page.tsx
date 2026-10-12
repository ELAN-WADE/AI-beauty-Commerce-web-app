'use client';

import dynamic from 'next/dynamic';

const Screen01Splash = dynamic(
  () => import('@/storefront/screens/catalog/Screen01Splash').then((m) => m.Screen01Splash),
  { ssr: false },
);

export default function SplashPage() {
  return <Screen01Splash />;
}
