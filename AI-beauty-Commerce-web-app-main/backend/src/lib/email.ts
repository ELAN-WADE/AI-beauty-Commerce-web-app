import nodemailer from 'nodemailer';
import { assertEmailConfiguration, emailFrom, emailTransport } from './email-config';

/**
 * Email sender (§S5 worker). Templates are pure functions (unit-tested);
 * delivery uses Brevo HTTPS API or SMTP. Logging is a development-only fallback.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  preheader?: string;
}

export interface EmailSender {
  readonly name: string;
  lastMessageId?: string;
  verify?(): Promise<void>;
  send(msg: EmailMessage): Promise<void>;
}

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString('en-NG')}`;

function escHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface DeslaEmailLayoutInput {
  preheader: string;
  eyebrow: string;
  heading: string;
  greeting?: string;
  paragraphs: string[];
  rows?: { label: string; value: string }[];
  ctaLabel?: string;
  ctaUrl?: string;
  note?: string;
}

/**
 * Reusable Desla Beauty HTML email layout (obsidian, warm alabaster, controlled gold).
 * Pure function — safe for Brevo HTTPS API and SMTP multipart delivery.
 */
export function renderDeslaEmailHtml(input: DeslaEmailLayoutInput): string {
  const rowsHtml = input.rows?.length
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;border:1px solid #E5E7EB;border-radius:12px;background:#FAF9F6;">
        ${input.rows
          .map(
            (r) =>
              `<tr><td style="padding:10px 16px;font-size:12px;color:#6B7280;border-bottom:1px solid #E5E7EB;">${escHtml(r.label)}</td><td align="right" style="padding:10px 16px;font-size:13px;font-weight:600;color:#0F0F10;border-bottom:1px solid #E5E7EB;">${escHtml(r.value)}</td></tr>`,
          )
          .join('')}
       </table>`
    : '';
  const ctaHtml =
    input.ctaLabel && input.ctaUrl
      ? `<p style="margin:24px 0 18px;"><a href="${escHtml(input.ctaUrl)}" style="display:inline-block;padding:12px 24px;border-radius:999px;background:#0F0F10;color:#FFFFFF;font-size:13px;font-weight:600;text-decoration:none;">${escHtml(input.ctaLabel)}</a></p>`
      : '';
  const bodyHtml = input.paragraphs
    .map((p) => `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#2D2A26;">${escHtml(p)}</p>`)
    .join('');
  const noteHtml = input.note
    ? `<p style="margin:18px 0 0;padding-top:14px;border-top:1px solid #E5E7EB;font-size:12px;line-height:1.5;color:#6B7280;">${escHtml(input.note)}</p>`
    : '';

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF9F6;font-family:'Segoe UI',system-ui,-apple-system,Arial,sans-serif;color:#0F0F10;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escHtml(input.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FAF9F6;padding:28px 14px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:20px;overflow:hidden;">
        <tr><td style="padding:22px 28px;background:#0F0F10;color:#FFFFFF;">
          <span style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#D4AF37;font-weight:600;">DESLA BEAUTY</span>
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#997A2E;font-weight:600;">${escHtml(input.eyebrow)}</p>
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;font-weight:600;color:#0F0F10;">${escHtml(input.heading)}</h1>
          ${input.greeting ? `<p style="margin:0 0 14px;font-size:14px;color:#0F0F10;font-weight:500;">${escHtml(input.greeting)}</p>` : ''}
          ${bodyHtml}
          ${rowsHtml}
          ${ctaHtml}
          ${noteHtml}
        </td></tr>
        <tr><td style="padding:18px 28px;background:#FAF9F6;border-top:1px solid #E5E7EB;font-size:11px;color:#6B7280;line-height:1.5;">
          Health before beauty. Intention before trend.<br>
          &copy; ${new Date().getFullYear()} Desla Beauty. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function renderWelcomeEmail(p: { email: string; name?: string; storefrontUrl: string }): EmailMessage {
  const greeting = p.name ? `Welcome, ${p.name},` : 'Welcome to Desla Beauty,';
  const preheader = 'Your Desla Beauty account is verified and ready.';
  return {
    to: p.email,
    subject: 'Welcome to Desla Beauty',
    preheader,
    text: `${greeting}\n\nYour Desla Beauty account (${p.email}) is verified and ready. Explore skin-first formulations, track orders, and manage your routines anytime:\n${p.storefrontUrl}\n\nHealth before beauty. Intention before trend.\n— Desla Beauty`,
    html: renderDeslaEmailHtml({
      preheader,
      eyebrow: 'Account Verified',
      heading: 'Welcome to Desla Beauty',
      greeting,
      paragraphs: [
        'Your account is now verified. You can explore formulations tailored for natural skin, follow your deliveries in real time, and save routines to your profile.',
      ],
      ctaLabel: 'Explore Desla Beauty',
      ctaUrl: p.storefrontUrl,
      note: 'If you did not create this account, please contact our support desk immediately.',
    }),
  };
}

export function renderOrderCreated(p: { orderNumber: string; totalKobo: number; name?: string }): EmailMessage {
  const preheader = `We received Desla Beauty order ${p.orderNumber} (${naira(p.totalKobo)}).`;
  return {
    to: '',
    subject: `Desla Beauty order ${p.orderNumber} received`,
    preheader,
    text: `Hello${p.name ? ` ${p.name}` : ''},\n\nWe received your Desla Beauty order ${p.orderNumber} (${naira(p.totalKobo)}). You will get another email once payment confirms.\n\nHealth before beauty. Intention before trend.\n— Desla Beauty`,
    html: renderDeslaEmailHtml({
      preheader,
      eyebrow: 'Order Received',
      heading: `Order ${p.orderNumber}`,
      greeting: `Hello${p.name ? ` ${p.name}` : ''},`,
      paragraphs: ['We have received your order and reserved your selected formulations. You will receive a payment confirmation as soon as settlement completes.'],
      rows: [
        { label: 'Order Number', value: p.orderNumber },
        { label: 'Order Total', value: naira(p.totalKobo) },
      ],
    }),
  };
}

export function renderOrderPaid(p: { orderNumber: string; totalKobo: number; name?: string }): EmailMessage {
  const preheader = `Payment confirmed for Desla Beauty order ${p.orderNumber}.`;
  return {
    to: '',
    subject: `Desla Beauty payment confirmed — ${p.orderNumber}`,
    preheader,
    text: `Hello${p.name ? ` ${p.name}` : ''},\n\nPayment confirmed for your Desla Beauty order ${p.orderNumber} (${naira(p.totalKobo)}). Your items are being prepared for dispatch.\n\n— Desla Beauty`,
    html: renderDeslaEmailHtml({
      preheader,
      eyebrow: 'Payment Confirmed',
      heading: `Payment received for ${p.orderNumber}`,
      greeting: `Hello${p.name ? ` ${p.name}` : ''},`,
      paragraphs: ['Your payment has been verified and your items are now being prepared for dispatch or collection from your selected Desla hub.'],
      rows: [
        { label: 'Order Number', value: p.orderNumber },
        { label: 'Amount Paid', value: naira(p.totalKobo) },
      ],
    }),
  };
}

export function renderShipmentUpdate(p: { orderNumber: string; status: string; trackingRef: string; name?: string }): EmailMessage {
  const readableStatus = p.status.replace(/_/g, ' ');
  const preheader = `Order ${p.orderNumber} is now ${readableStatus}.`;
  return {
    to: '',
    subject: `Desla Beauty order ${p.orderNumber}: ${readableStatus}`,
    preheader,
    text: `Hello${p.name ? ` ${p.name}` : ''},\n\nYour Desla Beauty order ${p.orderNumber} is now "${readableStatus}"${p.trackingRef ? ` (tracking: ${p.trackingRef})` : ''}.\n\n— Desla Beauty`,
    html: renderDeslaEmailHtml({
      preheader,
      eyebrow: 'Fulfilment Update',
      heading: `Order ${p.orderNumber} — ${readableStatus}`,
      greeting: `Hello${p.name ? ` ${p.name}` : ''},`,
      paragraphs: [`Your order status has been updated to "${readableStatus}".`],
      rows: [
        { label: 'Order Number', value: p.orderNumber },
        { label: 'Status', value: readableStatus },
        ...(p.trackingRef ? [{ label: 'Tracking Reference', value: p.trackingRef }] : []),
      ],
    }),
  };
}

export function renderCartAbandoned(p: { name?: string; lines: { name: string; qty: number; priceNgn: number }[]; subtotalNgn: number }): EmailMessage {
  const items = p.lines.map((l) => `• ${l.name} × ${l.qty} — ₦${l.priceNgn.toLocaleString('en-NG')}`).join('\n');
  const preheader = 'Your selected Desla Beauty formulations are still in your bag.';
  return {
    to: '',
    subject: 'Your Desla Beauty bag is waiting',
    preheader,
    text: `Hello${p.name ? ` ${p.name}` : ''},\n\nYou left these in your Desla Beauty bag:\n${items}\nSubtotal: ₦${p.subtotalNgn.toLocaleString('en-NG')}\n\nComplete checkout within 48 hours before reserved stock releases.\n\n— Desla Beauty`,
    html: renderDeslaEmailHtml({
      preheader,
      eyebrow: 'Saved Selection',
      heading: 'Your bag is still waiting',
      greeting: `Hello${p.name ? ` ${p.name}` : ''},`,
      paragraphs: ['Your selected formulations are still in your bag. Complete checkout within 48 hours before inventory holds release.'],
      rows: [
        ...p.lines.map((l) => ({ label: `${l.name} × ${l.qty}`, value: `₦${l.priceNgn.toLocaleString('en-NG')}` })),
        { label: 'Subtotal', value: `₦${p.subtotalNgn.toLocaleString('en-NG')}` },
      ],
    }),
  };
}

export function renderVerifyEmail(p: { verifyUrl: string; email: string; expiresAt?: Date }): EmailMessage {
  const expiryText = p.expiresAt ? `at ${p.expiresAt.toUTCString()}` : 'in 24 hours';
  const preheader = 'Confirm your email address to activate your Desla Beauty account.';
  return {
    to: '',
    subject: 'Verify your Desla Beauty email',
    preheader,
    text: `Hello,\n\nConfirm ${p.email} for Desla Beauty:\n${p.verifyUrl}\n\nThis link expires ${expiryText} and can be used once. If you did not create this account, ignore this email.\n\n— Desla Beauty`,
    html: renderDeslaEmailHtml({
      preheader,
      eyebrow: 'Email Verification',
      heading: 'Confirm your email address',
      paragraphs: [
        `Please verify ${p.email} to activate your Desla Beauty account.`,
        `This single-use link expires ${expiryText}.`,
      ],
      ctaLabel: 'Verify Email Address',
      ctaUrl: p.verifyUrl,
      note: 'If you did not create a Desla Beauty account, you can safely ignore this email.',
    }),
  };
}

export function renderPasswordReset(p: { resetUrl: string; email: string; expiresAt?: Date }): EmailMessage {
  const expiryText = p.expiresAt ? `at ${p.expiresAt.toUTCString()}` : 'in 1 hour';
  const preheader = 'Reset your Desla Beauty account password.';
  return {
    to: '',
    subject: 'Reset your Desla Beauty password',
    preheader,
    text: `Hello,\n\nReset the password for ${p.email}:\n${p.resetUrl}\n\nThis link expires ${expiryText} and can be used once. If you did not request this, ignore this email.\n\n— Desla Beauty`,
    html: renderDeslaEmailHtml({
      preheader,
      eyebrow: 'Account Security',
      heading: 'Reset your password',
      paragraphs: [
        `We received a request to reset the password for ${p.email}.`,
        `This single-use link expires ${expiryText}.`,
      ],
      ctaLabel: 'Reset Password',
      ctaUrl: p.resetUrl,
      note: 'If you did not request a password reset, your account remains unchanged and you can ignore this email.',
    }),
  };
}

export function authLinksFor(baseUrl: string): { verifyBase: string; resetBase: string } {
  const base = (baseUrl || '').replace(/\/+$/, '');
  return {
    verifyBase: `${base}/verify-email`,
    resetBase: `${base}/reset-password`,
  };
}

export class LogSender implements EmailSender {
  readonly name = 'log';
  lastMessageId?: string;
  async send(msg: EmailMessage): Promise<void> {
    this.lastMessageId = `log-${Date.now()}`;
    console.log(JSON.stringify({ level: 'info', scope: 'email', to: msg.to, subject: msg.subject }));
  }
}

export class SmtpSender implements EmailSender {
  readonly name = 'smtp';
  lastMessageId?: string;
  private transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    requireTLS: process.env.SMTP_SECURE !== 'true' && (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1', '::1'].includes(process.env.SMTP_HOST || '')),
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' } : undefined,
  });

  /** Connect/authenticate without sending a message. */
  async verify(): Promise<void> {
    await this.transport.verify();
  }

  async send(msg: EmailMessage): Promise<void> {
    const sender = emailFrom();
    const result = await this.transport.sendMail({
      from: { name: sender.name, address: sender.email },
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      ...(msg.html ? { html: msg.html } : {}),
    });
    if (!result.accepted?.length || result.rejected?.length) throw new Error('SMTP did not accept the email recipient.');
    this.lastMessageId = typeof result.messageId === 'string' ? result.messageId : undefined;
  }
}

