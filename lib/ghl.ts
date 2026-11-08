// GoHighLevel (LeadConnector) API client, server-side only.
// Docs: https://marketplace.gohighlevel.com/docs/
import type { Client } from './quote';

const BASE = 'https://services.leadconnectorhq.com';

export class GhlError extends Error {
  constructor(message: string, public status: number, public data: unknown) {
    super(message);
  }
}

export const ghlConfigured = () =>
  Boolean(process.env.GHL_PRIVATE_INTEGRATION_TOKEN && process.env.GHL_LOCATION_ID);

const locationId = () => process.env.GHL_LOCATION_ID as string;

async function ghl<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!ghlConfigured()) throw new GhlError('GoHighLevel is not connected', 0, null);
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.GHL_PRIVATE_INTEGRATION_TOKEN}`,
      Version: process.env.GHL_API_VERSION || '2021-07-28',
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const d = data as { message?: string | string[]; error?: string } | null;
    const raw = d?.message ?? d?.error ?? text ?? res.statusText;
    const msg = Array.isArray(raw) ? raw.join(', ') : raw;
    throw new GhlError(`GoHighLevel ${method} ${path.split('?')[0]} failed (${res.status}): ${msg}`, res.status, data);
  }
  return data as T;
}

export type GhlContact = {
  id: string;
  firstName?: string;
  lastName?: string;
  contactName?: string;
  name?: string;
  email?: string;
  phone?: string;
  address1?: string;
  city?: string;
  postalCode?: string;
  tags?: string[];
};

export function contactToClient(c: GhlContact): Client {
  const name = c.contactName || [c.firstName, c.lastName].filter(Boolean).join(' ') || c.name || '';
  return {
    ghlContactId: c.id,
    name: titleCase(name),
    email: c.email ?? '',
    phone: c.phone ?? '',
    address: [c.address1, c.city].filter(Boolean).join(', '),
    postcode: c.postalCode ?? '',
  };
}

function titleCase(s: string) {
  return s.replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

export async function searchContacts(query: string): Promise<GhlContact[]> {
  try {
    const d = await ghl<{ contacts?: GhlContact[] }>('POST', '/contacts/search', {
      locationId: locationId(),
      page: 1,
      pageLimit: 10,
      query,
    });
    return d.contacts ?? [];
  } catch (e) {
    // Fallback to the older list endpoint if search is not enabled for this token.
    if (e instanceof GhlError && (e.status === 401 || e.status === 403 || e.status === 0)) throw e;
    const qs = new URLSearchParams({ locationId: locationId(), query, limit: '10' });
    const d = await ghl<{ contacts?: GhlContact[] }>('GET', `/contacts/?${qs}`);
    return d.contacts ?? [];
  }
}

export async function getContact(id: string): Promise<GhlContact> {
  const d = await ghl<{ contact: GhlContact }>('GET', `/contacts/${encodeURIComponent(id)}`);
  return d.contact;
}

/** Creates a contact, or returns the existing one if GoHighLevel reports a duplicate. */
export async function createContact(c: Client): Promise<string> {
  const [firstName, ...rest] = c.name.trim().split(/\s+/);
  try {
    const d = await ghl<{ contact: { id: string } }>('POST', '/contacts/', {
      locationId: locationId(),
      firstName,
      lastName: rest.join(' ') || undefined,
      email: c.email || undefined,
      phone: c.phone || undefined,
      address1: c.address || undefined,
      postalCode: c.postcode || undefined,
      source: 'Quote app',
    });
    return d.contact.id;
  } catch (e) {
    const existing = (e as GhlError).data as { meta?: { contactId?: string } } | null;
    if (existing?.meta?.contactId) return existing.meta.contactId;
    throw e;
  }
}

export async function addTags(contactId: string, tags: string[]) {
  await ghl('POST', `/contacts/${encodeURIComponent(contactId)}/tags`, { tags });
}

export async function addNote(contactId: string, body: string) {
  await ghl('POST', `/contacts/${encodeURIComponent(contactId)}/notes`, { body });
}

export async function sendEmail(args: { contactId: string; subject: string; html: string; emailTo?: string }) {
  const d = await ghl<{ messageId?: string; conversationId?: string }>('POST', '/conversations/messages', {
    type: 'Email',
    contactId: args.contactId,
    subject: args.subject,
    html: args.html,
    emailTo: args.emailTo || undefined,
    emailFrom: process.env.GHL_EMAIL_FROM || undefined,
  });
  return d;
}

/** Creates or updates the quote's opportunity. Returns null when no pipeline is configured. */
export async function upsertOpportunity(args: {
  opportunityId?: string;
  contactId: string;
  name: string;
  value: number;
  stageId?: string;
}): Promise<string | null> {
  const pipelineId = process.env.GHL_PIPELINE_ID;
  if (!pipelineId) return null;
  const body = {
    name: args.name,
    monetaryValue: Math.round(args.value * 100) / 100,
    pipelineId,
    ...(args.stageId ? { pipelineStageId: args.stageId } : {}),
  };
  if (args.opportunityId) {
    await ghl('PUT', `/opportunities/${encodeURIComponent(args.opportunityId)}`, body);
    return args.opportunityId;
  }
  const d = await ghl<{ opportunity: { id: string } }>('POST', '/opportunities/', {
    ...body,
    locationId: locationId(),
    contactId: args.contactId,
    status: 'open',
  });
  return d.opportunity.id;
}

export type Pipeline = { id: string; name: string; stages: { id: string; name: string }[] };

export async function listPipelines(): Promise<Pipeline[]> {
  const d = await ghl<{ pipelines?: Pipeline[] }>(
    'GET',
    `/opportunities/pipelines?locationId=${encodeURIComponent(locationId())}`,
  );
  return d.pipelines ?? [];
}
