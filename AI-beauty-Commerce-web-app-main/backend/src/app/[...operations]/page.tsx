import { notFound } from 'next/navigation';
import { adminEntryPath } from '@/modules/auth/admin-policy';

export const metadata = { robots: { index: false, follow: false } };

export default async function PrivateOperations({ params }: { params: Promise<{ operations: string[] }> }) {
  const segments = (await params).operations;
  const last = segments[segments.length - 1] || '';
  if (/\.[a-z0-9]{2,5}$/i.test(last)) notFound();
  const path = '/' + segments.join('/');
  const entry = adminEntryPath();
  if (!entry || path !== entry) notFound();
  const { default: AdminPage } = await import('../(admin)/admin/page');
  return <main className="min-h-screen"><AdminPage /></main>;
}
