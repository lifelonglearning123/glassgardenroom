// Nexus Portal CRM connector (server-side only).
// Connection details are saved by the user on the Settings page, encrypted in the database.
import * as store from './store';
import { decrypt, encrypt } from './secret';
import type { Client } from './quote';

const BASE = 'https://services.leadconnectorhq.com';
const API_VERSION = '2021-07-28';

export class CrmError extends Error {
  constructor(message: string, public status: number, public data: unknown) {
    super(message);
  }
}

// ---------- Saved connection ----------

export type CrmSettings = {
  id: 'crm';
  tokenEnc: string;
  tokenHint: string;
  locationId: string;
  pipelineId?: string;
  stageSentId?: string;
  stageAcceptedId?: string;
  emailFrom?: string;
  updatedAt: string;
};

export type CrmConfig = Omit<CrmSettings, 'tokenEnc'> & { token: string };

export async function getCrmSettings(): Promise<CrmSettings | null> {
  return store.get<CrmSettings>('settings', 'crm');
}

export async function getCrmConfig(): Promise<CrmConfig | null> {
  const s = await getCrmSettings();
  if (!s?.tokenEnc || !s.locationId) return null;
  try {
    const { tokenEnc: _omit, ...rest } = s;
    void _omit;
    return { ...rest, token: decrypt(s.tokenEnc) };
  } catch {
    return null; // AUTH_SECRET changed: the saved token can no longer be read, so treat as disconnected.
  }
}

export async function crmConnected(): Promise<boolean> {
  return (await getCrmConfig()) !== null;
}

export async function saveCrmConnection(token: string | null, locationId: string, emailFrom: string) {
  const existing = await getCrmSettings();
  const next: CrmSettings = {
    id: 'crm',
    tokenEnc: token ? encrypt(token) : existing?.tokenEnc ?? '',
    tokenHint: token ? token.slice(-4) : existing?.tokenHint ?? '',
    locationId,
    emailFrom: emailFrom || undefined,
    pipelineId: existing?.locationId === locationId ? existing?.pipelineId : undefined,
    stageSentId: existing?.locationId === locationId ? existing?.stageSentId : undefined,
    stageAcceptedId: existing?.locationId === locationId ? existing?.stageAcceptedId : undefined,
    updatedAt: new Date().toISOString(),
  };
  await store.put('settings', next);
}

export async function saveCrmPipeline(pipelineId?: string, stageSentId?: string, stageAcceptedId?: string) {
  const existing = await getCrmSettings();
  if (!existing) return;
  await store.put('settings', { ...existing, pipelineId, stageSentId, stageAcceptedId, updatedAt: new Date().toISOString() });
}

export async function disconnectCrm() {
  await store.remove('settings', 'crm');
}

// ---------- API calls ----------

async function call<T>(cfg: CrmConfig, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Version: API_VERSION,
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
    const raw = d?.message ?? d?.error ?? res.statusText;
    const msg = Array.isArray(raw) ? raw.join(', ') : String(raw);
    const hint = res.status === 401 || res.status === 403 ? ' Check the access token and its permissions in Settings.' : '';
    throw new CrmError(`Nexus Portal request failed (${res.status}): ${msg}.${hint}`, res.status, data);
  }
  return data as T;
}

async function requireConfig(): Promise<CrmConfig> {
  const cfg = await getCrmConfig();
  if (!cfg) throw new CrmError('Nexus Portal is not connected. Connect it in Settings.', 0, null);
  return cfg;
}

export type CrmContact = {
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
};

const titleCase = (s: string) => s.replace(/\b([a-z])/g, (m) => m.toUpperCase());

