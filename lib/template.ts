// The standard wording and photos in every proposal. Steve edits these on the
// "Proposal wording" page; anything he hasn't changed falls back to DEFAULT_TEMPLATE.
// Shared by server and client code, so no Node-only imports here.
import type { RangeKey } from './quote';

export type Point = { title: string; text: string };

export type RangeCopy = {
  image: string;
  headline: string;
  sub: string;
  intro: string;
  details: Point[];
};

export type ProposalTemplate = {
  coverTitle: string;
  coverKicker: string;
  aboutHeading: string;
  aboutBody: string;
  aboutSubheading: string;
  aboutPoints: Point[];
  aboutImage: string;
  ranges: Record<RangeKey, RangeCopy>;
  pricingHeading: string;
  financeText: string;
  terms: string;
  stepsHeading: string;
  steps: Point[];
  ctaHeading: string;
  ctaText: string;
};

export const RANGE_ORDER: RangeKey[] = ['bronze', 'silver', 'gold'];

export const DEFAULT_TEMPLATE: ProposalTemplate = {
  coverTitle: 'A Bespoke Space for Your Home',
  coverKicker: 'Custom Outdoor Living Proposal',
  aboutHeading: 'Bringing the Outdoors In',
  aboutBody:
    'Thank you for inviting Glass Garden Rooms Ltd to design your outdoor living solution. From our Nuneaton base, ' +
    'our family-run team is dedicated to supplying premium architectural aluminium structures across the Midlands and beyond.',
  aboutSubheading: 'Built to last decades, not seasons',
  aboutPoints: [
    { title: 'Engineered excellence', text: 'Constructed using ultra-durable 6063-T6 structural aluminium.' },
    { title: 'Up to 15-year guarantee', text: 'Peace of mind with a comprehensive structural warranty on all chosen ranges.' },
    { title: 'Transparent principles', text: 'Honest numbers, clear-cut packages, and no high-pressure sales tactics.' },
  ],
  aboutImage: '/library/stretton-lighting.jpg',
  ranges: {
    bronze: {
      image: '/library/bordeaux.jpg',
      headline: 'Practical All-Weather Shelter',
      sub: 'The polycarbonate and aluminium veranda',
      intro: 'A robust, high-performance architectural canopy providing cost-effective weather protection.',
      details: [
        { title: 'Specification', text: 'Structural-grade aluminium framework; impact-resistant multi-wall polycarbonate roof panels; integrated invisible guttering down the support posts.' },
        { title: 'Ideal for', text: 'Sheltering hot tubs, outdoor kitchens or patio dining areas.' },
      ],
    },
    silver: {
      image: '/library/stretton-giallo.jpg',
      headline: 'Light-Filled Glass Roof Living',
      sub: 'The glass roof aluminium veranda',
      intro: 'Premium architectural aesthetics with an 8.8mm laminated glass canopy that softens rain noise and floods your home with daylight.',
      details: [
        { title: 'Specification', text: 'Heavy-duty reinforced slimline aluminium frame; premium 8.8mm high-transparency laminated safety glass.' },
        { title: 'Available upgrades', text: 'Integrated rafter LED lighting and premium heating units.' },
      ],
    },
    gold: {
      image: '/library/hero-inside-view.jpg',
      headline: 'Elite Architectural Luxury',
      sub: 'The all-season glass garden room',
      intro: 'A fully enclosed glass sanctuary designed to seal out cold draughts, crosswinds, snow and rain, extending your outdoor living from early spring to late autumn.',
      details: [
        { title: 'Specification', text: 'Extra heavy-duty structural aluminium frame; 8.8mm high-transparency laminated safety glass roof; fully glazed sides and front with high-strength safety glass and ultra-smooth multi-track sliding doors, or aluminium walls.' },
        { title: 'Climate upgrades', text: 'High-efficiency infra-red heaters, integrated ambient LED lighting and premium air conditioning units are available as bespoke extras.' },
        { title: 'Ideal for', text: 'A modern garden lounge, home workspace, or evening entertaining and relaxing.' },
      ],
    },
  },
  pricingHeading: 'Tailored Project Costings',
  financeText: 'Finance options available – contact us for details.',
  terms: 'Terms: deposit on order, interim payment prior to delivery, balance on completion of installation. All prices include VAT.',
  stepsHeading: 'Securing Your Commission',
  steps: [
    { title: 'Accept your quote', text: 'Accept online in one click, or contact us to lock in pricing.' },
    { title: 'Technical site survey', text: 'An unhurried 45-minute site measurement and physical sample sign-off at your home.' },
    { title: 'Precision manufacture & build', text: 'A 2–10 week manufacturing lead time depending on range. Verandas typically install in 1–2 days; glass garden rooms in 3–6 days.' },
    { title: 'Handover', text: 'A thorough clean and walkthrough of your project to ensure complete satisfaction.' },
  ],
  ctaHeading: 'Ready to move forward?',
  ctaText: 'If you are happy with this specification, accept your proposal and we will be in touch to book your technical survey.',
};

export const MAX_POINTS = 6;

const text = (v: unknown, fallback: string, max: number) =>
  typeof v === 'string' ? v.slice(0, max) : fallback;

/** Only site images and uploaded photos (https), never javascript: or other schemes. */
const image = (v: unknown, fallback: string) =>
  typeof v === 'string' && (/^\/[\w\-./]+$/.test(v) || /^https:\/\/[^\s"'()]+$/.test(v)) ? v : fallback;

const points = (v: unknown, fallback: Point[]): Point[] =>
  Array.isArray(v)
    ? v.slice(0, MAX_POINTS).map((p) => ({
        title: text((p as Point)?.title, '', 120),
        text: text((p as Point)?.text, '', 600),
      }))
    : fallback;

/** Cleans a saved or submitted template and fills any gaps from the defaults. */
export function normaliseTemplate(raw: unknown): ProposalTemplate {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<ProposalTemplate>;
  const d = DEFAULT_TEMPLATE;
  const ranges = {} as Record<RangeKey, RangeCopy>;
  for (const key of RANGE_ORDER) {
    const s = (r.ranges?.[key] ?? {}) as Partial<RangeCopy>;
    const dr = d.ranges[key];
    ranges[key] = {
      image: image(s.image, dr.image),
      headline: text(s.headline, dr.headline, 120),
      sub: text(s.sub, dr.sub, 160),
      intro: text(s.intro, dr.intro, 800),
      details: points(s.details, dr.details),
    };
  }
  return {
    coverTitle: text(r.coverTitle, d.coverTitle, 120),
    coverKicker: text(r.coverKicker, d.coverKicker, 160),
    aboutHeading: text(r.aboutHeading, d.aboutHeading, 120),
    aboutBody: text(r.aboutBody, d.aboutBody, 1500),
    aboutSubheading: text(r.aboutSubheading, d.aboutSubheading, 120),
    aboutPoints: points(r.aboutPoints, d.aboutPoints),
    aboutImage: image(r.aboutImage, d.aboutImage),
    ranges,
    pricingHeading: text(r.pricingHeading, d.pricingHeading, 120),
    financeText: text(r.financeText, d.financeText, 400),
    terms: text(r.terms, d.terms, 800),
    stepsHeading: text(r.stepsHeading, d.stepsHeading, 120),
    steps: points(r.steps, d.steps),
    ctaHeading: text(r.ctaHeading, d.ctaHeading, 120),
    ctaText: text(r.ctaText, d.ctaText, 600),
  };
}

/** Splits a text box into paragraphs on blank lines. */
export const paragraphs = (s: string) => s.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
