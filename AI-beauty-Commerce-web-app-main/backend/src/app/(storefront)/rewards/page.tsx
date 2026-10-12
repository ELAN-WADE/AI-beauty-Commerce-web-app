'use client';

import dynamic from 'next/dynamic';

const Screen16Rewards = dynamic(
  () => import('@/storefront/screens/account/Screen16Rewards').then((m) => m.Screen16Rewards),
  { ssr: false },
);

export default function RewardsPage() {
  return <Screen16Rewards />;
}
