'use client';

import dynamic from 'next/dynamic';

const Screen12OrderConfirmed = dynamic(
  () => import('@/storefront/screens/checkout/Screen12OrderConfirmed').then((m) => m.Screen12OrderConfirmed),
  { ssr: false },
);

export default function OrderConfirmedPage() {
  return <Screen12OrderConfirmed />;
}
