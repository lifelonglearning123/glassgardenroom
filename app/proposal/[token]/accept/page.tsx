import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getQuoteByToken } from '@/lib/quotes';
import { currentSession } from '@/lib/users';
import { isRealVisitor, recordOpen } from '@/lib/tracking';
import { gbp, quoteRef, totals, ukDate, validUntil } from '@/lib/quote';
import AcceptBox from '@/components/AcceptBox';
import '../../../quotes/globals.css';
import '../../proposal.css';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const q = await getQuoteByToken((await params).token);
  return {
    title: q ? `Accept your proposal ${quoteRef(q)} | Glass Garden Rooms` : 'Accept your proposal | Glass Garden Rooms',
    robots: { index: false, follow: false },
  };
}

/**
 * The page behind the "Accept your quote" link. Opening it never accepts on its own
 * (email scanners open links automatically); the client clicks one button.
 */
export default async function AcceptPage({ params }: Props) {
  const q = await getQuoteByToken((await params).token);
  if (!q) notFound();

  const session = await currentSession();
  if (!session && isRealVisitor(await headers())) {
    await recordOpen(q);
  }
  const t = totals(q.pricing);

  return (
    <div className="proposal-page accept-page">
      {session && (
        <div className="proposal-toolbar no-print">
          <span><strong>Preview</strong> of the accept page for quote {quoteRef(q)}. Don&apos;t click accept here unless you mean it.</span>
          <Link href={`/quotes/${q.id}`} className="btn ghost small">Back to editor</Link>
        </div>
      )}
      <main className="accept-card">
        <img src="/Brand/glassgardenroom.co-logo.svg" alt="Glass Garden Rooms" className="accept-logo" />
        <h1>Accept your proposal</h1>
        <p className="muted">{q.client.name ? `For ${q.client.name}` : ''}</p>
        <dl className="accept-summary">
          <dt>Quote</dt><dd>{quoteRef(q)}</dd>
          <dt>Project</dt><dd>{q.spec.productName}</dd>
          <dt>Total inc. VAT</dt><dd><strong>{gbp(t.total)}</strong></dd>
          <dt>Valid until</dt><dd>{ukDate(validUntil(q))}</dd>
        </dl>
        <AcceptBox token={q.token} acceptedAt={q.acceptedAt} acceptedBy={q.acceptedBy} clientName={q.client.name} />
        <p className="small">
          <Link href={`/proposal/${q.token}`}>Read the full proposal</Link> · Questions? Call 024 7510 2899
        </p>
      </main>
    </div>
  );
}
