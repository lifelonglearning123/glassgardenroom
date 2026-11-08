import { readFileSync } from 'fs';
import path from 'path';
import type { Metadata } from 'next';

// Re-uses the website's own 404 page (public/404.html) so unknown addresses look
// and behave exactly as before: the "page moved" message, then back to the homepage.
export const metadata: Metadata = {
  title: 'Page moved — Glass Garden Rooms',
  robots: { index: false, follow: true },
};

function siteBody(): string {
  const html = readFileSync(path.join(process.cwd(), 'public', '404.html'), 'utf8');
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? '';
  return body.replace(/<script[\s\S]*?<\/script>/gi, '');
}

export default function NotFound() {
  return (
    <>
      <link rel="stylesheet" href="/css/style.css" precedence="default" />
      <meta httpEquiv="refresh" content="3; url=/index.html" />
      <div dangerouslySetInnerHTML={{ __html: siteBody() }} />
    </>
  );
}
