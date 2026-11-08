import { Inter } from 'next/font/google';

// Root layout for the Next.js parts of the site only (quotes app and client proposals).
// The website's own pages are static HTML in /public and never pass through here.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
