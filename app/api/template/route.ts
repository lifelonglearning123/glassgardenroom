import { NextResponse } from 'next/server';
import { currentSession } from '@/lib/users';
import { saveTemplate } from '@/lib/template-store';

/** Saves the proposal wording and photos. Signed-in users only (also enforced by middleware). */
export async function PUT(req: Request) {
  const session = await currentSession();
  if (!session) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Nothing to save' }, { status: 400 });
  const template = await saveTemplate(body, session.name);
  return NextResponse.json({ ok: true, template });
}
