'use client';
import { PageRecovery } from '../../backend/src/storefront/components/common/PageRecovery';
export default function ErrorPage({ reset }: { reset: () => void }) { return <PageRecovery reset={reset} />; }
