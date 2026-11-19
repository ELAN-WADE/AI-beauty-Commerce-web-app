import { skinAnalysisSchema, type SkinAnalysis } from './skin-analysis';

export async function submitSkinPhoto(
  photo: File,
  { signal, timeoutMs = 35000 }: { signal: AbortSignal; timeoutMs?: number },
): Promise<SkinAnalysis> {
  const request = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  let onAbort: () => void;
  const stopped = new Promise<never>((_, reject) => {
    onAbort = () => {
      reject(new DOMException('Analysis cancelled.', 'AbortError'));
      request.abort();
    };
    timer = setTimeout(() => {
      reject(new Error('The analysis took too long. Please try again. Your photo is still ready.'));
      request.abort();
    }, timeoutMs);
    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) onAbort();
  });

  try {
    if (signal.aborted) return await stopped;
    const form = new FormData();
    form.append('photo', photo);
    form.append('consent', 'true');
    const operation = async () => {
      const response = await fetch('/api/skin-analysis', {
        method: 'POST', body: form, signal: request.signal,
      });
      let data: unknown;
      try { data = await response.json(); }
      catch { throw new Error('The server did not return a valid response. Please try again.'); }
      if (!response.ok) {
        const message = (data as { error?: unknown })?.error;
        throw new Error(typeof message === 'string' ? message : 'Analysis failed. Please try again.');
      }
      const parsed = skinAnalysisSchema.safeParse(data);
      if (!parsed.success) throw new Error('The analysis was incomplete. Please try again.');
      return parsed.data;
    };
    return await Promise.race([operation(), stopped]);
  } finally {
    clearTimeout(timer!);
    signal.removeEventListener('abort', onAbort!);
  }
}
