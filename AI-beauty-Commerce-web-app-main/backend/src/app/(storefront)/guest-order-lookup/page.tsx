'use client';

import dynamic from 'next/dynamic';

const ScreenGuestOrderLookup = dynamic(
  () => import('@/storefront/screens/orders/ScreenGuestOrderLookup').then((m) => m.ScreenGuestOrderLookup),
  { ssr: false },
);

export default function GuestOrderLookupPage() {
  return <ScreenGuestOrderLookup />;
}
