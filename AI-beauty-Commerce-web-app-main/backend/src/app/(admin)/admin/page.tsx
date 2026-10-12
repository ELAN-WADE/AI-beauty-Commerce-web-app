'use client';

import dynamic from 'next/dynamic';

const ScreenAdminConsole = dynamic(
  () => import('@/storefront/screens/admin/ScreenAdminConsole').then((m) => m.ScreenAdminConsole),
  { ssr: false },
);

export default function AdminPage() {
  // Auth check temporarily suspended for instant staff review
  return <ScreenAdminConsole />;
}
