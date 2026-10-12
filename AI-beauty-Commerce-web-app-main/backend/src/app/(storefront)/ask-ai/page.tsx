'use client';

import dynamic from 'next/dynamic';

const ScreenAskAI = dynamic(
  () => import('@/storefront/screens/ai/ScreenAskAI').then((m) => m.ScreenAskAI),
  { ssr: false },
);

export default function AskAiPage() {
  return <ScreenAskAI />;
}
