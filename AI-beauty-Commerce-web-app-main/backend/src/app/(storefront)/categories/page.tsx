'use client';

import dynamic from 'next/dynamic';

const Screen05Categories = dynamic(
  () => import('@/storefront/screens/catalog/Screen05Categories').then((m) => m.Screen05Categories),
  { ssr: false },
);

export default function CategoriesPage() {
  return <Screen05Categories />;
}
