// Server-side quote persistence.
import { randomBytes, randomUUID } from 'crypto';
import * as store from './store';
import { defaultSpec, RANGES, type Quote } from './quote';

const COLLECTION = 'quotes';

export async function listQuotes(): Promise<Quote[]> {
  const all = await store.list<Quote>(COLLECTION);
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export const getQuote = (id: string) => store.get<Quote>(COLLECTION, id);
export const getQuoteByToken = (token: string) => store.findBy<Quote>(COLLECTION, 'token', token);
export const deleteQuote = (id: string) => store.remove(COLLECTION, id);

export async function saveQuote(q: Quote, touch = true): Promise<Quote> {
  if (touch) q.updatedAt = new Date().toISOString();
  return store.put(COLLECTION, q);
}

function newToken() {
  return randomBytes(18).toString('base64url');
}

export async function createQuote(preparedBy: string): Promise<Quote> {
  const start = Number(process.env.QUOTE_START_NUMBER) || 1;
  const number = await store.nextCounter('quote_number', start);
  const now = new Date().toISOString();
  const q: Quote = {
    id: randomUUID(),
    number,
    revision: 0,
    token: newToken(),
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    preparedBy,
    validDays: 30,
    client: { name: '', email: '', phone: '', address: '', postcode: '' },
    spec: defaultSpec('gold'),
    pricing: {
      packageAmount: 0,
      upgrades: [],
      installMode: 'professional',
      installAmount: RANGES.gold.installAmount,
      installNote: 'Payable to the installation company on completion',
      discountLabel: '',
      discountAmount: 0,
    },
    photoIds: [],
    ghl: {},
    history: [{ at: now, text: 'Quote created' }],
  };
  return saveQuote(q, false);
}

/** Copies a quote as the next revision (e.g. 392 -> 392-R1), keeping client and spec. */
export async function reviseQuote(source: Quote): Promise<Quote> {
  const siblings = (await store.list<Quote>(COLLECTION)).filter((q) => q.number === source.number);
  const revision = Math.max(...siblings.map((q) => q.revision)) + 1;
  const now = new Date().toISOString();
  const q: Quote = {
    ...structuredClone(source),
    id: randomUUID(),
    revision,
    token: newToken(),
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    sentAt: undefined,
    viewedAt: undefined,
    lastViewedAt: undefined,
    viewCount: 0,
    acceptedAt: undefined,
    ghl: { opportunityId: source.ghl.opportunityId },
    acceptedBy: undefined,
    history: [{ at: now, text: `Revision of quote ${source.number}${source.revision ? '-R' + source.revision : ''}` }],
  };
  return saveQuote(q, false);
}

export async function duplicateQuote(source: Quote, preparedBy: string): Promise<Quote> {
  const fresh = await createQuote(preparedBy);
  fresh.spec = structuredClone(source.spec);
  fresh.pricing = structuredClone(source.pricing);
  fresh.photoIds = [...source.photoIds];
  fresh.history = [{ at: fresh.createdAt, text: `Copied from quote ${source.number}` }];
  return saveQuote(fresh, false);
}
