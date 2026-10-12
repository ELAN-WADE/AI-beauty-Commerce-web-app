'use client';

import dynamic from 'next/dynamic';

const Screen11Payment = dynamic(
  () => import('@/storefront/screens/checkout/Screen11Payment').then((m) => m.Screen11Payment),
  { ssr: false },
);

export default function PaymentPage() {
  return <Screen11Payment />;
}
