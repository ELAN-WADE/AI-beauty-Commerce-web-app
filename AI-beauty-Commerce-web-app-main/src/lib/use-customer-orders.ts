import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from './owned-api';
export interface CustomerOrderSummary { id: string; orderNumber: string; status: string; paymentStatus: string; totalKobo: number; totalNgn: number; createdAt: string }
export function useCustomerOrders(userId?: string) {
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([]);
  const [owner, setOwner] = useState<string | undefined>(userId);
  const requestId = useRef(0);
  const currentOwner = useRef(userId); currentOwner.current = userId;
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const fetchPage = useCallback(async (next?: string) => {
    if (!userId) { setOrders([]); setLoading(false); setError(''); return; }
    const request = ++requestId.current;
    setLoading(true); setError('');
    try {
      const result = await apiFetch<{ orders: CustomerOrderSummary[]; nextCursor: string | null }>('/api/orders?limit=20' + (next ? '&cursor=' + encodeURIComponent(next) : ''));
      if (currentOwner.current !== userId || request !== requestId.current) return;
      setOwner(userId); setOrders(previous => next ? [...previous, ...result.orders.filter(order => !previous.some(existing => existing.id === order.id))] : result.orders); setCursor(result.nextCursor);
    } catch (cause) { if (currentOwner.current === userId && request === requestId.current) setError(cause instanceof Error ? cause.message : 'Could not load your orders. Please try again.'); }
    finally { if (currentOwner.current === userId && request === requestId.current) setLoading(false); }
  }, [userId]);
  const refresh = useCallback(() => fetchPage(), [fetchPage]);
  useEffect(() => { setOrders([]); setCursor(null); void refresh(); return () => { requestId.current++; }; }, [refresh]);
  return { orders: owner === userId ? orders : [], loading, error, refresh, hasMore: Boolean(cursor), loadMore: () => cursor ? fetchPage(cursor) : Promise.resolve() };
}