export class EmailDeliveryError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = 'EmailDeliveryError';
  }
}

/** Brevo Transactional Email API v3 over HTTPS: supports HTML + text + delivery messageId tracking. */
export class BrevoSender implements EmailSender {
  readonly name = 'brevo';
  lastMessageId?: string;
  private readonly sender = emailFrom();
  private readonly key = process.env.BREVO_API_KEY?.trim();
  constructor(private readonly fetcher: typeof fetch = fetch) {
    if (!this.key || this.key.startsWith('xsmtpsib-')) throw new EmailDeliveryError('BREVO_API_KEY_REQUIRED');
  }

  private async request(path: '/account' | '/smtp/email', init: RequestInit = {}) {
    let response: Response;
    try {
      response = await this.fetcher(`https://api.brevo.com/v3${path}`, {
        ...init,
        headers: { accept: 'application/json', 'content-type': 'application/json', 'api-key': this.key! },
        signal: AbortSignal.timeout(12000),
        cache: 'no-store',
        redirect: 'error',
      });
    } catch {
      throw new EmailDeliveryError('BREVO_NETWORK_ERROR');
    }
    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      throw new EmailDeliveryError(
        response.status === 401 || response.status === 403
          ? 'BREVO_AUTH_REJECTED'
          : response.status === 429
            ? 'BREVO_RATE_LIMITED'
            : 'BREVO_REQUEST_REJECTED',
      );
    }
    return response;
  }

  /** Read-only credential check. Does not send an email. */
  async verify() {
    const response = await this.request('/account');
    await response.body?.cancel();
  }

  async send(msg: EmailMessage): Promise<void> {
    const payload: Record<string, unknown> = {
      sender: this.sender,
      to: [{ email: msg.to }],
      subject: msg.subject,
      textContent: msg.text,
    };
    if (msg.html) payload.htmlContent = msg.html;
    const response = await this.request('/smtp/email', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const result = (await response.json().catch(() => null)) as { messageId?: unknown } | null;
    if (response.status !== 201 || typeof result?.messageId !== 'string' || !result.messageId) {
      throw new EmailDeliveryError('BREVO_INVALID_RESPONSE');
    }
    this.lastMessageId = result.messageId;
  }
}

export function getEmailSender(): EmailSender {
  const transport = emailTransport();
  if (process.env.NODE_ENV === 'production' || transport === 'brevo') assertEmailConfiguration();
  return transport === 'brevo' ? new BrevoSender() : transport === 'smtp' ? new SmtpSender() : new LogSender();
}
