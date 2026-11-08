import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getQuoteByToken, saveQuote } from '@/lib/quotes';
import { listPhotos } from '@/lib/photos';
import { currentSession } from '@/lib/users';
import { addNote, addTags, ghlConfigured } from '@/lib/ghl';
import { quoteRef } from '@/lib/quote';
import Proposal from '@/components/Proposal';
import PrintButton from '@/components/PrintButton';
import '../../quotes/globals.css';
import '../proposal.css';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const q = await getQuoteByToken((await params).token);
  return {
    title: q ? `Your proposal ${quoteRef(q)} | Glass Garden Rooms` : 'Proposal | Glass Garden Rooms',
    robots: { index: false, follow: false },
  };
}

export default async function ProposalPage({ params }: Props) {
  const q = await getQuoteByToken((await params).token);
  if (!q) notFound();

  const session = await currentSession();
  const all = await listPhotos();
  const photos = q.photoIds.map((id) => all.find((p) => p.id === id)).filter(Boolean) as typeof all;

  // First open by the client (not Steve previewing) is logged on the quote and in GoHighLevel.
  if (!session && !q.viewedAt && q.status === 'sent') {
    const now = new Date().toISOString();
    q.viewedAt = now;
    q.status = 'viewed';
    q.history.push({ at: now, text: 'Opened by the client' });
    await saveQuote(q, false);
    if (ghlConfigured() && q.client.ghlContactId) {
      await Promise.allSettled([
        addTags(q.client.ghlContactId, ['quote-viewed']),
        addNote(q.client.ghlContactId, `Client opened quote ${quoteRef(q)}.`),
      ]);
    }
  }

  return (
    <div className="proposal-page">
      <div className="proposal-toolbar no-print">
        {session ? (
          <>
            <span><strong>Preview</strong> of quote {quoteRef(q)}. This is exactly what the client sees.</span>
            <Link href={`/quotes/${q.id}`} className="btn ghost small">Back to editor</Link>
          </>
        ) : (
          <span>Your proposal from Glass Garden Rooms</span>
        )}
        <PrintButton />
      </div>
      <Proposal quote={q} photos={photos} />
    </div>
  );
}
