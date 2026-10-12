'use client';

import dynamic from 'next/dynamic';

const Screen13OrdersTracking = dynamic(
  () => import('@/storefront/screens/orders/Screen13OrdersTracking').then((m) => m.Screen13OrdersTracking),
  { ssr: false },
);

export default function OrdersPage() {
  return <Screen13OrdersTracking />;
}
