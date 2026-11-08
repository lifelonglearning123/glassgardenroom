import { NextResponse } from 'next/server';
import { getQuoteByToken, saveQuote } from '@/lib/quotes';
import { addNote, addTags, ghlConfigured, upsertOpportunity } from '@/lib/ghl';
import { gbp, quoteRef, totals } from '@/lib/quote';

/** Public: the client accepts their proposal. Logs it in GoHighLevel for follow-up. */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const q = await getQuoteByToken((await params).token);
  if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (q.acceptedAt) return NextResponse.json({ ok: true, already: true });

  const { name } = (await req.json().catch(() => ({}))) as { name?: string };
  const who = (name || q.client.name || 'Client').slice(0, 120);
  const now = new Date().toISOString();
  q.status = 'accepted';
  q.acceptedAt = now;
  q.acceptedBy = who;
  q.history.push({ at: now, text: `Accepted online by ${who}` });
  await saveQuote(q);

  const contactId = q.client.ghlContactId;
  if (ghlConfigured() && contactId) {
    const total = totals(q.pricing).total;
    await Promise.allSettled([
      addTags(contactId, ['quote-accepted']),
      addNote(contactId, `Quote ${quoteRef(q)} ACCEPTED online by ${who}: ${q.spec.productName}, ${gbp(total)}. Book the technical survey.`),
      q.ghl.opportunityId && process.env.GHL_STAGE_ACCEPTED_ID
        ? upsertOpportunity({
            opportunityId: q.ghl.opportunityId,
            contactId,
            name: `${q.client.name} - ${q.spec.productName} (quote ${quoteRef(q)})`,
            value: total,
            stageId: process.env.GHL_STAGE_ACCEPTED_ID,
          })
        : Promise.resolve(null),
    ]);
  }
  return NextResponse.json({ ok: true });
}
