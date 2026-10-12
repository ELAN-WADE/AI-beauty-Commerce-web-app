import type { CartItem } from '../types';

export interface CheckoutFulfilment {
  locationId: string;
  method: 'DELIVERY' | 'PICKUP';
  feeKobo: number;
  routingKey: string;
}

// A displayed routing result is valid only for this exact bag and destination.
export function routingKey(items: Pick<CartItem, 'productId' | 'size' | 'quantity'>[], city: string, state: string, method: string) {
  return JSON.stringify([items.map(i => [i.productId, i.size, i.quantity]).sort((a, b) => String(a).localeCompare(String(b))), city.trim().toLowerCase(), state.trim().toLowerCase(), method]);
}
