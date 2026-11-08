import { addUser, changePassword, removeUser } from '../../actions';
import { listUsers, requireSession } from '@/lib/users';
import { ghlConfigured, listPipelines, type Pipeline } from '@/lib/ghl';

const MESSAGES: Record<string, [string, 'ok' | 'error']> = {
  'password-changed': ['Your password has been changed.', 'ok'],
  'wrong-password': ['Your current password was not correct.', 'error'],
  'short-password': ['Passwords need at least 8 characters.', 'error'],
  'bad-email': ['Please enter a valid email address.', 'error'],
  'user-exists': ['A user with that email already exists.', 'error'],
  'user-added': ['User added. They can sign in now.', 'ok'],
  'user-removed': ['User removed.', 'ok'],
  'cannot-remove-self': ['You cannot remove your own account while signed in.', 'error'],
  'last-user': ['At least one user must remain.', 'error'],
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  const session = await requireSession();
  const users = await listUsers();

  let pipelines: Pipeline[] = [];
  let ghlError = '';
  if (ghlConfigured()) {
    try {
      pipelines = await listPipelines();
    } catch (e) {
      ghlError = (e as Error).message;
    }
  }
  const message = msg ? MESSAGES[msg] : undefined;

  return (
    <>
      <div className="page-head">
        <h1>Settings</h1>
      </div>
      {message && <p className={`alert ${message[1]}`}>{message[0]}</p>}

      <div className="grid-2">
        <section className="card">
          <h2>GoHighLevel</h2>
          {!ghlConfigured() ? (
            <p className="muted">
              Not connected. Add <code>GHL_PRIVATE_INTEGRATION_TOKEN</code> and <code>GHL_LOCATION_ID</code> to the
              app&apos;s environment variables, then redeploy. Until then, client details can be typed in by hand and
              proposals shared with a link.
            </p>
          ) : ghlError ? (
            <p className="alert error">Connected, but the test call failed: {ghlError}</p>
          ) : (
            <>
              <p className="alert ok">Connected to location {process.env.GHL_LOCATION_ID}.</p>
              <p className="muted small">
                Pipeline in use: {process.env.GHL_PIPELINE_ID || 'none (no opportunities will be created)'}. To change
                it, copy the IDs below into <code>GHL_PIPELINE_ID</code>, <code>GHL_STAGE_SENT_ID</code> and{' '}
                <code>GHL_STAGE_ACCEPTED_ID</code>.
              </p>
              {pipelines.map((p) => (
                <details key={p.id} className="pipeline">
                  <summary>
                    {p.name} <code>{p.id}</code>
                  </summary>
                  <ul>
                    {p.stages.map((s) => (
                      <li key={s.id}>
                        {s.name} <code>{s.id}</code>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </>
          )}
        </section>

        <section className="card">
          <h2>Change your password</h2>
          <form action={changePassword} className="stack">
            <input type="hidden" name="username" value={session.email} autoComplete="username" />
            <label className="field">
              <span>Current password</span>
              <input name="current" type="password" autoComplete="current-password" required />
            </label>
            <label className="field">
              <span>New password</span>
              <input name="password" type="password" autoComplete="new-password" minLength={8} required />
            </label>
            <button className="btn primary" type="submit">Change password</button>
          </form>
        </section>

        <section className="card">
          <h2>Users</h2>
          <ul className="user-list">
            {users.map((u) => (
              <li key={u.id}>
                <div>
                  <strong>{u.name}</strong>
                  <div className="muted small">{u.email}</div>
                </div>
                {u.id !== session.uid && (
                  <form action={removeUser}>
                    <input type="hidden" name="id" value={u.id} />
                    <button className="btn ghost small" type="submit">Remove</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <h2>Add a user</h2>
          <form action={addUser} className="stack">
            <label className="field">
              <span>Name</span>
              <input name="name" autoComplete="off" />
            </label>
            <label className="field">
              <span>Email</span>
              <input name="email" type="email" autoComplete="off" required />
            </label>
            <label className="field">
              <span>Password</span>
              <input name="password" type="password" autoComplete="new-password" minLength={8} required />
            </label>
            <button className="btn" type="submit">Add user</button>
          </form>
        </section>
      </div>
    </>
  );
}
