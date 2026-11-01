'use client';
import { PageRecovery } from '@/storefront/components/common/PageRecovery';
export default function ErrorPage({ reset }: { reset: () => void }) { return <PageRecovery reset={reset} />; }
