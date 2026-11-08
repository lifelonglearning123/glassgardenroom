'use client';

import { useState } from 'react';
import { PHOTO_TAGS, type Photo } from '@/lib/quote';

/** Shrinks a photo in the browser so uploads stay small and fast. */
async function resize(file: File, max = 1800): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not read image'))), 'image/jpeg', 0.84),
  );
}

export default function PhotoLibrary({ initial, canUpload }: { initial: Photo[]; canUpload: boolean }) {
  const [photos, setPhotos] = useState(initial);
  const [filter, setFilter] = useState<string>('');
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const update = async (id: string, patch: Partial<Photo>) => {
    setPhotos((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    await fetch(`/api/photos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  };

  const remove = async (p: Photo) => {
    if (!confirm(`Remove "${p.title}" from the library?`)) return;
    setPhotos((ps) => ps.filter((x) => x.id !== p.id));
    await fetch(`/api/photos/${p.id}`, { method: 'DELETE' });
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setError('');
    const list = Array.from(files);
    for (let i = 0; i < list.length; i++) {
      setProgress(`Uploading ${i + 1} of ${list.length}…`);
      try {
        const blob = await resize(list[i]);
        const fd = new FormData();
        fd.append('file', new File([blob], list[i].name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }));
        fd.append('title', list[i].name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
        fd.append('tags', uploadTags.join(','));
        const res = await fetch('/api/photos', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        setPhotos((ps) => [data, ...ps]);
      } catch (e) {
        setError(`${list[i].name}: ${(e as Error).message}`);
      }
    }
    setProgress('');
  };

  const shown = filter ? photos.filter((p) => p.tags.includes(filter)) : photos;
  const toggleTag = (arr: string[], t: string) => (arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Photo library</h1>
          <p className="muted">
            Tag each photo with the range and features it shows. Quotes use the tags to suggest the best matching
            photos automatically.
          </p>
        </div>
      </div>

      <section className="card">
        <h2>Add photos</h2>
        {canUpload ? (
          <>
            <p className="muted small">Choose the tags first, then pick one or more photos. They are all given these tags, and you can change them afterwards.</p>
            <div className="chips">
              {PHOTO_TAGS.map((t) => (
                <button key={t} type="button" className={`chip ${uploadTags.includes(t) ? 'on' : ''}`} onClick={() => setUploadTags((u) => toggleTag(u, t))}>
                  {t}
                </button>
              ))}
            </div>
            <label className="btn primary upload-btn">
              Choose photos
              <input type="file" accept="image/*" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
            </label>
            {progress && <span className="muted small"> {progress}</span>}
            {error && <p className="alert error small">{error}</p>}
          </>
        ) : (
          <p className="alert warn">Photo storage is not set up yet. Add a Vercel Blob store to the project to enable uploads.</p>
        )}
      </section>

      <div className="chips filter">
        <button type="button" className={`chip ${filter === '' ? 'on' : ''}`} onClick={() => setFilter('')}>All ({photos.length})</button>
        {PHOTO_TAGS.map((t) => {
          const n = photos.filter((p) => p.tags.includes(t)).length;
          return n ? (
            <button key={t} type="button" className={`chip ${filter === t ? 'on' : ''}`} onClick={() => setFilter(t)}>
              {t} ({n})
            </button>
          ) : null;
        })}
      </div>

      <div className="library-grid">
        {shown.map((p) => (
          <figure key={p.id} className="card library-item">
            <img src={p.url} alt={p.title} loading="lazy" />
            <input value={p.title} onChange={(e) => setPhotos((ps) => ps.map((x) => (x.id === p.id ? { ...x, title: e.target.value } : x)))} onBlur={(e) => update(p.id, { title: e.target.value })} />
            <div className="chips tight">
              {PHOTO_TAGS.map((t) => (
                <button key={t} type="button" className={`chip small ${p.tags.includes(t) ? 'on' : ''}`} onClick={() => update(p.id, { tags: toggleTag(p.tags, t) })}>
                  {t}
                </button>
              ))}
            </div>
            <button type="button" className="link small danger-text" onClick={() => remove(p)}>Remove</button>
          </figure>
        ))}
      </div>
    </>
  );
}
