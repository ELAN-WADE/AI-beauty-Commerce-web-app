'use client';

import dynamic from 'next/dynamic';

const Screen09Cart = dynamic(
  () => import('@/storefront/screens/checkout/Screen09Cart').then((m) => m.Screen09Cart),
  { ssr: false },
);

export default function CartPage() {
  return <Screen09Cart />;
}
