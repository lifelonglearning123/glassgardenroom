// Encrypts values stored in the database (e.g. the Nexus Portal access token)
// with AES-256-GCM, using a key derived from AUTH_SECRET.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

function key(): Buffer {
  const s = process.env.AUTH_SECRET;
  if (!s && process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET is not set');
  return createHash('sha256').update(`${s || 'dev-only-secret'}:stored-credentials`).digest();
}

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join(':');
}

export function decrypt(stored: string): string {
  const [v, iv, tag, data] = stored.split(':');
  if (v !== 'v1') throw new Error('Unknown secret format');
  const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
}
