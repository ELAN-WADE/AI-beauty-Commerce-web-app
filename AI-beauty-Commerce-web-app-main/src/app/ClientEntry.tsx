'use client';
import ClientApp from './ClientApp';
import dynamic from 'next/dynamic';
import type { StorefrontSeed } from '../../backend/src/storefront/lib/storefront-seed';
import type { ScreenId, Product } from '../types';
const PrivateClientApp = dynamic(() => import('./ClientApp'), { ssr: false });
export default function ClientEntry({ initialScreen, initialProduct, initialCatalogue, initialEditorial }: { initialScreen?: ScreenId; initialProduct?: Product; initialCatalogue?: Product[]; initialEditorial?: StorefrontSeed }) {
  const View = ['home', 'desktop-home', 'catalogue', 'categories', 'search', 'product-details'].includes(initialScreen || 'home') ? ClientApp : PrivateClientApp;
  return <View initialScreen={initialScreen} initialProduct={initialProduct} initialCatalogue={initialCatalogue} initialEditorial={initialEditorial} />;
}
