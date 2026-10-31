import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ClientEntry from '../../ClientEntry';
import { getPublicProduct, getPublicCatalogue } from '../../../lib/server-public-catalog';
import { absoluteAsset, publicSiteOrigin, productStructuredData, safeJsonLd } from '../../../lib/site-seo';
export const revalidate = 60;
export async function generateStaticParams() {
  return ((await getPublicCatalogue()) || []).slice(0, 100).map(product => ({ slug: product.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await getPublicProduct((await params).slug);
  if (!product) return { title: 'Product not found', robots: { index: false } };
  const origin = publicSiteOrigin(), image = absoluteAsset(product.image, origin);
  return { title: product.name + ' | Desla', description: (product.tagline || product.description).slice(0, 160), ...(origin ? { alternates: { canonical: origin + '/products/' + product.id } } : {}), openGraph: { title: product.name, ...(image ? { images: [image] } : {}) } };
}
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getPublicProduct((await params).slug); if (!product) notFound();
  const schema = productStructuredData(product, publicSiteOrigin());
  return <>{schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />}<ClientEntry initialScreen="product-details" initialProduct={product} /></>;
}
