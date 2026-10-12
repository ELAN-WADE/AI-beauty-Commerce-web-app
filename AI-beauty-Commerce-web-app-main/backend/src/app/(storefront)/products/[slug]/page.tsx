import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCatalogSeed, getProductSeed, listProductSlugs } from '@/lib/server-catalog';
import ProductClient from './ProductClient';

/**
 * Phase 2 — product pages are ISR-static with full SEO/social metadata:
 * shareable `/products/golden-body-oil` URLs (impossible in the Vite SPA),
 * CDN-served shells, and a seeded buy box (no client waterfall).
 * Unknown slugs render on demand (`dynamicParams`) then cache.
 */
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await listProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

function absoluteBase(): string {
  return (process.env.APP_URL ?? '').replace(/\/+$/, '');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductSeed(slug);
  if (!product) return { title: 'Product | Desla!™' };
  const base = absoluteBase();
  const image = product.image
    ? base
      ? `${base}${product.image.startsWith('/') ? '' : '/'}${product.image}`
      : product.image
    : undefined;
  const price = `₦${product.price.toLocaleString('en-NG')}`;
  return {
    title: `${product.name} — ${price}`,
    description: (product.tagline || product.description || 'Desla!™ luxury beauty.').slice(0, 160),
    openGraph: {
      title: `${product.name} | Desla!™`,
      description: product.tagline || undefined,
      type: 'website',
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Desla!™`,
      description: product.tagline || undefined,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [seed, detail] = await Promise.all([getCatalogSeed(), getProductSeed(slug)]);
  // Keep the URL honest: unknown slugs 404 instead of rendering a wrong product.
  if (seed.length > 0 && !detail) notFound();
  const initialProducts =
    detail && !seed.some((p) => p.id === detail.id) ? [detail, ...seed] : seed;
  return <ProductClient slug={slug} initialProducts={initialProducts} />;
}
