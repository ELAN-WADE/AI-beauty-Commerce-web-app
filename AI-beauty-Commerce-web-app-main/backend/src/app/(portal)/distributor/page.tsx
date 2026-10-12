'use client';

import dynamic from 'next/dynamic';
import { RequireRole } from '@/storefront/components/auth/RequireRole';

const ScreenDistributorPortal = dynamic(
  () =>
    import('@/storefront/screens/partners/ScreenDistributorPortal').then(
      (m) => m.ScreenDistributorPortal,
    ),
  { ssr: false },
);

export default function DistributorPage() {
  return (
    <RequireRole
      allowedRoles={['DISTRIBUTOR', 'STAFF', 'ADMIN', 'SUPER_ADMIN']}
      title="Distributor City Hub"
      description="Manage your regional city hub inventory, customer order pickups, and restock requests."
    >
      <ScreenDistributorPortal />
    </RequireRole>
  );
}
