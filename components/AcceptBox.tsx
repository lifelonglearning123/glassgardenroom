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
  const [name, setName] = useState(clientName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (done) {
    return (
      <div className="accept done">
        <strong>Proposal accepted{acceptedBy ? ` by ${acceptedBy}` : ''}.</strong> Thank you. We will be in touch shortly
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
      setDone(true);
    } catch {
      setError('Something went wrong. Please call us on 024 7510 2899.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="accept no-print">
      <label>
        <span>Your name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <button className="btn primary block" onClick={accept} disabled={busy || !name.trim()}>
        {busy ? 'Sending…' : 'Accept this proposal'}
      </button>
      <p className="small">Accepting books your free technical survey. Nothing is payable until you confirm your order.</p>
      {error && <p className="small error-text">{error}</p>}
    </div>
  );
}
