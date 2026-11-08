import { redirect } from 'next/navigation';
import { login } from '../actions';
import { currentSession } from '@/lib/users';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  if (await currentSession()) redirect(next && next.startsWith('/') ? next : '/quotes');

  return (
    <main className="login">
      <form action={login} className="login-card" method="post">
        <img src="/Brand/glassgardenroom.co-logo.svg" alt="Glass Garden Rooms" className="login-logo" />
        <h1>Quotes</h1>
        <p className="muted">Sign in to create and send proposals.</p>
        {error && <p className="alert error">That email and password don&apos;t match. Please try again.</p>}
        <input type="hidden" name="next" value={next ?? '/quotes'} />
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" autoComplete="username" required autoFocus />
        </label>
        <label className="field">
          <span>Password</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <label className="check">
          <input type="checkbox" name="remember" defaultChecked />
          <span>Keep me signed in on this device for 30 days</span>
        </label>
        <button className="btn primary block" type="submit">Sign in</button>
      </form>
    </main>
  );
}