export function contactToClient(c: CrmContact): Client {
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

export async function searchContacts(query: string): Promise<CrmContact[]> {
  const cfg = await requireConfig();
  try {
    const d = await call<{ contacts?: CrmContact[] }>(cfg, 'POST', '/contacts/search', {
      locationId: cfg.locationId,
      page: 1,
      pageLimit: 10,
      query,
    });
    return d.contacts ?? [];
  } catch (e) {
    if (e instanceof CrmError && (e.status === 401 || e.status === 403)) throw e;
    const qs = new URLSearchParams({ locationId: cfg.locationId, query, limit: '10' });
    const d = await call<{ contacts?: CrmContact[] }>(cfg, 'GET', `/contacts/?${qs}`);
    return d.contacts ?? [];
  }
}

/** Creates a contact, or returns the existing one if Nexus Portal reports a duplicate. */
export async function createContact(c: Client): Promise<string> {
  const cfg = await requireConfig();
  const [firstName, ...rest] = c.name.trim().split(/\s+/);
  try {
    const d = await call<{ contact: { id: string } }>(cfg, 'POST', '/contacts/', {
      locationId: cfg.locationId,
      firstName,
      lastName: rest.join(' ') || undefined,
      email: c.email || undefined,
      phone: c.phone || undefined,
      address1: c.address || undefined,
      postalCode: c.postcode || undefined,
      source: 'Quotes',
    });
    return d.contact.id;
  } catch (e) {
    const existing = (e as CrmError).data as { meta?: { contactId?: string } } | null;
    if (existing?.meta?.contactId) return existing.meta.contactId;
    throw e;
  }
}

export async function addTags(contactId: string, tags: string[]) {
  const cfg = await requireConfig();
  await call(cfg, 'POST', `/contacts/${encodeURIComponent(contactId)}/tags`, { tags });
}

export async function addNote(contactId: string, body: string) {
  const cfg = await requireConfig();
  await call(cfg, 'POST', `/contacts/${encodeURIComponent(contactId)}/notes`, { body });
}

export async function sendEmail(args: { contactId: string; subject: string; html: string; emailTo?: string }) {
  const cfg = await requireConfig();
  return call<{ messageId?: string }>(cfg, 'POST', '/conversations/messages', {
    type: 'Email',
    contactId: args.contactId,
    subject: args.subject,
    html: args.html,
    emailTo: args.emailTo || undefined,
    emailFrom: cfg.emailFrom || undefined,
  });
}

/** Creates or updates the quote's opportunity. Returns null when no pipeline is chosen in Settings. */
export async function upsertOpportunity(args: {
  opportunityId?: string;
  contactId: string;
  name: string;
  value: number;
  stage: 'sent' | 'accepted';
}): Promise<string | null> {
  const cfg = await requireConfig();
  if (!cfg.pipelineId) return null;
  const stageId = args.stage === 'accepted' ? cfg.stageAcceptedId : cfg.stageSentId;
  const body = {
    name: args.name,
    monetaryValue: Math.round(args.value * 100) / 100,
    pipelineId: cfg.pipelineId,
    ...(stageId ? { pipelineStageId: stageId } : {}),
  };
  if (args.opportunityId) {
    await call(cfg, 'PUT', `/opportunities/${encodeURIComponent(args.opportunityId)}`, body);
    return args.opportunityId;
  }
  const d = await call<{ opportunity: { id: string } }>(cfg, 'POST', '/opportunities/', {
    ...body,
    locationId: cfg.locationId,
    contactId: args.contactId,
    status: 'open',
  });
  return d.opportunity.id;
}

export type Pipeline = { id: string; name: string; stages: { id: string; name: string }[] };

export async function listPipelines(cfg?: CrmConfig): Promise<Pipeline[]> {
  const c = cfg ?? (await requireConfig());
  const d = await call<{ pipelines?: Pipeline[] }>(
    c,
    'GET',
    `/opportunities/pipelines?locationId=${encodeURIComponent(c.locationId)}`,
  );
  return d.pipelines ?? [];
}

/** Checks a token + location before saving them. Throws a readable error when they don't work. */
export async function testConnection(token: string, locationId: string): Promise<void> {
  await listPipelines({ id: 'crm', token, tokenHint: '', locationId, updatedAt: '' });
}
