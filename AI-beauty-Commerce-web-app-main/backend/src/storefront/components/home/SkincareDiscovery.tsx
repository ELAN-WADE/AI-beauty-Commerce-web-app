import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../common/ProductCard';
import { ProductComparison } from './ProductComparison';
import { DESLA_EASE_OUT } from '../motion/DeslaMotion';

const concerns = [
  { label: 'Dryness', match: /moisturi|ceramide|barrier|shea|hydrati|butter|lotion|wash|cleanser/i },
  { label: 'Oil & blemishes', match: /cleanser|niacinamide|salicylic|toner|wash|serum|barrier/i },
  { label: 'Dullness', match: /vitamin|radiance|glow|serum|oil|lip|butter|elixir/i },
  { label: 'Sun protection', match: /sunscreen|spf|shield|barrier|moisturi|lotion/i },
];

export function SkincareDiscovery() {
  const { products, navigateTo } = useApp();
  const [selected, setSelected] = useState(0);
  const [hasSwitched, setHasSwitched] = useState(false);
  const prefersReduced = useReducedMotion();

  const selectConcern = (index: number) => {
    setHasSwitched(true);
    setSelected(index);
  };

  const inStockProducts = products.filter((p) => p.inStock);
  const matched = inStockProducts.filter((p) =>
    concerns[selected].match.test(`${p.name} ${p.subCategory} ${p.category} ${p.description || ''}`)
  );
  // Display up to 5 real in-stock formulas (completing the 5-card row with top in-stock formulas when fewer than 5 match directly)
  const matches = [
    ...matched,
    ...inStockProducts.filter((p) => !matched.some((m) => m.id === p.id)),
  ].slice(0, 5);

  return (
    <section className="border-b border-[#EAE5DC] bg-white px-4 py-12 sm:py-16" aria-label="Shop by skin concern">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#997A2E]">Care that fits your routine</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-heading font-semibold text-2xl sm:text-3xl text-[#111111]">
              What would you like to care for?
            </h2>
            <p className="mt-2 max-w-xl text-sm font-normal text-[#6E6A63]">
              Explore available formulas by concern, then check each product’s ingredients and directions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('ai-scan')}
            className="min-h-11 text-sm font-medium underline underline-offset-4 text-[#111111] hover:text-[#997A2E] transition-colors cursor-pointer"
          >
            Help me choose
          </button>
        </div>

        {/* Minimalist Sliding Underline Switch (No background pill, no dot) */}
        <div
          role="tablist"
          aria-label="Skin concerns"
          className="my-6 flex items-center gap-6 sm:gap-8 border-b border-[#EAE5DC] overflow-x-auto no-scrollbar"
        >
          {concerns.map((c, i) => {
            const active = selected === i;
            return (
              <button
                key={c.label}
                type="button"
                role="tab"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={() => selectConcern(i)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    selectConcern((i + 1) % concerns.length);
                  } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    selectConcern((i - 1 + concerns.length) % concerns.length);
                  }
                }}
                className={`relative pb-3 pt-1 whitespace-nowrap text-sm font-medium transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89248] focus-visible:ring-offset-2 rounded-sm ${
                  active ? 'text-[#111111]' : 'text-[#767168] hover:text-[#111111]'
                }`}
              >
                <span>{c.label}</span>
                {active && (
                  <motion.span
                    layoutId="concern-active-underline"
                    transition={
                      prefersReduced
                        ? { duration: 0 }
                        : { duration: 0.26, ease: DESLA_EASE_OUT }
                    }
                    className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#111111] rounded-full"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div aria-live="polite">
          <p className="mb-4 text-xs font-normal text-[#6E6A63]">
            {matches.length
              ? `Explore ${matches.length} available ${matches.length === 1 ? 'formula' : 'formulas'}`
              : 'No matching formulas available right now. Browse the catalogue or ask for help.'}
          </p>
          <motion.div
            key={selected}
            initial={prefersReduced || !hasSwitched ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: DESLA_EASE_OUT }}
            className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5"
          >
            {matches.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </motion.div>
        </div>

        <ProductComparison products={inStockProducts} />

        <aside className="mt-10 flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-[#111111] border border-[#B89248]/25 p-6 text-white sm:p-8">
          <div>
            <h3 className="font-heading font-semibold text-xl text-white">Prefer to shop closer to home?</h3>
            <p className="mt-2 text-sm font-normal text-white/75">
              Find a local distributor and check collection or delivery options.
            </p>
          </div>
          <button
            type="button"
            className="min-h-11 rounded-full bg-[#FBF9F5] hover:bg-white px-6 text-sm font-medium text-[#111111] active-press transition-colors cursor-pointer"
            onClick={() => navigateTo('distributors')}
          >
            Find a partner
          </button>
        </aside>
      </div>
    </section>
  );
}
