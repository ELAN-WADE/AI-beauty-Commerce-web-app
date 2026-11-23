import localFont from 'next/font/local';
import { publicSiteOrigin } from '@/storefront/lib/site-seo';
import type { Viewport } from 'next';
import './globals.css';
import Providers from './providers';
import { getCatalogSeed } from '@/lib/server-catalog';
import { getStorefrontSeed } from '@/lib/server-storefront';

const manrope = localFont({
  src: './fonts/manrope-latin-wght-normal.woff2',
  weight: '400 700',
  style: 'normal',
  variable: '--font-manrope',
  display: 'swap',
  fallback: ['Segoe UI', 'Inter', 'system-ui', 'sans-serif'],
});

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#ffffff' };

export const metadata = {
  metadataBase: publicSiteOrigin() ? new URL(publicSiteOrigin()!) : undefined,
  title: { default: 'Desla Beauty — Luxury Apothecary & Skincare', template: '%s | Desla Beauty' },
  description: 'Skin-first natural skincare, body rituals, and fine fragrance by Desla Beauty.',
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
    <html lang="en" className={manrope.variable}>
      <body>
        <Providers initialCatalogue={initialCatalogue} initialEditorial={initialEditorial}>{children}</Providers>
      </body>
    </html>
  );
}
