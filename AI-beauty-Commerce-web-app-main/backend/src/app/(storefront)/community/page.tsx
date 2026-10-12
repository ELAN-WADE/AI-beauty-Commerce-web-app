'use client';

import dynamic from 'next/dynamic';

const ScreenCommunityChat = dynamic(
  () => import('@/storefront/screens/community/ScreenCommunityChat').then((m) => m.ScreenCommunityChat),
  { ssr: false },
);

export default function CommunityPage() {
  return <ScreenCommunityChat />;
}
