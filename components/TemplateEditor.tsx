'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RANGES, type Photo, type RangeKey } from '@/lib/quote';
import { DEFAULT_TEMPLATE, MAX_POINTS, RANGE_ORDER, type Point, type ProposalTemplate, type RangeCopy } from '@/lib/template';

type SaveState = 'saved' | 'unsaved' | 'saving' | 'error';

/** "Proposal wording": the standard text and photos that appear in every proposal. */
export default function TemplateEditor({
  initial,
  photos,
  previewToken,
  updatedAt,
  updatedBy,
}: {
  initial: ProposalTemplate;
  photos: Photo[];
  previewToken?: string;
  updatedAt?: string;
  updatedBy?: string;
}) {
  const [t, setT] = useState<ProposalTemplate>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [busy, setBusy] = useState<'' | 'saving' | 'error'>('');
  const [range, setRange] = useState<RangeKey>('gold');
  const dirty = JSON.stringify(t) !== saved;
  const state: SaveState = busy || (dirty ? 'unsaved' : 'saved');

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const set = (patch: Partial<ProposalTemplate>) => setT((x) => ({ ...x, ...patch }));
  const setRangeCopy = (key: RangeKey, patch: Partial<RangeCopy>) =>
    setT((x) => ({ ...x, ranges: { ...x.ranges, [key]: { ...x.ranges[key], ...patch } } }));

  const save = async (): Promise<boolean> => {
    setBusy('saving');
    try {
      const res = await fetch('/api/template', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(t),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setT(data.template);
      setSaved(JSON.stringify(data.template));
      setBusy('');
      return true;
    } catch {
      setBusy('error');
      return false;
    }
  };

  const preview = async () => {
    if (dirty && !(await save())) return;
    window.open(`/proposal/${previewToken}`, '_blank');
  };

  const resetAll = () => {
    if (confirm('Put all proposal wording and photos back to the original version? Nothing changes until you press Save.')) {
      setT(structuredClone(DEFAULT_TEMPLATE));
    }
  };

  const r = t.ranges[range];

  return (
    <div className="template-editor">
      <div className="editor-bar">
        <div>
          <h1>Proposal wording</h1>
          <p className="muted small" style={{ margin: '0.3rem 0 0' }}>
            The standard text and photos in every proposal. Each quote&apos;s own details, prices and project photos are
            still set on the quote.
            {updatedAt && ` Last saved ${new Date(updatedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}${updatedBy ? ` by ${updatedBy}` : ''}.`}
          </p>
        </div>
        <div className="editor-actions">
          <span className={`save-state ${state}`}>
            {{ saved: 'All changes saved', saving: 'Saving…', unsaved: 'Unsaved changes', error: 'Could not save, please try again' }[state]}
          </span>
          {previewToken && <button className="btn ghost" onClick={preview}>Preview on latest quote</button>}
          <button className="btn primary" onClick={save} disabled={!dirty || state === 'saving'}>Save changes</button>
        </div>
      </div>

      <p className="alert warn small">
        Changes show on <strong>every</strong> proposal as soon as you save, including ones already sent, because
        clients always see the latest version of their proposal link.
      </p>

      <section className="card">
        <h2>Cover <span className="muted small">(page 1)</span></h2>
        <div className="form-grid">
          <TextField label="Title" value={t.coverTitle} onChange={(v) => set({ coverTitle: v })} />
          <TextField label="Line under the title" value={t.coverKicker} onChange={(v) => set({ coverKicker: v })} />
        </div>
        <p className="muted small">The cover photo is the first project photo chosen on each quote.</p>
      </section>

      <section className="card">
        <h2>About us <span className="muted small">(page 2)</span></h2>
        <div className="form-grid">
          <TextField label="Heading" full value={t.aboutHeading} onChange={(v) => set({ aboutHeading: v })} />
          <TextArea label="Introduction (leave a blank line between paragraphs)" value={t.aboutBody} onChange={(v) => set({ aboutBody: v })} rows={4} />
          <TextField label="Sub-heading above the points" full value={t.aboutSubheading} onChange={(v) => set({ aboutSubheading: v })} />
        </div>
        <PointsEditor label="Points" points={t.aboutPoints} onChange={(aboutPoints) => set({ aboutPoints })} />
        <PhotoPicker label="Photo beside About us" value={t.aboutImage} photos={photos} onChange={(aboutImage) => set({ aboutImage })} />
      </section>

      <section className="card">
        <h2>Ranges <span className="muted small">(page 2 shows the client&apos;s chosen range, page 3 shows all three)</span></h2>
        <div className="segmented" style={{ marginTop: '0.8rem' }}>
          {RANGE_ORDER.map((k) => (
            <button key={k} type="button" className={range === k ? 'active' : ''} onClick={() => setRange(k)}>
              {RANGES[k].tier}: {RANGES[k].label}
            </button>
          ))}
        </div>
        <div className="form-grid">
          <TextField label="Headline (when this is the client's choice)" full value={r.headline} onChange={(v) => setRangeCopy(range, { headline: v })} />
          <TextField label="Short description" full value={r.sub} onChange={(v) => setRangeCopy(range, { sub: v })} />
          <TextArea label="Introduction" value={r.intro} onChange={(v) => setRangeCopy(range, { intro: v })} rows={3} />
        </div>
        <PointsEditor
          label="Details (the first two also show on the all-ranges page)"
          points={r.details}
          onChange={(details) => setRangeCopy(range, { details })}
        />
        <PhotoPicker label={`${RANGES[range].tier} range photo`} value={r.image} photos={photos} onChange={(image) => setRangeCopy(range, { image })} />
      </section>

      <section className="card">
        <h2>Pricing <span className="muted small">(page 5)</span></h2>
        <div className="form-grid">
          <TextField label="Heading" full value={t.pricingHeading} onChange={(v) => set({ pricingHeading: v })} />
          <TextField label="Finance line (after “Spread the cost.”)" full value={t.financeText} onChange={(v) => set({ financeText: v })} />
          <TextArea label="Payment terms" value={t.terms} onChange={(v) => set({ terms: v })} rows={2} />
        </div>
      </section>

      <section className="card">
        <h2>Next steps <span className="muted small">(page 5)</span></h2>
        <div className="form-grid">
          <TextField label="Heading" full value={t.stepsHeading} onChange={(v) => set({ stepsHeading: v })} />
        </div>
        <PointsEditor label="Steps" points={t.steps} onChange={(steps) => set({ steps })} numbered />
        <div className="form-grid">
          <TextField label="Box heading" full value={t.ctaHeading} onChange={(v) => set({ ctaHeading: v })} />
          <TextArea label="Box text" value={t.ctaText} onChange={(v) => set({ ctaText: v })} rows={2} />
        </div>
        <p className="muted small">The accept button, QR code and contact details are added automatically.</p>
      </section>

      <div className="row-between template-foot">
        <button className="btn ghost small" onClick={resetAll}>Reset everything to the original wording</button>
        <div className="editor-actions">
          <Link href="/quotes" className="btn ghost">Back to quotes</Link>
          <button className="btn primary" onClick={save} disabled={!dirty || state === 'saving'}>Save changes</button>
        </div>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, full }: { label: string; value: string; onChange: (v: string) => void; full?: boolean }) {
  return (
    <label className={`field ${full ? 'full' : ''}`}>
      <span>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="field full">
      <span>{label}</span>
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

/** A short list of "Bold title. Text" points with add, remove and reorder. */
function PointsEditor({
  label,
  points,
  onChange,
  numbered,
}: {
  label: string;
  points: Point[];
  onChange: (p: Point[]) => void;
  numbered?: boolean;
}) {
  const update = (i: number, patch: Partial<Point>) => onChange(points.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const move = (i: number, by: number) => {
    const next = [...points];
    const [item] = next.splice(i, 1);
    next.splice(i + by, 0, item);
    onChange(next);
  };
  return (
    <div className="points-editor">
      <span className="points-label">{label}</span>
      {points.map((p, i) => (
        <div key={i} className="point-row">
          <span className="point-num">{numbered ? `${i + 1}.` : '•'}</span>
          <input className="point-title" value={p.title} placeholder="Bold title" onChange={(e) => update(i, { title: e.target.value })} />
          <textarea className="point-text" rows={3} value={p.text} placeholder="Text" onChange={(e) => update(i, { text: e.target.value })} />
          <div className="point-actions">
            <button type="button" className="btn ghost small" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
            <button type="button" className="btn ghost small" disabled={i === points.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
            <button type="button" className="btn ghost small" onClick={() => onChange(points.filter((_, j) => j !== i))} aria-label="Remove">✕</button>
          </div>
        </div>
      ))}
      {points.length < MAX_POINTS && (
        <button type="button" className="btn ghost small" onClick={() => onChange([...points, { title: '', text: '' }])}>
          + Add {numbered ? 'step' : 'point'}
        </button>
      )}
    </div>
  );
}

/** Shows the chosen photo; "Change photo" opens the photo library to pick another. */
function PhotoPicker({ label, value, photos, onChange }: { label: string; value: string; photos: Photo[]; onChange: (url: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="photo-picker">
      <span className="points-label">{label}</span>
      <div className="photo-picker-current">
        <img src={value} alt="" />
        <div>
          <button type="button" className="btn ghost small" onClick={() => setOpen((o) => !o)}>
            {open ? 'Close' : 'Change photo'}
          </button>
          <p className="muted small">
            Pick from your photo library. To use a new photo, <Link href="/quotes/photos">upload it to the Photo library</Link> first.
          </p>
        </div>
      </div>
      {open && (
        <div className="photo-grid">
          {photos.map((p) => (
            <button
              type="button"
              key={p.id}
              className={`photo-tile ${p.url === value ? 'on' : ''}`}
              onClick={() => {
                onChange(p.url);
                setOpen(false);
              }}
              title={p.title}
            >
              <img src={p.url} alt={p.title} loading="lazy" />
              <span>{p.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
