import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getQuoteByToken } from '@/lib/quotes';
import { listPhotos } from '@/lib/photos';
import { currentSession } from '@/lib/users';
import { isRealVisitor, recordOpen } from '@/lib/tracking';
import { quoteRef } from '@/lib/quote';
import Proposal from '@/components/Proposal';
import PrintButton from '@/components/PrintButton';
import '../../quotes/globals.css';
import '../proposal.css';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ print?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const q = await getQuoteByToken((await params).token);
  return {
    title: q ? `Your proposal ${quoteRef(q)} | Glass Garden Rooms` : 'Proposal | Glass Garden Rooms',
    robots: { index: false, follow: false },
  };
}

export default async function ProposalPage({ params, searchParams }: Props) {
  const q = await getQuoteByToken((await params).token);
  if (!q) notFound();
  const { print } = await searchParams;

  const session = await currentSession();
  const all = await listPhotos();
  const photos = q.photoIds.map((id) => all.find((p) => p.id === id)).filter(Boolean) as typeof all;

  // Every open by the client is counted (not Steve's own previews, not link-preview robots).
  if (!session && isRealVisitor(await headers())) {
    await recordOpen(q);
  }

  return (
    <div className="proposal-page">
      <div className="proposal-toolbar no-print">
        {session ? (
          <>
            <span><strong>Preview</strong> of quote {quoteRef(q)}. This is exactly what the client sees. Your own views are not counted as client opens.</span>
            <Link href={`/quotes/${q.id}`} className="btn ghost small">Back to editor</Link>
          </>
        ) : (
          <span>Your proposal from Glass Garden Rooms</span>
        )}
        <PrintButton auto={print === '1'} />
      </div>
      <Proposal quote={q} photos={photos} />
    </div>
  );
}
