import Link from 'next/link';
import { logout } from '../actions';
import { requireSession } from '@/lib/users';
import { ghlConfigured } from '@/lib/ghl';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return (
    <>
      <header className="topbar">
        <Link href="/quotes" className="brand">
          <img src="/Brand/glassgardenroom.co-logo.svg" alt="" />
          <span>Quotes</span>
        </Link>
        <nav>
          <Link href="/quotes">All quotes</Link>
          <Link href="/quotes/photos">Photo library</Link>
          <Link href="/quotes/settings">Settings</Link>
        </nav>
        <div className="topbar-right">
          <span className={`pill ${ghlConfigured() ? 'ok' : 'warn'}`}>
            {ghlConfigured() ? 'GoHighLevel connected' : 'GoHighLevel not connected'}
          </span>
          <span className="muted small">{session.name}</span>
          <form action={logout}>
            <button className="btn ghost small" type="submit">Sign out</button>
          </form>
        </div>
      </header>
      <main className="container">{children}</main>
    </>
  );
}
