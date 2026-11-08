import { NextResponse } from 'next/server';
import { contactToClient, crmConnected, searchContacts } from '@/lib/crm';

/** Search Nexus Portal contacts by name, email or phone. */
export async function GET(req: Request) {
  if (!(await crmConnected())) {
    return NextResponse.json({ error: 'Nexus Portal is not connected. Connect it in Settings.' }, { status: 400 });
  }
  const q = (new URL(req.url).searchParams.get('q') ?? '').trim().slice(0, 75);
  if (q.length < 2) return NextResponse.json({ results: [] });
  try {
    const contacts = await searchContacts(q);
    return NextResponse.json({ results: contacts.map(contactToClient) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
