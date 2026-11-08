import { addUser, changePassword, connectCrm, disconnectCrmAction, removeUser, saveCrmStages } from '../../actions';
import { listUsers, requireSession } from '@/lib/users';
import { getCrmConfig, listPipelines, type Pipeline } from '@/lib/crm';

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
  'crm-missing': ['Enter both the access token and the location ID.', 'error'],
  'crm-failed': ['Nexus Portal did not accept those details.', 'error'],
  'crm-connected': ['Nexus Portal is connected. Choose your pipeline stages below.', 'ok'],
  'crm-stages-saved': ['Pipeline stages saved.', 'ok'],
  'crm-stage-mismatch': ['Both stages must be in the same pipeline.', 'error'],
  'crm-disconnected': ['Nexus Portal has been disconnected. Saved details were removed.', 'ok'],
};

function StageSelect({ name, label, pipelines, value, optional }: {
  name: string; label: string; pipelines: Pipeline[]; value?: string; optional?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} defaultValue={value ?? ''}>
        <option value="">{optional}</option>
        {pipelines.map((p) => (
          <optgroup key={p.id} label={p.name}>
            {p.stages.map((s) => (
              <option key={s.id} value={`${p.id}:${s.id}`}>{p.name} › {s.name}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ msg?: string; detail?: string }> }) {
  const { msg, detail } = await searchParams;
  const session = await requireSession();
  const users = await listUsers();
  const crm = await getCrmConfig();

  let pipelines: Pipeline[] = [];
  let crmError = '';
  if (crm) {
    try {
      pipelines = await listPipelines();
    } catch (e) {
      crmError = (e as Error).message;
    }
  }
  const message = msg ? MESSAGES[msg] : undefined;
  const sentValue = crm?.pipelineId && crm.stageSentId ? `${crm.pipelineId}:${crm.stageSentId}` : '';
  const acceptedValue = crm?.pipelineId && crm.stageAcceptedId ? `${crm.pipelineId}:${crm.stageAcceptedId}` : '';

  return (
    <>
      <div className="page-head">
        <h1>Settings</h1>
      </div>
      {message && (
        <p className={`alert ${message[1]}`}>
          {message[0]} {detail && <span className="small">{detail}</span>}
        </p>
      )}

      <section className="card" id="nexus">
        <div className="section-head">
          <h2>Nexus Portal</h2>
          <span className={`pill ${crm ? 'ok' : 'warn'}`}>{crm ? 'Connected' : 'Not connected'}</span>
        </div>
        <p className="muted small">
          Connecting Nexus Portal lets you load clients from your contacts, email quotes from your Nexus Portal
          inbox, and see on each contact when a quote was sent, opened and accepted.
        </p>

        <div className="grid-2">
          <form action={connectCrm} className="stack">
            <h3>{crm ? 'Connection details' : 'Connect your account'}</h3>
            <label className="field">
              <span>Access token</span>
              <input
                name="token"
                type="password"
                autoComplete="off"
                placeholder={crm ? `Saved (ends in ${crm.tokenHint}). Leave blank to keep it.` : 'Paste your private integration token'}
                required={!crm}
              />
            </label>
            <label className="field">
              <span>Location ID</span>
              <input name="locationId" autoComplete="off" defaultValue={crm?.locationId ?? ''} required />
            </label>
            <label className="field">
              <span>Send quote emails from (optional)</span>
              <input name="emailFrom" type="email" autoComplete="off" defaultValue={crm?.emailFrom ?? ''} placeholder="e.g. info@glassgardenrooms.net" />
            </label>
            <button className="btn primary" type="submit">{crm ? 'Save and test' : 'Connect'}</button>
            <details className="small muted">
              <summary>Where do I find these?</summary>
              <ol>
                <li>In Nexus Portal, open <strong>Settings › Private Integrations</strong> and create a new integration.</li>
                <li>Give it access to <strong>Contacts</strong>, <strong>Conversations</strong>, <strong>Conversation messages</strong> and <strong>Opportunities</strong> (view and edit).</li>
                <li>Copy the token it shows (it is only shown once) into Access token.</li>
                <li>The Location ID is under <strong>Settings › Business Profile</strong>.</li>
              </ol>
              The token is stored encrypted and is never shown again.
            </details>
          </form>

          {crm && (
            <div className="stack">
              <h3>Pipeline</h3>
              {crmError ? (
                <p className="alert error small">{crmError}</p>
              ) : (
                <form action={saveCrmStages} className="stack">
                  <p className="muted small">
                    When a quote is sent, an opportunity with the quote value is created in this stage. It moves to the
                    second stage when the client accepts online.
                  </p>
                  <StageSelect name="stageSent" label="Stage when a quote is sent" pipelines={pipelines} value={sentValue} optional="Don't create opportunities" />
                  <StageSelect name="stageAccepted" label="Stage when the client accepts" pipelines={pipelines} value={acceptedValue} optional="Leave where it is" />
                  <button className="btn" type="submit">Save stages</button>
                </form>
              )}
              <form action={disconnectCrmAction}>
                <button className="btn danger small" type="submit">Disconnect Nexus Portal</button>
              </form>
            </div>
          )}
        </div>
      </section>

      <div className="grid-2">
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
          <h3>Add a user</h3>
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
