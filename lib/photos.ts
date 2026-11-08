// Photo library: starter set from the website, plus Steve's uploads.
import { randomUUID } from 'crypto';
import * as store from './store';
import type { Photo } from './quote';

const COLLECTION = 'photos';

const SEED: { file: string; title: string; tags: string[] }[] = [
  { file: 'toulouse.jpg', title: 'Toulouse glass garden room', tags: ['gold', 'sliding-doors', 'anthracite', 'attached'] },
  { file: 'melton-mowbray.jpg', title: 'Melton Mowbray glass room', tags: ['gold', 'sliding-doors', 'anthracite', 'attached'] },
  { file: 'stretton-glassroom.jpg', title: 'Glass room with sliding doors', tags: ['gold', 'sliding-doors', 'anthracite', 'interior'] },
  { file: 'stretton-sliding.jpg', title: 'Inside a glass room', tags: ['gold', 'interior', 'lounge', 'sliding-doors'] },
  { file: 'hero-inside-view.jpg', title: 'Looking out to the garden', tags: ['gold', 'interior', 'sliding-doors'] },
  { file: 'inside-view-pond.jpg', title: 'Glass room over a koi pond', tags: ['gold', 'interior', 'lounge'] },
  { file: 'pool-glass-room.jpg', title: 'Poolside glass room', tags: ['gold', 'pool', 'dining', 'sliding-doors', 'anthracite'] },
  { file: 'large-glass-room.jpg', title: 'Large glass garden room', tags: ['gold', 'wide', 'sliding-doors', 'anthracite', 'attached'] },
  { file: 'showroom-sliding.jpg', title: 'Showroom sliding glass', tags: ['gold', 'sliding-doors'] },
  { file: 'stretton-giallo.jpg', title: 'Glass roof veranda, dining', tags: ['silver', 'dining', 'anthracite', 'attached'] },
  { file: 'stretton-pigato.jpg', title: 'Pigato glass veranda', tags: ['silver', 'dining', 'anthracite', 'attached'] },
  { file: 'stretton-hero.jpg', title: 'Veranda lounge', tags: ['silver', 'lounge', 'anthracite'] },
  { file: 'stretton-lighting.jpg', title: 'Veranda with LED lighting', tags: ['silver', 'lighting', 'lounge', 'anthracite'] },
  { file: 'glass-roof-interior.jpg', title: 'Under a glass roof', tags: ['silver', 'interior', 'lounge'] },
  { file: 'bordeaux.jpg', title: 'Bordeaux polycarbonate veranda', tags: ['bronze', 'wide', 'anthracite', 'attached'] },
  { file: 'wide-veranda.jpg', title: 'Wide veranda across the house', tags: ['bronze', 'wide', 'anthracite', 'attached'] },
  { file: 'heating.jpg', title: 'Infra-red heater', tags: ['extras', 'heating'] },
  { file: 'lighting.jpg', title: 'LED rafter lighting', tags: ['extras', 'lighting'] },
];

async function ensureSeeded() {
  const flag = await store.get<{ id: string }>('meta', 'photos-seeded');
  if (flag) return;
  const now = new Date().toISOString();
  for (const s of SEED) {
    await store.put<Photo>(COLLECTION, { id: randomUUID(), url: `/library/${s.file}`, title: s.title, tags: s.tags, createdAt: now });
  }
  await store.put('meta', { id: 'photos-seeded' });
}

export async function listPhotos(): Promise<Photo[]> {
  await ensureSeeded();
  const all = await store.list<Photo>(COLLECTION);
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.title.localeCompare(b.title));
}

/** True when a Vercel Blob store is connected (token-free OIDC store, or a classic read-write token). */
export const blobConfigured = () => Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);

export const getPhoto = (id: string) => store.get<Photo>(COLLECTION, id);
export const savePhoto = (p: Photo) => store.put(COLLECTION, p);
export const deletePhoto = (id: string) => store.remove(COLLECTION, id);
