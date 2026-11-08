import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { blobConfigured, deletePhoto, getPhoto, savePhoto } from '@/lib/photos';
import { PHOTO_TAGS } from '@/lib/quote';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const photo = await getPhoto((await params).id);
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const b = (await req.json()) as { title?: string; tags?: string[] };
  const allowed = new Set<string>(PHOTO_TAGS);
  if (typeof b.title === 'string') photo.title = b.title.slice(0, 120);
  if (Array.isArray(b.tags)) photo.tags = b.tags.filter((t) => allowed.has(t));
  await savePhoto(photo);
  return NextResponse.json(photo);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const photo = await getPhoto((await params).id);
  if (!photo) return NextResponse.json({ ok: true });
  if (blobConfigured() && photo.url.startsWith('/media/')) {
    try {
      await del(photo.url.slice('/media/'.length));
    } catch {
      /* the record is removed either way */
    }
  }
  await deletePhoto(photo.id);
  return NextResponse.json({ ok: true });
}
