import Link from 'next/link';
import { newQuote } from '../actions';
import { listQuotes } from '@/lib/quotes';
import { gbp, quoteRef, totals, type QuoteStatus } from '@/lib/quote';

const STATUS_LABEL: Record<QuoteStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Opened by client',
  accepted: 'Accepted',
};

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const needle = q.trim().toLowerCase();
  const quotes = (await listQuotes()).filter(
    (x) =>
      !needle ||
      [x.client.name, x.client.email, x.client.postcode, quoteRef(x), x.spec.productName]
        .join(' ')
        .toLowerCase()
        .includes(needle),
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Quotes</h1>
          <p className="muted">Every proposal you have created, newest first.</p>
        </div>
        <form action={newQuote}>
          <button className="btn primary" type="submit">+ New quote</button>
        </form>
      </div>

      <form className="search-row" method="get">
        <input name="q" defaultValue={q} placeholder="Search by client, postcode, quote number…" />
        <button className="btn ghost" type="submit">Search</button>
      </form>

      {quotes.length === 0 ? (
        <div className="empty card">
          <p>No quotes yet. Start one with <strong>New quote</strong>.</p>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Quote</th>
                <th>Client</th>
                <th>Project</th>
                <th className="num">Total</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((x) => (
                <tr key={x.id}>
                  <td><Link href={`/quotes/${x.id}`}>{quoteRef(x)}</Link></td>
                  <td>
                    <Link href={`/quotes/${x.id}`}>{x.client.name || <em className="muted">No client yet</em>}</Link>
                    {x.client.postcode && <div className="muted small">{x.client.postcode}</div>}
                  </td>
                  <td>{x.spec.productName}</td>
                  <td className="num">{gbp(totals(x.pricing).total)}</td>
                  <td><span className={`status ${x.status}`}>{STATUS_LABEL[x.status]}</span></td>
                  <td className="muted small">{new Date(x.updatedAt).toLocaleDateString('en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
