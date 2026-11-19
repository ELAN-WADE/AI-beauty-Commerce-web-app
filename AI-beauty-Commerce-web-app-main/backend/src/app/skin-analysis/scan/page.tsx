import type { Metadata } from 'next';
import SkinAnalysisExperience from '@/storefront/components/ai/SkinAnalysisExperience';

export const metadata: Metadata = {
  title: 'Try your skin scan | Desla!',
  description: 'Capture or upload a photo for a personal AI cosmetic skin review.',
};

export default function SkinScanPage() {
  return <SkinAnalysisExperience />;
}
