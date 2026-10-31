'use client';
import ClientApp from './ClientApp';
import type { StorefrontSeed } from '../../backend/src/lib/server-storefront';
import type { ScreenId, Product } from '../types';
export default function ClientEntry({ initialScreen, initialProduct, initialCatalogue, initialEditorial }: { initialScreen?: ScreenId; initialProduct?: Product; initialCatalogue?: Product[]; initialEditorial?: StorefrontSeed }) {
  return <ClientApp initialScreen={initialScreen} initialProduct={initialProduct} initialCatalogue={initialCatalogue} initialEditorial={initialEditorial} />;
}
