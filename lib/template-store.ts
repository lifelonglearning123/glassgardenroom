// Loads and saves the proposal template (server only).
import * as store from './store';
import { normaliseTemplate, type ProposalTemplate } from './template';

const COLLECTION = 'settings';
const ID = 'proposal-template';

type Saved = { id: string; template: ProposalTemplate; updatedAt: string; updatedBy: string };

export async function getTemplate(): Promise<ProposalTemplate> {
  const saved = await store.get<Saved>(COLLECTION, ID);
  return normaliseTemplate(saved?.template);
}

export async function getTemplateMeta(): Promise<{ updatedAt?: string; updatedBy?: string }> {
  const saved = await store.get<Saved>(COLLECTION, ID);
  return { updatedAt: saved?.updatedAt, updatedBy: saved?.updatedBy };
}

export async function saveTemplate(raw: unknown, by: string): Promise<ProposalTemplate> {
  const template = normaliseTemplate(raw);
  await store.put<Saved>(COLLECTION, { id: ID, template, updatedAt: new Date().toISOString(), updatedBy: by });
  return template;
}
