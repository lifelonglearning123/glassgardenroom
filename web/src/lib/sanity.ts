import { createClient, type ClientConfig, type SanityClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset   = import.meta.env.PUBLIC_SANITY_DATASET;

export const sanityConfigured = Boolean(projectId && dataset);

let _client: SanityClient | null = null;

if (sanityConfigured) {
  const config: ClientConfig = {
    projectId,
    dataset,
    apiVersion: import.meta.env.PUBLIC_SANITY_API_VERSION ?? '2026-01-01',
    token: import.meta.env.SANITY_READ_TOKEN,
    useCdn: true,
    perspective: 'published',
  };
  _client = createClient(config);
}

export const sanity = _client;

const builder = sanityConfigured && _client ? imageUrlBuilder(_client) : null;

export function urlFor(source: SanityImageSource) {
  if (!builder) {
    throw new Error('Sanity not configured. Set PUBLIC_SANITY_PROJECT_ID and PUBLIC_SANITY_DATASET in .env.');
  }
  return builder.image(source);
}

// Safe fetchers — return null/[] if Sanity isn't configured yet, so pages
// can still render with their hardcoded fallback content during early dev.
export async function fetchOne<T>(query: string, params: Record<string, unknown> = {}): Promise<T | null> {
  if (!_client) return null;
  try {
    return await _client.fetch<T | null>(query, params);
  } catch (err) {
    console.warn('[sanity] fetch failed:', err);
    return null;
  }
}

export async function fetchMany<T>(query: string, params: Record<string, unknown> = {}): Promise<T[]> {
  if (!_client) return [];
  try {
    const result = await _client.fetch<T[] | null>(query, params);
    return result ?? [];
  } catch (err) {
    console.warn('[sanity] fetch failed:', err);
    return [];
  }
}
