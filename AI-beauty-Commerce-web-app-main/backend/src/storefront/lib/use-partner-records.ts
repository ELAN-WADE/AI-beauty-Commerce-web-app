import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPartnerWorkspace } from './owned-api';
export interface PartnerRecord { id: string; kind: string; title: string; body: string; url: string; status: string; createdAt: string; updatedAt: string; reviewNote?: string; ownerId?: string | null; parentId?: string | null; data?: { productIds?: string[]; details?: Record<string, unknown>; shipping?: { trackingReference: string; dispatchedAt: string; deliveredAt?: string } }; version: number; }
export function usePartnerRecords(kind: 'CREATOR' | 'DISTRIBUTOR') {
  const [records, setRecords] = useState<PartnerRecord[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const refresh = useCallback(async (background = false) => {
    const attempt = ++generation.current;
    if (!background) setLoading(true);
    setError('');
    try { const data = await fetchPartnerWorkspace(kind); if (attempt === generation.current) setRecords(data.records); }
    catch (error) { if (attempt === generation.current) setError(error instanceof Error ? error.message : 'Could not load workspace records.'); }
    finally { if (attempt === generation.current) setLoading(false); }
  }, [kind]);
  useEffect(() => {
    void refresh();
    const check = () => { if (document.visibilityState === 'visible') void refresh(true); };
    window.addEventListener('focus', check);
    const timer = window.setInterval(check, 30000);
    return () => { generation.current++; clearInterval(timer); window.removeEventListener('focus', check); };
  }, [refresh]);
  return { records, error, loading, refresh };
}


