'use client';
import dynamic from 'next/dynamic';
import type { ScreenId, Product } from '../types';
const ClientApp = dynamic(() => import('./ClientApp'), { ssr: false });
export default function ClientEntry({ initialScreen, initialProduct }: { initialScreen?: ScreenId; initialProduct?: Product }) {
  return <ClientApp initialScreen={initialScreen} initialProduct={initialProduct} />;
}
