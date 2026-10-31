export type EmailTransport = 'smtp' | 'brevo' | 'log';

export function emailTransport(): EmailTransport {
  const configured = process.env.EMAIL_TRANSPORT?.trim();
  if (configured && !['smtp', 'brevo', 'log'].includes(configured)) throw new Error('EMAIL_TRANSPORT must be smtp, brevo, or log.');
  return configured as EmailTransport || (process.env.BREVO_API_KEY?.trim() ? 'brevo' : process.env.SMTP_HOST?.trim() ? 'smtp' : 'log');
}

export function emailFrom() {
  const raw = (process.env.EMAIL_FROM || process.env.SMTP_FROM || '').trim();
  const match = /^(?:(.*?)\s*<([^<>]+)>|([^<>]+))$/.exec(raw);
  const email = (match?.[2] || match?.[3] || '').trim();
  if (/[\r\n]/.test(raw) || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) {
    throw new Error('EMAIL_FROM (or SMTP_FROM) must contain a valid verified sender address.');
  }
  const name = (process.env.EMAIL_FROM_NAME || match?.[1] || '').trim().replace(/^"(.*)"$/, '$1');
  if (/[\r\n]/.test(name)) throw new Error('EMAIL_FROM_NAME must be a single line.');
  return { email, ...(name ? { name } : {}) };
}

/** Validate names/settings only; never include credential values in errors. */
export function assertEmailConfiguration() {
  const transport = emailTransport();
  if (transport === 'log') throw new Error('Configure EMAIL_TRANSPORT=brevo with BREVO_API_KEY, or SMTP_HOST and SMTP credentials; production account email cannot use log delivery.');
  emailFrom();
  if (transport === 'brevo') {
    const key = process.env.BREVO_API_KEY?.trim();
    if (!key) throw new Error('BREVO_API_KEY is required for EMAIL_TRANSPORT=brevo.');
    if (key.startsWith('xsmtpsib-')) throw new Error('BREVO_API_KEY must be a Brevo API key, not an SMTP key.');
  } else {
    for (const name of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS']) {
      if (!process.env[name]?.trim()) throw new Error(`${name} is required for production SMTP delivery.`);
    }
    const port = Number(process.env.SMTP_PORT || 587);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SMTP_PORT must be a valid TCP port.');
  }
}
