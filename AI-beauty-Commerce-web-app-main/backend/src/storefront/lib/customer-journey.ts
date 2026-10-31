import type { CartItem, Product } from '../types';
import { localReturnTo } from './auth-flow';

export type CartChoice = { productId: string; size: string; quantity: number; fulfillmentType?: 'local' | 'central' };
export type PendingBag = { id: string; expiresAt: number; returnTo: string; items: CartChoice[] };
const key = 'desla-pending-bag';
export function validChoices(value: unknown): value is CartChoice[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 100 && value.every(item =>
    item && typeof item.productId === 'string' && item.productId.length > 0 && item.productId.length <= 120 &&
    typeof item.size === 'string' && item.size.length > 0 && item.size.length <= 100 &&
    Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= 99 &&
    (item.fulfillmentType === undefined || ['local', 'central'].includes(item.fulfillmentType)));
}
export function rememberPendingBag(items: CartChoice[], returnTo = '/cart'): PendingBag {
  if (!validChoices(items)) throw new Error('Choose a valid product, size and quantity.');
  const value = { id: crypto.randomUUID(), expiresAt: Date.now() + 30 * 60_000, returnTo: localReturnTo(returnTo) || '/cart', items };
  sessionStorage.setItem(key, JSON.stringify(value));
  return value;
}
export function readPendingBag(): PendingBag | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (!value || typeof value.id !== 'string' || !Number.isFinite(value.expiresAt) || value.expiresAt <= Date.now() || value.expiresAt > Date.now() + 30 * 60_000 || !validChoices(value.items) || !localReturnTo(value.returnTo)) return null;
    return value;
  } catch { return null; }
}
export function claimPendingBag(id: string): PendingBag | null {
  const pending = readPendingBag();
  if (!pending || pending.id !== id) return null;
  sessionStorage.removeItem(key);
  return pending;
}
export function clearPendingBag() { try { sessionStorage.removeItem(key); } catch { /* optional storage */ } }
export interface SavedCartLine {
  id: string; productSlug: string; productName: string; sku: string; sizeLabel: string; qty: number; unitPriceKobo: number; available: number;
}
export function cartFromServer(lines: SavedCartLine[], products: Product[]): CartItem[] {
  return lines.map(line => {
    const product = products.find(product => product.id === line.productSlug) || {
      id: line.productSlug, name: line.productName, sku: line.sku, brand: '', tagline: '', rating: 0, reviewsCount: 0,
      price: line.unitPriceKobo / 100, image: '', galleryImages: [], category: '', subCategory: '', sizes: [line.sizeLabel], selectedSize: line.sizeLabel,
      inStock: false, stockCount: 0, distributorStock: [], description: '', whatItDoes: [], keyIngredients: [],
      howToUse: { routine: '', step: '', instructions: '', precautions: '' }, whoItsFor: { skinTypes: [], concerns: [] },
      brandInfo: { origin: '', crueltyFree: false, guarantee: '' },
    } as Product;
    return { id: line.id, productId: line.productSlug, product, size: line.sizeLabel, quantity: line.qty, unitPrice: line.unitPriceKobo / 100, fulfillmentType: 'local' };
  });
}

