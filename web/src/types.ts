// Minimal types for what Astro pages consume from Sanity.
// These mirror the GROQ projections in src/lib/queries.ts, not the raw schema.
// Kept loose intentionally — Sanity gives us back unknown-shape data and the
// goal here is editor-friendly types at the use site, not bulletproof inference.

import type { PortableTextBlock } from '@portabletext/types';

export type SanityImage = {
  asset?: any;
  alt?: string;
  caption?: string;
  url?: string;
  lqip?: string;
  dimensions?: { width: number; height: number };
};

export type Cta = {
  label: string;
  href: string;
  variant?: 'btn-bone' | 'btn-outline-bone' | 'btn-ghost' | 'cta-mini';
  external?: boolean;
};

export type SiteSettings = {
  businessName?: string;
  phone?: string;
  email?: string;
  address?: {
    line1?: string;
    town?: string;
    county?: string;
    postcode?: string;
    mapUrl?: string;
  };
  showroomHours?: Array<{ days: string; hours: string }>;
  masthead?: {
    logo?: SanityImage;
    nav?: Array<{ label: string; href: string }>;
    ctaLabel?: string;
    ctaHref?: string;
  };
  footer?: {
    tagline?: string;
    columns?: Array<{ heading: string; links?: Cta[] }>;
    legalLine?: string;
  };
  trustBadges?: Array<{ label: string; icon?: SanityImage }>;
  defaultSeo?: Seo;
};

export type Seo = {
  title?: string;
  description?: string;
  ogImage?: SanityImage;
  noindex?: boolean;
};

export type Product = {
  _id: string;
  name: string;
  slug: { current: string };
  category: 'glass-room' | 'veranda' | 'carport';
  catalogueNumber?: string;
  strapline?: string;
  fromPrice?: { amount?: number; displayPrefix?: string };
  heroImage?: SanityImage;
};

export type Testimonial = {
  _id: string;
  customerName: string;
  location?: string;
  quote: string;
  rating?: number;
};

export type JournalPost = {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt?: string;
  author?: string;
  volumeNumber?: string;
  excerpt?: string;
  heroImage?: SanityImage;
};

export type HomePage = {
  cinematicHero?: {
    videoUrl?: string;
    posterImage?: SanityImage;
    metaLabels?: string[];
    headline?: PortableTextBlock[];
    lede?: string;
    ctas?: Cta[];
    creditLine?: string;
  };
  tickertape?: string[];
  usps?: Array<{ number: string; title: string; body: string }>;
  featuredProducts?: Product[];
  featuredTestimonials?: Testimonial[];
  journalTeaser?: {
    heading?: string;
    autoPopulate?: boolean;
    posts?: JournalPost[];
  };
  seo?: Seo;
};
