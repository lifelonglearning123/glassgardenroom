// Records what happens to a quote (shared, opened, accepted) in the app and in Nexus Portal.
import { saveQuote } from './quotes';
import { addNote, addTags, createContact, crmConnected, upsertOpportunity } from './crm';
import { gbp, quoteRef, totals, type Quote } from './quote';

const errMsg = (e: unknown) => (e as Error).message;

function opportunityName(q: Quote) {
  return `${q.client.name} - ${q.spec.productName} (quote ${quoteRef(q)})`;
}

/** Makes sure the client exists as a Nexus Portal contact. Saves the id on the quote straight away. */
export async function ensureContact(q: Quote): Promise<string> {
  if (q.client.ghlContactId) return q.client.ghlContactId;
  q.client.ghlContactId = await createContact(q.client);
  await saveQuote(q);
  return q.client.ghlContactId;
}

/**
 * Marks the quote as given to the client (by email or by link) and logs it in Nexus Portal:
 * contact, opportunity at the "sent" stage, tag "quote-sent" and a note with the link.
 * Returns warnings for CRM steps that failed; the quote is still marked as sent.
 */
export async function recordShare(q: Quote, how: 'email' | 'link', link: string): Promise<string[]> {
  const warnings: string[] = [];
  const now = new Date().toISOString();
  const firstShare = !q.sentAt;

  if (await crmConnected()) {
    try {
      const contactId = await ensureContact(q);
      const total = totals(q.pricing).total;
      const steps: Promise<unknown>[] = [
        upsertOpportunity({ opportunityId: q.ghl.opportunityId, contactId, name: opportunityName(q), value: total, stage: 'sent' }).then(
          (id) => {
            if (id) q.ghl.opportunityId = id;
          },
        ),
        addTags(contactId, ['quote-sent']),
      ];
      if (how === 'email' || firstShare) {
        steps.push(
          addNote(
            contactId,
            `Quote ${quoteRef(q)} ${how === 'email' ? 'emailed' : 'shared by link'}: ${q.spec.productName}, ${gbp(total)} inc. VAT.\n${link}`,
          ),
        );
      }
      const results = await Promise.allSettled(steps);
      for (const r of results) if (r.status === 'rejected') warnings.push(errMsg(r.reason));
    } catch (e) {
      warnings.push(errMsg(e));
    }
  }

  if (q.status === 'draft') q.status = 'sent';
  q.sentAt = q.sentAt ?? now;
  if (how === 'email' || firstShare) {
    q.history.push({ at: now, text: how === 'email' ? `Emailed to ${q.client.email}` : 'Tracked link shared with the client' });
  }
  await saveQuote(q);
  return warnings;
}

// Link previews (WhatsApp, iMessage, Facebook, Slack…), search engines and mail scanners
// fetch the page too. They must not count as the client opening the quote.
const BOT = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|skype|linkedin|embedly|quora|pinterest|vkshare|w3c_validator|headless|lighthouse|python-requests|curl|wget|go-http|java\/|okhttp|axios|node-fetch|microsoft office|outlook|safelinks|proofpoint|mimecast|barracuda/i;

export function isRealVisitor(headers: Headers): boolean {
  const ua = headers.get('user-agent') ?? '';
  if (!ua || BOT.test(ua)) return false;
  const purpose = `${headers.get('purpose') ?? ''} ${headers.get('sec-purpose') ?? ''} ${headers.get('x-purpose') ?? ''}`;
  return !/prefetch|preview/i.test(purpose);
}

const NOTE_EVERY_MS = 60 * 60 * 1000; // log repeat opens in the CRM at most once an hour

/** Logs a client opening the proposal: counts every open, tells Nexus Portal on the first one. */
export async function recordOpen(q: Quote): Promise<void> {
  const now = new Date();
  const first = !q.viewedAt;
  q.viewCount = (q.viewCount ?? 0) + 1;
  q.lastViewedAt = now.toISOString();
  if (first) {
    q.viewedAt = q.lastViewedAt;
    q.history.push({ at: q.lastViewedAt, text: 'Opened by the client for the first time' });
  }
  if (q.status === 'draft' || q.status === 'sent') q.status = 'viewed';

  const lastNote = q.ghl.lastOpenNoteAt ? new Date(q.ghl.lastOpenNoteAt).getTime() : 0;
  const shouldNote = first || now.getTime() - lastNote > NOTE_EVERY_MS;
  if (shouldNote && q.client.ghlContactId && (await crmConnected())) {
    q.ghl.lastOpenNoteAt = q.lastViewedAt;
    await Promise.allSettled([
      first ? addTags(q.client.ghlContactId, ['quote-viewed']) : Promise.resolve(),
      addNote(
        q.client.ghlContactId,
        first
          ? `Client opened quote ${quoteRef(q)} for the first time.`
          : `Client opened quote ${quoteRef(q)} again (${q.viewCount} opens so far).`,
      ),
    ]);
  }
  await saveQuote(q, false);
}

export async function recordAccept(q: Quote, who: string): Promise<void> {
  const now = new Date().toISOString();
  q.status = 'accepted';
  q.acceptedAt = now;
  q.acceptedBy = who;
  q.history.push({ at: now, text: `Accepted online by ${who}` });
  await saveQuote(q);

  if (q.client.ghlContactId && (await crmConnected())) {
    const total = totals(q.pricing).total;
    await Promise.allSettled([
      addTags(q.client.ghlContactId, ['quote-accepted']),
      addNote(q.client.ghlContactId, `Quote ${quoteRef(q)} ACCEPTED online by ${who}: ${q.spec.productName}, ${gbp(total)}. Book the technical survey.`),
      q.ghl.opportunityId
        ? upsertOpportunity({ opportunityId: q.ghl.opportunityId, contactId: q.client.ghlContactId, name: opportunityName(q), value: total, stage: 'accepted' })
        : Promise.resolve(null),
    ]);
    await saveQuote(q, false);
  }
}
