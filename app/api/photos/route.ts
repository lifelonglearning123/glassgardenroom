import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { put } from '@vercel/blob';
import { blobConfigured, listPhotos, savePhoto } from '@/lib/photos';
import { PHOTO_TAGS, type Photo } from '@/lib/quote';

export async function GET() {
  return NextResponse.json(await listPhotos());
}

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Upload one photo (already resized in the browser). Uses Vercel Blob in production, ./public/uploads locally. */
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: 'Please upload JPG, PNG or WebP images' }, { status: 400 });
  if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'Image too large (max 4 MB)' }, { status: 400 });

  const id = randomUUID();
  const name = `${id}.${ext}`;
  let url: string;
  if (blobConfigured()) {
    // The store is private, so photos are served through /media/... on our own domain.
    const blob = await put(`library/${name}`, file, { access: 'private', contentType: file.type });
    url = `/media/${blob.pathname}`;
  } else if (!process.env.VERCEL) {
    const dir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
    url = `/uploads/${name}`;
  } else {
    return NextResponse.json({ error: 'Photo storage is not set up (add Vercel Blob).' }, { status: 500 });
  }

  const allowed = new Set<string>(PHOTO_TAGS);
  const tags = String(form.get('tags') ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter((t) => allowed.has(t));
  const title = String(form.get('title') ?? '').slice(0, 120) || file.name.replace(/\.[^.]+$/, '');
  const photo: Photo = { id, url, title, tags, createdAt: new Date().toISOString() };
  await savePhoto(photo);
  return NextResponse.json(photo);
}
