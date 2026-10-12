'use client';

import dynamic from 'next/dynamic';

const ScreenAuthSuite = dynamic(
  () => import('@/storefront/screens/account/ScreenAuthSuite').then((m) => m.ScreenAuthSuite),
  { ssr: false },
);

export default function VerifyEmailPage() {
  return <ScreenAuthSuite initialMode="verify-email" />;
}
