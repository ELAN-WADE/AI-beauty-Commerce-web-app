import { publicSiteOrigin } from '../lib/site-seo';
import type { Metadata, Viewport } from 'next';
import React from 'react';
import '../index.css';

export const metadata: Metadata = {
  metadataBase: publicSiteOrigin() ? new URL(publicSiteOrigin()!) : undefined,
  title: 'Desla!™ — Haute Dermatologie, Natural Beauty & Lifestyle',
  description: 'Desla!™ Unisex cosmetics, body care, haute parfumerie and lifestyle. Health before beauty. Intention before trend.',
  openGraph: {
    type: 'website',
    siteName: 'Desla!™',
    title: 'Desla!™ — Haute Dermatologie, Natural Beauty & Lifestyle',
    description: 'Safe-conscious unisex natural skincare, body care and haute parfumerie, made in Lagos and delivered across Nigeria.',
  },
  twitter: {
    card: 'summary',
    title: 'Desla!™ — Haute Dermatologie, Natural Beauty & Lifestyle',
    description: 'Safe-conscious unisex natural skincare, body care and haute parfumerie, made in Lagos and delivered across Nigeria.',
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0F0F10' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300..800;1,14..32,300..800&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="bg-[#FFFFFF] text-[#0F0F10] antialiased selection:bg-[#D4AF37]/20 selection:text-[#997A2E]">
        {children}
      </body>
    </html>
  );
}
