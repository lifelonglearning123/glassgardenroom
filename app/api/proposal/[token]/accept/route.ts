import { NextResponse } from 'next/server';
import { getQuoteByToken } from '@/lib/quotes';
import { recordAccept } from '@/lib/tracking';

/** Public: the client accepts their proposal. Logged on the quote and in Nexus Portal. */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const q = await getQuoteByToken((await params).token);
  if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (q.acceptedAt) return NextResponse.json({ ok: true, already: true });

  const { name } = (await req.json().catch(() => ({}))) as { name?: string };
  await recordAccept(q, (name || q.client.name || 'Client').slice(0, 120));
  return NextResponse.json({ ok: true });
}
