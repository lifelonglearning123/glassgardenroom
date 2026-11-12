// Quote model, range defaults, totals and photo suggestions.
// Shared by server and client code, so no Node-only imports here.

export type RangeKey = 'gold' | 'silver' | 'bronze';
export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted';

export type Client = {
  ghlContactId?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  postcode: string;
};

export type Spec = {
  range: RangeKey;
  productName: string;
  width: string;
  projection: string;
  colour: string;
  roof: string;
  leftReturn: string;
  rightReturn: string;
  front: string;
  /** Only used when freestanding; wall-mounted rooms have the house wall at the back. */
  rear: string;
  freestanding: boolean;
  notes: string;
};

export type Line = { id: string; label: string; amount: number };

export type Pricing = {
  packageAmount: number;
  upgrades: Line[];
  installMode: 'professional' | 'diy';
  installAmount: number;
  installNote: string;
  discountLabel: string;
  discountAmount: number;
};

export type Quote = {
  id: string;
  number: number;
  revision: number;
  token: string;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  viewedAt?: string;
  lastViewedAt?: string;
  viewCount?: number;
  acceptedAt?: string;
  acceptedBy?: string;
  preparedBy: string;
  validDays: number;
  client: Client;
  spec: Spec;
  pricing: Pricing;
  photoIds: string[];
  ghl: { opportunityId?: string; lastOpenNoteAt?: string };
  history: { at: string; text: string }[];
};

export type Photo = { id: string; url: string; title: string; tags: string[]; createdAt: string };

export const PHOTO_TAGS = [
  'gold', 'silver', 'bronze', 'extras',
  'sliding-doors', 'interior', 'lighting', 'heating', 'pool', 'hot-tub',
  'dining', 'lounge', 'anthracite', 'white', 'attached', 'freestanding', 'wide',
] as const;

export const COLOURS = [
  'Anthracite Grey (RAL 7016)',
  'Traffic White (RAL 9016)',
  'Cream (RAL 9001)',
  'Black (RAL 9005)',
];

export const UPGRADE_PRESETS = [
  'Integrated LED rafter lighting',
  'Infra-red heater',
  'Motorised blinds',
  'Air conditioning unit',
  'Soakaway / drainage connection',
];

const COMMON_NOTES =
  'Drainage via front support post to outlet. Additional cost to supply and install soakaway or connect into existing underground drainage: POA.\n' +
  'Flooring not included in this price.\n' +
  'Wind and snow load rated. Hidden internal drainage via support post.';

export const RANGES: Record<RangeKey, {
  label: string;
  tier: string;
  defaults: Omit<Spec, 'range' | 'width' | 'projection' | 'colour' | 'freestanding'>;
  installAmount: number;
}> = {
  gold: {
    label: 'Glass Garden Room',
    tier: 'Gold',
    installAmount: 2995,
    defaults: {
      productName: 'Provence glass garden room',
      roof: '8.8mm laminated clear glass',
      leftReturn: 'Glazed wedge frame with 10mm toughened clear glazed sliding doors',
      rightReturn: 'Glazed wedge frame with 10mm toughened clear glazed sliding doors',
      front: '10mm toughened clear glazed sliding doors',
      rear: '10mm toughened clear glazed sliding doors',
      notes: COMMON_NOTES,
    },
  },
  silver: {
    label: 'Glass Roof Veranda',
    tier: 'Silver',
    installAmount: 0,
    defaults: {
      productName: 'Pigato glass roof veranda',
      roof: '8.8mm laminated clear glass',
      leftReturn: 'Open',
      rightReturn: 'Open',
      front: 'Open',
      rear: 'Open',
      notes: COMMON_NOTES,
    },
  },
  bronze: {
    label: 'Polycarbonate Veranda',
    tier: 'Bronze',
    installAmount: 0,
    defaults: {
      productName: 'Bordeaux polycarbonate veranda',
      roof: 'Multi-wall polycarbonate',
      leftReturn: 'Open',
      rightReturn: 'Open',
      front: 'Open',
      rear: 'Open',
      notes: COMMON_NOTES,
    },
  },
};

export const FINANCE_TEXT = 'Finance options available – contact us for details.';

export const REAR_NOT_APPLICABLE = 'Not applicable (wall-mounted)';

/** What the rear shows on the proposal: the chosen rear if freestanding, otherwise not applicable. */
export function rearText(s: Pick<Spec, 'freestanding' | 'rear'>): string {
  return s.freestanding ? s.rear ?? '' : REAR_NOT_APPLICABLE;
}

export function defaultSpec(range: RangeKey = 'gold'): Spec {
  return {
    range,
    width: '',
    projection: '',
    colour: COLOURS[0],
    freestanding: false,
    ...RANGES[range].defaults,
  };
}

export function quoteRef(q: Pick<Quote, 'number' | 'revision'>): string {
  return q.revision > 0 ? `${q.number}-R${q.revision}` : String(q.number);
}

export function totals(p: Pricing) {
  const upgrades = p.upgrades.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const install = p.installMode === 'professional' ? Number(p.installAmount) || 0 : 0;
  const subtotal = (Number(p.packageAmount) || 0) + upgrades + install;
  const discount = Math.min(Number(p.discountAmount) || 0, subtotal);
  const total = subtotal - discount;
  return { upgrades, install, subtotal, discount, total, monthly12: total / 12 };
}

export function gbp(n: number): string {
  return '£' + (Number(n) || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function issuedAt(q: Quote): Date {
  return new Date(q.sentAt ?? q.createdAt);
}

export function validUntil(q: Quote): Date {
  const d = issuedAt(q);
  d.setDate(d.getDate() + (q.validDays || 30));
  return d;
}

export function ukDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Words in the quote that should pull matching photos to the top. */
export function quoteKeywords(q: Pick<Quote, 'spec' | 'pricing'>): string[] {
  const s = q.spec;
  const text = [s.colour, s.leftReturn, s.rightReturn, s.front, s.freestanding ? s.rear : '', s.notes, ...q.pricing.upgrades.map((u) => u.label)]
    .join(' ')
    .toLowerCase();
  const k: string[] = [s.range, s.freestanding ? 'freestanding' : 'attached'];
  if (/anthracite|grey|gray|7016/.test(text)) k.push('anthracite');
  if (/white|cream|9016|9001/.test(text)) k.push('white');
  if (/sliding/.test(text)) k.push('sliding-doors');
  if (/light|led/.test(text)) k.push('lighting');
  if (/heat/.test(text)) k.push('heating');
  if (/pool/.test(text)) k.push('pool');
  if (/hot ?tub|spa/.test(text)) k.push('hot-tub');
  const w = parseFloat(s.width);
  if (w >= 6000) k.push('wide');
  return k;
}

export function scorePhoto(photo: Photo, keywords: string[], range: RangeKey): number {
  let score = 0;
  if (photo.tags.includes(range)) score += 10;
  for (const k of keywords) if (k !== range && photo.tags.includes(k)) score += 2;
  return score;
}

export function suggestPhotos(q: Pick<Quote, 'spec' | 'pricing'>, photos: Photo[], count = 4): Photo[] {
  const keywords = quoteKeywords(q);
  return [...photos]
    .map((p) => ({ p, s: scorePhoto(p, keywords, q.spec.range) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, count)
    .map((x) => x.p);
}
