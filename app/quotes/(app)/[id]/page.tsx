import { notFound } from 'next/navigation';
import { getQuote } from '@/lib/quotes';
import { listPhotos } from '@/lib/photos';
import { crmConnected } from '@/lib/crm';
import QuoteEditor from '@/components/QuoteEditor';

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) notFound();
  const photos = await listPhotos();
  return <QuoteEditor initial={quote} photos={photos} crmEnabled={await crmConnected()} />;
}
