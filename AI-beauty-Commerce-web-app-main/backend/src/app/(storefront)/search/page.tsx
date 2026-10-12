'use client';

import dynamic from 'next/dynamic';

const Screen04Search = dynamic(
  () => import('@/storefront/screens/catalog/Screen04Search').then((m) => m.Screen04Search),
  { ssr: false },
);

export default function SearchPage() {
  return <Screen04Search />;
}
