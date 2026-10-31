type PartnerOrder = { serverId?: string; serverStatus?: string; paymentStatus?: string; fulfilmentMethod?: 'PICKUP' | 'DELIVERY' };
export type PartnerOrderAction = 'ACCEPT' | 'READY_PICKUP' | 'DISPATCH' | 'CONFIRM_PICKUP' | 'COMPLETE_DELIVERY';
export function creatorDiscountNaira(subtotalNaira: number, percent: number): number {
  if (!Number.isFinite(subtotalNaira) || !Number.isFinite(percent) || subtotalNaira <= 0 || percent <= 0) return 0;
  const subtotalKobo = Math.round(subtotalNaira * 100);
  return Math.min(subtotalKobo, Math.round(subtotalKobo * Math.min(50, percent) / 100)) / 100;
}
export function nextPartnerOrderAction(order: PartnerOrder | null | undefined): PartnerOrderAction | null {
  if (!order?.serverId || order.paymentStatus !== 'PAID') return null;
  if (order.serverStatus === 'PAID') return 'ACCEPT';
  if (order.serverStatus === 'FULFILLING') return order.fulfilmentMethod === 'PICKUP' ? 'READY_PICKUP' : order.fulfilmentMethod === 'DELIVERY' ? 'DISPATCH' : null;
  if (order.serverStatus === 'READY_PICKUP' && order.fulfilmentMethod === 'PICKUP') return 'CONFIRM_PICKUP';
  if (order.serverStatus === 'SHIPPED' && order.fulfilmentMethod === 'DELIVERY') return 'COMPLETE_DELIVERY';
  return null;
}
