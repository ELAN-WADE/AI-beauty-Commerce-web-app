import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

function key(name: 'AUTH_EMAIL_ENCRYPTION_KEY' | 'MFA_ENCRYPTION_KEY'): Buffer {
  const hex = process.env[name];
  const isDev = process.env.NODE_ENV !== 'production' || process.env.RENDER_DEV === 'true' || process.env.DEV_DEPLOY === 'true';
  if (!hex && isDev) {
    const developmentKey = name === 'AUTH_EMAIL_ENCRYPTION_KEY'
      ? 'glowly-development-only-outbox-key'
      : 'glowly-development-only-mfa-key';
    return createHash('sha256').update(developmentKey).digest();
  }
  if (hex && !/^[a-f0-9]{64}$/i.test(hex)) {
    // Derive a 32-byte key from any raw secret string (e.g. Render auto-generated value)
    return createHash('sha256').update(hex).digest();
  }
  if (!hex || !/^[a-f0-9]{64}$/i.test(hex)) throw new Error(`${name} must be 32 random bytes (hex).`);
  return Buffer.from(hex, 'hex');
}

function seal(value: string, encryptionKey: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map(part => part.toString('base64url')).join('.');
}

function open(sealed: string, encryptionKey: Buffer): string {
  const parts = sealed.split('.');
  if (parts.length !== 3) throw new Error('Invalid encrypted payload.');
  const [iv, tag, data] = parts.map(part => Buffer.from(part, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export const sealAuthUrl = (url: string) => seal(url, key('AUTH_EMAIL_ENCRYPTION_KEY'));
export const openAuthUrl = (sealed: string) => open(sealed, key('AUTH_EMAIL_ENCRYPTION_KEY'));
export const sealMfaSecret = (secret: string) => seal(secret, key('MFA_ENCRYPTION_KEY'));
export const openMfaSecret = (sealed: string) => open(sealed, key('MFA_ENCRYPTION_KEY'));
