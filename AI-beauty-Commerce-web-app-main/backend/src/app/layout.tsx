import './globals.css';
import Providers from './providers';
import { getCatalogSeed } from '@/lib/server-catalog';

export const metadata = {
  title: { default: 'Desla!™ Luxury Beauty', template: '%s | Desla!™' },
  description: 'Luxury Nigerian beauty commerce — skincare, bodycare, fragrance.',
};

/**
 * Phase 3: one indexed catalogue query per layout render feeds every page's
 * first paint (server HTML + hydration share it). Empty without a DB —
 * the client falls back to mocks exactly as before.
 */
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialCatalogue = await getCatalogSeed();
  return (
    <html lang="en">
      <body>
        <Providers initialCatalogue={initialCatalogue}>{children}</Providers>
      </body>
    </html>
  );
}
