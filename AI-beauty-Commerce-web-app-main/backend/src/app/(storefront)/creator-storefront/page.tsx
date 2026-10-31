'use client';
import dynamic from 'next/dynamic';
const CreatorStorefront = dynamic(() => import('@/storefront/screens/partners/ScreenCreatorStorefront').then(m => m.ScreenCreatorStorefront), { ssr: false });
export default function Page() { return <CreatorStorefront />; }
