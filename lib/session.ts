// Session tokens (edge-safe: used by middleware and server code).
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'ggr_session';
export const REMEMBER_DAYS = 30;

export type Session = { uid: string; email: string; name: string };

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET is not set');
    return new TextEncoder().encode('dev-only-secret-do-not-use-in-production-0123456789');
  }
  return new TextEncoder().encode(s);
}

export async function signSession(s: Session, maxAgeSeconds: number): Promise<string> {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAgeSeconds)
    .sign(secret());
}

export async function readSession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { uid: String(payload.uid), email: String(payload.email), name: String(payload.name) };
  } catch {
    return null;
  }
}
