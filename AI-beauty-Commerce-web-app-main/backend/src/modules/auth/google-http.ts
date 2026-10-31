const beforeConnection = new Set(['UND_ERR_CONNECT_TIMEOUT', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ENETUNREACH']);
const retryableRead = new Set([...beforeConnection, 'ECONNRESET', 'ETIMEDOUT', 'UND_ERR_SOCKET']);
export function googleNetworkCode(error: unknown): string {
  const code = (error as { cause?: { code?: unknown } })?.cause?.code;
  if (typeof code === 'string' && /^[A-Z][A-Z0-9_]{1,63}$/.test(code)) return code;
  return error instanceof Error && ['AbortError', 'TimeoutError'].includes(error.name) ? 'TIMEOUT' : 'NETWORK_ERROR';
}

/** Retry a code exchange only when the transport confirms no connection was made. */
export async function googleRequest(fetchFn: typeof fetch, url: string, init: RequestInit, stage: 'token' | 'identity'): Promise<Response> {
  const read = (init.method || 'GET') === 'GET';
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetchFn(url, { ...init, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000) });
      if (read && attempt === 0 && [502, 503, 504].includes(response.status)) {
        await response.body?.cancel().catch(() => {});
        await new Promise(resolve => setTimeout(resolve, 200));
        continue;
      }
      return response;
    } catch (error) {
      const code = googleNetworkCode(error);
      const retry = beforeConnection.has(code) || (read && (retryableRead.has(code) || code === 'TIMEOUT'));
      if (attempt !== 0 || !retry) throw error;
      console.warn(JSON.stringify({ scope: 'google-oauth', stage, code: 'retry_connection', cause: code }));
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
}
