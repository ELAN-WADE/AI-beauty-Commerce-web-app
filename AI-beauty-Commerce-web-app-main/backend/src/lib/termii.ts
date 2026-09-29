import { ProviderError, type FetchFn } from './providers';

/**
 * Termii messaging (SMS + WhatsApp) for the Nigerian market, where WhatsApp
 * open rates dwarf email. Same seam philosophy as payments: server-side only,
 * secrets in env, log-driver fallback when unconfigured, unit-tested shapes.
 *
 * Contract (api.ng.termii.com, api_key auth): POST /api/sms/send
 * { to, from, sms, type: 'plain', channel: 'generic' | 'dnd' | 'whatsapp',
 *   api_key }. Paths/fields are env-overridable; confirm on the Termii
 * dashboard at onboarding (same pattern as OPAY_*_PATH).
 */

export interface TermiiConfig {
  baseUrl: string;
  apiKey: string;
  senderId: string;
  sendPath: string;
}

export function termiiConfig(): TermiiConfig {
  return {
    baseUrl: process.env.TERMII_BASE_URL ?? 'https://api.ng.termii.com',
    apiKey: process.env.TERMII_API_KEY ?? '',
    senderId: process.env.TERMII_SENDER_ID ?? 'Glowly',
    sendPath: process.env.TERMII_SEND_PATH ?? '/api/sms/send',
  };
}

export function isTermiiConfigured(): boolean {
  return Boolean(process.env.TERMII_API_KEY);
}

/** Normalize NG numbers to E.164: 0803… → +234803…, 234… → +234…. */
export function toE164Nigeria(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (/^0\d{10}$/.test(digits)) return `+234${digits.slice(1)}`;
  if (/^234\d{10}$/.test(digits)) return `+${digits}`;
  if (/^\+234\d{10}$/.test(raw.trim())) return raw.trim();
  return null;
}

export type TermiiChannel = 'generic' | 'dnd' | 'whatsapp';

export async function termiiSend(
  fetchFn: FetchFn,
  cfg: TermiiConfig,
  input: { to: string; text: string; channel: TermiiChannel },
  timeoutMs = 8000,
): Promise<{ messageId: string }> {
  if (!cfg.apiKey) throw new ProviderError('Termii is not configured', false);
  const to = toE164Nigeria(input.to);
  if (!to) throw new ProviderError('Invalid recipient number', false);
  if (input.text.length === 0 || input.text.length > 1600) {
    throw new ProviderError('Message must be 1–1600 chars', false);
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchFn(`${cfg.baseUrl}${cfg.sendPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        from: cfg.senderId,
        sms: input.text,
        type: 'plain',
        channel: input.channel,
        api_key: cfg.apiKey,
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new ProviderError(`Termii HTTP ${res.status}`, res.status >= 500);
    const data = (await res.json()) as { message_id?: string; messageid?: string; message?: string; status?: string };
    const id = data.message_id ?? data.messageid;
    if (!id) throw new ProviderError(`Termii refused the message (${data.message ?? data.status ?? 'unknown'})`, false);
    return { messageId: String(id) };
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    throw new ProviderError(`Termii unreachable (${String(err)})`, true);
  } finally {
    clearTimeout(timer);
  }
}

// Short-form templates (SMS/WhatsApp constraints: concise, no links required).
const nairaShort = (kobo: number) => `N${(kobo / 100).toLocaleString('en-NG')}`;

export function smsOrderPaid(orderNumber: string, totalKobo: number): string {
  return `Glowly: payment confirmed for ${orderNumber} (${nairaShort(totalKobo)}). Items are being prepared.`;
}

export function smsShipmentUpdate(orderNumber: string, status: string, trackingRef: string): string {
  return `Glowly: order ${orderNumber} is ${status.replace(/_/g, ' ')}${trackingRef ? ` (${trackingRef})` : ''}.`;
}

export function smsCartAbandoned(subtotalNgn: number): string {
  return `Glowly: your bag (${nairaShort(subtotalNgn * 100)}) is waiting. Complete checkout within 48hrs before reserved stock releases.`;
}
