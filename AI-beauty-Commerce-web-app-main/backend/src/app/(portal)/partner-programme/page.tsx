'use client';
import dynamic from 'next/dynamic';
const Programme = dynamic(() => import('@/storefront/components/partner/InfluencerProgramme').then(module => module.InfluencerProgramme), { ssr: false });
export default function PartnerProgrammePage() { return <Programme />; }
