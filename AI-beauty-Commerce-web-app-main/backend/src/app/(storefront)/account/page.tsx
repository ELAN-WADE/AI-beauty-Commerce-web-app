'use client';

import dynamic from 'next/dynamic';

const Screen17Account = dynamic(
  () => import('@/storefront/screens/account/Screen17Account').then((m) => m.Screen17Account),
  { ssr: false },
);

export default function AccountPage() {
  return <Screen17Account />;
}
