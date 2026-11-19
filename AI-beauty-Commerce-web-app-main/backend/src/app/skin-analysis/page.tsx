import type { Metadata } from 'next';
import SkinAnalysisIntroduction from '@/storefront/components/ai/SkinAnalysisIntroduction';

export const metadata: Metadata = {
  title: 'AI Skin Scan | Desla!',
  description: 'Explore visible skin appearance with a photo and get a gentle care routine from Desla’s AI skin assistant.',
};

export default function SkinAnalysisPage() {
  return <SkinAnalysisIntroduction />;
}
