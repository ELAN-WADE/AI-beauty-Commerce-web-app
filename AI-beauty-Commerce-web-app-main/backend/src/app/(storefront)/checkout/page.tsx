'use client';

import dynamic from 'next/dynamic';

const Screen10Checkout = dynamic(
  () => import('@/storefront/screens/checkout/Screen10Checkout').then((m) => m.Screen10Checkout),
  { ssr: false },
);

export default function CheckoutPage() {
  return <Screen10Checkout />;
}
