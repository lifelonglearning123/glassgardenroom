import { NextResponse, type NextRequest } from 'next/server';
import { readSession, SESSION_COOKIE } from './lib/session';

// Only the quotes area and its data routes need a signed-in user.
// The website pages, images and client proposal links are public.
const PUBLIC = [/^\/quotes\/login\/?$/, /^\/api\/proposal\//];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PUBLIC.some((r) => r.test(pathname))) return NextResponse.next();

  const session = await readSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/quotes/login';
  url.search = pathname === '/quotes' ? '' : `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/quotes', '/quotes/:path*', '/api/:path*'],
};
