import { publicSiteOrigin } from '@/storefront/lib/site-seo';
import type { Viewport } from 'next';
import './globals.css';
import Providers from './providers';
import { getCatalogSeed } from '@/lib/server-catalog';
import { getStorefrontSeed } from '@/lib/server-storefront';

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#ffffff' };

export const metadata = {
  metadataBase: publicSiteOrigin() ? new URL(publicSiteOrigin()!) : undefined,
  title: { default: 'Desla!™ Luxury Beauty', template: '%s | Desla!™' },
  description: 'Natural luxury skincare, body care, and fine fragrance.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

/**
 * Public catalogue data feeds server HTML and hydration. Identical layout/page
 * loads share request memoization; unavailable data produces an empty seed.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [initialCatalogue, initialEditorial] = await Promise.all([getCatalogSeed(), getStorefrontSeed()]);
  return (
    <html lang="en">
      <body>
        <Providers initialCatalogue={initialCatalogue} initialEditorial={initialEditorial}>{children}</Providers>
      </body>
    </html>
  );
}
