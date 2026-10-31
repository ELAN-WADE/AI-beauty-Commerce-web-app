import { notFound } from 'next/navigation';
import { adminEntryPath } from '@/modules/auth/admin-policy';
import AdminPage from '../(admin)/admin/page';
export const metadata = { robots: { index: false, follow: false } };
export default async function PrivateOperations({ params }: { params: Promise<{ operations: string[] }> }) {
  const path = '/' + (await params).operations.join('/');
  if (!adminEntryPath() || path !== adminEntryPath()) notFound();
  return <main className="min-h-screen"><AdminPage /></main>;
}
