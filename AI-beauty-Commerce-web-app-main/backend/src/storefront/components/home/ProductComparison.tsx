import React, { useState } from 'react';
import type { Product } from '../../types';

export function ProductComparison({ products }: { products: Product[] }) {
  const [left, setLeft] = useState(''), [right, setRight] = useState('');
  if (products.length < 2) return null;
  const first = products.find(p => p.id === left) || products[0];
  const second = products.find(p => p.id === right && p.id !== first.id) || products.find(p => p.id !== first.id)!;
  const select = (label: string, value: string, change: (value: string) => void, exclude?: string) => <label className="block text-sm"><span>{label}</span><select className="mt-2 min-h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3" value={value} onChange={e => change(e.target.value)}>{products.filter(p => p.id !== exclude).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>;
  const rows = [
    ['From', ...[first, second].map(p => '₦' + p.price.toLocaleString('en-NG'))],
    ['Available sizes', ...[first, second].map(p => p.sizes.join(', ') || 'Not listed')],
    ['Skin types', ...[first, second].map(p => p.whoItsFor?.skinTypes.join(', ') || 'See product details')],
    ['Ingredients', ...[first, second].map(p => p.keyIngredients?.map(i => i.name).join(', ') || 'See product label')],
    ['When to use', ...[first, second].map(p => p.howToUse?.routine || 'See directions')],
  ];
  return <details className="mt-8 rounded-2xl border border-[#E5E7EB] p-5 sm:p-6"><summary className="min-h-11 cursor-pointer font-heading text-lg">Compare formulas before you choose</summary><div className="mt-4 grid gap-4 sm:grid-cols-2">{select('First formula', first.id, setLeft)}{select('Compare with', second.id, setRight, first.id)}</div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[360px] text-left text-sm"><caption className="mb-3 text-left text-xs text-[#6B7280]">Published catalogue details. Read the full product directions before use.</caption><thead><tr><th scope="col" className="p-3">Compare</th><th scope="col" className="p-3">{first.name}</th><th scope="col" className="p-3">{second.name}</th></tr></thead><tbody>{rows.map(([label, a, b]) => <tr key={label} className="border-t border-[#E5E7EB]"><th scope="row" className="p-3 font-medium">{label}</th><td className="p-3">{a}</td><td className="p-3">{b}</td></tr>)}</tbody></table></div></details>;
}
