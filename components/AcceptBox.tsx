'use client';

import { useState } from 'react';

export default function AcceptBox({
  token,
  acceptedAt,
  acceptedBy,
  clientName,
}: {
  token: string;
  acceptedAt?: string;
  acceptedBy?: string;
  clientName: string;
}) {
  const [done, setDone] = useState(Boolean(acceptedAt));
  const [who, setWho] = useState(acceptedBy ?? '');
  // When we already know the client's name, accepting is a single click.
  const known = clientName.trim();
  const [name, setName] = useState(known);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (done) {
    return (
      <div className="accept done">
        <strong>Proposal accepted{who ? ` by ${who}` : ''}.</strong> Thank you. We will be in touch shortly
        to arrange your technical site survey.
      </div>
    );
  }

  const accept = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/proposal/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error();
      setWho(name.trim());
      setDone(true);
    } catch {
      setError('Something went wrong. Please call us on 024 7510 2899.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="accept no-print">
      {!known && (
        <label>
          <span>Your name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
      )}
      <button className="btn primary block" onClick={accept} disabled={busy || !name.trim()}>
        {busy ? 'Sending…' : 'Accept this proposal'}
      </button>
      <p className="small">Accepting books your free technical survey. Nothing is payable until you confirm your order.</p>
      {error && <p className="small error-text">{error}</p>}
    </div>
  );
}
