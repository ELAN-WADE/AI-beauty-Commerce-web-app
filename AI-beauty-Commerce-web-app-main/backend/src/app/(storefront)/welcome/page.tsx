'use client';

import dynamic from 'next/dynamic';

const Screen02Onboarding = dynamic(
  () => import('@/storefront/screens/catalog/Screen02Onboarding').then((m) => m.Screen02Onboarding),
  { ssr: false },
);

export default function WelcomePage() {
  return <Screen02Onboarding />;
}
