import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quotes | Glass Garden Rooms',
  robots: { index: false, follow: false },
};

export default function QuotesRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
