import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

function key(): Buffer {
  const hex = process.env.AUTH_EMAIL_ENCRYPTION_KEY;
  if ((!hex || !/^[a-f0-9]{64}$/i.test(hex)) && process.env.NODE_ENV !== 'production') {
    return createHash('sha256').update('glowly-development-only-outbox-key').digest();
  }
  if (!hex || !/^[a-f0-9]{64}$/i.test(hex)) throw new Error('AUTH_EMAIL_ENCRYPTION_KEY must be 32 random bytes (hex).');
  return Buffer.from(hex, 'hex');
}

export function sealAuthUrl(url: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([cipher.update(url, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map(part => part.toString('base64url')).join('.');
}

export function openAuthUrl(sealed: string): string {
  const parts = sealed.split('.');
  if (parts.length !== 3) throw new Error('Invalid auth email payload.');
  const [iv, tag, data] = parts.map(part => Buffer.from(part, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
