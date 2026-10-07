import nodemailer from 'nodemailer';

/**
 * Email sender (§S5 worker). Templates are pure functions (unit-tested);
 * transport is SMTP when configured, stdout otherwise (dev-safe default).
 */

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface EmailSender {
  readonly name: string;
  send(msg: EmailMessage): Promise<void>;
}

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString('en-NG')}`;

export function renderOrderCreated(p: { orderNumber: string; totalKobo: number; name?: string }): EmailMessage {
  return {
    to: '',
    subject: `Glowly order ${p.orderNumber} received`,
    text: `Hello${p.name ? ` ${p.name}` : ''},\n\nWe received your Glowly order ${p.orderNumber} (${naira(p.totalKobo)}). You will get another email once payment confirms.\n\nHealth before beauty. Intention before trend.\n— Glowly`,
  };
}

export function renderOrderPaid(p: { orderNumber: string; totalKobo: number; name?: string }): EmailMessage {
  return {
    to: '',
    subject: `Payment confirmed — ${p.orderNumber}`,
    text: `Hello${p.name ? ` ${p.name}` : ''},\n\nPayment confirmed for order ${p.orderNumber} (${naira(p.totalKobo)}). Your items are being prepared for dispatch.\n\n— Glowly`,
  };
}

export function renderShipmentUpdate(p: { orderNumber: string; status: string; trackingRef: string; name?: string }): EmailMessage {
  return {
    to: '',
    subject: `Order ${p.orderNumber}: ${p.status.replace(/_/g, ' ')}`,
    text: `Hello${p.name ? ` ${p.name}` : ''},\n\nOrder ${p.orderNumber} is now "${p.status.replace(/_/g, ' ')}"${p.trackingRef ? ` (tracking: ${p.trackingRef})` : ''}.\n\n— Glowly`,
  };
}

export function renderCartAbandoned(p: { name?: string; lines: { name: string; qty: number; priceNgn: number }[]; subtotalNgn: number }): EmailMessage {
  const items = p.lines.map((l) => `• ${l.name} × ${l.qty} — ₦${l.priceNgn.toLocaleString('en-NG')}`).join('\n');
  return {
    to: '',
    subject: 'Your Glowly bag is waiting',
    text: `Hello${p.name ? ` ${p.name}` : ''},\n\nYou left these in your bag:\n${items}\nSubtotal: ₦${p.subtotalNgn.toLocaleString('en-NG')}\n\nComplete checkout within 48 hours before reserved stock releases.\n\n— Glowly`,
  };
}

export function renderVerifyEmail(p: { verifyUrl: string; email: string; expiresAt?: Date }): EmailMessage {
  return {
    to: '',
    subject: 'Verify your Glowly email',
    text: `Hello,\n\nConfirm ${p.email} for Glowly:\n${p.verifyUrl}\n\nThis link expires ${p.expiresAt ? `at ${p.expiresAt.toUTCString()}` : 'in 24 hours'} and can be used once. If you did not create this account, ignore this email.\n\n— Glowly`,
  };
}

export function renderPasswordReset(p: { resetUrl: string; email: string; expiresAt?: Date }): EmailMessage {
  return {
    to: '',
    subject: 'Reset your Glowly password',
    text: `Hello,\n\nReset the password for ${p.email}:\n${p.resetUrl}\n\nThis link expires ${p.expiresAt ? `at ${p.expiresAt.toUTCString()}` : 'in 1 hour'} and can be used once. If you did not request this, ignore this email.\n\n— Glowly`,
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
  async send(msg: EmailMessage): Promise<void> {
    console.log(JSON.stringify({ level: 'info', scope: 'email', to: msg.to, subject: msg.subject }));
  }
}

export class SmtpSender implements EmailSender {
  readonly name = 'smtp';
  private transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    requireTLS: process.env.NODE_ENV === 'production' && process.env.SMTP_SECURE !== 'true',
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' } : undefined,
  });

  async send(msg: EmailMessage): Promise<void> {
    const result = await this.transport.sendMail({ from: process.env.SMTP_FROM ?? 'Glowly <hello@example.com>', ...msg });
    if (!result.accepted?.length || result.rejected?.length) throw new Error('SMTP did not accept the email recipient.');
  }
}

export function getEmailSender(): EmailSender {
  if (process.env.NODE_ENV === 'production' && (!process.env.SMTP_HOST?.trim() || !process.env.SMTP_FROM?.trim())) {
    throw new Error('SMTP_HOST and SMTP_FROM are required; production email cannot use the log driver.');
  }
  return process.env.SMTP_HOST ? new SmtpSender() : new LogSender();
}
