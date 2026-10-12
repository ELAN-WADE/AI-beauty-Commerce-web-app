'use client';

import dynamic from 'next/dynamic';
import { RequireRole } from '@/storefront/components/auth/RequireRole';

const ScreenCreators = dynamic(
  () => import('@/storefront/screens/partners/ScreenCreators').then((m) => m.ScreenCreators),
  { ssr: false },
);

export default function CreatorsPage() {
  return (
    <RequireRole
      allowedRoles={['CREATOR', 'STAFF', 'ADMIN', 'SUPER_ADMIN']}
      title="Creator Affiliate Studio"
      description="Access your VIP commission ledger, promo code performance, and seasonal PR box dispatch tracking."
    >
      <ScreenCreators />
    </RequireRole>
  );
}
