'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  COLOURS,
  RANGES,
  UPGRADE_PRESETS,
  gbp,
  quoteKeywords,
  quoteRef,
  scorePhoto,
  totals,
  type Client,
  type Photo,
  type Pricing,
  type Quote,
  type RangeKey,
  type Spec,
} from '@/lib/quote';
import { defaultEmailMessage, defaultEmailSubject } from '@/lib/email';
import { deleteQuoteAction, duplicateQuoteAction, reviseQuoteAction } from '@/app/quotes/actions';

type SaveState = 'saved' | 'saving' | 'unsaved' | 'error';
const MAX_PHOTOS = 6;

const editable = (q: Quote) =>
  JSON.stringify({
    client: q.client,
    spec: q.spec,
    pricing: q.pricing,
    photoIds: q.photoIds,
    preparedBy: q.preparedBy,
    validDays: q.validDays,
  });

export default function QuoteEditor({
  initial,
  photos,
  ghlEnabled,
}: {
  initial: Quote;
  photos: Photo[];
  ghlEnabled: boolean;
}) {
  const [q, setQ] = useState<Quote>(initial);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [showSend, setShowSend] = useState(false);
  const [copied, setCopied] = useState(false);
  const lastSaved = useRef(editable(initial));
  const payload = editable(q);

  const save = useCallback(async (body: string) => {
    if (body === lastSaved.current) return true;
    setSaveState('saving');
    try {
      const res = await fetch(`/api/quotes/${initial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      if (!res.ok) throw new Error();
      lastSaved.current = body;
      setSaveState('saved');
      return true;
    } catch {
      setSaveState('error');
      return false;
    }
  }, [initial.id]);

  // Autosave shortly after each change.
  useEffect(() => {
    if (payload === lastSaved.current) return;
    setSaveState('unsaved');
    const t = setTimeout(() => save(payload), 700);
    return () => clearTimeout(t);
  }, [payload, save]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (payload !== lastSaved.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [payload]);

  const setClient = (patch: Partial<Client>) => setQ((x) => ({ ...x, client: { ...x.client, ...patch } }));
  const setSpec = (patch: Partial<Spec>) => setQ((x) => ({ ...x, spec: { ...x.spec, ...patch } }));
  const setPricing = (patch: Partial<Pricing>) => setQ((x) => ({ ...x, pricing: { ...x.pricing, ...patch } }));

  const chooseRange = (range: RangeKey) => {
    if (range === q.spec.range) return;
    setQ((x) => ({
      ...x,
      spec: { ...x.spec, range, ...RANGES[range].defaults },
      pricing: { ...x.pricing, installAmount: RANGES[range].installAmount || x.pricing.installAmount },
      photoIds: [],
    }));
  };

  const t = totals(q.pricing);
  const link = typeof window === 'undefined' ? `/proposal/${q.token}` : `${window.location.origin}/proposal/${q.token}`;

  const copyLink = async () => {
    await save(payload);
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const preview = async () => {
    await save(payload);
    window.open(`/proposal/${q.token}`, '_blank');
  };

  return (
    <div className="editor">
      <div className="editor-bar">
        <div>
          <Link href="/quotes" className="muted small">← All quotes</Link>
          <h1>
            Quote {quoteRef(q)} <span className={`status ${q.status}`}>{q.status}</span>
          </h1>
        </div>
        <div className="editor-actions">
          <span className={`save-state ${saveState}`}>
            {{ saved: 'All changes saved', saving: 'Saving…', unsaved: 'Unsaved changes', error: 'Could not save, retrying on next change' }[saveState]}
          </span>
          <button className="btn ghost" onClick={preview}>Preview</button>
          <button className="btn ghost" onClick={copyLink}>{copied ? 'Link copied' : 'Copy client link'}</button>
          <button className="btn primary" onClick={async () => { await save(payload); setShowSend(true); }}>
            {ghlEnabled ? 'Send via GoHighLevel' : 'Send'}
          </button>
        </div>
      </div>

      <div className="editor-grid">
        <div className="editor-main">
          <ClientSection client={q.client} setClient={setClient} ghlEnabled={ghlEnabled} />

          <section className="card">
            <h2>Project</h2>
            <div className="range-picker">
              {(Object.keys(RANGES) as RangeKey[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`range-btn ${q.spec.range === r ? 'active' : ''} ${r}`}
                  onClick={() => chooseRange(r)}
                >
                  <span className="tier">{RANGES[r].tier}</span>
                  <span>{RANGES[r].label}</span>
                </button>
              ))}
            </div>
            <div className="form-grid">
              <Field label="Project type" full value={q.spec.productName} onChange={(v) => setSpec({ productName: v })} />
              <Field label="Width approx. (mm)" value={q.spec.width} onChange={(v) => setSpec({ width: v })} placeholder="e.g. 5000" />
              <Field label="Projection approx. (mm)" value={q.spec.projection} onChange={(v) => setSpec({ projection: v })} placeholder="e.g. 3000" />
              <label className="field">
                <span>Frame colour</span>
                <input list="colours" value={q.spec.colour} onChange={(e) => setSpec({ colour: e.target.value })} />
                <datalist id="colours">{COLOURS.map((c) => <option key={c} value={c} />)}</datalist>
              </label>
              <label className="check inline">
                <input type="checkbox" checked={q.spec.freestanding} onChange={(e) => setSpec({ freestanding: e.target.checked })} />
                <span>Freestanding (not fixed to the house)</span>
              </label>
              <Field label="Roof" full value={q.spec.roof} onChange={(v) => setSpec({ roof: v })} />
              <Field label="Left return" full value={q.spec.leftReturn} onChange={(v) => setSpec({ leftReturn: v })} />
              <Field label="Right return" full value={q.spec.rightReturn} onChange={(v) => setSpec({ rightReturn: v })} />
              <Field label="Front" full value={q.spec.front} onChange={(v) => setSpec({ front: v })} />
              <label className="field full">
                <span>Notes shown on the proposal (one per line)</span>
                <textarea rows={4} value={q.spec.notes} onChange={(e) => setSpec({ notes: e.target.value })} />
              </label>
            </div>
          </section>

          <PricingSection pricing={q.pricing} setPricing={setPricing} />

          <PhotoSection quote={q} photos={photos} setPhotoIds={(photoIds) => setQ((x) => ({ ...x, photoIds }))} />
        </div>

        <aside className="editor-side">
          <section className="card sticky">
            <h2>Summary</h2>
            <dl className="summary">
              <dt>{q.spec.productName || 'Package'}</dt><dd>{gbp(q.pricing.packageAmount)}</dd>
              {t.upgrades > 0 && (<><dt>Upgrades</dt><dd>{gbp(t.upgrades)}</dd></>)}
              <dt>Installation</dt><dd>{q.pricing.installMode === 'diy' ? 'DIY' : gbp(t.install)}</dd>
              <dt className="strong">Subtotal</dt><dd className="strong">{gbp(t.subtotal)}</dd>
              {t.discount > 0 && (<><dt>{q.pricing.discountLabel || 'Discount'}</dt><dd>−{gbp(t.discount)}</dd></>)}
              <dt className="total">Total inc. VAT</dt><dd className="total">{gbp(t.total)}</dd>
            </dl>
            <p className="muted small">Or {gbp(t.monthly12)} a month over 12 months at 0% APR.</p>
            <div className="form-grid tight">
              <Field label="Prepared by" value={q.preparedBy} onChange={(v) => setQ((x) => ({ ...x, preparedBy: v }))} />
              <label className="field">
                <span>Valid for (days)</span>
                <input type="number" min={1} max={365} value={q.validDays} onChange={(e) => setQ((x) => ({ ...x, validDays: Number(e.target.value) || 30 }))} />
              </label>
            </div>
            <div className="side-actions">
              <form action={reviseQuoteAction}><input type="hidden" name="id" value={q.id} /><button className="btn ghost small" type="submit">New revision</button></form>
              <form action={duplicateQuoteAction}><input type="hidden" name="id" value={q.id} /><button className="btn ghost small" type="submit">Copy for new client</button></form>
              <form action={deleteQuoteAction} onSubmit={(e) => { if (!confirm(`Delete quote ${quoteRef(q)}? This cannot be undone.`)) e.preventDefault(); }}>
                <input type="hidden" name="id" value={q.id} />
                <button className="btn danger small" type="submit">Delete</button>
              </form>
            </div>
            {q.history.length > 0 && (
              <details className="history">
                <summary>Activity</summary>
                <ul>
                  {[...q.history].reverse().map((h, i) => (
                    <li key={i}><span className="muted small">{new Date(h.at).toLocaleString('en-GB')}</span> {h.text}</li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        </aside>
      </div>

      {showSend && (
        <SendDialog
          quote={q}
          ghlEnabled={ghlEnabled}
          link={link}
          onClose={() => setShowSend(false)}
          onSent={(updated) => {
            lastSaved.current = editable(updated);
            setQ(updated);
          }}
        />
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  full,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  full?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className={`field ${full ? 'full' : ''}`}>
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Money({ value, onChange, label }: { value: number; onChange: (n: number) => void; label?: string }) {
  const [text, setText] = useState(value ? String(value) : '');
  useEffect(() => {
    if ((Number(text) || 0) !== value) setText(value ? String(value) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <div className="money">
      <span>£</span>
      <input
        aria-label={label}
        inputMode="decimal"
        value={text}
        placeholder="0.00"
        onChange={(e) => {
          const v = e.target.value.replace(/[^0-9.]/g, '');
          setText(v);
          onChange(Number(v) || 0);
        }}
      />
    </div>
  );
}

function ClientSection({
  client,
  setClient,
  ghlEnabled,
}: {
  client: Client;
  setClient: (p: Partial<Client>) => void;
  ghlEnabled: boolean;
}) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<Client[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ghlEnabled || term.trim().length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setBusy(true);
      setError('');
      try {
        const res = await fetch(`/api/ghl/contacts?q=${encodeURIComponent(term.trim())}`, { signal: ctrl.signal });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Search failed');
        setResults(data.results);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [term, ghlEnabled]);

  return (
    <section className="card">
      <div className="section-head">
        <h2>Client</h2>
        {client.ghlContactId && (
          <span className="pill ok">
            Linked to GoHighLevel
            <button type="button" className="link small" onClick={() => setClient({ ghlContactId: undefined })}>unlink</button>
          </span>
        )}
      </div>

      {ghlEnabled ? (
        <div className="ghl-search">
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search GoHighLevel by name, email or phone…"
          />
          {busy && <span className="muted small">Searching…</span>}
          {error && <p className="alert error small">{error}</p>}
          {results.length > 0 && (
            <ul className="results">
              {results.map((r) => (
                <li key={r.ghlContactId}>
                  <button
                    type="button"
                    onClick={() => {
                      setClient(r);
                      setTerm('');
                      setResults([]);
                    }}
                  >
                    <strong>{r.name || '(no name)'}</strong>
                    <span className="muted small">{[r.email, r.phone, r.postcode].filter(Boolean).join(' · ')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!busy && term.trim().length >= 2 && results.length === 0 && !error && (
            <p className="muted small">No matching contacts. Type the details below and the contact will be created in GoHighLevel when you send.</p>
          )}
        </div>
      ) : (
        <p className="muted small">GoHighLevel is not connected, so type the client details in.</p>
      )}

      <div className="form-grid">
        <Field label="Full name" value={client.name} onChange={(v) => setClient({ name: v })} />
        <Field label="Email" type="email" value={client.email} onChange={(v) => setClient({ email: v })} />
        <Field label="Phone" type="tel" value={client.phone} onChange={(v) => setClient({ phone: v })} />
        <Field label="Postcode" value={client.postcode} onChange={(v) => setClient({ postcode: v })} />
        <Field label="Address / town" full value={client.address} onChange={(v) => setClient({ address: v })} />
      </div>
    </section>
  );
}

function PricingSection({ pricing, setPricing }: { pricing: Pricing; setPricing: (p: Partial<Pricing>) => void }) {
  const addUpgrade = (label = '') =>
    setPricing({ upgrades: [...pricing.upgrades, { id: crypto.randomUUID(), label, amount: 0 }] });
  const updateUpgrade = (id: string, patch: { label?: string; amount?: number }) =>
    setPricing({ upgrades: pricing.upgrades.map((u) => (u.id === id ? { ...u, ...patch } : u)) });
  const removeUpgrade = (id: string) => setPricing({ upgrades: pricing.upgrades.filter((u) => u.id !== id) });
  const unused = UPGRADE_PRESETS.filter((p) => !pricing.upgrades.some((u) => u.label === p));

  return (
    <section className="card">
      <h2>Pricing <span className="muted small">(all prices include VAT)</span></h2>

      <div className="price-row">
        <label>Package price</label>
        <Money label="Package price" value={pricing.packageAmount} onChange={(n) => setPricing({ packageAmount: n })} />
      </div>

      <h3>Optional upgrades</h3>
      {pricing.upgrades.map((u) => (
        <div className="price-row" key={u.id}>
          <input className="grow" value={u.label} placeholder="Upgrade description" onChange={(e) => updateUpgrade(u.id, { label: e.target.value })} />
          <Money label={u.label} value={u.amount} onChange={(n) => updateUpgrade(u.id, { amount: n })} />
          <button type="button" className="btn ghost small" onClick={() => removeUpgrade(u.id)} aria-label="Remove">✕</button>
        </div>
      ))}
      <div className="chips">
        {unused.map((p) => (
          <button key={p} type="button" className="chip" onClick={() => addUpgrade(p)}>+ {p}</button>
        ))}
        <button type="button" className="chip" onClick={() => addUpgrade()}>+ Other</button>
      </div>

      <h3>Installation</h3>
      <div className="segmented">
        <button type="button" className={pricing.installMode === 'professional' ? 'active' : ''} onClick={() => setPricing({ installMode: 'professional' })}>Professional installation</button>
        <button type="button" className={pricing.installMode === 'diy' ? 'active' : ''} onClick={() => setPricing({ installMode: 'diy' })}>DIY / supply only</button>
      </div>
      {pricing.installMode === 'professional' && (
        <>
          <div className="price-row">
            <label>Installation price</label>
            <Money label="Installation price" value={pricing.installAmount} onChange={(n) => setPricing({ installAmount: n })} />
          </div>
          <label className="field">
            <span>Installation note</span>
            <input value={pricing.installNote} onChange={(e) => setPricing({ installNote: e.target.value })} />
          </label>
        </>
      )}

      <h3>Discount</h3>
      <div className="price-row">
        <input className="grow" value={pricing.discountLabel} placeholder="e.g. Autumn Deal, if confirmed before 30 November" onChange={(e) => setPricing({ discountLabel: e.target.value })} />
        <Money label="Discount" value={pricing.discountAmount} onChange={(n) => setPricing({ discountAmount: n })} />
      </div>
    </section>
  );
}

function PhotoSection({
  quote,
  photos,
  setPhotoIds,
}: {
  quote: Quote;
  photos: Photo[];
  setPhotoIds: (ids: string[]) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const keywords = useMemo(() => quoteKeywords(quote), [quote]);
  const ranked = useMemo(
    () =>
      [...photos]
        .map((p) => ({ p, s: scorePhoto(p, keywords, quote.spec.range) }))
        .sort((a, b) => b.s - a.s),
    [photos, keywords, quote.spec.range],
  );
  const selected = quote.photoIds.map((id) => photos.find((p) => p.id === id)).filter(Boolean) as Photo[];
  const suggestions = ranked.filter((x) => x.s > 0).map((x) => x.p);
  const visible = showAll ? ranked.map((x) => x.p) : suggestions.slice(0, 12);

  const toggle = (id: string) => {
    if (quote.photoIds.includes(id)) setPhotoIds(quote.photoIds.filter((x) => x !== id));
    else if (quote.photoIds.length < MAX_PHOTOS) setPhotoIds([...quote.photoIds, id]);
  };
  const makeCover = (id: string) => setPhotoIds([id, ...quote.photoIds.filter((x) => x !== id)]);
  const autoPick = () => setPhotoIds(suggestions.slice(0, 4).map((p) => p.id));

  return (
    <section className="card">
      <div className="section-head">
        <h2>Photos of similar projects</h2>
        <button type="button" className="btn ghost small" onClick={autoPick}>Pick the best 4 for me</button>
      </div>
      <p className="muted small">
        The first photo is the proposal cover. Suggestions match the range, colour, doors and extras on this quote. Choose up to {MAX_PHOTOS}.
      </p>

      {selected.length > 0 && (
        <div className="photo-strip">
          {selected.map((p, i) => (
            <figure key={p.id} className="selected">
              <img src={p.url} alt={p.title} />
              <figcaption>
                {i === 0 ? <span className="pill ok">Cover</span> : <button type="button" className="link small" onClick={() => makeCover(p.id)}>Make cover</button>}
                <button type="button" className="link small" onClick={() => toggle(p.id)}>Remove</button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <div className="photo-grid">
        {visible.map((p) => {
          const on = quote.photoIds.includes(p.id);
          return (
            <button type="button" key={p.id} className={`photo-tile ${on ? 'on' : ''}`} onClick={() => toggle(p.id)} title={p.tags.join(', ')}>
              <img src={p.url} alt={p.title} loading="lazy" />
              <span>{p.title}</span>
              {on && <i className="tick">✓</i>}
            </button>
          );
        })}
      </div>
      <div className="row-between">
        <button type="button" className="link small" onClick={() => setShowAll((s) => !s)}>
          {showAll ? 'Show suggestions only' : `Browse all ${photos.length} photos`}
        </button>
        <Link href="/quotes/photos" className="small">Manage photo library →</Link>
      </div>
    </section>
  );
}

function SendDialog({
  quote,
  ghlEnabled,
  link,
  onClose,
  onSent,
}: {
  quote: Quote;
  ghlEnabled: boolean;
  link: string;
  onClose: () => void;
  onSent: (q: Quote) => void;
}) {
  const [subject, setSubject] = useState(defaultEmailSubject(quote));
  const [message, setMessage] = useState(defaultEmailMessage(quote));
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);

  const send = async () => {
    setState('sending');
    setError('');
    try {
      const res = await fetch(`/api/quotes/${quote.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sending failed');
      setWarnings(data.warnings ?? []);
      onSent(data.quote);
      setState('sent');
    } catch (e) {
      setError((e as Error).message);
      setState('error');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2>Send quote {quoteRef(quote)}</h2>
        {state === 'sent' ? (
          <>
            <p className="alert ok">
              Sent to {quote.client.email}. It is logged on the client&apos;s GoHighLevel contact with the tag “quote-sent”.
            </p>
            {warnings.length > 0 && (
              <div className="alert warn small">
                The email went out, but some GoHighLevel updates failed:
                <ul>{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
              </div>
            )}
            <button className="btn primary" onClick={onClose}>Done</button>
          </>
        ) : !ghlEnabled ? (
          <>
            <p>GoHighLevel is not connected yet, so the app can&apos;t email the client directly. Copy this link into your own email instead:</p>
            <input readOnly value={link} onFocus={(e) => e.target.select()} />
            <div className="modal-actions">
              <button className="btn" onClick={() => navigator.clipboard.writeText(link)}>Copy link</button>
              <button className="btn ghost" onClick={onClose}>Close</button>
            </div>
          </>
        ) : (
          <>
            <p className="muted small">
              To: <strong>{quote.client.name || 'no name'}</strong> &lt;{quote.client.email || 'no email'}&gt;
              {!quote.client.ghlContactId && ' (a new GoHighLevel contact will be created)'}
            </p>
            <label className="field">
              <span>Subject</span>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </label>
            <label className="field">
              <span>Message</span>
              <textarea rows={10} value={message} onChange={(e) => setMessage(e.target.value)} />
            </label>
            <p className="muted small">A “View your proposal” button and the quote total are added under your message.</p>
            {error && <p className="alert error">{error}</p>}
            <div className="modal-actions">
              <button className="btn primary" onClick={send} disabled={state === 'sending'}>
                {state === 'sending' ? 'Sending…' : 'Send email'}
              </button>
              <button className="btn ghost" onClick={onClose}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
