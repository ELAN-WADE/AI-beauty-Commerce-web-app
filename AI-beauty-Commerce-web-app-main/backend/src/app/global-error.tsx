'use client';
import { PageRecovery } from '@/storefront/components/common/PageRecovery';
export default function GlobalError({ reset }: { reset: () => void }) {
  return <html lang="en"><body style={{ margin: 0 }}><PageRecovery reset={reset} /></body></html>;
}
