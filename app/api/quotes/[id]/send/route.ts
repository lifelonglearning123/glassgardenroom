import { NextResponse } from 'next/server';
import { getQuote, saveQuote } from '@/lib/quotes';
import { addNote, addTags, createContact, ghlConfigured, sendEmail, upsertOpportunity } from '@/lib/ghl';
import { emailHtml } from '@/lib/email';
import { gbp, quoteRef, totals } from '@/lib/quote';

type Ctx = { params: Promise<{ id: string }> };

function appUrl(req: Request) {
  return (process.env.APP_URL || new URL(req.url).origin).replace(/\/$/, '');
}

/** Emails the proposal link to the client through GoHighLevel and logs it on their contact. */
export async function POST(req: Request, { params }: Ctx) {
  if (!ghlConfigured()) {
    return NextResponse.json({ error: 'GoHighLevel is not connected yet. Copy the client link instead.' }, { status: 400 });
  }
  const q = await getQuote((await params).id);
  if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { subject, message } = (await req.json()) as { subject?: string; message?: string };
  if (!q.client.name.trim()) return NextResponse.json({ error: 'Add the client name first.' }, { status: 400 });
  if (!q.client.email.trim()) return NextResponse.json({ error: 'Add the client email address first.' }, { status: 400 });
  if (!totals(q.pricing).total) return NextResponse.json({ error: 'Enter the prices before sending.' }, { status: 400 });

  const base = appUrl(req);
  const link = `${base}/proposal/${q.token}`;
  const ref = quoteRef(q);
  const total = totals(q.pricing).total;
  const warnings: string[] = [];

  try {
    // 1. Make sure the client exists in GoHighLevel (save straight away so we never create duplicates).
    if (!q.client.ghlContactId) {
      q.client.ghlContactId = await createContact(q.client);
      await saveQuote(q);
    }
    const contactId = q.client.ghlContactId;

    // 2. Send the email from GoHighLevel so it appears in the contact's conversation.
    await sendEmail({
      contactId,
      emailTo: q.client.email,
      subject: (subject || `Your Glass Garden Rooms proposal (quote ${ref})`).slice(0, 200),
      html: emailHtml(q, message || '', link, base),
    });

    // 3. Pipeline, tags and a note. Failures here should not undo a sent email.
    try {
      const oppId = await upsertOpportunity({
        opportunityId: q.ghl.opportunityId,
        contactId,
        name: `${q.client.name} - ${q.spec.productName} (quote ${ref})`,
        value: total,
        stageId: process.env.GHL_STAGE_SENT_ID || undefined,
      });
      if (oppId) q.ghl.opportunityId = oppId;
    } catch (e) {
      warnings.push((e as Error).message);
    }
    try {
      await addTags(contactId, ['quote-sent']);
    } catch (e) {
      warnings.push((e as Error).message);
    }
    try {
      await addNote(contactId, `Quote ${ref} sent: ${q.spec.productName}, ${gbp(total)} inc. VAT.\n${link}`);
    } catch (e) {
      warnings.push((e as Error).message);
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  const now = new Date().toISOString();
  if (q.status !== 'accepted') q.status = 'sent';
  q.sentAt = now;
  q.history.push({ at: now, text: `Sent to ${q.client.email} via GoHighLevel` });
  await saveQuote(q);
  return NextResponse.json({ ok: true, quote: q, warnings, link });
}
