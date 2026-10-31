'use client';

import dynamic from 'next/dynamic';
import { RequireRole } from '@/storefront/components/auth/RequireRole';

const ScreenAdminConsole = dynamic(
  () => import('@/storefront/screens/admin/ScreenAdminConsole').then((m) => m.ScreenAdminConsole),
  { ssr: false },
);

export default function AdminPage() {
  return <RequireRole allowedRoles={['ADMIN', 'STAFF', 'SUPER_ADMIN', 'INVENTORY_MANAGER', 'SUPPORT']} title="Admin operations"><ScreenAdminConsole /></RequireRole>;
}
