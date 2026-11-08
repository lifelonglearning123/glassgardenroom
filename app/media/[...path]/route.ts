import { get } from '@vercel/blob';

// Serves uploaded photos from the private Blob store on our own domain, e.g. /media/library/<id>.jpg.
// File names are unique, so browsers and Vercel's CDN can cache them for a year.
export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  if (parts[0] !== 'library' || parts.length !== 2 || !/^[\w-]+\.(jpg|png|webp)$/.test(parts[1])) {
    return new Response('Not found', { status: 404 });
  }
  const result = await get(parts.join('/'), {
    access: 'private',
    ifNoneMatch: req.headers.get('if-none-match') ?? undefined,
  }).catch(() => null);
  if (!result) return new Response('Not found', { status: 404 });

  const headers = {
    'Cache-Control': 'public, max-age=31536000, immutable',
    ETag: result.blob.etag,
  };
  if (result.statusCode === 304) return new Response(null, { status: 304, headers });
  return new Response(result.stream, { headers: { ...headers, 'Content-Type': result.blob.contentType } });
}
