import { NextResponse } from 'next/server';
import { contactToClient, ghlConfigured, searchContacts } from '@/lib/ghl';

/** Search GoHighLevel contacts by name, email or phone. */
export async function GET(req: Request) {
  if (!ghlConfigured()) return NextResponse.json({ error: 'GoHighLevel is not connected' }, { status: 400 });
  const q = (new URL(req.url).searchParams.get('q') ?? '').trim().slice(0, 75);
  if (q.length < 2) return NextResponse.json({ results: [] });
  try {
    const contacts = await searchContacts(q);
    return NextResponse.json({ results: contacts.map(contactToClient) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
