import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as store from './store';
import { readSession, SESSION_COOKIE, type Session } from './session';

export type User = { id: string; email: string; name: string; passwordHash: string; createdAt: string };

function scryptKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, 64, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptKey(password, salt);
  return ['scrypt', salt.toString('hex'), key.toString('hex')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [alg, saltHex, keyHex] = stored.split('$');
  if (alg !== 'scrypt' || !saltHex || !keyHex) return false;
  const key = await scryptKey(password, Buffer.from(saltHex, 'hex'));
  const expected = Buffer.from(keyHex, 'hex');
  return expected.length === key.length && timingSafeEqual(expected, key);
}

export const listUsers = () => store.list<User>('users');

export async function findUserByEmail(email: string): Promise<User | null> {
  return store.findBy<User>('users', 'email', email.trim().toLowerCase());
}

export async function createUser(email: string, name: string, password: string): Promise<User> {
  const user: User = {
    id: randomUUID(),
    email: email.trim().toLowerCase(),
    name: name.trim() || email.trim(),
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  return store.put('users', user);
}

/** Creates the first account from ADMIN_EMAIL / ADMIN_PASSWORD when no users exist yet. */
export async function ensureSeedUser(): Promise<void> {
  const users = await listUsers();
  if (users.length) return;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) await createUser(email, process.env.ADMIN_NAME || 'Steve', password);
}

export async function currentSession(): Promise<Session | null> {
  const jar = await cookies();
  return readSession(jar.get(SESSION_COOKIE)?.value);
}

export async function requireSession(): Promise<Session> {
  const s = await currentSession();
  if (!s) redirect('/quotes/login');
  return s;
}
