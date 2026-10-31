import React, { useEffect, useState } from 'react';
import { apiFetch, mapOwned } from '../../lib/owned-api';
import { ProductCard } from '../../components/common/ProductCard';
import { useApp } from '../../context/AppContext';
import type { Product } from '../../types';

export function ScreenCreatorStorefront() {
  const { authUser, goBack } = useApp();
  const [data, setData] = useState<{ title: string; body: string; name: string; promoCode: string; discountPercent: number; products: Product[] } | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(''); setData(null);
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const code = params.get('ref') || params.get('code') || params.get('creator') || params.get('handle') || (authUser?.profile as any)?.promoCode || 'AMARA10';

    apiFetch<any>(`/api/creators/${encodeURIComponent(code)}/storefront`).then(result => {
      if (!cancelled) {
        setData({
          title: result.collection.title,
          body: result.collection.body,
          name: result.creator.name,
          promoCode: result.creator.promoCode,
          discountPercent: result.creator.discountPercent,
          products: (result.products || []).map(mapOwned)
        });
      }
    }).catch(e => {
      if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load collection.');
    });

    return () => { cancelled = true; };
  }, [attempt, (authUser?.profile as any)?.promoCode]);

  return (
    <section className="mx-auto max-w-7xl space-y-6 p-6 sm:p-10">
      <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
        <button
          onClick={goBack}
          className="text-xs font-semibold text-[#6B7280] hover:text-[#0F0F10] transition-colors cursor-pointer"
        >
          ← Return
        </button>
        {data?.promoCode && (
          <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-[#FBF5E8] text-[#997A2E] border border-[#D4AF37]/30">
            Use Code: {data.promoCode} ({data.discountPercent}% Off)
          </span>
        )}
      </div>

      {error ? (
        <div className="space-y-3 p-8 rounded-3xl bg-white border border-rose-200">
          <p role="alert" className="text-sm text-rose-800">{error}</p>
          <button
            onClick={() => setAttempt(value => value + 1)}
            className="rounded-full bg-[#0F0F10] text-white px-5 py-2 text-xs font-bold"
          >
            Retry Collection
          </button>
        </div>
      ) : !data ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#E5E7EB] border-t-[#D4AF37] animate-spin mx-auto mb-3" />
          <p role="status" className="text-xs font-mono uppercase tracking-wider text-[#6B7280]">Loading creator collection…</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-[#997A2E] font-bold">Curated by {data.name}</p>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-[#0F0F10]">{data.title}</h1>
            <p className="max-w-2xl whitespace-pre-wrap text-xs sm:text-sm text-[#6B7280] leading-relaxed">{data.body}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 pt-4">
            {data.products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {data.products.length === 0 && (
            <div className="p-12 rounded-3xl bg-white border border-[#E5E7EB] text-center">
              <p className="text-xs text-[#6B7280]">No active products currently in this collection.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
