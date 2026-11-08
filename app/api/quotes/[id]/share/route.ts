import { NextResponse } from 'next/server';
import { getQuote } from '@/lib/quotes';
import { crmConnected, sendEmail } from '@/lib/crm';
import { ensureContact, recordShare } from '@/lib/tracking';
import { emailHtml } from '@/lib/email';
import { quoteRef, totals } from '@/lib/quote';

type Ctx = { params: Promise<{ id: string }> };

function siteUrl(req: Request) {
  return (process.env.APP_URL || new URL(req.url).origin).replace(/\/$/, '');
}

/**
 * Gives the quote to the client.
 * - how: "link"  -> returns the tracked link to paste into WhatsApp, text or email, and logs the share.
 * - how: "email" -> emails the link from Nexus Portal, so it appears in the contact's conversation.
 * Both mark the quote as sent and log it on the client's Nexus Portal contact when connected.
 */
export async function POST(req: Request, { params }: Ctx) {
  const q = await getQuote((await params).id);
  if (!q) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { how?: string; subject?: string; message?: string };
  const how = body.how === 'email' ? 'email' : 'link';
  const base = siteUrl(req);
  const link = `${base}/proposal/${q.token}`;

  if (!q.client.name.trim()) return NextResponse.json({ error: 'Add the client name first.' }, { status: 400 });
  if (!totals(q.pricing).total) return NextResponse.json({ error: 'Enter the prices before sharing.' }, { status: 400 });

  if (how === 'email') {
    if (!(await crmConnected())) {
      return NextResponse.json({ error: 'Connect Nexus Portal in Settings to email quotes.' }, { status: 400 });
    }
    if (!q.client.email.trim()) return NextResponse.json({ error: 'Add the client email address first.' }, { status: 400 });
    try {
      const contactId = await ensureContact(q);
      await sendEmail({
        contactId,
        emailTo: q.client.email,
        subject: (body.subject || `Your Glass Garden Rooms proposal (quote ${quoteRef(q)})`).slice(0, 200),
        html: emailHtml(q, body.message || '', link, base),
      });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 502 });
    }
  }

  const warnings = await recordShare(q, how, link);
  return NextResponse.json({ ok: true, quote: q, link, warnings });
}
