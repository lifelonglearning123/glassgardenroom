import { urlFor } from './sanity';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

type ImgRef = {
  asset?: SanityImageSource;
  url?: string;
  alt?: string;
  caption?: string;
} | null | undefined;

// Resolve to a URL string. Accepts both a Sanity image object (with .asset)
// and a denormalised projection that includes a precomputed .url.
export function imgUrl(img: ImgRef, width?: number): string {
  if (!img) return '';
  if (img.url && !width) return img.url;
  if (img.asset) {
    let b = urlFor(img.asset);
    if (width) b = b.width(width).auto('format');
    return b.url();
  }
  return img.url ?? '';
}

export function imgAlt(img: ImgRef, fallback = ''): string {
  return img?.alt ?? fallback;
}
