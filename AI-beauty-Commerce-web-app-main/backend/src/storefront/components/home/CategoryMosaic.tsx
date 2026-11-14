'use client';

import React, { useMemo } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import { ElasticReel, type ElasticReelItem } from '../ui/ElasticReel';

interface CategoryMosaicProps {
  onSelectCategory: (category: string) => void;
  onViewAll: () => void;
}

const CURATED_COLLECTIONS: Array<{
  id: string;
  title: string;
  category: string;
  image: string;
  tag: string;
  description: string;
}> = [
  {
    id: 'barrier-repair',
    title: 'Barrier Precision',
    category: 'skincare',
    image: '/product_barrier_cream.jpg',
    tag: 'Cellular Lipids',
    description:
      'Physiological ceramides and bio-identical fatty acids engineered to prevent transepidermal water loss.',
  },
  {
    id: 'botanical-cleansers',
    title: 'Botanical Cleansers',
    category: 'skincare',
    image: '/product_cleanser.jpg',
    tag: 'pH-Balanced',
    description:
      'Micro-emulsion purifying washes calibrated to preserve natural lipid barriers without stripping.',
  },
  {
    id: 'sun-defense',
    title: 'Sheer Sun Defense',
    category: 'skincare',
    image: '/product_sunscreen.jpg',
    tag: 'Zero White Cast',
    description:
      'Broad-spectrum SPF filters developed seamlessly for melanin-rich complexions in humid climates.',
  },
  {
    id: 'body-butters',
    title: 'Whipped Body Care',
    category: 'body-care',
    image: '/carousel/photo_6_butter.jpg',
    tag: 'Sovereign Moisture',
    description:
      'Cold-pressed unrefined West African shea blended with marula and squalane for lasting suppleness.',
  },
  {
    id: 'fine-fragrance',
    title: 'Fine Fragrance',
    category: 'fragrance',
    image: '/carousel/photo_3_apothecary.jpg',
    tag: 'Apothecary Extrait',
    description:
      'Botanical oud, smoked vanilla, and warm amber extraits macerated in small artisanal batches.',
  },
  {
    id: 'velvet-lip-oils',
    title: 'Lip & Cheek Rituals',
    category: 'makeup',
    image: '/carousel/photo_4_cleanser.jpg',
    tag: 'Mineral Tints',
    description:
      'Conditioning peptide lip oils and skin-first mineral tints designed for luminous everyday wear.',
  },
  {
    id: 'night-recovery',
    title: 'Daily Apothecary',
    category: 'skincare',
    image: '/carousel/photo_7_application.jpg',
    tag: 'AM / PM Regimen',
    description:
      'Targeted botanical serums and recovery emulsions layered for balanced barrier renewal.',
  },
];

export const CategoryMosaic: React.FC<CategoryMosaicProps> = ({
  onSelectCategory,
  onViewAll,
}) => {
  const { categories, products } = useApp();

  const collectionItems: ElasticReelItem[] = useMemo(() => {
    const availableSlugs = new Set<string>();
    for (const c of categories) {
      if (c.slug) availableSlugs.add(c.slug.toLowerCase());
      if (c.name) availableSlugs.add(c.name.toLowerCase());
    }
    for (const p of products) {
      if (p.category) availableSlugs.add(p.category.toLowerCase());
    }

    return CURATED_COLLECTIONS.map((entry) => {
      const matchedCat = categories.find(
        (c) =>
          c.slug?.toLowerCase() === entry.category.toLowerCase() ||
          c.name?.toLowerCase() === entry.category.toLowerCase()
      );
      const targetCategory = matchedCat?.slug || matchedCat?.name || entry.category;
      const productImage = products.find(
        (p) => p.category?.toLowerCase() === entry.category.toLowerCase() && p.image
      )?.image;

      return {
        id: entry.id,
        src: entry.image || productImage || '/cat_skincare.jpg',
        title: entry.title,
        caption: entry.description,
        tag: entry.tag,
        category: targetCategory,
        onClick: () => onSelectCategory(targetCategory),
      };
    });
  }, [categories, onSelectCategory, products]);

  return (
    <section
      aria-label="Curated Collections"
      className="py-12 sm:py-16 bg-[#FAF9F6] border-b border-[#E5E7EB]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-3">
          <div className="max-w-xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#997A2E] font-semibold">
              Curated Collections
            </p>
            <h2 className="font-heading font-semibold text-xl sm:text-2xl text-[#0F0F10] tracking-tight mt-1">
              Explore by Botanical Discipline
            </h2>
          </div>

          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F0F10] hover:text-[#997A2E] transition-colors cursor-pointer group self-start sm:self-auto"
          >
            <span>All Categories</span>
            <ArrowRight
              size={13}
              weight="bold"
              className="group-hover:translate-x-0.5 transition-transform"
              aria-hidden="true"
            />
          </button>
        </div>

        <ElasticReel
          items={collectionItems}
          barWidth={59}
          barHeight={0.27}
          gap={10}
          radius={12}
          magnify={2.4}
          lift={1.15}
          elasticity={0.35}
          align="center"
          autoplay="sweep"
          speed={1.4}
          draggable
          pauseOnHover
          wheel={false}
          captions
          labels
          onItemClick={(item) => {
            if (item.category) onSelectCategory(item.category);
          }}
        />
      </div>
    </section>
  );
};
