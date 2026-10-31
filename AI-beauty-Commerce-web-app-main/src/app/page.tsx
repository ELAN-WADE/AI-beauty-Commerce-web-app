import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { privateSearchSurface, publicSiteOrigin } from '../lib/site-seo';
import ClientEntry from './ClientEntry';
import { getPublicCatalogue, getPublicEditorial } from '../lib/server-public-catalog';
import { SCREEN_PATHS } from '../../backend/src/lib/screen-routes';
import type { ScreenId } from '../types';
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ screen?: string }> }): Promise<Metadata> {
  const screen = (await searchParams).screen;
  if ((await headers()).get('x-desla-private-admin') === '1' || privateSearchSurface('/', screen)) return { robots: { index: false, follow: false } };
  const origin = publicSiteOrigin();
  const pages: Record<string, { title: string; description: string }> = {
    catalogue: { title: 'Shop Skincare, Body Care & Fragrance | Desla', description: 'Explore Desla formulations, sizes, prices and availability. Shop skincare, body care and fragrance.' },
    categories: { title: 'Beauty Collections | Desla', description: 'Browse Desla collections for skincare, body care, fragrance and everyday routines.' },
    distributors: { title: 'Find a Desla Distributor', description: 'Find approved Desla distributors and check local delivery and pickup availability.' },
  };
  return { ...(screen && pages[screen] ? pages[screen] : {}), ...(origin ? { alternates: { canonical: origin + (screen && pages[screen] ? '/?screen=' + screen : '/') } } : {}) };
}
export default async function HomePage({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  const privateAdmin = (await headers()).get('x-desla-private-admin') === '1';
  const requested = (await searchParams).screen;
  const initialScreen = privateAdmin ? 'admin-console' : requested && requested !== 'admin-console' && Object.hasOwn(SCREEN_PATHS, requested) ? requested as ScreenId : 'home';
  const publicSurface = ['home', 'desktop-home', 'catalogue', 'categories', 'search', 'product-details'].includes(initialScreen);
  const [catalogue, editorial] = publicSurface ? await Promise.all([getPublicCatalogue(), getPublicEditorial()]) : [];
  return <ClientEntry initialScreen={initialScreen} initialCatalogue={catalogue} initialEditorial={editorial} />;
}
