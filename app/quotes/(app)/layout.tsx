import Link from 'next/link';
import { logout } from '../actions';
import { requireSession } from '@/lib/users';
import { crmConnected } from '@/lib/crm';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const connected = await crmConnected();
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
          <Link href="/quotes/template">Proposal wording</Link>
          <Link href="/quotes/settings">Settings</Link>
        </nav>
        <div className="topbar-right">
          <Link href="/quotes/settings#nexus" className={`pill ${connected ? 'ok' : 'warn'}`}>
            {connected ? 'Nexus Portal connected' : 'Nexus Portal not connected'}
          </Link>
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
