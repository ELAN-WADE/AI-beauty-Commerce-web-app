import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from './owned-api';
export type SocialProvider = 'tiktok' | 'instagram';
interface Profile { handle: string; displayName: string; followers: number | null; profileUrl: string; }
interface SocialStatus {
  providers: { provider: SocialProvider; configured: boolean; connection: (Profile & { connected: boolean; expiresAt: string; updatedAt: string }) | null }[];
  pending: { provider: SocialProvider; grant: string; accounts: (Profile & { accountId: string })[] }[];
}
export function useSocialConnections(userId?: string) {
  const [status, setStatus] = useState<SocialStatus>({ providers: [], pending: [] });
  const [error, setError] = useState('');
  const [authorizing, setAuthorizing] = useState(false);
  const statusOwner = useRef<string | undefined>(undefined);
  const owner = useRef(userId), timer = useRef<ReturnType<typeof setInterval> | null>(null), popup = useRef<Window | null>(null), inFlight = useRef(false);
  const cancel = useCallback(() => { if (timer.current) clearInterval(timer.current); timer.current = null; setAuthorizing(false); }, []);
  useEffect(() => {
    owner.current = userId; statusOwner.current = undefined; setStatus({ providers: [], pending: [] }); setError('');
    return () => { owner.current = undefined; if (timer.current) clearInterval(timer.current); popup.current?.close(); };
  }, [userId]);
  const refresh = useCallback(async () => {
    if (!userId) return null;
    const result = await apiFetch<SocialStatus>('/api/creator/social');
    if (owner.current !== userId) return null;
    statusOwner.current = userId; setStatus(result); return result;
  }, [userId]);
  useEffect(() => {
    void refresh().catch(reason => { if (owner.current === userId) setError(reason instanceof Error ? reason.message : 'Could not load social connections.'); });
    const focus = () => { void refresh().catch(() => {}); };
    window.addEventListener('focus', focus); return () => window.removeEventListener('focus', focus);
  }, [refresh, userId]);
  async function connect(provider: SocialProvider) {
    if (inFlight.current || !userId || owner.current !== userId) return;
    if (!status.providers.find(item => item.provider === provider)?.configured) { setError('Developer app setup is required before this channel can be connected.'); return; }
    cancel(); setError(''); inFlight.current = true; setAuthorizing(true);
    const started = Date.now();
    // Open synchronously so a successful API response is not blocked as an unsolicited popup.
    const windowRef = window.open('about:blank', '_blank', 'width=650,height=760');
    popup.current = windowRef;
    try {
      if (!windowRef) throw new Error('Allow the authorization popup, then try again.');
      windowRef.opener = null;
      const result = await apiFetch<{ authorizationUrl: string }>('/api/creator/social', { method: 'POST', body: JSON.stringify({ action: 'connect', provider }) });
      if (owner.current !== userId) { windowRef.close(); return; }
      const target = new URL(result.authorizationUrl);
      if (target.protocol !== 'https:' || !['www.tiktok.com', 'www.facebook.com'].includes(target.hostname)) throw new Error('The authorization address is invalid.');
      windowRef.location.href = target.toString();
      let checking = false;
      timer.current = setInterval(async () => {
        if (checking || document.hidden) return;
        if (Date.now() - started > 600000) { cancel(); setError('The connection request expired. Please try again.'); return; }
        checking = true;
        try {
          const current = await refresh();
          if (!current) return;
          const connected = current.providers.find(item => item.provider === provider)?.connection;
          if (current.pending.some(item => item.provider === provider) || (connected?.connected && Date.parse(connected.updatedAt) >= started)) { cancel(); windowRef.close(); }
        } catch { /* Keep the editor draft; a later poll/focus can recover a temporary failure. */ }
        finally { checking = false; }
      }, 3000);
    } catch (reason) {
      windowRef?.close(); cancel();
      if (owner.current === userId) setError(reason instanceof Error ? reason.message : 'Authorization could not start.');
    } finally { inFlight.current = false; }
  }
  async function command(action: 'select' | 'disconnect', provider: SocialProvider, grant?: string, accountId?: string) {
    if (inFlight.current || !userId) return;
    inFlight.current = true; setError('');
    try {
      await apiFetch('/api/creator/social', { method: 'POST', body: JSON.stringify({ action, provider, ...(action === 'select' ? { grant, accountId } : {}) }) });
      await refresh();
    } catch (reason) { if (owner.current === userId) setError(reason instanceof Error ? reason.message : 'The connection could not be updated.'); }
    finally { inFlight.current = false; }
  }
  function account(provider: SocialProvider) {
    const entry = statusOwner.current === userId ? status.providers.find(item => item.provider === provider) : undefined, profile = entry?.connection;
    return { connected: profile?.connected || false, handle: profile?.handle || '', followers: profile?.followers == null ? '' : profile.followers.toLocaleString() + ' followers', profileUrl: profile?.profileUrl || '', verified: profile?.connected || false, configured: entry?.configured || false };
  }
  return { account, pending: statusOwner.current === userId ? status.pending : [], error, authorizing, connect, cancel, disconnect: (provider: SocialProvider) => command('disconnect', provider), select: (provider: SocialProvider, grant: string, accountId: string) => command('select', provider, grant, accountId) };
}
